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
  'Keterampilan Teknis'
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
    
    setTraits(prev => [...prev, newTrait]);
    setNewTraitName('');
    setIsSaved(false);
  };

  const updateTrait = (id: string, updates: Partial<Trait>) => {
    setTraits(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    setIsSaved(false);
  };

  const removeTrait = (id: string) => {
    setTraits(prev => prev.filter(t => t.id !== id));
    setIsSaved(false);
  };

  const handleSave = () => {
    localStorage.setItem('personal_traits_evaluation', JSON.stringify(traits));
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const activeTraits = traits.filter(t => t.focusArea === activeTab);

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Header */}
      <div className="border-b border-white/10 pb-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Icon name="user" size={16} className="text-teal-400" />
          Evaluasi Sifat Pribadi
        </h3>
        <p className="text-xs text-zinc-400 mt-1">
          Identifikasi sifat-sifat Anda di berbagai area fokus, evaluasi, dan tentukan target perubahan.
        </p>
      </div>

      {/* Tabs / Accordion Headers */}
      <div className="flex flex-wrap gap-2 mb-2">
        {FOCUS_AREAS.map(area => (
          <button
            key={area}
            onClick={() => setActiveTab(area)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all duration-300 ${
              activeTab === area
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/50'
                : 'bg-white/5 text-zinc-400 border border-white/5 hover:bg-white/10'
            }`}
          >
            {area}
          </button>
        ))}
      </div>

      {/* Active Tab Content */}
      <div className="flex-1 bg-black/20 border border-white/5 rounded-xl p-4 flex flex-col animate-fade-in transition-all">
        <h4 className="text-sm font-bold text-white mb-4">{activeTab}</h4>
        
        {/* Trait List */}
        <div className="space-y-3 flex-1 overflow-y-auto mb-4 pr-2">
          {activeTraits.length === 0 ? (
            <div className="text-center py-8 text-zinc-500 text-xs">
              Belum ada sifat yang ditambahkan di area ini.
            </div>
          ) : (
            activeTraits.map(trait => (
              <div key={trait.id} className="bg-white/5 border border-white/10 rounded-lg p-3 transition-all animate-fade-in group">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex-1 flex items-center gap-2">
                    <button 
                      onClick={() => removeTrait(trait.id)}
                      className="text-zinc-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                      title="Hapus sifat"
                    >
                      <Icon name="trash" size={14} />
                    </button>
                    <span className="text-sm font-medium text-zinc-200">{trait.name}</span>
                  </div>
                  
                  {/* Rating Buttons */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => updateTrait(trait.id, { rating: '+' })}
                      className={`w-8 h-8 rounded-md flex items-center justify-center font-bold transition-all ${
                        trait.rating === '+' 
                          ? 'bg-teal-500 text-white shadow-[0_0_10px_rgba(20,184,166,0.3)]' 
                          : 'bg-white/5 text-zinc-500 hover:bg-teal-500/20 hover:text-teal-400 border border-white/5'
                      }`}
                    >
                      +
                    </button>
                    <button
                      onClick={() => updateTrait(trait.id, { rating: '-' })}
                      className={`w-8 h-8 rounded-md flex items-center justify-center font-bold transition-all ${
                        trait.rating === '-' 
                          ? 'bg-red-500 text-white shadow-[0_0_10px_rgba(239,68,68,0.3)]' 
                          : 'bg-white/5 text-zinc-500 hover:bg-red-500/20 hover:text-red-400 border border-white/5'
                      }`}
                    >
                      -
                    </button>
                  </div>
                </div>

                {/* Conditional Target Goal Input for Negative Rating */}
                {trait.rating === '-' && (
                  <div className="mt-3 pt-3 border-t border-white/5 animate-fade-in-down">
                    <label className="block text-[10px] text-zinc-400 mb-1 uppercase tracking-wider">
                      Tujuan: Sifat ini ingin kamu ubah menjadi seperti apa?
                    </label>
                    <textarea
                      value={trait.targetGoal || ''}
                      onChange={(e) => updateTrait(trait.id, { targetGoal: e.target.value })}
                      placeholder="Misal: Bisa mulai mencicil tugas H-3..."
                      className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-xs text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-red-500/50 resize-none"
                      rows={2}
                    />
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Add Trait Form */}
        <form onSubmit={handleAddTrait} className="flex gap-2 mt-auto">
          <input
            type="text"
            value={newTraitName}
            onChange={(e) => setNewTraitName(e.target.value)}
            placeholder={`Tambahkan sifat di area ${activeTab}...`}
            className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-indigo-500/50"
          />
          <Button type="submit" variant="primary" className="text-xs py-2">
            Tambah
          </Button>
        </form>
      </div>

      {/* Save Button */}
      <div className="pt-4 border-t border-white/10 flex justify-end">
        <Button 
          onClick={handleSave} 
          variant={isSaved ? "secondary" : "primary"}
          className={`text-xs ${isSaved ? 'bg-teal-500/20 text-teal-400' : 'bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white'}`}
          icon={isSaved ? "check" : "save"}
        >
          {isSaved ? "Tersimpan!" : "Simpan Evaluasi"}
        </Button>
      </div>
    </div>
  );
}
