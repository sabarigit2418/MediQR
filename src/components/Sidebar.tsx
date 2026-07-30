import React from 'react';
import { NavLink } from 'react-router-dom';

interface SidebarItemProps {
  to: string;
  icon: string;
  label: string;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ to, icon, label }) => {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-3 rounded-full font-medium transition-all duration-200 ${
          isActive
            ? 'bg-gradient-to-r from-primary to-surface-tint text-white shadow-md'
            : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
        }`
      }
    >
      <span className="material-symbols-outlined text-[20px]">{icon}</span>
      <span className="text-sm font-semibold">{label}</span>
    </NavLink>
  );
};

export const Sidebar: React.FC = () => {
  return (
    <aside className="w-64 h-screen bg-slate-50 border-r border-slate-100 flex flex-col justify-between py-6 px-4 shrink-0 sticky top-0 overflow-y-auto">
      <div className="flex flex-col gap-6">
        {/* Brand — clinical vector logo */}
        <div className="flex items-center gap-3 px-4 py-2">
          <div className="w-10 h-10 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-center flex-shrink-0 shadow-sm">
            <span className="material-symbols-outlined text-[22px] text-primary filled-icon">qr_code_scanner</span>
          </div>
          <div>
            <h1 className="font-title-md text-primary tracking-tight">MediQR</h1>
            <p className="font-label-caps text-[9px] text-on-surface-variant/80 tracking-widest leading-none">Clinical Clarity</p>
          </div>
        </div>

        {/* Links */}
        <nav className="flex flex-col gap-1">
          <SidebarItem to="/dashboard" icon="dashboard" label="Dashboard" />
          <SidebarItem to="/qr/my-code" icon="qr_code" label="My Medical QR" />
          <SidebarItem to="/qr/scan" icon="qr_code_scanner" label="Scan Health QR" />
          <SidebarItem to="/records" icon="history" label="Records & History" />
          <SidebarItem to="/documents" icon="description" label="Document Vault" />
          <SidebarItem to="/reports" icon="analytics" label="Medical Reports" />

          <div className="h-px bg-outline-variant/30 my-2 mx-4" />

          <SidebarItem to="/profile/setup" icon="person" label="Profile Setup" />
          <SidebarItem to="/profile/conditions" icon="healing" label="Conditions & Allergies" />
          <SidebarItem to="/profile/medications" icon="medication" label="Current Medications" />
          <SidebarItem to="/profile/reminders" icon="alarm" label="Medication Reminders" />
          <SidebarItem to="/profile/emergency-contacts" icon="call" label="Emergency Contacts" />
          <SidebarItem to="/settings" icon="settings" label="Settings & Privacy" />
        </nav>
      </div>

      {/* Footer Info */}
      <div className="px-4 py-2 text-center flex items-center justify-center gap-2 opacity-50">
        <span className="material-symbols-outlined text-[14px]">lock</span>
        <span className="font-label-caps text-[9px]">End-to-End Encrypted</span>
      </div>
    </aside>
  );
};
