import { NextRequest, NextResponse } from 'next/server';

// Next.js 14 App Router: increase body size limit for base64 images
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  
  try {
    if (!GEMINI_API_KEY) {
      console.error('[analyze-food] GEMINI_API_KEY is not set in environment variables');
      return NextResponse.json(
        { error: 'Gemini API key belum dikonfigurasi. Tambahkan GEMINI_API_KEY di .env.local lalu restart dev server.' },
        { status: 500 }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Request body tidak valid (bukan JSON)' },
        { status: 400 }
      );
    }

    const { image } = body;

    if (!image) {
      return NextResponse.json(
        { error: 'Tidak ada gambar yang dikirim' },
        { status: 400 }
      );
    }

    // Extract base64 data (remove data:image/...;base64, prefix if present)
    const base64Data = image.includes(',') ? image.split(',')[1] : image;
    const mimeType = image.includes('data:') 
      ? image.split(';')[0].split(':')[1] 
      : 'image/jpeg';

    console.log(`[analyze-food] Processing image: mimeType=${mimeType}, base64Length=${base64Data.length}`);

    const prompt = `Kamu adalah ahli nutrisi. Analisis gambar makanan ini dan berikan estimasi informasi nutrisi.

PENTING: 
- Berikan estimasi terbaik berdasarkan visual makanan
- Jika ada beberapa item, daftarkan masing-masing di dalam array "foods"
- Jika tidak dapat menentukan berat makanan secara pasti, berikan estimasi yang masuk akal dan gunakan confidence score. Jangan mengklaim angka sebagai nilai pasti mutlak.
- Jawab HANYA dalam format JSON berikut (sesuai struktur persis ini), tanpa teks tambahan:

{
  "foods": [
    {
      "name": "string (Nama makanan)",
      "estimated_grams": angka_integer,
      "calories": angka_integer,
      "protein_g": angka_integer,
      "carbs_g": angka_integer,
      "fat_g": angka_integer,
      "confidence": angka_integer_0_100
    }
  ],
  "total": {
    "calories": angka_integer_total,
    "protein_g": angka_integer_total,
    "carbs_g": angka_integer_total,
    "fat_g": angka_integer_total
  }
}

Berikan angka sebagai integer (tanpa desimal). Jangan tambahkan teks apapun selain JSON.`;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${GEMINI_API_KEY}`;

    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: mimeType,
                  data: base64Data,
                },
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 500,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[analyze-food] Gemini API error (${response.status}):`, errorText);
      
      // Parse error for user-friendly message
      let userMessage = `Gemini API error (${response.status})`;
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson?.error?.message) {
          userMessage = errorJson.error.message;
        }
      } catch {
        // errorText is not JSON
      }

      return NextResponse.json(
        { error: userMessage },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Extract the text response from Gemini
    const textContent = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!textContent) {
      console.error('[analyze-food] No text in Gemini response:', JSON.stringify(data).slice(0, 500));
      
      // Check for safety blocks
      const blockReason = data?.candidates?.[0]?.finishReason;
      if (blockReason === 'SAFETY') {
        return NextResponse.json(
          { error: 'Gambar ditolak oleh filter keamanan AI. Coba foto lain.' },
          { status: 422 }
        );
      }
      
      return NextResponse.json(
        { error: 'AI tidak mengembalikan hasil analisis. Coba foto yang lebih jelas.' },
        { status: 500 }
      );
    }

    console.log('[analyze-food] Gemini response:', textContent);

    // Parse the JSON from the response (handle markdown code blocks)
    let cleanedText = textContent.trim();
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.slice(7);
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.slice(3);
    }
    if (cleanedText.endsWith('```')) {
      cleanedText = cleanedText.slice(0, -3);
    }
    cleanedText = cleanedText.trim();

    let nutritionData;
    try {
      nutritionData = JSON.parse(cleanedText);
    } catch (parseErr) {
      console.error('[analyze-food] Failed to parse Gemini JSON:', cleanedText);
      return NextResponse.json(
        { error: 'AI response bukan format JSON valid. Coba foto ulang.' },
        { status: 500 }
      );
    }

    // Validate and provide defaults for the new JSON structure
    const foods = Array.isArray(nutritionData.foods) ? nutritionData.foods.map((f: any) => ({
      name: f.name || 'Makanan tidak dikenali',
      estimated_grams: Math.round(Number(f.estimated_grams) || 0),
      calories: Math.round(Number(f.calories) || 0),
      protein_g: Math.round(Number(f.protein_g) || 0),
      carbs_g: Math.round(Number(f.carbs_g) || 0),
      fat_g: Math.round(Number(f.fat_g) || 0),
      confidence: Math.round(Number(f.confidence) || 0)
    })) : [];

    const total = nutritionData.total || {};
    const fallbackTotalCalories = foods.reduce((sum: number, f: any) => sum + f.calories, 0);
    const fallbackTotalProtein = foods.reduce((sum: number, f: any) => sum + f.protein_g, 0);
    const fallbackTotalCarbs = foods.reduce((sum: number, f: any) => sum + f.carbs_g, 0);
    const fallbackTotalFat = foods.reduce((sum: number, f: any) => sum + f.fat_g, 0);

    return NextResponse.json({
      foods,
      total: {
        calories: Math.round(Number(total.calories)) || fallbackTotalCalories,
        protein_g: Math.round(Number(total.protein_g)) || fallbackTotalProtein,
        carbs_g: Math.round(Number(total.carbs_g)) || fallbackTotalCarbs,
        fat_g: Math.round(Number(total.fat_g)) || fallbackTotalFat,
      }
    });
  } catch (error) {
    console.error('[analyze-food] Unexpected error:', error);
    return NextResponse.json(
      { error: `Server error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
