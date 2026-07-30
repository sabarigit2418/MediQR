import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GlassCard } from '../components/GlassCard';
import { Button } from '../components/Button';

interface TakenLog {
  [key: string]: boolean;
}

const formatTime = (timeStr?: string) => {
  if (!timeStr) return '';
  try {
    const [hours, minutes] = timeStr.split(':');
    const h = parseInt(hours, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayHour = h % 12 === 0 ? 12 : h % 12;
    return displayHour + ':' + minutes + ' ' + ampm;
  } catch (err) {
    return timeStr;
  }
};

export const Reminders: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [takenLog, setTakenLog] = useState<TakenLog>({});
  const [todayStr, setTodayStr] = useState('');

  useEffect(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dateStr = year + '-' + month + '-' + day;
    setTodayStr(dateStr);

    const saved = localStorage.getItem('mediqr_taken_log_' + dateStr);
    if (saved) {
      try {
        setTakenLog(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse taken log:', e);
      }
    }
  }, []);

  if (!user) return null;

  const medications = user.patientRecord?.medications || [];

  const morningMeds = medications
    .filter(m => m.reminderMorning)
    .sort((a, b) => (a.reminderMorningTime || '08:00').localeCompare(b.reminderMorningTime || '08:00'));

  const afternoonMeds = medications
    .filter(m => m.reminderAfternoon)
    .sort((a, b) => (a.reminderAfternoonTime || '14:00').localeCompare(b.reminderAfternoonTime || '14:00'));

  const nightMeds = medications
    .filter(m => m.reminderNight)
    .sort((a, b) => (a.reminderNightTime || '21:00').localeCompare(b.reminderNightTime || '21:00'));

  const totalScheduled = morningMeds.length + afternoonMeds.length + nightMeds.length;

  const handleToggleTaken = (medName: string, slot: string) => {
    const key = medName + '_' + slot;
    const newLog = { ...takenLog, [key]: !takenLog[key] };
    setTakenLog(newLog);
    localStorage.setItem('mediqr_taken_log_' + todayStr, JSON.stringify(newLog));
  };

  const getTakenCount = () => {
    let count = 0;
    morningMeds.forEach(m => { if (takenLog[m.name + '_morning']) count++; });
    afternoonMeds.forEach(m => { if (takenLog[m.name + '_afternoon']) count++; });
    nightMeds.forEach(m => { if (takenLog[m.name + '_night']) count++; });
    return count;
  };

  const takenCount = getTakenCount();
  const progressPercent = totalScheduled > 0 ? Math.round((takenCount / totalScheduled) * 100) : 0;

  const getFormattedDate = () => {
    return new Date().toLocaleDateString('en-US', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long' 
    });
  };

  const renderMedItem = (med: any, slot: string) => {
    const key = med.name + '_' + slot;
    const isTaken = !!takenLog[key];
    const timeVal = slot === 'morning' ? med.reminderMorningTime : slot === 'afternoon' ? med.reminderAfternoonTime : med.reminderNightTime;

    return (
      <GlassCard 
        key={med.name + '_' + slot}
        onClick={() => handleToggleTaken(med.name, slot)}
        className={'flex items-center justify-between p-4 border transition-all cursor-pointer select-none active:scale-[0.99] duration-150 ' + (
          isTaken 
            ? 'bg-emerald-500/[0.03] border-emerald-500/25 opacity-75 shadow-inner' 
            : 'bg-white hover:bg-white/95 border-white/60 shadow-sm'
        )}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className={'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ' + (
            isTaken ? 'bg-emerald-500/10 text-emerald-600' : 'bg-slate-100 text-outline'
          )}>
            <span className="material-symbols-outlined text-[18px]">pill</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className={'font-semibold text-sm truncate ' + (isTaken ? 'text-outline/80 line-through decoration-emerald-600/40' : 'text-on-surface')}>
              {med.name}
            </p>
            <p className={'text-xs truncate ' + (isTaken ? 'text-outline/60 line-through decoration-emerald-600/20' : 'text-on-surface-variant')}>
              {med.dosage} &bull; {med.purpose} &bull; Time: {formatTime(timeVal || '08:00')}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center pl-3">
          <span className={'material-symbols-outlined text-2xl transition-all duration-200 ' + (
            isTaken ? 'text-emerald-600 filled-icon' : 'text-outline-variant hover:text-outline'
          )}>
            {isTaken ? 'check_circle' : 'radio_button_unchecked'}
          </span>
        </div>
      </GlassCard>
    );
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <span className="font-label-caps text-xs text-on-surface-variant/70 tracking-widest block mb-1">
          {getFormattedDate()}
        </span>
        <h1 className="font-headline-lg-mobile md:font-headline-lg text-on-surface font-bold">
          Daily Tablet Checker
        </h1>
      </div>

      {totalScheduled > 0 && (
        <GlassCard className="p-5 border border-white/60 shadow-sm bg-white/40">
          <div className="flex justify-between items-center mb-2">
            <div>
              <p className="text-sm font-semibold text-on-surface">Daily Intake Progress</p>
              <p className="text-xs text-on-surface-variant">
                Taken {takenCount} of {totalScheduled} doses today
              </p>
            </div>
            <span className="text-lg font-bold text-primary">{progressPercent}%</span>
          </div>
          <div className="w-full h-3 bg-slate-200/60 rounded-full overflow-hidden border border-slate-300/10">
            <div 
              className="h-full bg-gradient-to-r from-primary to-surface-tint rounded-full transition-all duration-500 ease-out"
              style={{ width: progressPercent + '%' }}
            />
          </div>
        </GlassCard>
      )}

      {totalScheduled === 0 ? (
        <GlassCard className="text-center py-12">
          <span className="material-symbols-outlined text-outline-variant text-5xl mb-3">fact_check</span>
          <p className="text-on-surface-variant font-medium text-lg">No daily tablet schedule active.</p>
          <p className="text-outline text-xs mt-1.5 max-w-md mx-auto">
            Enable morning, afternoon, or night schedule slots when adding/editing medications to build your checker list here.
          </p>
          <Button
            variant="primary"
            onClick={() => navigate('/profile/medications')}
            className="mt-6"
            icon="medication"
          >
            Go to Medications
          </Button>
        </GlassCard>
      ) : (
        <div className="space-y-6">
          {morningMeds.length > 0 && (
            <section className="space-y-3">
              <h3 className="text-sm font-bold text-amber-700 flex items-center gap-1.5 tracking-wider uppercase pl-1">
                ☀️ Morning Checklist
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {morningMeds.map(med => renderMedItem(med, 'morning'))}
              </div>
            </section>
          )}

          {afternoonMeds.length > 0 && (
            <section className="space-y-3">
              <h3 className="text-sm font-bold text-orange-700 flex items-center gap-1.5 tracking-wider uppercase pl-1">
                🌤️ Afternoon Checklist
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {afternoonMeds.map(med => renderMedItem(med, 'afternoon'))}
              </div>
            </section>
          )}

          {nightMeds.length > 0 && (
            <section className="space-y-3">
              <h3 className="text-sm font-bold text-indigo-700 flex items-center gap-1.5 tracking-wider uppercase pl-1">
                🌙 Night Checklist
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {nightMeds.map(med => renderMedItem(med, 'night'))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
};
