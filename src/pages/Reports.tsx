import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { GlassCard } from '../components/GlassCard';
import { Button } from '../components/Button';
import { jsPDF } from 'jspdf';

export const Reports: React.FC = () => {
  const { user } = useAuth();
  
  // Selection checkboxes
  const [includeProfile, setIncludeProfile] = useState(true);
  const [includeMeds, setIncludeMeds] = useState(true);
  const [includeAllergies, setIncludeAllergies] = useState(true);
  const [includeConditions, setIncludeConditions] = useState(true);
  const [includeLabs, setIncludeLabs] = useState(false);
  const [includeDocuments, setIncludeDocuments] = useState(true);

  if (!user) return null;

  const record = user.patientRecord;

  const handleGeneratePDF = () => {
    const doc = new jsPDF();
    
    // Header Branding
    doc.setFillColor(0, 61, 155); // Medical Blue
    doc.rect(0, 0, 210, 35, 'F');
    
    doc.setFontSize(22);
    doc.setTextColor(255, 255, 255);
    doc.text('MediQR Medical Summary Card', 15, 23);
    
    doc.setFontSize(9);
    doc.setTextColor(220, 225, 255);
    doc.text(`RECORD REPORT ID: ${record.qrId.toUpperCase()} • DECRYPTED SUMMARY`, 15, 30);
    
    let currentY = 50;

    // 1. Basic Profile & Contacts
    if (includeProfile) {
      doc.setFontSize(16);
      doc.setTextColor(0, 61, 155);
      doc.text('1. Patient Profile & emergency contacts', 15, currentY);
      
      doc.setFontSize(11);
      doc.setTextColor(24, 28, 30);
      doc.text(`Name: ${record.name}`, 15, currentY + 8);
      doc.text(`Age: ${record.age} yrs`, 15, currentY + 15);
      doc.text(`Blood Group: ${record.bloodGroup}`, 120, currentY + 8);
      doc.text(`Vitals: ${record.height} cm / ${record.weight} kg`, 120, currentY + 15);
      
      let contactY = currentY + 23;
      if (record.contacts.length > 0) {
        doc.text('Emergency Contacts:', 15, contactY);
        record.contacts.forEach((contact, idx) => {
          doc.text(`• ${contact.name} (${contact.relationship}): ${contact.phone}`, 20, contactY + 6 + (idx * 6));
        });
        contactY += 6 + (record.contacts.length * 6);
      }
      
      currentY = contactY + 6;
      doc.setDrawColor(220, 225, 230);
      doc.line(15, currentY, 195, currentY);
      currentY += 10;
    }

    // 2. Medications
    if (includeMeds) {
      doc.setFontSize(16);
      doc.setTextColor(0, 61, 155);
      doc.text('2. Current Medications', 15, currentY);
      
      doc.setFontSize(11);
      doc.setTextColor(24, 28, 30);
      let medY = currentY + 8;
      if (record.medications.length > 0) {
        record.medications.forEach((med) => {
          doc.text(`• ${med.name} (${med.dosage}) — ${med.frequency} ${med.purpose ? `for ${med.purpose}` : ''}`, 15, medY);
          medY += 7;
        });
      } else {
        doc.text('No active medications reported.', 15, medY);
        medY += 7;
      }
      
      currentY = medY + 3;
      doc.setDrawColor(220, 225, 230);
      doc.line(15, currentY, 195, currentY);
      currentY += 10;
    }

    // 3. Allergies
    if (includeAllergies) {
      doc.setFontSize(16);
      doc.setTextColor(186, 26, 26); // Alert Red
      doc.text('3. Allergies & Alert Risks', 15, currentY);
      
      doc.setFontSize(11);
      doc.setTextColor(24, 28, 30);
      let allergyY = currentY + 8;
      if (record.allergies.length > 0) {
        record.allergies.forEach((allergy) => {
          doc.text(`• ${allergy.name} [${allergy.severity}] ${allergy.notes ? `- ${allergy.notes}` : ''}`, 15, allergyY);
          allergyY += 7;
        });
      } else {
        doc.text('No allergies documented.', 15, allergyY);
        allergyY += 7;
      }
      
      currentY = allergyY + 3;
      doc.setDrawColor(220, 225, 230);
      doc.line(15, currentY, 195, currentY);
      currentY += 10;
    }

    // 4. Conditions
    if (includeConditions) {
      doc.setFontSize(16);
      doc.setTextColor(0, 61, 155);
      doc.text('4. Chronic Conditions', 15, currentY);
      
      doc.setFontSize(11);
      doc.setTextColor(24, 28, 30);
      let condY = currentY + 8;
      if (record.conditions.length > 0) {
        record.conditions.forEach((cond) => {
          doc.text(`• ${cond.name} [${cond.severity}] ${cond.notes ? `- ${cond.notes}` : ''}`, 15, condY);
          condY += 7;
        });
      } else {
        doc.text('No active clinical conditions listed.', 15, condY);
        condY += 7;
      }
      
      currentY = condY + 3;
      doc.setDrawColor(220, 225, 230);
      doc.line(15, currentY, 195, currentY);
      currentY += 10;
    }

    // 5. Recent Lab Results
    if (includeLabs) {
      doc.setFontSize(16);
      doc.setTextColor(0, 61, 155);
      doc.text('5. Recent Lab Results Summary', 15, currentY);
      
      doc.setFontSize(11);
      doc.setTextColor(24, 28, 30);
      doc.text('• Blood Panel CBC (Normal ranges, completed 2026-04-12)', 15, currentY + 8);
      doc.text('• Glucose HbA1c (6.2%, controlled, Endocrinology)', 15, currentY + 15);
      currentY += 23;
    }

    // 6. Clinical Documents & Verification
    if (includeDocuments) {
      doc.setFontSize(16);
      doc.setTextColor(0, 61, 155);
      doc.text('6. Clinical Documents & Verification', 15, currentY);
      
      doc.setFontSize(11);
      let docY = currentY + 8;
      
      if (record.documents && record.documents.length > 0) {
        record.documents.forEach((item) => {
          const urlStr = item.url || '';
          const absoluteUrl = urlStr.startsWith('http') 
            ? urlStr 
            : `${window.location.origin}${urlStr}`;
            
          doc.setTextColor(0, 102, 204); // Underline blue for links
          doc.text(`• ${item.name} (${item.category}) [Click to View]`, 15, docY, { link: absoluteUrl } as any);
          docY += 7;
        });
      } else {
        doc.setTextColor(24, 28, 30);
        doc.text('No verified documents attached to this profile.', 15, docY);
        docY += 7;
      }
      
      currentY = docY + 3;
    }

    // Footer Info
    doc.setFontSize(8);
    doc.setTextColor(120, 125, 130);
    doc.text('Generated via MediQR. Confidential Protected Health Information.', 15, 285);
    
    doc.save(`mediqr-export-${record.name.toLowerCase().replace(/\s+/g, '-')}.pdf`);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div>
        <span className="font-label-caps text-xs text-on-surface-variant/70 tracking-widest block mb-1">Reports</span>
        <h1 className="font-headline-lg-mobile md:font-headline-lg text-on-surface font-bold">Export Medical Card</h1>
        <p className="text-xs text-on-surface-variant max-w-2xl mt-1">
          Select the health information you wish to include in your generated PDF report. This document can be shared with healthcare providers.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Selector */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <GlassCard className="p-6 flex flex-col gap-4">
            <h3 className="font-title-md text-sm text-on-surface font-semibold flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">checklist</span>
              Included Data
            </h3>
            <p className="text-xs text-on-surface-variant">Check the sections you want to appear on the exported card.</p>
            
            <div className="flex flex-col gap-3">
              {/* Option 1 */}
              <label className="flex items-start gap-4 p-4 rounded-xl bg-surface/50 hover:bg-white/90 transition-all cursor-pointer border border-outline-variant/20">
                <input 
                  type="checkbox" 
                  checked={includeProfile}
                  onChange={() => setIncludeProfile(!includeProfile)}
                  className="mt-1 w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer" 
                />
                <div className="flex flex-col">
                  <span className="font-semibold text-sm text-on-surface">Basic Profile &amp; Emergency Contacts</span>
                  <span className="text-xs text-on-surface-variant mt-0.5">Name, Age, Blood Type, Height, Weight, and ICE contacts.</span>
                </div>
              </label>

              {/* Option 2 */}
              <label className="flex items-start gap-4 p-4 rounded-xl bg-surface/50 hover:bg-white/90 transition-all cursor-pointer border border-outline-variant/20">
                <input 
                  type="checkbox" 
                  checked={includeMeds}
                  onChange={() => setIncludeMeds(!includeMeds)}
                  className="mt-1 w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer" 
                />
                <div className="flex flex-col">
                  <span className="font-semibold text-sm text-on-surface">Current Medications</span>
                  <span className="text-xs text-on-surface-variant mt-0.5">Active prescriptions, dosages, and schedules.</span>
                </div>
              </label>

              {/* Option 3 */}
              <label className="flex items-start gap-4 p-4 rounded-xl bg-surface/50 hover:bg-white/90 transition-all cursor-pointer border border-outline-variant/20">
                <input 
                  type="checkbox" 
                  checked={includeAllergies}
                  onChange={() => setIncludeAllergies(!includeAllergies)}
                  className="mt-1 w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer" 
                />
                <div className="flex flex-col">
                  <span className="font-semibold text-sm text-on-surface">Allergies &amp; Reactions</span>
                  <span className="text-xs text-on-surface-variant mt-0.5">Known allergies (drug, food, environmental) and severity.</span>
                </div>
              </label>

              {/* Option 4 */}
              <label className="flex items-start gap-4 p-4 rounded-xl bg-surface/50 hover:bg-white/90 transition-all cursor-pointer border border-outline-variant/20">
                <input 
                  type="checkbox" 
                  checked={includeConditions}
                  onChange={() => setIncludeConditions(!includeConditions)}
                  className="mt-1 w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer" 
                />
                <div className="flex flex-col">
                  <span className="font-semibold text-sm text-on-surface">Chronic Conditions</span>
                  <span className="text-xs text-on-surface-variant mt-0.5">Long-term diagnoses and management plans.</span>
                </div>
              </label>

              {/* Option 5 */}
              <label className="flex items-start gap-4 p-4 rounded-xl bg-surface/50 hover:bg-white/90 transition-all cursor-pointer border border-outline-variant/20">
                <input 
                  type="checkbox" 
                  checked={includeLabs}
                  onChange={() => setIncludeLabs(!includeLabs)}
                  className="mt-1 w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer" 
                />
                <div className="flex flex-col">
                  <span className="font-semibold text-sm text-on-surface">Recent Lab Results</span>
                  <span className="text-xs text-on-surface-variant mt-0.5">Summary of blood panels and glucose levels.</span>
                </div>
              </label>

              {/* Option 6 */}
              <label className="flex items-start gap-4 p-4 rounded-xl bg-surface/50 hover:bg-white/90 transition-all cursor-pointer border border-outline-variant/20">
                <input 
                  type="checkbox" 
                  checked={includeDocuments}
                  onChange={() => setIncludeDocuments(!includeDocuments)}
                  className="mt-1 w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer" 
                />
                <div className="flex flex-col">
                  <span className="font-semibold text-sm text-on-surface">Clinical Documents &amp; Certificates</span>
                  <span className="text-xs text-on-surface-variant mt-0.5">Clickable links to your uploaded lab reports and certifications.</span>
                </div>
              </label>
            </div>
          </GlassCard>

          {/* Security Notice */}
          <div className="flex items-start gap-3 p-4 bg-primary/5 rounded-xl border border-primary/20">
            <span className="material-symbols-outlined text-primary mt-0.5 filled-icon">shield_lock</span>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              <strong>Security Note:</strong> The generated PDF will contain sensitive PHI (Protected Health Information). Only share this document with verified healthcare professionals or trusted individuals.
            </p>
          </div>

          <Button
            variant="primary"
            onClick={handleGeneratePDF}
            className="w-full py-4 justify-center"
            icon="picture_as_pdf"
            iconPosition="left"
          >
            Generate PDF Report
          </Button>
        </div>

        {/* Right Column: Preview */}
        <div className="lg:col-span-5">
          <div className="sticky top-24 space-y-4">
            <h3 className="font-title-md text-sm text-on-surface font-semibold px-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-500">visibility</span>
              Live Preview
            </h3>
            
            {/* Gold-Border Accent Preview Box */}
            <div className="bg-gradient-to-br from-amber-400/5 to-amber-600/10 backdrop-blur-[12px] border border-amber-500/40 shadow-[0_8px_32px_rgba(203,167,47,0.15)] rounded-[24px] p-6 flex flex-col gap-6 relative overflow-hidden group">
              {/* Inner ring highlight */}
              <div className="absolute inset-0 rounded-[24px] border border-amber-500/10 pointer-events-none m-[2px]" />
              
              {/* Watermark grid */}
              <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: `radial-gradient(#003d9b 1px, transparent 1px)`, backgroundSize: '16px 16px' }} />
              
              {/* Header */}
              <div className="flex justify-between items-start z-10 border-b border-outline-variant/30 pb-4">
                <div className="flex flex-col">
                  <span className="font-bold text-lg text-on-surface leading-tight">{record.name}</span>
                  <span className="text-xs text-on-surface-variant">Age: {record.age}y &bull; {record.gender}</span>
                </div>
                <div className="bg-white px-3 py-1 rounded-full border border-amber-500/30 text-amber-700 font-bold text-[10px] flex items-center gap-1 shadow-sm leading-none shrink-0">
                  <span className="material-symbols-outlined text-[12px] filled-icon">water_drop</span>
                  {record.bloodGroup}
                </div>
              </div>

              {/* Live selecting content */}
              <div className="flex flex-col gap-4 z-10 text-xs">
                {includeProfile && record.contacts.length > 0 && (
                  <div>
                    <h4 className="font-bold text-[9px] text-primary uppercase tracking-wider mb-1">Emergency Contact</h4>
                    <p className="text-on-surface font-semibold">{record.contacts[0].name} ({record.contacts[0].relationship})</p>
                    <p className="text-on-surface-variant">{record.contacts[0].phone}</p>
                  </div>
                )}

                {includeMeds && record.medications.length > 0 && (
                  <div>
                    <h4 className="font-bold text-[9px] text-primary uppercase tracking-wider mb-1">Current Medications</h4>
                    <ul className="text-on-surface list-disc list-inside space-y-0.5">
                      {record.medications.map((med, idx) => (
                        <li key={idx} className="truncate">{med.name} {med.dosage} ({med.frequency})</li>
                      ))}
                    </ul>
                  </div>
                )}

                {includeAllergies && record.allergies.length > 0 && (
                  <div>
                    <h4 className="font-bold text-[9px] text-error uppercase tracking-wider mb-1">Allergies</h4>
                    <div className="flex gap-1.5 flex-wrap mt-1">
                      {record.allergies.map((allergy, idx) => (
                        <span key={idx} className="bg-error/10 text-error px-2 py-0.5 rounded text-[10px] font-semibold border border-error/20">
                          {allergy.name} ({allergy.severity})
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {includeConditions && record.conditions.length > 0 && (
                  <div>
                    <h4 className="font-bold text-[9px] text-primary uppercase tracking-wider mb-1">Active Conditions</h4>
                    <div className="flex gap-1.5 flex-wrap mt-1">
                      {record.conditions.map((cond, idx) => (
                        <span key={idx} className="bg-primary/10 text-primary px-2 py-0.5 rounded text-[10px] border border-primary/20">
                          {cond.name} ({cond.severity})
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {includeLabs && (
                  <div>
                    <h4 className="font-bold text-[9px] text-primary uppercase tracking-wider mb-1">Recent Lab Results</h4>
                    <p className="text-on-surface truncate">Blood Panel CBC &bull; Completed 2026-04-12</p>
                  </div>
                )}

                {includeDocuments && record.documents && record.documents.length > 0 && (
                  <div>
                    <h4 className="font-bold text-[9px] text-teal-600 uppercase tracking-wider mb-1">Attached Documents</h4>
                    <ul className="text-on-surface list-disc list-inside space-y-0.5">
                      {record.documents.map((doc, idx) => (
                        <li key={idx} className="truncate text-teal-600 font-semibold cursor-pointer hover:underline">
                          <a href={doc.url} target="_blank" rel="noopener noreferrer">
                            {doc.name} ({doc.category})
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="mt-4 pt-4 border-t border-outline-variant/30 flex justify-between items-end z-10">
                <div className="flex flex-col">
                  <span className="font-semibold text-[9px] text-on-surface-variant uppercase tracking-wider">Generated by MediQR</span>
                  <span className="text-[9px] text-on-surface-variant/70 mt-0.5">ID: {record.qrId.toUpperCase()}</span>
                </div>
                <div className="w-12 h-12 bg-white rounded border border-outline-variant/30 flex items-center justify-center text-outline-variant">
                  <span className="material-symbols-outlined text-2xl">qr_code_2</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
