const fs = require('fs');

// 1. Write fully typed Medications.tsx
const medsPath = 'C:/Users/SABARI/Music/Velan/fullweb/fullweb_MediQR/src/pages/Medications.tsx';
const medsCode = `import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GlassCard } from '../components/GlassCard';
import { Button } from '../components/Button';
import { Input } from '../components/Input';

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

export const Medications: React.FC = () => {
  const { user, addMedication, removeMedication, updatePatientRecord } = useAuth();
  const navigate = useNavigate();

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('');
  const [purpose, setPurpose] = useState('');
  const [date, setDate] = useState('');
  const [reminderMorning, setReminderMorning] = useState(false);
  const [reminderMorningTime, setReminderMorningTime] = useState('08:00');
  const [reminderAfternoon, setReminderAfternoon] = useState(false);
  const [reminderAfternoonTime, setReminderAfternoonTime] = useState('14:00');
  const [reminderNight, setReminderNight] = useState(false);
  const [reminderNightTime, setReminderNightTime] = useState('21:00');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'scheduled' | 'needed'>('all');

  // Taken dose tracking log
  const [takenLog, setTakenLog] = useState<Record<string, boolean>>({});
  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const savedLog = localStorage.getItem('mediqr_taken_log_' + todayStr);
    if (savedLog) {
      try {
        setTakenLog(JSON.parse(savedLog));
      } catch (err) {
        console.error('Failed to parse taken log:', err);
      }
    }
  }, []);

  const handleToggleTaken = (medName: string, slot: string) => {
    const key = medName + '_' + slot;
    const newLog = { ...takenLog, [key]: !takenLog[key] };
    setTakenLog(newLog);
    localStorage.setItem('mediqr_taken_log_' + todayStr, JSON.stringify(newLog));
  };

  if (!user) return null;

  const handleOpenAdd = () => {
    setName('');
    setDosage('');
    setFrequency('');
    setPurpose('');
    setDate(new Date().toISOString().split('T')[0]);
    setReminderMorning(false);
    setReminderMorningTime('08:00');
    setReminderAfternoon(false);
    setReminderAfternoonTime('14:00');
    setReminderNight(false);
    setReminderNightTime('21:00');
    setEditingIdx(null);
    setShowAddModal(true);
  };

  const handleOpenEdit = (idx: number) => {
    const med = user.patientRecord.medications[idx];
    setName(med.name);
    setDosage(med.dosage);
    setFrequency(med.frequency);
    setPurpose(med.purpose || '');
    setDate(med.date || new Date().toISOString().split('T')[0]);
    setReminderMorning(med.reminderMorning || false);
    setReminderMorningTime(med.reminderMorningTime || '08:00');
    setReminderAfternoon(med.reminderAfternoon || false);
    setReminderAfternoonTime(med.reminderAfternoonTime || '14:00');
    setReminderNight(med.reminderNight || false);
    setReminderNightTime(med.reminderNightTime || '21:00');
    setEditingIdx(idx);
    setShowAddModal(true);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const medData = {
      name: name.trim(),
      dosage: dosage.trim() || 'As prescribed',
      frequency: frequency.trim() || 'Daily',
      purpose: purpose.trim() || 'Routine',
      date: date || new Date().toISOString().split('T')[0],
      reminderMorning,
      reminderMorningTime,
      reminderAfternoon,
      reminderAfternoonTime,
      reminderNight,
      reminderNightTime
    };

    if (editingIdx !== null) {
      const updatedMeds = [...user.patientRecord.medications];
      updatedMeds[editingIdx] = medData;
      updatePatientRecord({ medications: updatedMeds });
    } else {
      addMedication(medData);
    }
    
    setShowAddModal(false);
  };

  const sortedMedications = [...user.patientRecord.medications].sort((a, b) => {
    const dateA = a.date || '';
    const dateB = b.date || '';
    if (!dateA) return 1;
    if (!dateB) return -1;
    return dateB.localeCompare(dateA);
  });

  const getOriginalIndex = (sortedMed: any) => {
    return user.patientRecord.medications.findIndex(
      m => m.name === sortedMed.name && m.dosage === sortedMed.dosage && m.date === sortedMed.date
    );
  };

  const filteredMedications = sortedMedications.filter(med => {
    const matchesSearch = med.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (med.purpose || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    if (filterTab === 'scheduled') {
      return matchesSearch && (med.reminderMorning || med.reminderAfternoon || med.reminderNight);
    }
    if (filterTab === 'needed') {
      return matchesSearch && !(med.reminderMorning || med.reminderAfternoon || med.reminderNight);
    }
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="font-label-caps text-xs text-on-surface-variant/70 tracking-widest block mb-1">Health Records</span>
          <h1 className="font-headline-lg-mobile md:font-headline-lg text-on-surface font-bold">Current Medications</h1>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            variant="secondary"
            onClick={() => navigate('/profile/reminders')}
            icon="alarm"
            iconPosition="left"
            className="flex-grow sm:flex-grow-0"
          >
            Reminders Schedule
          </Button>
          <Button
            variant="primary"
            onClick={handleOpenAdd}
            icon="add"
            iconPosition="left"
            className="flex-grow sm:flex-grow-0"
          >
            Add Medication
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/40 backdrop-blur-md border border-white/60 p-4 rounded-3xl shadow-sm">
        <div className="relative flex-grow max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant text-lg">search</span>
          <input
            type="text"
            placeholder="Search medications by name or purpose..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-2xl border border-outline-variant/45 bg-surface-container/20 text-sm focus:outline-none focus:border-primary/80 focus:bg-white transition-all text-on-surface font-medium"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface bg-transparent border-0 cursor-pointer flex items-center"
            >
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          )}
        </div>

        <div className="flex gap-1.5 p-1 bg-surface-container-highest/35 rounded-2xl border border-outline-variant/20 self-start md:self-auto">
          <button
            onClick={() => setFilterTab('all')}
            className={'px-4 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border-0 ' + (filterTab === 'all' ? 'bg-white text-primary shadow-sm font-bold' : 'text-on-surface-variant hover:text-on-surface bg-transparent')}
          >
            All ({sortedMedications.length})
          </button>
          <button
            onClick={() => setFilterTab('scheduled')}
            className={'px-4 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border-0 ' + (filterTab === 'scheduled' ? 'bg-white text-primary shadow-sm font-bold' : 'text-on-surface-variant hover:text-on-surface bg-transparent')}
          >
            Scheduled ({sortedMedications.filter(m => m.reminderMorning || m.reminderAfternoon || m.reminderNight).length})
          </button>
          <button
            onClick={() => setFilterTab('needed')}
            className={'px-4 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border-0 ' + (filterTab === 'needed' ? 'bg-white text-primary shadow-sm font-bold' : 'text-on-surface-variant hover:text-on-surface bg-transparent')}
          >
            As Needed ({sortedMedications.filter(m => !(m.reminderMorning || m.reminderAfternoon || m.reminderNight)).length})
          </button>
        </div>
      </div>

      {filteredMedications.length === 0 ? (
        <GlassCard className="text-center py-12">
          <span className="material-symbols-outlined text-outline-variant text-5xl mb-3">pill</span>
          <p className="text-on-surface-variant font-medium text-lg">No matching medications found.</p>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMedications.map((med, displayIdx) => {
            const originalIdx = getOriginalIndex(med);
            return (
              <GlassCard
                key={displayIdx}
                className="flex flex-col hover:translate-y-[-2px] hover:bg-white/95 border border-white/60 shadow-sm relative group transition-all duration-300"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined filled-icon">pill</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(originalIdx)}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-outline hover:text-primary hover:bg-primary/5 transition-colors cursor-pointer border-0 bg-transparent"
                      title="Edit"
                    >
                      <span className="material-symbols-outlined text-[18px]">edit</span>
                    </button>
                    <button
                      onClick={() => removeMedication(originalIdx)}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-outline hover:text-error hover:bg-error/5 transition-colors cursor-pointer border-0 bg-transparent"
                      title="Delete"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                </div>

                <div className="mb-4">
                  <h3 className="font-title-md text-lg text-on-surface font-semibold">{med.name}</h3>
                  <p className="text-xs text-on-surface-variant font-medium">{med.purpose}</p>
                  
                  {med.date && (
                    <div className="flex items-center gap-1 text-[10px] text-outline mt-1.5 font-medium">
                      <span className="material-symbols-outlined text-[12px]">calendar_today</span>
                      <span>Started: {med.date}</span>
                    </div>
                  )}

                  {(med.reminderMorning || med.reminderAfternoon || med.reminderNight) && (
                    <div className="flex items-center gap-1.5 mt-3 pt-2.5 border-t border-outline-variant/20">
                      <span className="text-[10px] font-semibold text-outline tracking-wider uppercase mr-1">Reminders:</span>
                      <div className="flex gap-1 flex-wrap">
                        {med.reminderMorning && (
                          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[9px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            ☀️ Morning ({formatTime(med.reminderMorningTime)})
                          </span>
                        )}
                        {med.reminderAfternoon && (
                          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[9px] font-semibold bg-orange-50 text-orange-700 border border-orange-200">
                            🌤️ Afternoon ({formatTime(med.reminderAfternoonTime)})
                          </span>
                        )}
                        {med.reminderNight && (
                          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[9px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                            🌙 Night ({formatTime(med.reminderNightTime)})
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {(med.reminderMorning || med.reminderAfternoon || med.reminderNight) && (
                    <div className="mt-4 pt-3 border-t border-outline-variant/20">
                      <span className="text-[10px] font-bold text-outline uppercase block mb-2 pl-0.5">Quick Log Today:</span>
                      <div className="flex gap-2">
                        {med.reminderMorning && (
                          <button
                            onClick={() => handleToggleTaken(med.name, 'morning')}
                            className={'flex-1 py-1.5 px-2 rounded-xl border text-[10px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ' + (takenLog[med.name + '_morning'] ? 'bg-emerald-500/10 border-emerald-500 text-emerald-700 font-bold' : 'bg-surface-container/20 border-outline-variant/30 text-on-surface-variant hover:bg-surface-variant')}
                          >
                            <span className="material-symbols-outlined text-[12px]">{takenLog[med.name + '_morning'] ? 'check_circle' : 'circle'}</span>
                            Morning
                          </button>
                        )}
                        {med.reminderAfternoon && (
                          <button
                            onClick={() => handleToggleTaken(med.name, 'afternoon')}
                            className={'flex-1 py-1.5 px-2 rounded-xl border text-[10px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ' + (takenLog[med.name + '_afternoon'] ? 'bg-emerald-500/10 border-emerald-500 text-emerald-700 font-bold' : 'bg-surface-container/20 border-outline-variant/30 text-on-surface-variant hover:bg-surface-variant')}
                          >
                            <span className="material-symbols-outlined text-[12px]">{takenLog[med.name + '_afternoon'] ? 'check_circle' : 'circle'}</span>
                            Afternoon
                          </button>
                        )}
                        {med.reminderNight && (
                          <button
                            onClick={() => handleToggleTaken(med.name, 'night')}
                            className={'flex-1 py-1.5 px-2 rounded-xl border text-[10px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ' + (takenLog[med.name + '_night'] ? 'bg-emerald-500/10 border-emerald-500 text-emerald-700 font-bold' : 'bg-surface-container/20 border-outline-variant/30 text-on-surface-variant hover:bg-surface-variant')}
                          >
                            <span className="material-symbols-outlined text-[12px]">{takenLog[med.name + '_night'] ? 'check_circle' : 'circle'}</span>
                            Night
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-auto pt-4 border-t border-outline-variant/30 flex justify-between items-center text-sm">
                  <div>
                    <p className="font-label-caps text-[10px] text-outline">Dosage</p>
                    <p className="text-on-surface font-semibold">{med.dosage}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-label-caps text-[10px] text-outline">Frequency</p>
                    <p className="text-on-surface font-semibold">{med.frequency}</p>
                  </div>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm px-4">
          <GlassCard className="w-full max-w-md border border-white/80 shadow-2xl">
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <h3 className="font-title-md text-on-surface font-semibold">
                {editingIdx !== null ? 'Edit Medication' : 'Add New Medication'}
              </h3>
              
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="font-label-caps text-[10px] text-on-surface-variant pl-1">Medication Name</label>
                  <Input
                    type="text"
                    placeholder="e.g. Metformin"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-label-caps text-[10px] text-on-surface-variant pl-1">Purpose / Indication</label>
                  <Input
                    type="text"
                    placeholder="e.g. Diabetes management"
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-label-caps text-[10px] text-on-surface-variant pl-1">Dosage</label>
                    <Input
                      type="text"
                      placeholder="e.g. 500mg"
                      value={dosage}
                      onChange={(e) => setDosage(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-label-caps text-[10px] text-on-surface-variant pl-1">Frequency</label>
                    <Input
                      type="text"
                      placeholder="e.g. Twice daily"
                      value={frequency}
                      onChange={(e) => setFrequency(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-label-caps text-[10px] text-on-surface-variant pl-1">Start Date / Prescribed Date</label>
                  <Input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2.5">
                <label className="font-label-caps text-[10px] text-on-surface-variant pl-1">Daily Reminders (Schedule)</label>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setReminderMorning(!reminderMorning)}
                      className={'w-32 py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer ' + (reminderMorning ? 'bg-amber-500/10 border-amber-500 text-amber-700 font-bold' : 'bg-transparent border-outline-variant/45 text-on-surface-variant hover:bg-surface-variant')}
                    >
                      ☀️ Morning
                    </button>
                    {reminderMorning && (
                      <input
                        type="time"
                        value={reminderMorningTime}
                        onChange={(e) => setReminderMorningTime(e.target.value)}
                        className="py-1.5 px-2.5 rounded-lg border border-outline-variant/45 text-xs text-on-surface font-semibold bg-white focus:outline-none focus:border-primary"
                      />
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setReminderAfternoon(!reminderAfternoon)}
                      className={'w-32 py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer ' + (reminderAfternoon ? 'bg-orange-500/10 border-orange-500 text-orange-700 font-bold' : 'bg-transparent border-outline-variant/45 text-on-surface-variant hover:bg-surface-variant')}
                    >
                      🌤️ Afternoon
                    </button>
                    {reminderAfternoon && (
                      <input
                        type="time"
                        value={reminderAfternoonTime}
                        onChange={(e) => setReminderAfternoonTime(e.target.value)}
                        className="py-1.5 px-2.5 rounded-lg border border-outline-variant/45 text-xs text-on-surface font-semibold bg-white focus:outline-none focus:border-primary"
                      />
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setReminderNight(!reminderNight)}
                      className={'w-32 py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer ' + (reminderNight ? 'bg-indigo-500/10 border-indigo-500 text-indigo-700 font-bold' : 'bg-transparent border-outline-variant/45 text-on-surface-variant hover:bg-surface-variant')}
                    >
                      🌙 Night
                    </button>
                    {reminderNight && (
                      <input
                        type="time"
                        value={reminderNightTime}
                        onChange={(e) => setReminderNightTime(e.target.value)}
                        className="py-1.5 px-2.5 rounded-lg border border-outline-variant/45 text-xs text-on-surface font-semibold bg-white focus:outline-none focus:border-primary"
                      />
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <Button
                  variant="secondary"
                  type="button"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                >
                  Save Medication
                </Button>
              </div>
            </form>
          </GlassCard>
        </div>
      )}

      <div className="pt-4 flex justify-between">
        <Button
          variant="secondary"
          onClick={() => navigate('/profile/conditions')}
        >
          Back to Conditions
        </Button>
        <Button
          variant="primary"
          onClick={() => navigate('/profile/emergency-contacts')}
          icon="arrow_forward"
        >
          Continue to Contacts
        </Button>
      </div>
    </div>
  );
};`;

fs.writeFileSync(medsPath, medsCode, 'utf8');
console.log('✅ Medications.tsx typed & rewritten successfully!');

// 2. Add formatTime helper to PublicEmergencyProfile.tsx
const pubProfilePath = 'C:/Users/SABARI/Music/Velan/fullweb/fullweb_MediQR/src/pages/PublicEmergencyProfile.tsx';
let pubContent = fs.readFileSync(pubProfilePath, 'utf8');
const helper = `const formatTime = (timeStr?: string) => {
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
};`;

if (!pubContent.includes('const formatTime =')) {
  const lines = pubContent.replace(/\r\n/g, '\n').split('\n');
  lines.splice(1, 0, helper);
  fs.writeFileSync(pubProfilePath, lines.join('\n'), 'utf8');
  console.log('✅ PublicEmergencyProfile.tsx formatTime helper successfully added!');
}
