'use client';

import React, { useState } from 'react';
import { useLifeOS } from '@/lib/hooks/useLifeOSState';
import { useI18n } from '@/lib/i18n/context';
import { Surface } from '@/components/ui/Surface';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Icon } from '@/components/ui/Icon';

export default function RulesPage() {
  const { state, addSelfRule, deleteSelfRule, updateSelfRuleSection } = useLifeOS();
  const { t, locale } = useI18n();

  const [newRule, setNewRule] = useState('');
  const [newSection, setNewSection] = useState('General');

  // Drag and Drop States
  const [draggingRuleId, setDraggingRuleId] = useState<string | null>(null);
  const [dragOverSection, setDragOverSection] = useState<string | null>(null);

  const handleAddRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRule.trim()) return;

    await addSelfRule(newRule.trim(), newSection.trim() || 'General');
    setNewRule('');
  };

  const handleDeleteRule = async (id: string) => {
    if (confirm(t('confirm_delete') as string)) {
      await deleteSelfRule(id);
    }
  };

  const rules = state.selfRules || [];
  
  // Group rules by section
  const groupedRules = rules.reduce((acc, rule) => {
    const section = rule.section || 'General';
    if (!acc[section]) acc[section] = [];
    acc[section].push(rule);
    return acc;
  }, {} as Record<string, typeof rules>);

  // --- Drag and Drop Handlers ---
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggingRuleId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, section: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverSection !== section) {
      setDragOverSection(section);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverSection(null);
  };

  const handleDrop = async (e: React.DragEvent, section: string) => {
    e.preventDefault();
    setDragOverSection(null);
    if (draggingRuleId) {
      const rule = rules.find((r) => r.id === draggingRuleId);
      if (rule && (rule.section || 'General') !== section) {
        await updateSelfRuleSection(draggingRuleId, section);
      }
      setDraggingRuleId(null);
    }
  };

  const handleDragEnd = () => {
    setDraggingRuleId(null);
    setDragOverSection(null);
  };
  // ------------------------------

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-amber-600 dark:from-yellow-300 dark:to-amber-500 flex items-center gap-2">
            <Icon name="shield" size={28} className="text-amber-500" />
            {t('rules_title')}
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">
            {t('rules_desc')}
          </p>
        </div>
      </div>

      {/* Add Rule Form */}
      <Surface className="p-4">
        <form onSubmit={handleAddRule} className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            className="sm:w-1/4 bg-white/50 dark:bg-black/20 border border-zinc-200 dark:border-zinc-700/50 rounded-lg px-4 py-2 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            placeholder="Kategori (opsional)"
            value={newSection}
            onChange={(e) => setNewSection(e.target.value)}
          />
          <input
            type="text"
            className="flex-1 bg-white/50 dark:bg-black/20 border border-zinc-200 dark:border-zinc-700/50 rounded-lg px-4 py-2 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            placeholder={t('rules_placeholder') as string}
            value={newRule}
            onChange={(e) => setNewRule(e.target.value)}
          />
          <Button type="submit" variant="primary" icon="plus" className="bg-amber-600 hover:bg-amber-700 text-white">
            {t('rules_add_btn')}
          </Button>
        </form>
      </Surface>

      {/* Rules List */}
      <div>
        <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200 mb-4 flex items-center gap-2">
          {rules.length} {t('rules_active')}
        </h2>
        
        {rules.length === 0 ? (
          <EmptyState message={t('rules_no_data') as string} />
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedRules).map(([section, sectionRules]) => (
              <div 
                key={section} 
                className={`space-y-3 p-4 rounded-xl transition-colors border-2 ${
                  dragOverSection === section 
                    ? 'border-amber-500/50 bg-amber-500/5 dark:bg-amber-500/10' 
                    : 'border-transparent'
                }`}
                onDragOver={(e) => handleDragOver(e, section)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, section)}
              >
                <h3 className="text-sm font-bold text-amber-500 uppercase tracking-wider px-2 border-l-2 border-amber-500">
                  {section}
                </h3>
                <div className="grid gap-3">
                  {sectionRules.map((rule) => (
                    <Surface
                      key={rule.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, rule.id)}
                      onDragEnd={handleDragEnd}
                      className={`p-4 flex items-center justify-between group hover:border-amber-500/30 transition-all cursor-move ${
                        draggingRuleId === rule.id ? 'opacity-50 scale-[0.98]' : 'opacity-100'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-1 w-2 h-2 rounded-full bg-amber-500 flex-shrink-0 cursor-grab" />
                        <p className="text-zinc-800 dark:text-zinc-200 leading-relaxed font-medium text-lg">
                          {rule.rule_text}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteRule(rule.id)}
                        className="opacity-0 group-hover:opacity-100 p-2 text-zinc-400 hover:text-red-500 transition-all rounded-md hover:bg-red-50 dark:hover:bg-red-500/10 flex-shrink-0"
                        title={t('delete') as string}
                      >
                        <Icon name="trash" size={18} />
                      </button>
                    </Surface>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
