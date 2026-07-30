import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

interface DueMedication {
  key: string;
  name: string;
  dosage: string;
  slot: string;
  time: string;
  purpose: string;
}

export const ReminderService: React.FC = () => {
  const { user } = useAuth();
  const [dueAlerts, setDueAlerts] = useState<DueMedication[]>([]);
  const [triggeredKeys, setTriggeredKeys] = useState<Record<string, boolean>>({});

  const playChime = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const playTone = (freq: number, startTime: number, duration: number) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.3, startTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration - 0.01);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(startTime);
        osc.stop(startTime + duration);
      };
      
      // Pleasant chime sound (C5 -> E5 -> G5)
      playTone(523.25, audioCtx.currentTime, 0.4);
      playTone(659.25, audioCtx.currentTime + 0.15, 0.4);
      playTone(783.99, audioCtx.currentTime + 0.3, 0.5);
    } catch (err) {
      console.warn('Web Audio API not allowed or supported yet', err);
    }
  };

  useEffect(() => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (!user || !user.patientRecord || !user.patientRecord.medications) return;

    const interval = setInterval(() => {
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const currentTime = `${hours}:${minutes}`;

      // Load taken log for today
      let takenLog: Record<string, boolean> = {};
      const savedLog = localStorage.getItem('mediqr_taken_log_' + todayStr);
      if (savedLog) {
        try {
          takenLog = JSON.parse(savedLog);
        } catch (e) {}
      }

      const meds = user.patientRecord.medications;
      const newlyDue: DueMedication[] = [];
      const updatedTriggered = { ...triggeredKeys };
      let hasNewTrigger = false;

      meds.forEach((med) => {
        const checkSlot = (slotEnabled?: boolean, slotTime?: string, slotName?: string) => {
          if (!slotEnabled || !slotTime) return;
          if (slotTime === currentTime) {
            const key = `${med.name}_${slotName}_${todayStr}`;
            const takenKey = `${med.name}_${slotName}`;
            // If not already taken and not already triggered
            if (!takenLog[takenKey] && !updatedTriggered[key]) {
              updatedTriggered[key] = true;
              hasNewTrigger = true;
              newlyDue.push({
                key,
                name: med.name,
                dosage: med.dosage || 'As prescribed',
                slot: slotName || '',
                time: slotTime,
                purpose: med.purpose || 'Routine'
              });

              // Browser System Notification
              if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
                try {
                  new Notification("MediQR Medication Reminder", {
                    body: `Time to take your ${slotName} dose of ${med.name} (${med.dosage || 'As prescribed'})`,
                    icon: '/favicon.ico'
                  });
                } catch (e) {
                  console.error('System Notification error:', e);
                }
              }
            }
          }
        };

        checkSlot(med.reminderMorning, med.reminderMorningTime, 'morning');
        checkSlot(med.reminderAfternoon, med.reminderAfternoonTime, 'afternoon');
        checkSlot(med.reminderNight, med.reminderNightTime, 'night');
      });

      if (hasNewTrigger) {
        setTriggeredKeys(updatedTriggered);
        setDueAlerts((prev) => [...prev, ...newlyDue]);
        playChime();
      }
    }, 15000); // Check every 15 seconds

    return () => clearInterval(interval);
  }, [user, triggeredKeys]);

  const handleMarkTaken = (alert: DueMedication) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const takenKey = `${alert.name}_${alert.slot}`;
    
    // Save to localStorage taken log
    let takenLog: Record<string, boolean> = {};
    const savedLog = localStorage.getItem('mediqr_taken_log_' + todayStr);
    if (savedLog) {
      try {
        takenLog = JSON.parse(savedLog);
      } catch (e) {}
    }
    takenLog[takenKey] = true;
    localStorage.setItem('mediqr_taken_log_' + todayStr, JSON.stringify(takenLog));

    // Remove from due alerts
    setDueAlerts((prev) => prev.filter((a) => a.key !== alert.key));
    
    // Play a confirmation sound (rising tones)
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880.00, audioCtx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.35);
    } catch(e){}
  };

  const handleDismiss = (alert: DueMedication) => {
    setDueAlerts((prev) => prev.filter((a) => a.key !== alert.key));
  };

  if (dueAlerts.length === 0) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-md p-4">
      <div className="w-full max-w-md bg-white/90 backdrop-blur-lg border border-white/80 rounded-[2.5rem] shadow-2xl p-6 relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-32 h-32 bg-primary/10 rounded-full blur-2xl" />
        <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl" />

        <div className="flex flex-col items-center text-center space-y-4">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping opacity-75" />
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center text-white shadow-lg relative">
              <span className="material-symbols-outlined text-3xl animate-bounce">notifications_active</span>
            </div>
          </div>

          <div className="space-y-1">
            <span className="font-label-caps text-xs text-primary font-bold tracking-widest uppercase block">Medication Reminder</span>
            <h2 className="font-headline-md text-on-surface font-bold">Time for your Dose!</h2>
          </div>

          <div className="w-full space-y-3 py-2 max-h-[250px] overflow-y-auto pr-1">
            {dueAlerts.map((alert) => (
              <div key={alert.key} className="bg-surface-container/20 border border-outline-variant/30 rounded-2xl p-4 text-left relative flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start">
                    <h3 className="font-title-md text-on-surface font-bold text-base leading-tight">{alert.name}</h3>
                    <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-primary/15 text-primary border border-primary/20 capitalize shrink-0">
                      {alert.slot} ({alert.time})
                    </span>
                  </div>
                  <p className="text-xs text-on-surface-variant/80 mt-1 font-medium">Dosage: {alert.dosage}</p>
                  <p className="text-[10px] text-outline mt-0.5 font-medium">Purpose: {alert.purpose}</p>
                </div>

                <div className="flex gap-2 mt-4 pt-3 border-t border-outline-variant/20">
                  <button
                    onClick={() => handleDismiss(alert)}
                    className="flex-1 py-2 px-3 rounded-xl border border-outline-variant/45 text-xs text-on-surface-variant hover:bg-surface-variant font-bold cursor-pointer transition-all bg-transparent"
                  >
                    Dismiss
                  </button>
                  <button
                    onClick={() => handleMarkTaken(alert)}
                    className="flex-1 py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold flex items-center justify-center gap-1 shadow-md hover:shadow-emerald-500/25 cursor-pointer transition-all border-0"
                  >
                    <span className="material-symbols-outlined text-sm">check_circle</span>
                    Mark Taken
                  </button>
                </div>
              </div>
            ))}
          </div>

          {dueAlerts.length > 1 && (
            <p className="text-[10px] text-on-surface-variant/70 italic">
              You have {dueAlerts.length} scheduled doses due.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
