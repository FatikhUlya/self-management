'use client';

import React, { useState, useMemo } from 'react';
import { useLifeOS, SelfRule, RuleComplianceLog } from '@/lib/hooks/useLifeOSState';
import { useI18n } from '@/lib/i18n/context';
import { Surface } from '@/components/ui/Surface';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Icon } from '@/components/ui/Icon';
import { MetricCard } from '@/components/ui/MetricCard';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { formatDate, todayISO, cn } from '@/lib/utils';
import { DateStamp } from '@/components/ui/DateStamp';

const DEFAULT_SECTIONS = [
  'Fokus & Deep Work',
  'Kesehatan & Energi',
  'Integritas & Karakter',
  'Keuangan & Kebiasaan',
  'Komunikasi & Sosial',
];

const RECOMMENDED_RULES = [
  { text: 'Tidak ada scrolling media sosial sebelum menyelesaikan 1 blok Deep Work di pagi hari.', section: 'Fokus & Deep Work' },
  { text: 'Tidur minimal 7 jam dan hentikan paparan layar 45 menit sebelum istirahat.', section: 'Kesehatan & Energi' },
  { text: 'Tentukan 1 prioritas terpenting (The One Thing) sebelum membuka pesan / notifikasi.', section: 'Fokus & Deep Work' },
  { text: 'Belanja berdasarkan anggaran terencana, tunda 24 jam untuk pembelian impulsif.', section: 'Keuangan & Kebiasaan' },
  { text: 'Radikal transparan pada diri sendiri: jika gagal mencapai target, perbaiki sistemnya.', section: 'Integritas & Karakter' },
];

const OPERATING_CREED = [
  {
    title: '1. Single-Tasking Over Multitasking',
    desc: 'Lakukan satu hal dengan konsentrasi penuh hingga selesai. Multitasking adalah ilusi yang memecah kualitas kognitif.',
    icon: 'target',
  },
  {
    title: '2. Ship Small, Iterate Fast',
    desc: 'Kesempurnaan adalah musuh eksekusi. Luncurkan progres kecil setiap hari, pelajari responsnya, lalu sempurnakan.',
    icon: 'activity',
  },
  {
    title: '3. Sleep & Energy are Non-Negotiable',
    desc: 'Energi tubuh dan pikiran adalah bahan bakar utama. Istirahat yang cukup bukan pemborosan waktu, melainkan investasi ketajaman.',
    icon: 'star',
  },
  {
    title: '4. Systems Over Willpower',
    desc: 'Kemauan bisa melemah saat lelah, tetapi sistem dan aturan yang jelas akan selalu menjaga Anda tetap berada di jalur yang benar.',
    icon: 'shield',
  },
];

export default function RulesPage() {
  const {
    state,
    addSelfRule,
    deleteSelfRule,
    reorderSelfRules,
    addRuleComplianceLog,
  } = useLifeOS();

  const { t, locale } = useI18n();
  const selectedDate = state.selectedDate || todayISO();

  // Active Tab
  const [activeTab, setActiveTab] = useState<'compliance' | 'rules' | 'creed'>('compliance');

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [sectionFilter, setSectionFilter] = useState<string>('all');

  // Inline Quick Add Rule
  const [quickRuleText, setQuickRuleText] = useState('');
  const [quickSection, setQuickSection] = useState(DEFAULT_SECTIONS[0]);

  // Dialog States
  const [isNewRuleModalOpen, setIsNewRuleModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<SelfRule | null>(null);
  const [modalRuleText, setModalRuleText] = useState('');
  const [modalSection, setModalSection] = useState(DEFAULT_SECTIONS[0]);

  // Missed Log Modal State
  const [ruleForMissedLog, setRuleForMissedLog] = useState<SelfRule | null>(null);
  const [missedReason, setMissedReason] = useState('');
  const [missedImprovement, setMissedImprovement] = useState('');

  // Rules list sorted by orderIndex
  const rules = useMemo(() => {
    return [...(state.selfRules || [])].sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
  }, [state.selfRules]);

  // Unique sections list
  const availableSections = useMemo(() => {
    const list = Array.from(new Set(rules.map((r) => r.section || 'General')));
    DEFAULT_SECTIONS.forEach((ds) => {
      if (!list.includes(ds)) list.push(ds);
    });
    return list;
  }, [rules]);

  // Today's Compliance Logs
  const todayLogs = useMemo(() => {
    return (state.ruleComplianceLogs || []).filter((log) => log.date === selectedDate);
  }, [state.ruleComplianceLogs, selectedDate]);

  // Compliance Stats
  const followedCount = useMemo(() => {
    return todayLogs.filter((l) => l.status === 'followed').length;
  }, [todayLogs]);

  const missedCount = useMemo(() => {
    return todayLogs.filter((l) => l.status === 'missed').length;
  }, [todayLogs]);

  const complianceRate = useMemo(() => {
    if (rules.length === 0) return 0;
    return Math.round((followedCount / rules.length) * 100);
  }, [followedCount, rules.length]);

  // Filtered Rules
  const filteredRules = useMemo(() => {
    return rules.filter((r) => {
      if (sectionFilter !== 'all' && (r.section || 'General') !== sectionFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchText = r.rule_text.toLowerCase().includes(q);
        const matchSec = r.section?.toLowerCase().includes(q);
        if (!matchText && !matchSec) return false;
      }
      return true;
    });
  }, [rules, sectionFilter, searchQuery]);

  // Grouped Filtered Rules by Section
  const groupedRules = useMemo(() => {
    const groups: Record<string, SelfRule[]> = {};
    filteredRules.forEach((r) => {
      const sec = r.section || 'General';
      if (!groups[sec]) groups[sec] = [];
      groups[sec].push(r);
    });
    return groups;
  }, [filteredRules]);

  // Fast Add Rule
  const handleQuickAddRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickRuleText.trim()) return;

    await addSelfRule(quickRuleText.trim(), quickSection);
    setQuickRuleText('');
  };

  // Submit Modal Rule (Create / Edit)
  const handleSubmitModalRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalRuleText.trim()) return;

    if (editingRule) {
      const updated = rules.map((r) =>
        r.id === editingRule.id
          ? { ...r, rule_text: modalRuleText.trim(), section: modalSection }
          : r
      );
      await reorderSelfRules(updated);
    } else {
      await addSelfRule(modalRuleText.trim(), modalSection);
    }

    setIsNewRuleModalOpen(false);
    setEditingRule(null);
    setModalRuleText('');
  };

  // Seed 5 Recommended Rules
  const handleSeedRecommendations = async () => {
    for (const rec of RECOMMENDED_RULES) {
      await addSelfRule(rec.text, rec.section);
    }
  };

  // Mark Compliance for a Rule
  const handleMarkCompliance = async (ruleId: string, status: 'followed' | 'missed' | 'exempt') => {
    if (status === 'missed') {
      const targetRule = rules.find((r) => r.id === ruleId);
      if (targetRule) {
        setRuleForMissedLog(targetRule);
        setMissedReason('');
        setMissedImprovement('');
        return;
      }
    }

    await addRuleComplianceLog({
      ruleId,
      date: selectedDate,
      status,
    });
  };

  // Submit Missed Reason Log
  const handleSubmitMissedLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleForMissedLog) return;

    await addRuleComplianceLog({
      ruleId: ruleForMissedLog.id,
      date: selectedDate,
      status: 'missed',
      reason: missedReason.trim(),
      improvement: missedImprovement.trim(),
    });

    setRuleForMissedLog(null);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header & Page Title */}
      <div className="page-header">
        <div>
          <DateStamp />
          <div className="flex items-center gap-2 mb-1">
            <h1 className="page-title">
              Personal Rules & Daily Compass
            </h1>
            <Badge tone="amber" className="tabular-nums text-xs">
              {rules.length} Aturan Aktif
            </Badge>
          </div>
          <p className="page-subtitle">
            Prinsip integritas, etos kerja solo operator, dan audit kepatuhan aturan hidup harian Anda.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button href="/rules/decisions" variant="secondary" icon="compass">Log Keputusan</Button>
          {rules.length === 0 && (
            <Button
              variant="outline"
              icon="sparkles"
              onClick={handleSeedRecommendations}
              className="text-xs"
            >
              Pasang 5 Prinsip Rekomendasi
            </Button>
          )}
          <Button
            variant="primary"
            icon="plus"
            onClick={() => {
              setEditingRule(null);
              setModalRuleText('');
              setModalSection(DEFAULT_SECTIONS[0]);
              setIsNewRuleModalOpen(true);
            }}
            className="text-xs"
          >
            Tambah Prinsip Baru
          </Button>
        </div>
      </div>

      {/* Top Strategic Metric Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard glow
          icon="shield"
          label="Kepatuhan Hari Ini"
          value={`${complianceRate}%`}
          detail={`${followedCount} dari ${rules.length} aturan ditaati`}
        />
        <MetricCard
          icon="checkCircle"
          label="Aturan Ditaati"
          value={followedCount}
          detail={followedCount > 0 ? 'Disiplin terjaga dengan baik' : 'Lakukan check-in hari ini'}
        />
        <MetricCard
          icon="alertCircle"
          label="Terlanggar / Hambatan"
          value={missedCount}
          detail={missedCount === 0 ? 'Nol pelanggaran hari ini' : 'Bahan evaluasi malam'}
        />
        <MetricCard
          icon="book"
          label="Kategori Terdefinisi"
          value={Object.keys(groupedRules).length}
          detail="Dimensi aturan personal"
        />
      </div>

      {/* Modern Segmented Navigation Tabs */}
      <div className="flex items-center justify-between gap-4 min-w-0">
        <div role="tablist" className="seg">
          <button
            onClick={() => setActiveTab('compliance')}
            role="tab" aria-selected={activeTab === 'compliance'} className="seg-item"
          >
            <Icon name="checkCircle" size={14} className={activeTab === 'compliance' ? 'text-amber-500' : ''} />
            Check-In Kepatuhan Hari Ini
            <span className="seg-count">
              {formatDate(selectedDate)}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('rules')}
            role="tab" aria-selected={activeTab === 'rules'} className="seg-item"
          >
            <Icon name="shield" size={14} className={activeTab === 'rules' ? 'text-amber-500' : ''} />
            Katalog & Manajemen Aturan
            <span className="seg-count">
              {rules.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('creed')}
            role="tab" aria-selected={activeTab === 'creed'} className="seg-item"
          >
            <Icon name="star" size={14} className={activeTab === 'creed' ? 'text-amber-500' : ''} />
            Etos Kerja Solo Operator
          </button>
        </div>
      </div>

      {/* TAB 1: CHECK-IN KEPATUHAN HARI INI */}
      {activeTab === 'compliance' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <Surface className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                <Icon name="shield" size={13} className="text-muted-foreground" />
                Audit Disiplin & Kepatuhan Prinsip ({formatDate(selectedDate)})
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Beri tanda apakah Anda mematuhi masing-masing prinsip hidup hari ini secara jujur.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <span className="text-xs tabular-nums font-medium text-foreground">
                Skor Disiplin: {complianceRate}%
              </span>
              <div className="w-24">
                <ProgressBar value={complianceRate} max={100} />
              </div>
            </div>
          </Surface>

          {rules.length > 0 ? (
            <div className="space-y-3">
              {rules.map((rule, idx) => {
                const log = todayLogs.find((l) => l.ruleId === rule.id);
                const isFollowed = log?.status === 'followed';
                const isMissed = log?.status === 'missed';

                return (
                  <Surface
                    key={rule.id}
                    className={cn(
                      'p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors',
                      isFollowed && 'border-emerald-500/30 bg-emerald-500/5',
                      isMissed && 'border-rose-500/30 bg-rose-500/5'
                    )}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <span className="text-xs tabular-nums font-medium text-muted-foreground mt-0.5">
                        {idx + 1}.
                      </span>
                      <div className="space-y-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground leading-relaxed">
                          {rule.rule_text}
                        </p>
                        <span className="inline-block px-2 py-0.2 rounded bg-muted/40 border border-border text-xs text-muted-foreground">
                          {rule.section || 'General'}
                        </span>
                        {isMissed && log?.reason && (
                          <p className="text-xs text-rose-500 font-medium pt-1">
                            Alasan terlanggar: "{log.reason}"
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={() => handleMarkCompliance(rule.id, 'followed')}
                        className={cn(
                          'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 border min-h-[44px]',
                          isFollowed
                            ? 'bg-emerald-500 text-white border-emerald-600 shadow-card'
                            : 'bg-muted/30 text-muted-foreground border-border hover:bg-emerald-500/10 hover:text-emerald-500 hover:border-emerald-500/30'
                        )}
                      >
                        <Icon name="check" size={13} />
                        Ditaati
                      </button>

                      <button
                        type="button"
                        onClick={() => handleMarkCompliance(rule.id, 'missed')}
                        className={cn(
                          'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 border min-h-[44px]',
                          isMissed
                            ? 'bg-rose-500 text-white border-rose-600 shadow-card'
                            : 'bg-muted/30 text-muted-foreground border-border hover:bg-rose-500/10 hover:text-rose-500 hover:border-rose-500/30'
                        )}
                      >
                        <Icon name="alertCircle" size={13} />
                        Terlanggar
                      </button>
                    </div>
                  </Surface>
                );
              })}
            </div>
          ) : (
            <Surface className="p-8 text-center space-y-3">
              <EmptyState message="Belum ada aturan atau prinsip personal yang tersimpan." />
              <Button
                variant="primary"
                icon="sparkles"
                onClick={handleSeedRecommendations}
                className="text-xs mx-auto"
              >
                Pasang 5 Prinsip Rekomendasi
              </Button>
            </Surface>
          )}
        </div>
      )}

      {/* TAB 2: KATALOG & MANAJEMEN ATURAN */}
      {activeTab === 'rules' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Inline Quick Add Rule */}
          <Surface className="p-4">
            <form onSubmit={handleQuickAddRule} className="flex flex-col gap-3">
              <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Icon name="plus" size={13} className="text-amber-500" />
                Tambah Prinsip Cepat
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                <input
                  type="text"
                  placeholder="Tuliskan prinsip atau aturan hidup Anda"
                  value={quickRuleText}
                  onChange={(e) => setQuickRuleText(e.target.value)}
                  className="sm:col-span-8 px-3 py-2 text-xs rounded-lg bg-muted/20 border border-border focus:outline-none focus:border-amber-500 text-foreground" aria-label="Tuliskan prinsip atau aturan hidup Anda"
/>
                <select
                  value={quickSection}
                  onChange={(e) => setQuickSection(e.target.value)}
                  className="sm:col-span-3 px-2.5 py-2 text-xs rounded-lg bg-muted/20 border border-border focus:outline-none text-foreground"
                >
                  {availableSections.map((sec) => (
                    <option key={sec} value={sec}>
                      {sec}
                    </option>
                  ))}
                </select>
                <div className="sm:col-span-1">
                  <Button
                    type="submit"
                    variant="primary"
                    icon="plus"
                    className="w-full text-xs py-2 px-0 flex justify-center"
                  >
                    Tambah
                  </Button>
                </div>
              </div>
            </form>
          </Surface>

          {/* Search & Filter Bar */}
          <Surface className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Icon
                name="search"
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                type="text"
                placeholder="Cari prinsip atau kata kunci"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg bg-muted/20 border border-border focus:outline-none focus:border-amber-500 text-foreground" aria-label="Cari prinsip atau kata kunci"
/>
            </div>

            <select
              value={sectionFilter}
              onChange={(e) => setSectionFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-lg bg-muted/20 border border-border text-foreground focus:outline-none w-full sm:w-auto"
            >
              <option value="all">Semua Kategori</option>
              {availableSections.map((sec) => (
                <option key={sec} value={sec}>
                  {sec}
                </option>
              ))}
            </select>
          </Surface>

          {/* Grouped Rules Feed */}
          {Object.keys(groupedRules).length > 0 ? (
            <div className="space-y-6">
              {Object.entries(groupedRules).map(([sectionName, sectionRules]) => (
                <div key={sectionName} className="space-y-3">
                  <div className="flex items-center gap-2 pb-1 border-b border-border">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <h3 className="text-xs font-medium text-foreground">
                      {sectionName}
                    </h3>
                    <span className="text-xs tabular-nums text-muted-foreground">
                      ({sectionRules.length})
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {sectionRules.map((r, idx) => (
                      <Surface
                        key={r.id}
                        className="p-4 flex items-center justify-between hover:border-amber-500/40 transition-colors gap-4 group"
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          <span className="text-xs tabular-nums font-medium text-muted-foreground mt-0.5">
                            {idx + 1}.
                          </span>
                          <p className="text-sm font-semibold text-foreground leading-relaxed">
                            {r.rule_text}
                          </p>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingRule(r);
                              setModalRuleText(r.rule_text);
                              setModalSection(r.section || DEFAULT_SECTIONS[0]);
                              setIsNewRuleModalOpen(true);
                            }}
                            className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"
                            title="Edit Aturan"
                          >
                            <Icon name="edit" size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              if (confirm('Hapus prinsip ini?')) {
                                await deleteSelfRule(r.id);
                              }
                            }}
                            className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                            title="Hapus Aturan"
                          >
                            <Icon name="trash" size={13} />
                          </button>
                        </div>
                      </Surface>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Surface className="p-8">
              <EmptyState message="Tidak ada prinsip yang cocok dengan kriteria filter." />
            </Surface>
          )}
        </div>
      )}

      {/* TAB 3: ETOS KERJA SOLO OPERATOR */}
      {activeTab === 'creed' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <Surface className="p-6 border-l-4 border-l-amber-500 ">
            <h3 className="text-sm font-medium text-amber-500 mb-1 flex items-center gap-2">
              <Icon name="shield" size={16} />
              Operating Creed: Filosofi Eksekusi Solo Operator
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl">
              Sebagai seorang operator mandiri, kebebasan Anda adalah hasil langsung dari disiplin internal.
              Prinsip-prinsip ini dirancang untuk menjaga fokus tetap tajam dan mencegah kelelahan mental.
            </p>
          </Surface>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {OPERATING_CREED.map((item, idx) => (
              <Surface key={idx} className="p-5 flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
                      <Icon name={item.icon} size={15} />
                    </div>
                    <strong className="text-sm font-medium text-foreground">
                      {item.title}
                    </strong>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed pl-9">
                    {item.desc}
                  </p>
                </div>
                <div className="pt-2 border-t border-border flex justify-end">
                  <button
                    type="button"
                    onClick={async () => {
                      await addSelfRule(item.title.replace(/^[0-9]+\.\s*/, ''), 'Etos Solo Operator');
                    }}
                    className="text-xs font-medium text-amber-600 dark:text-amber-400 hover:underline"
                  >
                    + Masukkan ke Aturan Saya
                  </button>
                </div>
              </Surface>
            ))}
          </div>
        </div>
      )}

      {/* DIALOG 1: MODAL TAMBAH / EDIT PRINSIP */}
      <Dialog open={isNewRuleModalOpen} onOpenChange={setIsNewRuleModalOpen}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleSubmitModalRule}>
            <DialogHeader>
              <DialogTitle className="text-lg font-medium flex items-center gap-2">
                <Icon name="shield" size={18} className="text-amber-500" />
                {editingRule ? 'Edit Prinsip Hidup' : 'Tambah Prinsip Baru'}
              </DialogTitle>
              <DialogDescription>
                Tuliskan aturan yang ingin Anda jadikan pedoman tindakan harian.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-3 text-xs">
              <div>
                <label className="label mb-1.5">
                  Teks Prinsip / Aturan *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Contoh: Tidak ada scrolling media sosial sebelum 1 sesi Deep Work selesai"
                  value={modalRuleText}
                  onChange={(e) => setModalRuleText(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-lg bg-muted/20 border border-border text-foreground leading-relaxed focus:outline-none focus:border-amber-500 resize-none" aria-label="Contoh: Tidak ada scrolling media sosial sebelum 1 sesi Deep Work selesai"
/>
              </div>

              <div>
                <label className="label mb-1.5">
                  Kategori / Dimensi Aturan
                </label>
                <select
                  value={modalSection}
                  onChange={(e) => setModalSection(e.target.value)}
                  className="glass-input"
                >
                  {availableSections.map((sec) => (
                    <option key={sec} value={sec}>
                      {sec}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsNewRuleModalOpen(false)}>
                Batal
              </Button>
              <Button type="submit" variant="primary">
                {editingRule ? 'Perbarui Prinsip' : 'Simpan Prinsip'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG 2: CATATAN PELANGGARAN ATURAN (MISSED LOG) */}
      <Dialog open={!!ruleForMissedLog} onOpenChange={(open) => !open && setRuleForMissedLog(null)}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleSubmitMissedLog}>
            <DialogHeader>
              <DialogTitle className="text-base font-medium flex items-center gap-2 text-rose-500">
                <Icon name="alertCircle" size={18} />
                Catat Evaluasi Pelanggaran Aturan
              </DialogTitle>
              <DialogDescription>
                Identifikasi pemicu terlanggarnya aturan "{ruleForMissedLog?.rule_text}".
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2 text-xs">
              <div>
                <label className="label mb-1.5">
                  Apa yang memicu pelanggaran ini?
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Contoh: Merasa lelah setelah meeting panjang lalu membuka Instagram tanpa sadar"
                  value={missedReason}
                  onChange={(e) => setMissedReason(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-lg bg-muted/20 border border-border text-foreground leading-relaxed focus:outline-none focus:border-rose-500 resize-none" aria-label="Contoh: Merasa lelah setelah meeting panjang lalu membuka Instagram tanpa sadar"
/>
              </div>

              <div>
                <label className="label mb-1.5">
                  Sistem perbaikan untuk mencegahnya terulang:
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Pasang app blocker mulai jam 21:00"
                  value={missedImprovement}
                  onChange={(e) => setMissedImprovement(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-muted/20 border border-border text-foreground focus:outline-none focus:border-rose-500" aria-label="Contoh: Pasang app blocker mulai jam 21:00"
/>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setRuleForMissedLog(null)}>
                Batal
              </Button>
              <Button type="submit" variant="destructive">
                Simpan Evaluasi
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
