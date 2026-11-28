import React, { useState, useEffect } from 'react';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';

const FOCUS_AREAS = [
  'Komunikasi',
  'Kepemimpinan',
  'Personal Branding',
  'Kesehatan Emosional',
  'Networking & Relasi',
  'Manajemen Waktu',
  'Keterampilan Teknis',
];

interface Trait {
  id: string;
  focusArea: string;
  name: string;
  rating: '+' | '-' | null;
  targetGoal?: string;
}

export function PersonalTraitEvaluation() {
  const [activeTab, setActiveTab] = useState(FOCUS_AREAS[0]);
  const [traits, setTraits] = useState<Trait[]>([]);
  const [newTraitName, setNewTraitName] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('personal_traits_evaluation');
    if (saved) {
      try {
        setTraits(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse saved traits', e);
      }
    }
  }, []);

  const handleAddTrait = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTraitName.trim()) return;

    const newTrait: Trait = {
      id: Date.now().toString(),
      focusArea: activeTab,
      name: newTraitName.trim(),
      rating: null,
    };

    setTraits((prev) => [...prev, newTrait]);
    setNewTraitName('');
    setIsSaved(false);
  };

  const updateTrait = (id: string, updates: Partial<Trait>) => {
    setTraits((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
    setIsSaved(false);
  };

  const removeTrait = (id: string) => {
    setTraits((prev) => prev.filter((t) => t.id !== id));
    setIsSaved(false);
  };

  const handleSave = () => {
    localStorage.setItem('personal_traits_evaluation', JSON.stringify(traits));
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const activeTraits = traits.filter((t) => t.focusArea === activeTab);

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Header */}
      <div className="border-b border-border pb-4">
        <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
          <Icon name="star" size={16} className="text-muted-foreground" />
          Evaluasi Karakter & Sifat Pribadi
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          Identifikasi sifat-sifat Anda di berbagai area fokus, evaluasi dampak positif (+) atau negatif (-), dan tentukan target perbaikan.
        </p>
      </div>

      {/* Tabs / Focus Areas */}
      <div className="flex flex-wrap gap-2 mb-2">
        {FOCUS_AREAS.map((area) => (
          <button
            key={area}
            onClick={() => setActiveTab(area)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors border ${
              activeTab === area
                ? 'bg-primary/10 text-primary border-primary/30 shadow-card'
                : 'bg-muted/20 text-muted-foreground border-border hover:bg-muted/40 hover:text-foreground'
            }`}
          >
            {area}
          </button>
        ))}
      </div>

      {/* Active Tab Content */}
      <div className="flex-1 bg-muted/10 border border-border rounded-xl p-4 flex flex-col transition-colors">
        <h4 className="text-sm font-medium text-foreground mb-4">{activeTab}</h4>

        {/* Trait List */}
        <div className="space-y-3 flex-1 overflow-y-auto mb-4 pr-1">
          {activeTraits.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-xs">
              Belum ada sifat yang ditambahkan di area ini. Ketik sifat baru di bawah!
            </div>
          ) : (
            activeTraits.map((trait) => (
              <div key={trait.id} className="bg-card border border-border rounded-lg p-3 transition-colors group space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex-1 flex items-center gap-2">
                    <button
                      onClick={() => removeTrait(trait.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors opacity-70 group-hover:opacity-100 p-1"
                      title="Hapus sifat"
                    >
                      <Icon name="trash" size={13} />
                    </button>
                    <span className="text-xs font-semibold text-foreground">{trait.name}</span>
                  </div>

                  {/* Rating Buttons */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => updateTrait(trait.id, { rating: '+' })}
                      className={`w-7 h-7 rounded-md flex items-center justify-center font-medium text-xs transition-colors ${
                        trait.rating === '+'
                          ? 'bg-emerald-500 text-white shadow-card'
                          : 'bg-muted/30 text-muted-foreground hover:bg-emerald-500/20 hover:text-emerald-500 border border-border'
                      }`}
                      title="Positif / Menguntungkan"
                    >
                      +
                    </button>
                    <button
                      onClick={() => updateTrait(trait.id, { rating: '-' })}
                      className={`w-7 h-7 rounded-md flex items-center justify-center font-medium text-xs transition-colors ${
                        trait.rating === '-'
                          ? 'bg-rose-500 text-white shadow-card'
                          : 'bg-muted/30 text-muted-foreground hover:bg-rose-500/20 hover:text-rose-500 border border-border'
                      }`}
                      title="Negatif / Perlu Diperbaiki"
                    >
                      -
                    </button>
                  </div>
                </div>

                {/* Target Goal Input for this Trait */}
                <div className="pt-2 border-t border-border flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground shrink-0">Target Ubah:</span>
                  <input
                    type="text"
                    placeholder="Contoh: Belajar mendengarkan sebelum memotong"
                    value={trait.targetGoal || ''}
                    onChange={(e) => updateTrait(trait.id, { targetGoal: e.target.value })}
                    className="flex-1 text-xs px-2.5 py-1 rounded bg-muted/20 border border-border text-foreground focus:outline-none" aria-label="Contoh: Belajar mendengarkan sebelum memotong"
/>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Add Trait Form */}
        <form onSubmit={handleAddTrait} className="flex gap-2">
          <input
            type="text"
            placeholder={`Tambah sifat baru di area ${activeTab}...`}
            value={newTraitName}
            onChange={(e) => setNewTraitName(e.target.value)}
            className="flex-1 text-xs px-3 py-2 rounded-lg bg-muted/20 border border-border text-foreground focus:outline-none"
          />
          <Button type="submit" variant="primary" size="sm" icon="plus" className="text-xs">
            Tambah
          </Button>
        </form>

        {/* Save Bar */}
        <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {traits.length} sifat terdaftar di seluruh area.
          </span>
          <Button variant="outline" size="sm" onClick={handleSave} className="text-xs">
            {isSaved ? 'Tersimpan' : 'Simpan Evaluasi Sifat'}
          </Button>
        </div>
      </div>
    </div>
  );
}
