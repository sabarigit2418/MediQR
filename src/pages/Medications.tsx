import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GlassCard } from '../components/GlassCard';
import { Button } from '../components/Button';
import { Input } from '../components/Input';

export const Medications: React.FC = () => {
  const { user, addMedication, removeMedication, updatePatientRecord } = useAuth();
  const navigate = useNavigate();

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('');
  const [purpose, setPurpose] = useState('');
  const [date, setDate] = useState('');
  const [reminderMorning, setReminderMorning] = useState(false);
  const [reminderAfternoon, setReminderAfternoon] = useState(false);
  const [reminderNight, setReminderNight] = useState(false);

  if (!user) return null;

  const handleOpenAdd = () => {
    setName('');
    setDosage('');
    setFrequency('');
    setPurpose('');
    setDate(new Date().toISOString().split('T')[0]); // Default to today
    setReminderMorning(false);
    setReminderAfternoon(false);
    setReminderNight(false);
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
    setReminderAfternoon(med.reminderAfternoon || false);
    setReminderNight(med.reminderNight || false);
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
      reminderAfternoon,
      reminderNight
    };

    if (editingIdx !== null) {
      // Edit existing medication
      const updatedMeds = [...user.patientRecord.medications];
      updatedMeds[editingIdx] = medData;
      updatePatientRecord({ medications: updatedMeds });
    } else {
      // Add new medication
      addMedication(medData);
    }
    
    setShowAddModal(false);
  };

  // Sort medications date-wise (newest start date first, fallback to empty dates last)
  const sortedMedications = [...user.patientRecord.medications].sort((a, b) => {
    const dateA = a.date || '';
    const dateB = b.date || '';
    if (!dateA) return 1;
    if (!dateB) return -1;
    return dateB.localeCompare(dateA);
  });

  // Find original index for removal or edit from the sorted array
  const getOriginalIndex = (sortedMed: typeof sortedMedications[0]) => {
    return user.patientRecord.medications.findIndex(
      m => m.name === sortedMed.name && m.dosage === sortedMed.dosage && m.date === sortedMed.date
    );
  };

  return (
    <div className="space-y-6">
      {/* Header & Add Button */}
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
            Alarms Schedule
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

      {/* Bento Medications Grid */}
      {sortedMedications.length === 0 ? (
        <GlassCard className="text-center py-12">
          <span className="material-symbols-outlined text-outline-variant text-5xl mb-3">pill</span>
          <p className="text-on-surface-variant font-medium text-lg">No active medications documented.</p>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedMedications.map((med, displayIdx) => {
            const originalIdx = getOriginalIndex(med);
            return (
              <GlassCard
                key={displayIdx}
                className="flex flex-col hover:translate-y-[-2px] hover:bg-white/95 border border-white/60 shadow-sm relative group"
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
                  <p className="text-xs text-on-surface-variant">{med.purpose}</p>
                  
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
                            ☀️ Morning
                          </span>
                        )}
                        {med.reminderAfternoon && (
                          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[9px] font-semibold bg-orange-50 text-orange-700 border border-orange-200">
                            🌤️ Afternoon
                          </span>
                        )}
                        {med.reminderNight && (
                          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[9px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                            🌙 Night
                          </span>
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

      {/* Add/Edit Medication Modal */}
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

              <div className="space-y-1.5">
                <label className="font-label-caps text-[10px] text-on-surface-variant pl-1">Daily Reminders (Schedule)</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setReminderMorning(!reminderMorning)}
                    className={`flex-1 py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                      reminderMorning 
                        ? 'bg-amber-500/10 border-amber-500 text-amber-700 font-bold' 
                        : 'bg-transparent border-outline-variant/45 text-on-surface-variant hover:bg-surface-variant'
                    }`}
                  >
                    ☀️ Morning
                  </button>
                  <button
                    type="button"
                    onClick={() => setReminderAfternoon(!reminderAfternoon)}
                    className={`flex-1 py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                      reminderAfternoon 
                        ? 'bg-orange-500/10 border-orange-500 text-orange-700 font-bold' 
                        : 'bg-transparent border-outline-variant/45 text-on-surface-variant hover:bg-surface-variant'
                    }`}
                  >
                    🌤️ Afternoon
                  </button>
                  <button
                    type="button"
                    onClick={() => setReminderNight(!reminderNight)}
                    className={`flex-1 py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                      reminderNight 
                        ? 'bg-indigo-500/10 border-indigo-500 text-indigo-700 font-bold' 
                        : 'bg-transparent border-outline-variant/45 text-on-surface-variant hover:bg-surface-variant'
                    }`}
                  >
                    🌙 Night
                  </button>
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

      {/* Flow Navigation */}
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
};
