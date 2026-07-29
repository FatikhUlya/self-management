'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useLifeOS } from '@/lib/hooks/useLifeOSState';
import { useLocalStorageState } from '@/lib/hooks/useLocalStorageState';
import { useI18n } from '@/lib/i18n/context';
import { Surface } from '@/components/ui/Surface';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Icon } from '@/components/ui/Icon';
import { Modal } from '@/components/ui/Modal';

export default function DictionaryPage() {
  const { state, addDictionaryEntry, deleteDictionaryEntry } = useLifeOS();
  const { t, locale } = useI18n();

  // Dictionary states
  const [indonesianWord, setIndonesianWord] = useLocalStorageState('draft_dict_indonesian', '');
  const [translatedWord, setTranslatedWord] = useLocalStorageState('draft_dict_translated', '');
  const [vocabLanguage, setVocabLanguage] = useLocalStorageState('draft_dict_language', 'English');
  const [customLanguage, setCustomLanguage] = useLocalStorageState('draft_dict_customLanguage', '');
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [copiedNotification, setCopiedNotification] = useState(false);
  const [selectedFilterLang, setSelectedFilterLang] = useState<string | null>(null);
  const [exportLanguageFilter, setExportLanguageFilter] = useState<string>('all');
  
  const [vocabFlipDirection, setVocabFlipDirection] = useState<'indo-target' | 'target-indo'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('lifeos_dictionary_flip');
      if (saved === 'indo-target' || saved === 'target-indo') return saved;
    }
    return 'indo-target';
  });

  const handleFlipDirectionToggle = () => {
    const next = vocabFlipDirection === 'indo-target' ? 'target-indo' : 'indo-target';
    setVocabFlipDirection(next);
    localStorage.setItem('lifeos_dictionary_flip', next);
  };

  const handleDictionarySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!indonesianWord.trim() || !translatedWord.trim()) return;

    const language = vocabLanguage === 'Other' ? (customLanguage.trim() || 'Other') : vocabLanguage;

    await addDictionaryEntry({
      indonesian: indonesianWord.trim(),
      translation: translatedWord.trim(),
      language: language,
    });

    setIndonesianWord('');
    setTranslatedWord('');
    setCustomLanguage('');
  };

  // Group entries by language for display
  const dictionaryGrouped = (state.dictionary || []).reduce((acc: any, curr) => {
    const lang = curr.language || 'English';
    if (!acc[lang]) acc[lang] = [];
    acc[lang].push(curr);
    return acc;
  }, {});

  const sortedDictionary = React.useMemo(() => {
    return [...(state.dictionary || [])].sort((a, b) => {
      if (vocabFlipDirection === 'indo-target') {
        return a.indonesian.localeCompare(b.indonesian, locale === 'id' ? 'id-ID' : 'en-US');
      } else {
        return a.translation.localeCompare(b.translation, locale === 'id' ? 'id-ID' : 'en-US');
      }
    });
  }, [state.dictionary, vocabFlipDirection, locale]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-24">
      <div className="flex items-center gap-3">
        <Link href="/learning">
          <button className="w-10 h-10 rounded-full bg-white/[0.02] border border-life-line flex items-center justify-center text-life-muted hover:bg-white/[0.05] transition-all">
            <Icon name="arrowLeft" size={18} />
          </button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-life-text flex items-center gap-2">
            <Icon name="bookOpen" size={24} className="text-amber-500" />
            {t('dictionary_title')}
          </h1>
          <p className="text-zinc-500 text-xs mt-1">
            Kumpulkan kosakata baru dan kelompokkan berdasarkan bahasa.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Surface className="p-6 lg:col-span-1 h-fit">
          <div className="border-b border-life-line pb-3 mb-5">
            <h3 className="text-sm font-bold text-life-text uppercase tracking-wider">
              Kosakata Baru
            </h3>
          </div>
          <form onSubmit={handleDictionarySubmit} className="space-y-4">
            <div className="flex flex-col space-y-1">
              <label htmlFor="indonesianWord" className="text-xs font-bold text-life-muted uppercase">
                {t('dictionary_indo')}
              </label>
              <input
                id="indonesianWord"
                type="text"
                required
                placeholder="E.g. Mengesampingkan..."
                value={indonesianWord}
                onChange={(e) => setIndonesianWord(e.target.value)}
                className="glass-input text-sm"
              />
            </div>

            <div className="flex flex-col space-y-1">
              <label htmlFor="translatedWord" className="text-xs font-bold text-life-muted uppercase">
                {t('dictionary_target')}
              </label>
              <input
                id="translatedWord"
                type="text"
                required
                placeholder="E.g. Set aside..."
                value={translatedWord}
                onChange={(e) => setTranslatedWord(e.target.value)}
                className="glass-input text-sm"
              />
            </div>

            <div className="flex flex-col space-y-1">
              <label htmlFor="vocabLanguage" className="text-xs font-bold text-life-muted uppercase">
                {t('dictionary_lang')}
              </label>
              <select
                id="vocabLanguage"
                value={vocabLanguage}
                onChange={(e) => setVocabLanguage(e.target.value)}
                className="glass-select text-sm"
              >
                <option value="English">English</option>
                <option value="Korean">Korean</option>
                <option value="Japanese">Japanese</option>
                <option value="Spanish">Spanish</option>
                <option value="Other">Other...</option>
              </select>
            </div>

            {vocabLanguage === 'Other' && (
              <div className="flex flex-col space-y-1">
                <label htmlFor="customLanguage" className="text-xs font-bold text-life-muted uppercase">
                  Bahasa Lainnya
                </label>
                <input
                  id="customLanguage"
                  type="text"
                  required
                  placeholder="E.g. French"
                  value={customLanguage}
                  onChange={(e) => setCustomLanguage(e.target.value)}
                  className="glass-input text-sm"
                />
              </div>
            )}

            <Button type="submit" variant="primary" icon="plus" className="w-full justify-center mt-2">
              {t('dictionary_add_btn')}
            </Button>
            <Button
              type="button"
              variant="secondary"
              icon="book"
              className="w-full justify-center"
              onClick={() => setIsSummaryOpen(true)}
            >
              {t('dictionary_summary_btn')}
            </Button>
          </form>
        </Surface>

        <Surface className="p-6 lg:col-span-2">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-life-line pb-4 mb-4">
            <div className="flex items-center gap-2">
              <button
                onClick={handleFlipDirectionToggle}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/[0.03] border border-white/10 text-life-muted hover:text-life-text hover:border-life-teal transition-all"
                title="Tukar urutan (Indo -> Asing / Asing -> Indo)"
              >
                <Icon name="shuffle" size={14} />
              </button>
              <h3 className="text-sm font-bold text-life-text uppercase tracking-wider">
                Daftar Kamus Pribadi
              </h3>
            </div>
            
            <div className="flex gap-2 overflow-x-auto max-w-full">
              <button
                onClick={() => setSelectedFilterLang(null)}
                className={`px-3 py-1 text-[10px] font-black uppercase rounded-full border transition-all whitespace-nowrap ${
                  selectedFilterLang === null
                    ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                    : 'bg-white/[0.02] border-white/10 text-life-muted hover:border-white/20'
                }`}
              >
                Semua
              </button>
              {Object.keys(dictionaryGrouped).sort().map(lang => (
                <button
                  key={lang}
                  onClick={() => setSelectedFilterLang(lang)}
                  className={`px-3 py-1 text-[10px] font-black uppercase rounded-full border transition-all whitespace-nowrap ${
                    selectedFilterLang === lang
                      ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                      : 'bg-white/[0.02] border-white/10 text-life-muted hover:border-white/20'
                  }`}
                >
                  {lang} <span className="opacity-50 ml-1">({dictionaryGrouped[lang].length})</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            {sortedDictionary.length > 0 ? (
              sortedDictionary
                .filter(item => selectedFilterLang ? item.language === selectedFilterLang : true)
                .map((item) => (
                  <div key={item.id} className="flex justify-between items-center p-3 rounded-lg bg-white/[0.01] border border-life-line hover:border-life-line-strong transition-colors group">
                    <div className="grid grid-cols-2 gap-4 flex-1">
                      <span className="text-xs font-bold text-life-text">
                        {vocabFlipDirection === 'indo-target' ? item.indonesian : item.translation}
                      </span>
                      <span className="text-xs font-medium text-amber-300">
                        {vocabFlipDirection === 'indo-target' ? item.translation : item.indonesian}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-life-muted/50 uppercase font-black tracking-widest bg-white/5 px-2 py-0.5 rounded">
                        {item.language || 'English'}
                      </span>
                      <button
                        onClick={() => deleteDictionaryEntry(item.id)}
                        className="text-life-muted hover:text-life-rose transition-colors opacity-0 group-hover:opacity-100"
                        title={t('delete')}
                      >
                        <Icon name="trash" size={12} />
                      </button>
                    </div>
                  </div>
                ))
            ) : (
              <EmptyState />
            )}
          </div>
        </Surface>
      </div>

      <Modal
        isOpen={isSummaryOpen}
        onClose={() => setIsSummaryOpen(false)}
        title={t('dictionary_summary_title')}
      >
        <div className="space-y-4 mt-2">
          <div className="flex gap-2">
            <select
              value={exportLanguageFilter}
              onChange={(e) => setExportLanguageFilter(e.target.value)}
              className="glass-select text-xs h-9 flex-1"
            >
              <option value="all">Semua Bahasa</option>
              {Object.keys(dictionaryGrouped).map(lang => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>
            <Button
              variant="secondary"
              onClick={() => {
                let dataToCopy = '';
                const filtered = exportLanguageFilter === 'all' 
                  ? state.dictionary || [] 
                  : (state.dictionary || []).filter(d => d.language === exportLanguageFilter);
                
                filtered.forEach(d => {
                  dataToCopy += `${d.indonesian} = ${d.translation}\n`;
                });

                navigator.clipboard.writeText(dataToCopy);
                setCopiedNotification(true);
                setTimeout(() => setCopiedNotification(false), 2000);
              }}
              className="h-9 px-4 text-xs shrink-0"
            >
              {copiedNotification ? t('dictionary_copied') : t('dictionary_notebooklm_btn')}
            </Button>
          </div>
          
          <div className="bg-black/20 border border-white/5 p-4 rounded-lg h-[40vh] overflow-y-auto text-xs text-life-text font-mono leading-relaxed select-all">
            {state.dictionary?.filter(d => exportLanguageFilter === 'all' || d.language === exportLanguageFilter).map((d) => (
              <div key={d.id}>
                <span className="text-amber-300">{d.indonesian}</span> = <span className="text-teal-300">{d.translation}</span>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-2">
            <a 
              href="https://notebooklm.google.com/" 
              target="_blank" 
              rel="noreferrer"
              className="text-xs font-bold text-life-teal hover:text-teal-300 transition-colors flex items-center gap-1"
            >
              {t('dictionary_notebooklm_link')} <Icon name="arrowRight" size={12} />
            </a>
          </div>
        </div>
      </Modal>
    </div>
  );
}
