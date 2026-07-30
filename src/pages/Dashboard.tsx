import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GlassCard } from '../components/GlassCard';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activities, setActivities] = useState<any[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(true);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (!token) return;
        const response = await fetch('/api/activities', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setActivities(data);
        }
      } catch (err) {
        console.error('Failed to fetch activities:', err);
      } finally {
        setLoadingActivities(false);
      }
    };
    fetchActivities();
  }, []);

  if (!user) return null;

  const allergies = user.patientRecord?.allergies || [];
  const medications = user.patientRecord?.medications || [];
  const contacts = user.patientRecord?.contacts || [];

  const allergySummary = allergies.length > 0 
    ? (allergies.length === 1 ? allergies[0].name : `${allergies.length} Items`) 
    : 'None';

  const getRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="space-y-6">
      {/* Daily Alarms Shortcut Card */}
      {medications.some(m => m.reminderMorning || m.reminderAfternoon || m.reminderNight) && (
        <div 
          onClick={() => navigate('/profile/reminders')}
          className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/35 shadow-sm rounded-[24px] p-5 flex items-center justify-between cursor-pointer hover:shadow-md active:scale-[0.99] transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-700">
              <span className="material-symbols-outlined text-[22px]">alarm</span>
            </div>
            <div>
              <h3 className="font-semibold text-sm text-on-surface">Medication Reminders Schedule</h3>
              <p className="text-xs text-on-surface-variant">Check off your morning, afternoon, or night doses.</p>
            </div>
          </div>
          <span className="material-symbols-outlined text-outline text-xl">chevron_right</span>
        </div>
      )}

      {/* Active QR Status Card */}
      <div 
        onClick={() => navigate('/qr/my-code')}
        className="bg-gradient-to-r from-emerald-400/10 to-green-600/10 backdrop-blur-[12px] border border-emerald-500/40 shadow-[0_8px_32px_rgba(34,197,94,0.15)] rounded-[24px] p-6 flex items-center justify-between cursor-pointer hover:shadow-[0_12px_40px_rgba(34,197,94,0.25)] active:scale-[0.99] transition-all duration-300 relative overflow-hidden"
      >
        <div className="absolute inset-0 border border-emerald-400/20 rounded-[24px] pointer-events-none m-[2px]" />
        
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-600 filled-icon">verified_user</span>
            <span className="font-title-md text-emerald-700 font-semibold">Status: Active</span>
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant/80">Your medical profile is ready for scanning.</p>
        </div>

        <div className="bg-white p-2 rounded-lg shadow-sm border border-outline-variant/30 flex-shrink-0">
          <div className="w-16 h-16 bg-surface-container flex items-center justify-center rounded">
            <span className="material-symbols-outlined text-primary text-3xl">qr_code_2</span>
          </div>
        </div>
      </div>

      {/* Health Stats Grid */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Blood Group */}
        <div 
          onClick={() => navigate('/profile/setup')}
          className="glass-panel rounded-[24px] p-6 flex flex-col items-center justify-center gap-2 bg-white/40 hover:bg-white hover:border-primary/30 hover:shadow-lg hover:-translate-y-1 cursor-pointer active:scale-[0.97] transition-all duration-300 border border-white/60 shadow-sm group"
        >
          <span className="material-symbols-outlined text-primary text-3xl filled-icon group-hover:scale-110 transition-transform duration-300">bloodtype</span>
          <span className="font-label-caps text-on-surface-variant text-center text-[10px] font-bold tracking-wider uppercase">Blood Group</span>
          <span className="font-title-md text-on-surface text-xl group-hover:text-primary transition-colors duration-300">{user.patientRecord.bloodGroup || 'Not Set'}</span>
        </div>

        {/* Allergies */}
        <div 
          onClick={() => navigate('/profile/conditions')}
          className="glass-panel rounded-[24px] p-6 flex flex-col items-center justify-center gap-2 bg-white/40 hover:bg-white hover:border-primary/30 hover:shadow-lg hover:-translate-y-1 cursor-pointer active:scale-[0.97] transition-all duration-300 border border-white/60 shadow-sm group"
        >
          <span className="material-symbols-outlined text-primary text-3xl filled-icon group-hover:scale-110 transition-transform duration-300">allergies</span>
          <span className="font-label-caps text-on-surface-variant text-center text-[10px] font-bold tracking-wider uppercase">Allergies</span>
          <span className="font-title-md text-on-surface text-xl truncate max-w-full group-hover:text-primary transition-colors duration-300">{allergySummary}</span>
        </div>

        {/* Medications */}
        <div 
          onClick={() => navigate('/profile/medications')}
          className="glass-panel rounded-[24px] p-6 flex flex-col items-center justify-center gap-2 bg-white/40 hover:bg-white hover:border-primary/30 hover:shadow-lg hover:-translate-y-1 cursor-pointer active:scale-[0.97] transition-all duration-300 border border-white/60 shadow-sm group"
        >
          <span className="material-symbols-outlined text-primary text-3xl filled-icon group-hover:scale-110 transition-transform duration-300">medication</span>
          <span className="font-label-caps text-on-surface-variant text-center text-[10px] font-bold tracking-wider uppercase">Medications</span>
          <span className="font-title-md text-on-surface text-xl group-hover:text-primary transition-colors duration-300">{medications.length} Active</span>
        </div>

        {/* Emergency Contacts */}
        <div 
          onClick={() => navigate('/profile/emergency-contacts')}
          className="glass-panel rounded-[24px] p-6 flex flex-col items-center justify-center gap-2 bg-white/40 hover:bg-white hover:border-primary/30 hover:shadow-lg hover:-translate-y-1 cursor-pointer active:scale-[0.97] transition-all duration-300 border border-white/60 shadow-sm group"
        >
          <span className="material-symbols-outlined text-primary text-3xl filled-icon group-hover:scale-110 transition-transform duration-300">contacts</span>
          <span className="font-label-caps text-on-surface-variant text-center text-[10px] font-bold tracking-wider uppercase">Emergency</span>
          <span className="font-title-md text-on-surface text-xl group-hover:text-primary transition-colors duration-300">{contacts.length} Contacts</span>
        </div>
      </section>

      {/* Recent Activity List */}
      <section className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <h2 className="font-title-md text-title-md text-on-surface font-semibold">Recent Activity</h2>
          <button 
            onClick={() => navigate('/records')}
            className="text-xs text-primary font-semibold hover:underline cursor-pointer bg-transparent border-0"
          >
            View Timeline
          </button>
        </div>
        
        {loadingActivities ? (
          <div className="text-center py-6 text-xs text-outline-variant">Loading timeline logs...</div>
        ) : activities.length === 0 ? (
          <GlassCard className="text-center py-10">
            <span className="material-symbols-outlined text-outline-variant text-4xl mb-2">history</span>
            <p className="text-on-surface-variant text-sm font-semibold">No recent activities logged.</p>
            <p className="text-outline text-xs mt-1">Your timeline updates dynamically on profile edits, QR scans, and document uploads.</p>
          </GlassCard>
        ) : (
          <div className="space-y-3">
            {activities.slice(0, 5).map((act, index) => (
              <div 
                key={index} 
                onClick={() => navigate('/records')}
                className="glass-panel rounded-[24px] p-5 flex items-center gap-4 hover:bg-white/90 cursor-pointer active:scale-[0.99] transition-all duration-200 border border-white/60 shadow-sm"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined">
                    {act.type === 'scan' ? 'qr_code_scanner' : act.type === 'document' ? 'description' : 'manage_accounts'}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="font-body-lg text-on-surface font-semibold text-sm">{act.title}</h3>
                  <p className="font-body-sm text-on-surface-variant text-xs">{act.description}</p>
                </div>
                <span className="text-xs text-on-surface-variant/70 shrink-0">{getRelativeTime(act.created_at)}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
