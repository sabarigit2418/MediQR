import React from 'react';
import { NavLink } from 'react-router-dom';

interface BottomNavItemProps {
  to: string;
  icon: string;
  label: string;
}

const BottomNavItem: React.FC<BottomNavItemProps> = ({ to, icon, label }) => {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex flex-col items-center justify-center gap-1 flex-1 py-2 text-center transition-all ${
          isActive ? 'text-primary' : 'text-on-surface-variant/70 hover:text-on-surface'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <span className={`material-symbols-outlined text-[24px] ${isActive ? 'filled-icon' : ''}`}>{icon}</span>
          <span className="text-[10px] font-semibold tracking-wide uppercase leading-none">{label}</span>
        </>
      )}
    </NavLink>
  );
};

export const BottomNav: React.FC = () => {
  const [isMobileApp, setIsMobileApp] = React.useState(false);

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('app') === 'true') {
      localStorage.setItem('is_mobile_app', 'true');
      setIsMobileApp(true);
    } else {
      setIsMobileApp(localStorage.getItem('is_mobile_app') === 'true');
    }
  }, []);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-100 flex items-center justify-around md:hidden shadow-lg pb-safe">
      <BottomNavItem to="/dashboard" icon="dashboard" label="Home" />
      <BottomNavItem to="/documents" icon="description" label="Vault" />
      {isMobileApp ? (
        <BottomNavItem to="/profile/reminders" icon="alarm" label="Alarms" />
      ) : (
        <BottomNavItem to="/qr/scan" icon="qr_code_scanner" label="Scan" />
      )}
      <BottomNavItem to="/qr/my-code" icon="qr_code" label="My QR" />
      <BottomNavItem to="/profile/setup" icon="person" label="Profile" />
    </nav>
  );
};
