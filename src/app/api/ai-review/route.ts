import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  
  try {
    if (!GEMINI_API_KEY) {
      console.error('[ai-review] GEMINI_API_KEY is not set');
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

    const { period, metrics, journal, habits, workouts, nutrition, finance } = body;

    const prompt = `Anda adalah seorang Life Coach dan Quantitative Analyst pribadi (berbahasa Indonesia).
Tugas Anda adalah meninjau data hidup klien selama periode "${period}" terakhir dan memberikan wawasan, korelasi, serta saran yang sangat tajam dan bisa ditindaklanjuti.

Berikut adalah data mentah klien:

1. Metrik Kehidupan (Rata-rata/Total):
${JSON.stringify(metrics, null, 2)}

2. Jurnal & Refleksi Harian (Sangat Penting untuk Konteks Mental):
${JSON.stringify(journal, null, 2)}

3. Kepatuhan Kebiasaan (Habits) (target vs aktual):
${JSON.stringify(habits, null, 2)}

4. Olahraga (Workouts):
${JSON.stringify(workouts, null, 2)}

5. Nutrisi (Kalori & Makro rata-rata harian vs Target):
${JSON.stringify(nutrition, null, 2)}

6. Keuangan (Pemasukan vs Pengeluaran):
${JSON.stringify(finance, null, 2)}

Buat ulasan komprehensif menggunakan format Markdown. Gunakan tone yang suportif, objektif, tapi tidak ragu untuk mengkritik jika ada pola buruk.
Struktur ulasan yang diharapkan:
1. **Ringkasan Eksekutif**: 1-2 paragraf rangkuman kondisi klien.
2. **Apa yang Berjalan Baik (Wins)**: Soroti 2-3 pencapaian terbaik.
3. **Pola & Korelasi Tersembunyi**: Coba temukan hubungan antar variabel (misal: "Di hari Anda kurang tidur, pengeluaran Anda cenderung naik", atau "Workouts Anda berkorelasi dengan mood yang tinggi di jurnal").
4. **Area yang Perlu Diperbaiki**: 2 hal utama yang menjadi *bottleneck*.
5. **Rekomendasi Aksi (Next Steps)**: 3 langkah konkret untuk minggu/bulan berikutnya.

Format dalam Markdown murni (tanpa tag \`\`\`markdown di awal/akhir, langsung teksnya). Jangan menggunakan bahasa yang terlalu kaku, gunakan bahasa Indonesia yang natural, elegan, dan profesional.`;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt }
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[ai-review] Gemini API error (${response.status}):`, errorText);
      return NextResponse.json(
        { error: `Gemini API error (${response.status})` },
        { status: response.status }
      );
    }

    const data = await response.json();
    const textContent = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!textContent) {
      return NextResponse.json(
        { error: 'AI tidak mengembalikan hasil analisis.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      review: textContent
    });
  } catch (error) {
    console.error('[ai-review] Unexpected error:', error);
    return NextResponse.json(
      { error: `Server error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
