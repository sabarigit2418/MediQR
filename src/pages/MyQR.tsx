import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GlassCard } from '../components/GlassCard';
import { Button } from '../components/Button';

export const MyQR: React.FC = () => {
  const { user, regenerateQrData, updatePrivacySettings } = useAuth();
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [shareSuccess, setShareSuccess] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [localIp, setLocalIp] = useState<string>('localhost');
  const [savingPrivacy, setSavingPrivacy] = useState(false);
  const [savedPrivacy, setSavedPrivacy] = useState(false);

  useEffect(() => {
    fetch('/api/network-ip')
      .then(res => res.json())
      .then(data => {
        if (data && data.ip) setLocalIp(data.ip);
      })
      .catch(err => console.error('Failed to fetch local IP:', err));
  }, []);

  const getQrCodeUrl = () => {
    let origin = window.location.origin;
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      origin = origin.replace('localhost', localIp).replace('127.0.0.1', localIp);
    }
    return `${origin}/emergency/${user?.patientRecord?.qrId || ''}`;
  };

  const getDirectReportCardUrl = () =>
    `${window.location.origin}/emergency/${user?.patientRecord?.qrId || ''}`;

  const qrCodeUrl = user ? getQrCodeUrl() : '';
  const directReportCardUrl = user ? getDirectReportCardUrl() : '';

  useEffect(() => {
    if (canvasRef.current && user?.patientRecord?.qrId) {
      QRCode.toCanvas(canvasRef.current, qrCodeUrl, {
        width: 240,
        margin: 1,
        color: { dark: '#181c1e', light: '#ffffff' },
      }, (err) => {
        if (err) console.error('Error generating QR Code', err);
      });
    }
  }, [user?.patientRecord?.qrId, qrCodeUrl]);

  if (!user) return null;

  const record = user.patientRecord;
  const privacy = user.privacySettings;

  const isNameValid = !!record.name.trim();
  const isBloodValid = !!record.bloodGroup;
  const isContactsValid = record.contacts.length > 0;

  const missingFields: { label: string; path: string }[] = [];
  if (!isNameValid) missingFields.push({ label: 'Full Name', path: '/profile/setup' });
  if (!isBloodValid) missingFields.push({ label: 'Blood Group', path: '/profile/setup' });
  if (!isContactsValid) missingFields.push({ label: 'Emergency Contact', path: '/profile/emergency-contacts' });

  const handleDownload = () => {
    if (canvasRef.current) {
      const url = canvasRef.current.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = url;
      link.download = `mediqr-${record.name.toLowerCase().replace(/\s+/g, '-')}-qr.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${record.name}'s MediQR Health ID`,
        text: `Securely access emergency health data for ${record.name}.`,
        url: qrCodeUrl,
      }).catch(err => console.log('Error sharing', err));
    } else {
      navigator.clipboard.writeText(qrCodeUrl);
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 2000);
    }
  };

  const handleRegenerate = () => {
    regenerateQrData();
    setSyncSuccess(true);
    setTimeout(() => setSyncSuccess(false), 2000);
  };

  // Toggle a privacy field and auto-save
  const handlePrivacyToggle = (field: keyof typeof privacy) => {
    updatePrivacySettings({ [field]: !privacy[field] });
    setSavedPrivacy(false);
  };

  const handleSavePrivacy = () => {
    setSavingPrivacy(true);
    setTimeout(() => {
      setSavingPrivacy(false);
      setSavedPrivacy(true);
      setTimeout(() => setSavedPrivacy(false), 3000);
    }, 800);
  };

  // Privacy section config
  const privacySections: {
    key: keyof typeof privacy;
    label: string;
    icon: string;
    description: string;
    preview: string;
  }[] = [
    {
      key: 'showVitals',
      label: 'Vitals & Demographics',
      icon: 'person',
      description: 'Name, age, gender, blood group, height, weight',
      preview: privacy.showVitals
        ? `${record.name} • ${record.age}y ${record.gender} • ${record.bloodGroup}`
        : 'Hidden from report card',
    },
    {
      key: 'showAllergies',
      label: 'Allergies Alert',
      icon: 'coronavirus',
      description: 'Critical allergy reactions (shown in red on report)',
      preview: privacy.showAllergies
        ? (record.allergies.length > 0 ? record.allergies.map(a => a.name).join(', ') : 'No allergies')
        : 'Hidden from report card',
    },
    {
      key: 'showConditions',
      label: 'Chronic Conditions',
      icon: 'monitor_heart',
      description: 'Long-term medical conditions and diagnoses',
      preview: privacy.showConditions
        ? (record.conditions.length > 0 ? record.conditions.map(c => c.name).join(', ') : 'None listed')
        : 'Hidden from report card',
    },
    {
      key: 'showMedications',
      label: 'Active Medications',
      icon: 'medication',
      description: 'Current prescriptions and dosage schedule',
      preview: privacy.showMedications
        ? (record.medications.length > 0 ? record.medications.map(m => m.name).join(', ') : 'None listed')
        : 'Hidden from report card',
    },
    {
      key: 'showContacts',
      label: 'Emergency Contacts',
      icon: 'emergency',
      description: 'ICE contacts for first responders',
      preview: privacy.showContacts
        ? (record.contacts.length > 0 ? record.contacts.map(c => `${c.name} (${c.relationship})`).join(', ') : 'No contacts')
        : 'Hidden from report card',
    },
  ];

  const publicCount = privacySections.filter(s => privacy[s.key]).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center max-w-md mx-auto space-y-1">
        <h2 className="font-headline-lg-mobile md:font-headline-lg text-primary font-bold">Your Health ID</h2>
        <p className="text-xs text-on-surface-variant">
          {missingFields.length === 0
            ? 'Present this secure code to authorized providers.'
            : 'Your QR code is ready — complete your profile for full emergency data.'}
        </p>
      </div>

      {/* Warning banner */}
      {missingFields.length > 0 && (
        <div className="max-w-4xl mx-auto">
          <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl px-4 py-3">
            <span className="material-symbols-outlined text-amber-600 text-[20px] shrink-0 mt-0.5">warning</span>
            <div className="flex-1">
              <p className="text-xs font-semibold text-amber-800 mb-2">Complete your profile for better emergency care</p>
              <div className="flex flex-wrap gap-2">
                {missingFields.map(f => (
                  <button
                    key={f.label}
                    onClick={() => navigate(f.path)}
                    className="text-[11px] text-amber-700 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-full hover:bg-amber-500/25 transition-colors cursor-pointer font-medium"
                  >
                    + Add {f.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Grid Container */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 max-w-4xl mx-auto">

        {/* QR Code Focus Area */}
        <div className="md:col-span-6 flex flex-col items-center justify-center gap-4">
          <div className="bg-gradient-to-br from-amber-400/5 to-amber-600/10 backdrop-blur-[16px] border-2 border-amber-500/30 shadow-[0_8px_32px_rgba(203,167,47,0.15)] rounded-[2rem] p-6 flex flex-col items-center relative w-full max-w-[300px] mx-auto group">
            {/* Corner markers */}
            <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-amber-500/50" />
            <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-amber-500/50" />
            <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-amber-500/50" />
            <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-amber-500/50" />

            <div className="bg-white p-4 rounded-xl shadow-inner w-full aspect-square flex items-center justify-center mb-4 relative overflow-hidden">
              <canvas ref={canvasRef} className="max-w-full rounded" />
            </div>

            <div className="flex items-center gap-2 text-amber-700 bg-amber-500/10 px-4 py-2 rounded-full backdrop-blur-sm">
              <span className="material-symbols-outlined text-[18px] filled-icon">verified_user</span>
              <span className="font-label-caps text-[10px]">Secured by MediQR</span>
            </div>
          </div>

          {syncSuccess && (
            <div className="text-xs text-teal-700 bg-teal-500/10 border border-teal-500/20 px-3 py-1 rounded-full animate-fade-in flex items-center gap-1 font-semibold">
              <span className="material-symbols-outlined text-xs">done</span> Data synced
            </div>
          )}

          <div className="flex flex-col w-full max-w-[300px] gap-3">
            <div className="flex gap-3">
              <Button variant="primary" onClick={handleDownload} icon="download" iconPosition="left" className="flex-1 py-3 justify-center">
                Save Image
              </Button>
              <Button variant="secondary" onClick={handleShare} icon="share" iconPosition="left" className="flex-1 py-3 text-center justify-center">
                {shareSuccess ? 'Copied!' : 'Share'}
              </Button>
            </div>
            <Button variant="primary" onClick={() => window.open(directReportCardUrl, '_blank')} icon="launch" iconPosition="left" className="w-full py-3 justify-center">
              Get Report Card
            </Button>
            <Button variant="secondary" onClick={handleRegenerate} icon="sync" iconPosition="left" className="w-full py-3 justify-center">
              Regenerate QR Key
            </Button>
            <Button variant="secondary" onClick={() => navigate('/qr/scan')} icon="qr_code_scanner" iconPosition="left" className="w-full py-3 justify-center bg-indigo-500/10 border-indigo-500/30 text-indigo-700 hover:bg-indigo-500/25">
              Scan QR Code
            </Button>
          </div>
        </div>

        {/* Privacy Control Panel — replaces old "Live Scanner Preview" */}
        <div className="md:col-span-6">
          <GlassCard className="flex flex-col gap-0 w-full h-full p-0 overflow-hidden">
            {/* Panel Header */}
            <div className="px-5 py-4 border-b border-outline-variant/20 flex items-center justify-between">
              <div>
                <h3 className="font-title-md text-on-surface font-semibold text-sm">Report Card Privacy</h3>
                <p className="text-[10px] text-on-surface-variant mt-0.5">
                  Toggle what doctors see when they scan your QR
                </p>
              </div>
              {/* Public count badge */}
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-all duration-500 ${
                  publicCount === 5 ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' :
                  publicCount >= 3 ? 'bg-primary/20 border-primary text-primary' :
                  'bg-error/20 border-error text-error'
                }`}>
                  {publicCount}/5
                </div>
                <span className="text-[9px] text-on-surface-variant mt-0.5">Public</span>
              </div>
            </div>

            {/* Get Report Card Banner */}
            <div
              onClick={() => window.open(directReportCardUrl, '_blank')}
              className="mx-4 mt-4 bg-gradient-to-r from-teal-500/10 to-primary/10 border border-teal-500/20 rounded-xl p-3 flex items-center justify-between hover:shadow-md active:scale-[0.99] transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 bg-teal-500/10 text-teal-600 rounded-lg flex items-center justify-center border border-teal-500/20 shrink-0">
                  <span className="material-symbols-outlined text-[18px] animate-pulse">launch</span>
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-primary uppercase tracking-wider">Preview Report Card</p>
                  <p className="text-[9px] text-on-surface-variant">See exactly what doctors will see</p>
                </div>
              </div>
              <span className="material-symbols-outlined text-teal-600 text-[14px] group-hover:translate-x-1 transition-transform shrink-0">arrow_forward_ios</span>
            </div>

            {/* Privacy Toggle List */}
            <div className="flex flex-col gap-0 px-4 py-3 flex-1">
              {privacySections.map((section, idx) => {
                const isOn = privacy[section.key];
                return (
                  <div
                    key={section.key}
                    className={`flex items-center gap-3 py-3 transition-all duration-300 ${idx < privacySections.length - 1 ? 'border-b border-outline-variant/15' : ''}`}
                  >
                    {/* Icon */}
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all duration-300 ${
                      isOn ? 'bg-primary/15 text-primary' : 'bg-surface-container-high/50 text-outline'
                    }`}>
                      <span className="material-symbols-outlined text-[16px]">{section.icon}</span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <span className={`text-xs font-semibold block transition-colors duration-300 ${isOn ? 'text-on-surface' : 'text-outline'}`}>
                        {section.label}
                      </span>
                      {/* Preview text */}
                      <p className={`text-[10px] mt-0.5 leading-tight truncate transition-all duration-300 ${
                        isOn ? 'text-on-surface-variant' : 'text-outline/60 italic'
                      }`}>
                        {isOn ? (
                          <span className="flex items-center gap-1">
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                            {section.preview}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[10px]">lock</span>
                            Hidden from doctors & report card
                          </span>
                        )}
                      </p>
                    </div>

                    {/* Toggle Switch - positioned directly as row child so it never wraps down */}
                    <button
                      onClick={() => handlePrivacyToggle(section.key)}
                      className={`relative w-11 h-6 rounded-full transition-all duration-300 shrink-0 focus:outline-none cursor-pointer ${
                        isOn ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]' : 'bg-surface-container-highest'
                      }`}
                      title={isOn ? 'Click to hide from report' : 'Click to show in report'}
                    >
                      <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-300 ${
                        isOn ? 'left-[22px]' : 'left-0.5'
                      }`} />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Save Button */}
            <div className="px-4 pb-4 pt-2 border-t border-outline-variant/15">
              <button
                onClick={handleSavePrivacy}
                disabled={savingPrivacy || savedPrivacy}
                className={`w-full py-2.5 rounded-xl text-xs font-bold tracking-wide transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer ${
                  savedPrivacy
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : savingPrivacy
                    ? 'bg-primary/20 text-primary border border-primary/30 opacity-70'
                    : 'bg-primary/15 text-primary border border-primary/30 hover:bg-primary/25 hover:shadow-[0_0_12px_rgba(0,200,255,0.2)]'
                }`}
              >
                {savedPrivacy ? (
                  <>
                    <span className="material-symbols-outlined text-[16px]">check_circle</span>
                    Privacy Settings Saved!
                  </>
                ) : savingPrivacy ? (
                  <>
                    <span className="material-symbols-outlined text-[16px] animate-spin">sync</span>
                    Saving...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[16px]">save</span>
                    Save Privacy Settings
                  </>
                )}
              </button>
              <p className="text-center text-[9px] text-on-surface-variant/50 mt-2">
                Changes apply immediately to your public emergency report card
              </p>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};
