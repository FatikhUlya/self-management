'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Icon } from './Icon';

interface NutritionResult {
  food: string;
  portion: string;
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
  confidence: 'high' | 'medium' | 'low';
}

interface AiFoodScannerProps {
  onSave: (data: {
    food: string;
    portion: string;
    calories: number;
    carbs: number;
    protein: number;
    fat: number;
    imageUrl: string;
  }) => void;
}

type ScanStep = 'camera' | 'preview' | 'analyzing' | 'result' | 'error';

export function AiFoodScanner({ onSave }: AiFoodScannerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<ScanStep>('camera');
  const [capturedImage, setCapturedImage] = useState<string>('');
  const [result, setResult] = useState<NutritionResult | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [description, setDescription] = useState('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Start camera
  const startCamera = useCallback(async () => {
    try {
      setIsCameraReady(false);
      // Stop any existing stream first
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 960 },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setIsCameraReady(true);
        };
      }
    } catch (err) {
      console.error('Camera error:', err);
      setErrorMsg('Tidak dapat mengakses kamera. Pastikan izin kamera telah diberikan.');
      setStep('error');
    }
  }, [facingMode]);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setIsCameraReady(false);
  }, []);

  // Open modal and start camera
  const handleOpen = useCallback(() => {
    setIsOpen(true);
    setStep('camera');
    setCapturedImage('');
    setResult(null);
    setErrorMsg('');
    setDescription('');
  }, []);

  // Close modal and clean up
  const handleClose = useCallback(() => {
    stopCamera();
    setIsOpen(false);
    setStep('camera');
    setCapturedImage('');
    setResult(null);
    setErrorMsg('');
    setDescription('');
  }, [stopCamera]);

  // Start camera when step becomes 'camera' and modal is open
  useEffect(() => {
    if (isOpen && step === 'camera') {
      // Small delay to let modal render
      const timer = setTimeout(() => startCamera(), 200);
      return () => clearTimeout(timer);
    } else {
      stopCamera();
    }
  }, [isOpen, step, startCamera, stopCamera]);

  // Capture photo
  const handleCapture = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setCapturedImage(dataUrl);
      setStep('preview');
      stopCamera();
    }
  }, [stopCamera]);

  // Switch camera
  const handleSwitchCamera = useCallback(() => {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  }, []);

  // Retake photo
  const handleRetake = useCallback(() => {
    setCapturedImage('');
    setResult(null);
    setStep('camera');
    setDescription('');
  }, []);

  // Analyze with Gemini AI
  const handleAnalyze = useCallback(async () => {
    if (!capturedImage) return;

    setStep('analyzing');

    try {
      const response = await fetch('/api/analyze-food', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: capturedImage, description }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || 'Gagal menganalisis makanan');
      }

      // Map the new structured JSON to the existing NutritionResult format
      const foodsArray = data.foods || [];
      const totalObj = data.total || {};
      
      const combinedFoodName = foodsArray.map((f: any) => f.name).join(', ') || 'Makanan tidak dikenali';
      const totalGrams = foodsArray.reduce((sum: number, f: any) => sum + (f.estimated_grams || 0), 0);
      const avgConfidence = foodsArray.length > 0 
        ? foodsArray.reduce((sum: number, f: any) => sum + (f.confidence || 0), 0) / foodsArray.length 
        : 50;

      let mappedConfidence: 'high' | 'medium' | 'low' = 'medium';
      if (avgConfidence >= 80) mappedConfidence = 'high';
      else if (avgConfidence >= 50) mappedConfidence = 'medium';
      else mappedConfidence = 'low';

      setResult({
        food: combinedFoodName,
        portion: totalGrams > 0 ? `${totalGrams}g total` : '1 porsi (estimasi)',
        calories: totalObj.calories || 0,
        carbs: totalObj.carbs_g || 0,
        protein: totalObj.protein_g || 0,
        fat: totalObj.fat_g || 0,
        confidence: mappedConfidence
      });

      setStep('result');
    } catch (err: any) {
      console.error('Analysis error:', err);
      setErrorMsg(err?.message || 'Gagal menganalisis gambar. Silakan coba lagi.');
      setStep('error');
    }
  }, [capturedImage]);

  // Save result to meal log
  const handleSave = useCallback(() => {
    if (!result) return;
    onSave({
      food: result.food,
      portion: result.portion,
      calories: result.calories,
      carbs: result.carbs,
      protein: result.protein,
      fat: result.fat,
      imageUrl: capturedImage,
    });
    handleClose();
  }, [result, capturedImage, onSave, handleClose]);

  // File upload (gallery) handler
  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setCapturedImage(dataUrl);
      stopCamera();
      setStep('preview');
    };
    reader.readAsDataURL(file);
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [stopCamera]);

  const confidenceColor = (c: string) => {
    if (c === 'high') return 'text-emerald-400 bg-emerald-500/10';
    if (c === 'medium') return 'text-amber-400 bg-amber-500/10';
    return 'text-rose-400 bg-rose-500/10';
  };

  const confidenceLabel = (c: string) => {
    if (c === 'high') return 'Akurasi Tinggi';
    if (c === 'medium') return 'Akurasi Sedang';
    return 'Akurasi Rendah';
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={handleOpen}
        className="group relative inline-flex items-center gap-2 px-4 py-2.5 rounded-xl 
          bg-gradient-to-r from-violet-600/20 to-fuchsia-600/20 
          hover:from-violet-600/30 hover:to-fuchsia-600/30
          border border-violet-500/30 hover:border-violet-400/50
          text-violet-300 hover:text-violet-200
          font-semibold text-sm
          shadow-lg shadow-violet-500/5 hover:shadow-violet-500/20
          transition-all duration-300 active:scale-[0.97]"
      >
        <div className="relative">
          <Icon name="camera" size={18} />
          <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-gradient-to-r from-violet-400 to-fuchsia-400 animate-pulse" />
        </div>
        <span>AI Scan</span>
        <Icon name="sparkles" size={14} className="opacity-60 group-hover:opacity-100 transition-opacity" />
      </button>

      {/* Scanner Modal */}
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title="🍽️ AI Food Scanner"
        subtitle="Foto makananmu, AI akan menganalisis nutrisinya"
        size="md"
      >
        <div className="space-y-4">
          {/* ─── Camera View ─── */}
          {step === 'camera' && (
            <div className="space-y-3">
              <div className="relative rounded-xl overflow-hidden bg-black/40 aspect-[4/3] flex items-center justify-center">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                {!isCameraReady && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                    <div className="text-center space-y-3">
                      <div className="animate-spin mx-auto">
                        <Icon name="loader" size={32} className="text-violet-400" />
                      </div>
                      <p className="text-xs text-zinc-400">Memuat kamera...</p>
                    </div>
                  </div>
                )}
                {/* Corner guides */}
                <div className="absolute inset-4 pointer-events-none">
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-violet-400/60 rounded-tl-lg" />
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-violet-400/60 rounded-tr-lg" />
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-violet-400/60 rounded-bl-lg" />
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-violet-400/60 rounded-br-lg" />
                </div>
              </div>

              <div className="flex items-center justify-center gap-3">
                {/* Gallery button */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-11 h-11 rounded-full bg-white/[0.05] border border-life-line hover:bg-white/[0.1] flex items-center justify-center text-life-muted hover:text-life-text transition-all"
                  title="Pilih dari galeri"
                >
                  <Icon name="image" size={18} />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileUpload}
                />

                {/* Capture button */}
                <button
                  onClick={handleCapture}
                  disabled={!isCameraReady}
                  className="w-16 h-16 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 
                    hover:from-violet-400 hover:to-fuchsia-400
                    disabled:opacity-30 disabled:cursor-not-allowed
                    flex items-center justify-center 
                    shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50
                    transition-all duration-200 active:scale-95
                    ring-4 ring-white/10"
                  title="Ambil foto"
                >
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                    <Icon name="camera" size={24} className="text-white" />
                  </div>
                </button>

                {/* Switch camera */}
                <button
                  onClick={handleSwitchCamera}
                  className="w-11 h-11 rounded-full bg-white/[0.05] border border-life-line hover:bg-white/[0.1] flex items-center justify-center text-life-muted hover:text-life-text transition-all"
                  title="Ganti kamera"
                >
                  <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 19H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5" />
                    <path d="M13 5h7a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-5" />
                    <path d="m14 3 3 3-3 3" />
                    <path d="m10 21-3-3 3-3" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* ─── Preview ─── */}
          {step === 'preview' && capturedImage && (
            <div className="space-y-4">
              <div className="relative rounded-xl overflow-hidden aspect-[4/3]">
                <img src={capturedImage} alt="Captured food" className="w-full h-full object-cover" />
                <div className="absolute bottom-3 right-3 px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold uppercase tracking-wider">
                  Preview
                </div>
              </div>
              <div className="flex flex-col space-y-2">
                <label className="text-xs font-bold text-life-muted uppercase">Keterangan Makanan (Opsional)</label>
                <input
                  type="text"
                  placeholder="Misal: Nasi goreng dengan telur ceplok dan ayam suwir..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="glass-input text-xs"
                />
              </div>
              <div className="flex gap-3">
                <Button variant="secondary" icon="camera" onClick={handleRetake} className="flex-1">
                  Foto Ulang
                </Button>
                <button
                  onClick={handleAnalyze}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg
                    bg-gradient-to-r from-violet-500 to-fuchsia-500 
                    hover:from-violet-400 hover:to-fuchsia-400
                    text-white font-semibold text-sm
                    shadow-lg shadow-violet-500/20 hover:shadow-violet-500/40
                    transition-all duration-200 active:scale-[0.98]"
                >
                  <Icon name="sparkles" size={16} />
                  Analisis AI
                </button>
              </div>
            </div>
          )}

          {/* ─── Analyzing ─── */}
          {step === 'analyzing' && (
            <div className="space-y-4 py-8">
              <div className="relative rounded-xl overflow-hidden aspect-[4/3] opacity-50">
                <img src={capturedImage} alt="Analyzing" className="w-full h-full object-cover blur-sm" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              </div>
              <div className="text-center space-y-4 -mt-20 relative z-10">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20 border border-violet-500/30">
                  <div className="animate-spin">
                    <Icon name="loader" size={28} className="text-violet-400" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-bold text-life-text">Menganalisis makanan...</p>
                  <p className="text-xs text-life-muted mt-1">Gemini AI sedang memproses gambar</p>
                </div>
                {/* Animated progress bar */}
                <div className="max-w-[200px] mx-auto h-1 rounded-full bg-white/5 overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 animate-pulse" style={{ width: '60%' }} />
                </div>
              </div>
            </div>
          )}

          {/* ─── Result ─── */}
          {step === 'result' && result && (
            <div className="space-y-4">
              {/* Food image & name */}
              <div className="relative rounded-xl overflow-hidden aspect-[16/9]">
                <img src={capturedImage} alt={result.food} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-3 left-3 right-3">
                  <h4 className="text-lg font-bold text-white leading-tight">{result.food}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-white/70">{result.portion}</span>
                    <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${confidenceColor(result.confidence)}`}>
                      {confidenceLabel(result.confidence)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Nutrition grid */}
              <div className="grid grid-cols-4 gap-2">
                <div className="text-center p-3 rounded-xl bg-gradient-to-b from-amber-500/10 to-amber-500/5 border border-amber-500/20">
                  <p className="text-[10px] font-black uppercase tracking-wider text-amber-400/80">Kalori</p>
                  <p className="text-xl font-black text-amber-400 mt-1">{result.calories}</p>
                  <p className="text-[9px] text-amber-400/50 font-bold">kcal</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-gradient-to-b from-blue-500/10 to-blue-500/5 border border-blue-500/20">
                  <p className="text-[10px] font-black uppercase tracking-wider text-blue-400/80">Karbo</p>
                  <p className="text-xl font-black text-blue-400 mt-1">{result.carbs}</p>
                  <p className="text-[9px] text-blue-400/50 font-bold">gram</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-gradient-to-b from-rose-500/10 to-rose-500/5 border border-rose-500/20">
                  <p className="text-[10px] font-black uppercase tracking-wider text-rose-400/80">Protein</p>
                  <p className="text-xl font-black text-rose-400 mt-1">{result.protein}</p>
                  <p className="text-[9px] text-rose-400/50 font-bold">gram</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-gradient-to-b from-yellow-500/10 to-yellow-500/5 border border-yellow-500/20">
                  <p className="text-[10px] font-black uppercase tracking-wider text-yellow-400/80">Lemak</p>
                  <p className="text-xl font-black text-yellow-400 mt-1">{result.fat}</p>
                  <p className="text-[9px] text-yellow-400/50 font-bold">gram</p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 pt-1">
                <Button variant="secondary" icon="camera" onClick={handleRetake} className="flex-1">
                  Scan Ulang
                </Button>
                <button
                  onClick={handleSave}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg
                    bg-gradient-to-r from-emerald-500 to-teal-500 
                    hover:from-emerald-400 hover:to-teal-400
                    text-white font-semibold text-sm
                    shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40
                    transition-all duration-200 active:scale-[0.98]"
                >
                  <Icon name="check" size={16} />
                  Simpan ke Log
                </button>
              </div>
            </div>
          )}

          {/* ─── Error ─── */}
          {step === 'error' && (
            <div className="text-center py-8 space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/20">
                <Icon name="alertCircle" size={28} className="text-rose-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-life-text">Terjadi Kesalahan</p>
                <p className="text-xs text-life-muted mt-1">{errorMsg}</p>
              </div>
              <Button variant="secondary" icon="camera" onClick={handleRetake}>
                Coba Lagi
              </Button>
            </div>
          )}
        </div>

        {/* Hidden canvas for capture */}
        <canvas ref={canvasRef} className="hidden" />
      </Modal>
    </>
  );
}
