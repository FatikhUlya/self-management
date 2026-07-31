'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useLifeOS } from '@/lib/hooks/useLifeOSState';
import { useI18n } from '@/lib/i18n/context';
import { Surface } from '@/components/ui/Surface';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Icon } from '@/components/ui/Icon';

export default function RulesPage() {
  const { state, addSelfRule, deleteSelfRule, updateSelfRuleSection, reorderSelfRules } = useLifeOS();
  const { t, locale } = useI18n();

  const [newRule, setNewRule] = useState('');
  const [newSection, setNewSection] = useState('General');

  // Drag and Drop States
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [draggingType, setDraggingType] = useState<'rule' | 'section' | null>(null);
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
  const [localRules, setLocalRules] = useState(rules);

  useEffect(() => {
    setLocalRules([...rules].sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0)));
  }, [rules]);
  
  // Group rules by section while maintaining global array order
  const orderedSections = useMemo(() => {
    return Array.from(new Set(localRules.map(r => r.section || 'General')));
  }, [localRules]);

  const groupedRules = useMemo(() => {
    return orderedSections.reduce((acc, section) => {
      acc[section] = localRules.filter(r => (r.section || 'General') === section);
      return acc;
    }, {} as Record<string, typeof rules>);
  }, [localRules, orderedSections]);

  // --- Drag and Drop Handlers ---
  const handleDragStart = (e: React.DragEvent, id: string, type: 'rule' | 'section') => {
    e.stopPropagation();
    setDraggingId(id);
    setDraggingType(type);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  };

  const handleRuleDragEnter = (e: React.DragEvent, targetRuleId: string) => {
    e.preventDefault();
    if (draggingType !== 'rule' || !draggingId || draggingId === targetRuleId) return;

    const draggingRuleIndex = localRules.findIndex(r => r.id === draggingId);
    const targetRuleIndex = localRules.findIndex(r => r.id === targetRuleId);
    
    if (draggingRuleIndex === -1 || targetRuleIndex === -1) return;

    const newRules = [...localRules];
    const removed = { ...newRules[draggingRuleIndex] };
    const targetRule = newRules[targetRuleIndex];
    
    // Auto change section if hovered over rule in different section
    removed.section = targetRule.section;
    
    newRules.splice(draggingRuleIndex, 1);
    // Find new target index because splice shifts array
    const newTargetIndex = newRules.findIndex(r => r.id === targetRuleId);
    newRules.splice(newTargetIndex !== -1 ? newTargetIndex : targetRuleIndex, 0, removed);
    
    setLocalRules(newRules);
  };

  const handleSectionDragEnter = (e: React.DragEvent, targetSection: string) => {
    e.preventDefault();
    if (!draggingId) return;

    if (draggingType === 'rule') {
      // Allow rule to be dropped into an empty section or at bottom of section
      if (dragOverSection !== targetSection) setDragOverSection(targetSection);
    } else if (draggingType === 'section') {
      if (draggingId === targetSection) return;

      const sectionRules = localRules.filter(r => (r.section || 'General') === draggingId);
      const otherRules = localRules.filter(r => (r.section || 'General') !== draggingId);
      
      const targetIndex = otherRules.findIndex(r => (r.section || 'General') === targetSection);
      if (targetIndex !== -1) {
        const newRules = [
          ...otherRules.slice(0, targetIndex),
          ...sectionRules,
          ...otherRules.slice(targetIndex)
        ];
        setLocalRules(newRules);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverSection(null);
  };

  const handleDrop = (e: React.DragEvent, targetSection: string) => {
    e.preventDefault();
    setDragOverSection(null);

    // If dropping a rule directly onto the section container
    if (draggingType === 'rule' && draggingId) {
      const draggingRuleIndex = localRules.findIndex(r => r.id === draggingId);
      if (draggingRuleIndex === -1) return;
      const draggingRule = localRules[draggingRuleIndex];
      
      if ((draggingRule.section || 'General') !== targetSection) {
        const newRules = [...localRules];
        const removed = { ...newRules[draggingRuleIndex], section: targetSection };
        newRules.splice(draggingRuleIndex, 1);
        
        // Find last index of this section to append
        // We find the first rule of the next section, or push to end
        const insertIndex = newRules.findLastIndex(r => (r.section || 'General') === targetSection) + 1;
        if (insertIndex > 0) {
          newRules.splice(insertIndex, 0, removed);
        } else {
          newRules.push(removed);
        }
        setLocalRules(newRules);
      }
    }
  };

  const handleDragEnd = async () => {
    const updatedRules = localRules.map((r, i) => ({ ...r, orderIndex: i }));
    await reorderSelfRules(updatedRules);
    
    setDraggingId(null);
    setDraggingType(null);
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
            {orderedSections.map((section) => {
              const sectionRules = groupedRules[section] || [];
              return (
                <div 
                  key={section} 
                  draggable
                  onDragStart={(e) => handleDragStart(e, section, 'section')}
                  onDragEnter={(e) => handleSectionDragEnter(e, section)}
                  onDragEnd={handleDragEnd}
                  className={`space-y-3 p-4 rounded-xl transition-colors border-2 ${
                    draggingType === 'section' && draggingId === section ? 'opacity-50 scale-[0.99] border-dashed border-zinc-400' : 
                    dragOverSection === section 
                      ? 'border-amber-500/50 bg-amber-500/5 dark:bg-amber-500/10' 
                      : 'border-transparent'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, section)}
                >
                  <div className="flex items-center gap-2 mb-2 cursor-grab">
                    <Icon name="gripVertical" size={16} className="text-zinc-400 dark:text-zinc-600" />
                    <h3 className="text-sm font-bold text-amber-500 uppercase tracking-wider px-2 border-l-2 border-amber-500 select-none">
                      {section}
                    </h3>
                  </div>
                  <div className="grid gap-3">
                    {sectionRules.map((rule) => (
                      <Surface
                        key={rule.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, rule.id, 'rule')}
                        onDragEnter={(e) => handleRuleDragEnter(e, rule.id)}
                        onDragOver={handleDragOver}
                        onDragEnd={handleDragEnd}
                        className={`p-4 flex items-center justify-between group hover:border-amber-500/30 transition-all cursor-grab active:cursor-grabbing ${
                          draggingType === 'rule' && draggingId === rule.id ? 'opacity-50 scale-[0.98]' : 'opacity-100'
                        }`}
                      >
                        <div className="flex items-start gap-3 w-full">
                          <div className="mt-1 w-4 h-4 text-zinc-400 dark:text-zinc-600 flex items-center justify-center flex-shrink-0 cursor-grab active:cursor-grabbing">
                             <Icon name="gripVertical" size={16} />
                          </div>
                          <p className="text-zinc-800 dark:text-zinc-200 leading-relaxed font-medium text-lg flex-1">
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
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
