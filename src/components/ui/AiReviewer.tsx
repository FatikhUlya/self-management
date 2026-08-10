import React, { useState } from 'react';
import { useLifeOS } from '@/lib/hooks/useLifeOSState';
import { Button } from './Button';
import { Icon } from './Icon';
import { Surface } from './Surface';
import { inLastDays, avg } from '@/lib/utils';

// Helper to render simple markdown without dependencies
const renderMarkdown = (text: string) => {
  return text.split('\n').map((line, i) => {
    if (line.trim() === '') return <br key={i} />;
    
    // Bold text (**text**)
    const parts = line.split(/(\*\*.*?\*\*)/g);
    const renderedLine = parts.map((part, j) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={j} className="text-life-text font-black">{part.slice(2, -2)}</strong>;
      }
      return part;
    });

    if (line.startsWith('# ')) {
      return <h1 key={i} className="text-2xl font-bold text-life-text mt-4 mb-2">{renderedLine.slice(1)}</h1>;
    } else if (line.startsWith('## ')) {
      return <h2 key={i} className="text-xl font-bold text-life-text mt-4 mb-2">{renderedLine.slice(1)}</h2>;
    } else if (line.startsWith('### ')) {
      return <h3 key={i} className="text-lg font-bold text-life-text mt-3 mb-1">{renderedLine.slice(1)}</h3>;
    } else if (line.match(/^[0-9]+\. /)) {
      return <li key={i} className="ml-4 list-decimal my-1 text-life-muted">{renderedLine.slice(1)}</li>;
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      return <li key={i} className="ml-4 list-disc my-1 text-life-muted">{renderedLine.slice(1)}</li>;
    }
    
    return <p key={i} className="my-2 text-life-muted">{renderedLine}</p>;
  });
};

export function AiReviewer() {
  const { state, saveReview } = useLifeOS();
  const [period, setPeriod] = useState<7 | 30>(7);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [review, setReview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const saveAiReviewToHistory = async () => {
    if (!review) return;
    setSaving(true);
    setError(null);
    try {
      await saveReview({
        date: state.selectedDate,
        period: period === 7 ? 'weekly' : 'monthly',
        score: 7, // Default AI score
        wins: 'Evaluasi mingguan yang dibantu oleh AI.',
        lessons: '',
        challenges: '',
        focus: '',
        evaluationNotes: '',
        aiSummary: review,
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError('Gagal menyimpan riwayat: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const generateReview = async () => {
    setLoading(true);
    setError(null);
    setReview(null);

    try {
      // 1. Aggregate Data
      const journals = state.journals.filter(j => inLastDays(j.date, period, state.selectedDate));
      
      const metrics = {
        avgMood: avg(journals.map(j => j.mood)).toFixed(1),
        avgEnergy: avg(journals.map(j => j.energy)).toFixed(1),
        totalEntries: journals.length,
      };

      const journalData = journals.map(j => ({
        date: j.date,
        mood: j.mood,
        energy: j.energy,
        win: j.win,
        reflection: j.reflection
      }));

      const habitsData: Record<string, any> = {};
      state.habits.forEach(h => {
        const logs = state.habitLogs.filter(l => l.habitId === h.id && inLastDays(l.date, period, state.selectedDate));
        habitsData[h.name] = {
          target: h.targetPerWeek * (period === 7 ? 1 : 4),
          completed: logs.length
        };
      });

      const workoutsData = state.workouts
        .filter(w => inLastDays(w.date, period, state.selectedDate))
        .map(w => ({ date: w.date, type: w.type, minutes: w.minutes }));

      const mealsData = state.meals.filter(m => inLastDays(m.date, period, state.selectedDate));
      const totalCals = mealsData.reduce((s, m) => s + (Number(m.calories) || 0), 0);
      const totalProtein = mealsData.reduce((s, m) => s + (Number(m.protein) || 0), 0);
      const activeDays = new Set(mealsData.map(m => m.date)).size || 1;
      
      const nutritionData = {
        avgCaloriesPerDay: Math.round(totalCals / activeDays),
        avgProteinPerDay: Math.round(totalProtein / activeDays)
      };

      const txData = state.transactions.filter(t => inLastDays(t.date, period, state.selectedDate));
      const expenses = txData.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
      const income = txData.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
      const financeData = { income, expenses };

      // 2. Call API
      const res = await fetch('/api/ai-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          period: period === 7 ? '7 Hari Terakhir' : '30 Hari Terakhir',
          metrics,
          journal: journalData,
          habits: habitsData,
          workouts: workoutsData,
          nutrition: nutritionData,
          finance: financeData
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menghasilkan ulasan.');
      
      setReview(data.review);
      setSuccess(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Surface className="p-6 overflow-hidden relative">
      <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
        <Icon name="sparkles" size={120} className="text-fuchsia-500" />
      </div>
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 relative z-10">
        <div>
          <h2 className="text-lg font-bold text-life-text flex items-center gap-2">
            <Icon name="sparkles" size={20} className="text-fuchsia-500" />
            AI Reviewer (Beta)
          </h2>
          <p className="text-xs text-life-muted mt-1 max-w-lg">
            AI akan menganalisis jurnal, rutinitas, olahraga, dan keuangan Anda untuk menemukan korelasi tersembunyi dan memberikan nasihat.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <select 
            value={period} 
            onChange={(e) => setPeriod(Number(e.target.value) as 7 | 30)}
            className="glass-select text-xs font-bold"
            disabled={loading}
          >
            <option value={7}>7 Hari Terakhir</option>
            <option value={30}>30 Hari Terakhir</option>
          </select>
          <Button 
            variant="primary" 
            onClick={generateReview} 
            disabled={loading}
            icon={loading ? 'loader' : 'zap'}
            className={loading ? 'animate-pulse' : ''}
          >
            {loading ? 'Menganalisis...' : 'Mulai Review'}
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm mt-4">
          <Icon name="alertCircle" size={16} className="inline mr-2" />
          {error}
        </div>
      )}

      {review && (
        <div className="mt-6 pt-6 border-t border-life-line relative z-10">
          <div className="prose prose-invert prose-sm max-w-none prose-p:text-life-muted prose-headings:text-life-text">
            {renderMarkdown(review)}
          </div>
          
          <div className="mt-6 pt-4 border-t border-life-line flex items-center justify-between">
            <span className="text-xs text-life-muted italic">
              *Evaluasi ini bisa disimpan ke Riwayat Evaluasi (History) Anda.
            </span>
            <Button
              variant={success ? "success" : "primary"}
              onClick={saveAiReviewToHistory}
              disabled={saving || success}
              icon={success ? "check" : "save"}
            >
              {saving ? "Menyimpan..." : success ? "Tersimpan!" : "Simpan ke History"}
            </Button>
          </div>
        </div>
      )}
    </Surface>
  );
}
