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

  if (!user) return null;

  const handleOpenAdd = () => {
    setName('');
    setDosage('');
    setFrequency('');
    setPurpose('');
    setDate(new Date().toISOString().split('T')[0]); // Default to today
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
      date: date || new Date().toISOString().split('T')[0]
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
        <Button
          variant="primary"
          onClick={handleOpenAdd}
          icon="add"
          iconPosition="left"
          className="w-full sm:w-auto"
        >
          Add Medication
        </Button>
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
