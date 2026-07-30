import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();



  const getPageTitle = (pathname: string) => {
    if (pathname.startsWith('/dashboard')) return 'Dashboard';
    if (pathname.startsWith('/profile/setup')) return 'Profile Setup';
    if (pathname.startsWith('/profile/conditions')) return 'Conditions & Allergies';
    if (pathname.startsWith('/profile/medications')) return 'Current Medications';
    if (pathname.startsWith('/profile/reminders')) return 'Tablet Checker';
    if (pathname.startsWith('/profile/emergency-contacts')) return 'Emergency Contacts';
    if (pathname.startsWith('/documents')) return 'Document Vault';
    if (pathname.startsWith('/qr/my-code')) return 'My Medical QR';
    if (pathname.startsWith('/qr/scan')) return 'Scan Health QR';
    if (pathname.startsWith('/records')) return 'Records & History';
    if (pathname.startsWith('/notifications')) return 'Notifications & Alerts';
    if (pathname.startsWith('/settings')) return 'Settings & Privacy';
    if (pathname.startsWith('/reports')) return 'Medical Reports';
    return 'MediQR';
  };

  const notifications = Array.isArray(user?.notifications) ? user?.notifications : [];
  const unreadCount = notifications.filter((n: any) => n.unread).length || 0;

  return (
    <header className="sticky top-0 z-30 w-full bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 py-3 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-3">
        {/* Beautiful clinical vector logo icon */}
        <div className="w-9 h-9 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-center flex-shrink-0 shadow-sm">
          <span className="material-symbols-outlined text-[20px] text-primary filled-icon">qr_code_scanner</span>
        </div>
        <h2 className="font-headline-lg-mobile text-primary tracking-tight md:hidden">
          {getPageTitle(location.pathname)}
        </h2>
        <h2 className="font-title-md text-primary tracking-tight hidden md:block">
          MediQR &bull; {getPageTitle(location.pathname)}
        </h2>
      </div>

      <div className="flex items-center gap-3">


        {/* Notifications */}
        <button
          onClick={() => navigate('/notifications')}
          className="relative w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:bg-surface-variant/50 transition-all cursor-pointer hover:scale-105 active:scale-95"
        >
          <span className="material-symbols-outlined text-[22px]">notifications</span>
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-error text-white font-bold text-[9px] flex items-center justify-center rounded-full border-2 border-white animate-pulse">
              {unreadCount}
            </span>
          )}
        </button>

        {/* Profile Avatar / Initials */}
        <button
          onClick={() => navigate('/profile/setup')}
          className="w-10 h-10 rounded-full bg-primary-container text-primary font-semibold flex items-center justify-center text-sm shadow-inner cursor-pointer hover:ring-2 hover:ring-primary/40 hover:scale-105 active:scale-95 transition-all overflow-hidden"
        >
          {user?.patientRecord?.photo ? (
            <img 
              src={user.patientRecord.photo} 
              alt="Profile" 
              className="w-full h-full object-cover"
            />
          ) : (
            user?.patientRecord?.name
              ? user.patientRecord.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
              : user?.email?.[0]?.toUpperCase() || 'U'
          )}
        </button>

        {/* Logout — always visible */}
        <button
          onClick={async () => {
            await logout();
            navigate('/login');
          }}
          className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:bg-red-50 hover:text-red-600 hover:scale-105 active:scale-95 transition-all cursor-pointer"
          title="Log Out"
        >
          <span className="material-symbols-outlined text-[22px]">logout</span>
        </button>
      </div>
    </header>
  );
};
