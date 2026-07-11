'use client';

import React, { useState } from 'react';
import { useLifeOS } from '@/lib/hooks/useLifeOSState';
import { useI18n } from '@/lib/i18n/context';
import { Surface } from '@/components/ui/Surface';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { Icon } from '@/components/ui/Icon';
import { Modal } from '@/components/ui/Modal';
import { LineChart } from '@/components/ui/LineChart';
import { 
  formatDate, 
  monthLabel, 
  monthCalendarDays, 
  monthDays, 
  dayName, 
  toISODate, 
  percent, 
  avg,
  yearOptions,
  dateInMonthYear,
  addDays
} from '@/lib/utils';
import { HABIT_AREAS } from '@/lib/constants';

export default function HabitsPage() {
  const { state, addHabit, toggleHabit, deleteHabit } = useLifeOS();
  const { t, locale } = useI18n();

  // Dialog & selection states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null);

  // Form states
  const [habitName, setHabitName] = useState('');
  const [habitArea, setHabitArea] = useState<string>(HABIT_AREAS[0]);
  const [habitFrequency, setHabitFrequency] = useState<'daily' | 'weekly'>('daily');
  const [habitTarget, setHabitTarget] = useState<number>(5);

  const selectedDate = state.selectedDate;
  const daysInMonth = monthDays(selectedDate);
  const calendarDays = monthCalendarDays(selectedDate);

  // Month navigation helpers
  const currentSelectedDate = new Date(`${selectedDate}T00:00:00`);
  const [monthSel, setMonthSel] = useState(currentSelectedDate.getMonth());
  const [yearSel, setYearSel] = useState(currentSelectedDate.getFullYear());

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const m = Number(e.target.value);
    setMonthSel(m);
    updateSelectedMonthYear(m, yearSel);
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const y = Number(e.target.value);
    setYearSel(y);
    updateSelectedMonthYear(monthSel, y);
  };

  const updateSelectedMonthYear = (m: number, y: number) => {
    const dateStr = dateInMonthYear(selectedDate, y, m);
    // Trigger state selectedDate change via a custom wrapper if needed, but since we have useLifeOS's selectedDate, we can sync:
    // Actually we can just update selectedDate inside our context!
    // That will update the entire month view globally!
    const contextDate = dateInMonthYear(state.selectedDate, y, m);
    // Since selectedDateInput is tied to this:
    const input = document.getElementById('selectedDate') as HTMLInputElement;
    if (input) {
      input.value = contextDate;
      const event = new Event('change', { bubbles: true });
      input.dispatchEvent(event);
    }
  };

  // Completion calculation for a single date
  const getCompletionPercent = (date: string) => {
    if (!state.habits.length) return 0;
    const done = state.habits.filter((h) => 
      state.habitLogs.some((log) => log.habitId === h.id && log.date === date)
    ).length;
    return percent(done, state.habits.length);
  };

  const getCompletionTone = (pct: number) => {
    if (pct <= 0) return 'tone-0';
    if (pct <= 25) return 'tone-25';
    if (pct <= 50) return 'tone-50';
    if (pct <= 75) return 'tone-75';
    return 'tone-100';
  };

  // Streak calculator
  const getHabitStreak = (habitId: string, fromDate = selectedDate) => {
    let streak = 0;
    let cursor = fromDate;
    const isDone = (hId: string, d: string) =>
      state.habitLogs.some((l) => l.habitId === hId && l.date === d);

    while (isDone(habitId, cursor)) {
      streak += 1;
      cursor = addDays(cursor, -1);
    }
    return streak;
  };

  const handleHabitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!habitName.trim()) return;

    await addHabit({
      name: habitName,
      area: habitArea,
      frequency: habitFrequency,
      targetPerWeek: habitTarget,
    });

    setHabitName('');
    setIsFormOpen(false);
  };

  // Chart data for daily completion rate across this month
  const chartPoints = daysInMonth.map((day) => ({
    label: day.slice(-2),
    value: getCompletionPercent(day),
    dateStr: day,
  }));

  const months = Array.from({ length: 12 }, (_, index) => ({
    value: index,
    label: new Intl.DateTimeFormat(locale === 'id' ? 'id-ID' : 'en-US', { month: 'long' }).format(
      new Date(yearSel, index, 1)
    ),
  }));

  return (
    <div className="space-y-6">
      {/* Monthly Heatmap Calendar */}
      <Surface className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-life-line pb-4 mb-6">
          <div>
            <h3 className="text-sm font-bold text-life-text uppercase tracking-wider">
              {t('habits_calendar')}
            </h3>
            <p className="text-xs text-life-muted mt-0.5">
              {state.habits.length} {t('habits_active')} / {t('habits_click_date')}
            </p>
          </div>

          {/* Month/Year selectors */}
          <div className="flex items-center gap-3">
            <select
              value={monthSel}
              onChange={handleMonthChange}
              className="glass-select text-xs py-1.5"
            >
              {months.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
            <select
              value={yearSel}
              onChange={handleYearChange}
              className="glass-select text-xs py-1.5"
            >
              {yearOptions(yearSel).map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>

            <Button 
              size="sm" 
              variant="primary" 
              icon="plus" 
              onClick={() => setIsFormOpen(true)}
            >
              Habit
            </Button>
          </div>
        </div>

        {/* Heatmap Grid */}
        <div className="grid grid-cols-7 gap-2 max-w-xl mx-auto">
          {/* Weekday headers */}
          {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map((day) => (
            <div key={day} className="text-center text-[10px] font-black text-life-muted uppercase py-1">
              {day}
            </div>
          ))}

          {/* Days */}
          {calendarDays.map((day, idx) => {
            if (!day) return <div key={`empty-${idx}`} className="aspect-square opacity-0" />;
            const pct = getCompletionPercent(day);
            const isSelected = day === selectedDate;
            const tone = getCompletionTone(pct);

            return (
              <button
                key={day}
                onClick={() => setSelectedCalendarDate(day)}
                className={`aspect-square rounded-lg flex flex-col items-center justify-between p-1.5 relative border transition-all duration-150 select-none ${tone} ${
                  isSelected ? 'border-teal-400 scale-[1.05] ring-2 ring-life-teal/30 z-10' : ''
                }`}
                title={`${formatDate(day)}: ${pct}% habit done`}
              >
                <span className="text-[10px] font-bold self-start">{Number(day.slice(-2))}</span>
                <strong className="text-xs font-black">{pct}%</strong>
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex justify-center items-center gap-4 mt-6 text-[10px] font-black text-life-muted uppercase">
          <span className="flex items-center gap-1.5">
            <i className="w-3.5 h-3.5 rounded bg-white/[0.02] border border-life-line inline-block" /> 0%
          </span>
          <span className="flex items-center gap-1.5">
            <i className="w-3.5 h-3.5 rounded bg-life-teal-soft/30 border border-life-teal/30 inline-block" /> 1-25%
          </span>
          <span className="flex items-center gap-1.5">
            <i className="w-3.5 h-3.5 rounded bg-life-teal-soft/60 border border-life-teal/50 inline-block" /> 26-50%
          </span>
          <span className="flex items-center gap-1.5">
            <i className="w-3.5 h-3.5 rounded bg-life-teal/60 border border-life-teal/70 inline-block" /> 51-75%
          </span>
          <span className="flex items-center gap-1.5">
            <i className="w-3.5 h-3.5 rounded bg-life-teal border border-teal-400/30 inline-block shadow-[0_0_8px_rgba(15,118,110,0.3)]" /> 76-100%
          </span>
        </div>
      </Surface>

      {/* Progress Chart */}
      <Surface className="p-6">
        <div className="border-b border-life-line pb-3 mb-6">
          <h3 className="text-sm font-bold text-life-text uppercase tracking-wider">
            {t('habits_monthly_progress')}
          </h3>
          <p className="text-xs text-life-muted mt-0.5">
            {t('habits_monthly_pct')} {monthLabel(selectedDate, locale === 'id' ? 'id-ID' : 'en-US')}
          </p>
        </div>

        <LineChart 
          points={chartPoints} 
          title="Habit Monthly Completion Rate" 
          minVal={0} 
          maxVal={100} 
        />

        <div className="flex flex-wrap gap-4 mt-6">
          <Badge tone="teal">
            {`${t('habits_avg')} ${Math.round(avg(chartPoints.map((p) => p.value || 0)))}%`}
          </Badge>
          <Badge tone="green">
            {`${chartPoints.filter((p) => p.value === 100).length} ${t('habits_full_days')}`}
          </Badge>
          <Badge tone="amber">
            {`${chartPoints.filter((p) => p.value > 0 && p.value < 100).length} ${t('habits_partial_days')}`}
          </Badge>
        </div>
      </Surface>

      {/* Habit Details Recaps */}
      <Surface className="p-6">
        <div className="border-b border-life-line pb-3 mb-4">
          <h3 className="text-sm font-bold text-life-text uppercase tracking-wider">
            {t('habits_monthly_detail')}
          </h3>
          <p className="text-xs text-life-muted mt-0.5">
            {t('habits_monthly_recap')} {monthLabel(selectedDate, locale === 'id' ? 'id-ID' : 'en-US')}
          </p>
        </div>

        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
          {state.habits.length > 0 ? (
            state.habits.map((habit) => {
              const logsCount = daysInMonth.filter((d) => 
                state.habitLogs.some((l) => l.habitId === habit.id && l.date === d)
              ).length;
              const rate = percent(logsCount, daysInMonth.length);

              return (
                <div 
                  key={habit.id}
                  className="p-4 rounded-xl bg-white/[0.005] border border-life-line hover:border-life-line-strong hover:bg-white/[0.01] transition-all space-y-3"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <strong className="text-sm text-life-text block tracking-tight">{habit.name}</strong>
                      <span className="text-[10px] font-black text-life-muted uppercase tracking-wider mt-1 block">
                        Area: {habit.area} / Streak: {getHabitStreak(habit.id)} {t('days')}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <Badge tone={rate >= 80 ? 'green' : rate >= 50 ? 'teal' : 'amber'}>
                        {`${rate}%`}
                      </Badge>
                      <button
                        onClick={() => deleteHabit(habit.id)}
                        className="w-7 h-7 rounded bg-white/[0.02] border border-life-line hover:bg-life-rose/20 text-life-muted hover:text-life-rose flex items-center justify-center transition-all"
                        title={t('delete')}
                      >
                        <Icon name="trash" size={12} />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-[10px] text-life-muted font-bold uppercase">
                      <span>{logsCount} {t('dash_of')} {daysInMonth.length} {t('days')} ({t('habits_monthly_progress')}: {rate}%)</span>
                      <span>30 Hari Terakhir</span>
                    </div>
                    {/* GitHub-style Contribution Grid */}
                    <div className="flex flex-wrap gap-1 p-2 rounded-xl bg-black/20 border border-white/[0.02] max-w-max">
                      {Array.from({ length: 30 }, (_, index) => {
                        const d = new Date();
                        d.setDate(d.getDate() - (29 - index));
                        const dayStr = toISODate(d);
                        const isCompleted = state.habitLogs.some(
                          (l) => l.habitId === habit.id && l.date === dayStr
                        );
                        return (
                          <button
                            key={dayStr}
                            type="button"
                            onClick={() => toggleHabit(habit.id, dayStr)}
                            title={`${formatDate(dayStr)}: ${isCompleted ? 'Selesai' : 'Belum selesai'} (Klik untuk mengubah)`}
                            className={`w-3.5 h-3.5 rounded-sm transition-all duration-150 shrink-0 ${
                              isCompleted 
                                ? 'bg-gradient-to-br from-emerald-400 to-teal-500 shadow-[0_0_6px_rgba(16,185,129,0.3)] scale-[1.05]' 
                                : 'bg-white/[0.03] border border-white/[0.02] hover:bg-white/[0.1] hover:border-white/[0.1]'
                            }`}
                          />
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <EmptyState />
          )}
        </div>
      </Surface>

      {/* Checklist modal for clicked calendar dates */}
      <Modal
        isOpen={selectedCalendarDate !== null}
        onClose={() => setSelectedCalendarDate(null)}
        title={t('habits_checklist')}
        subtitle={selectedCalendarDate ? formatDate(selectedCalendarDate) : ''}
      >
        {selectedCalendarDate && (
          <div className="space-y-3">
            {state.habits.length > 0 ? (
              state.habits.map((habit) => {
                const isDone = state.habitLogs.some(
                  (log) => log.habitId === habit.id && log.date === selectedCalendarDate
                );

                return (
                  <div
                    key={habit.id}
                    onClick={() => toggleHabit(habit.id, selectedCalendarDate)}
                    className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer select-none transition-all duration-150 ${
                      isDone
                        ? 'bg-life-teal-soft/10 border-life-teal/30 text-teal-300'
                        : 'bg-white/[0.01] border-life-line hover:border-life-line-strong text-life-muted'
                    }`}
                  >
                    <div>
                      <strong className="text-sm font-bold block">{habit.name}</strong>
                      <p className="text-[10px] text-life-muted font-bold uppercase mt-0.5">
                        Area: {habit.area} / Streak: {getHabitStreak(habit.id, selectedCalendarDate)} {t('days')}
                      </p>
                    </div>

                    <span className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all ${
                      isDone ? 'bg-life-teal border-teal-400 text-white' : 'border-life-line text-transparent'
                    }`}>
                      <Icon name="check" size={12} />
                    </span>
                  </div>
                );
              })
            ) : (
              <EmptyState />
            )}
          </div>
        )}
      </Modal>

      {/* Form modal to add habit */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={t('habits_new')}
        subtitle="Masukkan detail habit baru"
      >
        <form onSubmit={handleHabitSubmit} className="space-y-4">
          <div className="flex flex-col space-y-1">
            <label htmlFor="hName" className="text-xs font-bold text-life-muted uppercase">
              {t('habits_name')}
            </label>
            <input
              id="hName"
              type="text"
              required
              placeholder={t('habits_name_placeholder')}
              value={habitName}
              onChange={(e) => setHabitName(e.target.value)}
              className="glass-input text-sm"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col space-y-1">
              <label htmlFor="hArea" className="text-xs font-bold text-life-muted uppercase">
                {t('area')}
              </label>
              <select
                id="hArea"
                value={habitArea}
                onChange={(e) => setHabitArea(e.target.value)}
                className="glass-select text-xs"
              >
                {HABIT_AREAS.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col space-y-1">
              <label htmlFor="hFreq" className="text-xs font-bold text-life-muted uppercase">
                {t('habits_frequency')}
              </label>
              <select
                id="hFreq"
                value={habitFrequency}
                onChange={(e) => setHabitFrequency(e.target.value as any)}
                className="glass-select text-xs"
              >
                <option value="daily">{t('habits_daily')}</option>
                <option value="weekly">{t('habits_weekly')}</option>
              </select>
            </div>

            <div className="flex flex-col space-y-1">
              <label htmlFor="hTarget" className="text-xs font-bold text-life-muted uppercase">
                Target/minggu
              </label>
              <input
                id="hTarget"
                type="number"
                min="1"
                max="7"
                required
                value={habitTarget}
                onChange={(e) => setHabitTarget(Number(e.target.value))}
                className="glass-input text-xs"
              />
            </div>
          </div>

          <Button type="submit" variant="primary" icon="plus" className="w-full">
            {t('habits_add_new')}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
