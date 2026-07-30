import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GlassCard } from '../components/GlassCard';

export const Notifications: React.FC = () => {
  const { user, markNotificationsAsRead } = useAuth();
  const navigate = useNavigate();

  const [emailAlerts, setEmailAlerts] = useState(true);
  

  if (!user) return null;

  // Calculate profile completion progress dynamically
  const record = user.patientRecord;
  const vitalsScore = record.name && record.bloodGroup ? 40 : 0;
  const conditionsScore = (record.conditions.length > 0 || record.allergies.length > 0) ? 20 : 0;
  const medicationsScore = record.medications.length > 0 ? 20 : 0;
  const contactsScore = record.contacts.length > 0 ? 20 : 0;
  const progressPercent = vitalsScore + conditionsScore + medicationsScore + contactsScore;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Page Header */}
      <div className="flex items-end justify-between w-full">
        <div>
          <span className="font-label-caps text-xs text-on-surface-variant/70 tracking-widest block mb-1">Updates</span>
          <h1 className="font-headline-lg-mobile md:font-headline-lg text-on-surface font-bold">Activity</h1>
        </div>
        <button 
          onClick={markNotificationsAsRead}
          className="font-label-caps text-xs text-primary hover:opacity-80 transition-opacity active:scale-95 pb-1 cursor-pointer"
        >
          Mark all as read
        </button>
      </div>

      {/* Preferences Panel */}
      <section className="glass-panel rounded-xl p-5 flex flex-col gap-4 border border-white/60 shadow-sm">
        <h3 className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-wider mb-2 px-1">Alert Preferences</h3>
        
        {/* Toggle: Email */}
        <div className="flex items-center justify-between px-1 py-1">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-secondary-container/50 flex items-center justify-center text-secondary">
              <span className="material-symbols-outlined text-[18px]">mail</span>
            </div>
            <span className="font-semibold text-sm text-on-surface">Email Notifications</span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              checked={emailAlerts}
              onChange={() => setEmailAlerts(!emailAlerts)}
              className="sr-only peer" 
            />
            <div className="w-11 h-6 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary shadow-inner" />
          </label>
        </div>

        {/* Divider */}
        <div className="h-px w-full bg-outline-variant/30" />

        {/* Toggle: Push */}
        <div className="flex items-center justify-between px-1 py-1">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-secondary-container/50 flex items-center justify-center text-secondary">
              <span className="material-symbols-outlined text-[18px]">ad_units</span>
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-sm text-on-surface">Push Alerts</span>
              <span className="text-[10px] text-on-surface-variant">Enable local system notifications on this device</span>
            </div>
          </div>
          {typeof Notification !== 'undefined' ? (
            <button
              onClick={() => {
                if (Notification.permission !== 'granted') {
                  Notification.requestPermission().then(permission => {
                    if (permission === 'granted') {
                      alert('🔔 System Notifications Enabled Successfully!');
                    }
                  });
                } else {
                  alert('🔔 Notifications are already enabled on this device!');
                }
              }}
              className="px-3.5 py-1.5 rounded-xl border border-primary/30 text-[10px] font-bold bg-primary/10 text-primary hover:bg-primary/20 transition-all cursor-pointer"
            >
              {Notification.permission === 'granted' ? 'Enabled' : 'Enable'}
            </button>
          ) : (
            <span className="text-[10px] text-outline italic">Unavailable</span>
          )}
        </div>
      </section>

      {/* Alerts List */}
      <section className="flex flex-col gap-4">
        <h3 className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-wider mb-2 px-1">Recent</h3>

        {/* Dynamic List */}
        {user.notifications.map((notif) => {
          // Determine custom icon and styling based on notification content
          const isScan = notif.title.toLowerCase().includes('scan');
          
          return (
            <GlassCard
              key={notif.id}
              className="flex gap-4 items-start cursor-pointer hover:bg-white/95 border border-white/60 shadow-sm relative group p-4"
            >
              {notif.unread && (
                <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${isScan ? 'bg-amber-500' : 'bg-primary'}`} />
              )}
              
              <div className={`w-12 h-12 shrink-0 rounded-full flex items-center justify-center border ${
                isScan 
                  ? 'bg-amber-500/10 text-amber-700 border-amber-500/30' 
                  : 'bg-primary/10 text-primary border-primary/30'
              }`}>
                <span className={`material-symbols-outlined ${notif.unread ? 'filled-icon' : ''}`}>
                  {isScan ? 'qr_code_scanner' : 'notifications'}
                </span>
              </div>
              
              <div className="flex-grow pt-1 min-w-0">
                <p className={`text-sm text-on-surface font-semibold leading-tight mb-1 group-hover:text-primary transition-colors ${
                  isScan ? 'group-hover:text-amber-700' : ''
                }`}>
                  {notif.title}
                </p>
                <p className="text-xs text-on-surface-variant leading-relaxed">{notif.message}</p>
              </div>

              <span className="font-label-caps text-[9px] text-outline shrink-0 pt-1.5">{notif.time}</span>
            </GlassCard>
          );
        })}

        {/* Profile Completion Alert */}
        {progressPercent < 100 && (
          <GlassCard
            onClick={() => navigate('/profile/setup')}
            className="flex gap-4 items-start cursor-pointer hover:bg-white/95 border border-white/60 shadow-sm relative group p-4"
          >
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-l-xl" />
            <div className="w-12 h-12 shrink-0 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/30">
              <span className="material-symbols-outlined filled-icon">person</span>
            </div>
            
            <div className="flex-1 flex flex-col pt-1 min-w-0">
              <p className="text-sm text-on-surface font-semibold leading-tight mb-2 group-hover:text-primary transition-colors">
                Complete your profile ({progressPercent}% done)
              </p>
              
              {/* Progress Bar */}
              <div className="w-full max-w-[200px] h-1.5 bg-surface-container-high rounded-full overflow-hidden mb-1">
                <div 
                  className="h-full bg-primary rounded-full shadow-[0_0_8px_rgba(0,61,155,0.4)] transition-all duration-500" 
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              
              <p className="text-[11px] text-on-surface-variant mt-1 leading-normal">
                {contactsScore === 0 ? 'Add emergency contacts to reach 100%.' : 'Document your health vitals.'}
              </p>
            </div>
            
            <span className="font-label-caps text-[9px] text-outline shrink-0 pt-1.5">Action Needed</span>
          </GlassCard>
        )}
      </section>
    </div>
  );
};
