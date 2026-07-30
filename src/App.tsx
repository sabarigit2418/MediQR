import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { MainLayout } from './components/MainLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Splash } from './pages/Splash';
import { Login } from './pages/Login';
import { Onboarding } from './pages/Onboarding';
import { Dashboard } from './pages/Dashboard';
import { ProfileSetup } from './pages/ProfileSetup';
import { Conditions } from './pages/Conditions';
import { Medications } from './pages/Medications';
import { EmergencyContacts } from './pages/EmergencyContacts';
import { Documents } from './pages/Documents';
import { MyQR } from './pages/MyQR';
import { ScanQR } from './pages/ScanQR';
import { PublicEmergencyProfile } from './pages/PublicEmergencyProfile';
import { Records } from './pages/Records';
import { Notifications } from './pages/Notifications';
import { Settings } from './pages/Settings';
import { Reports } from './pages/Reports';
import { AdminDashboard } from './pages/AdminDashboard';
import { Reminders } from './pages/Reminders';
import { ReminderService } from './components/ReminderService';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ReminderService />
        <Routes>
          {/* Public Full Screen Routes */}
          <Route path="/splash" element={<Splash />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/onboarding"
            element={
              <ProtectedRoute requireOnboarding>
                <Onboarding />
              </ProtectedRoute>
            }
          />
          <Route path="/emergency/:qrId" element={<PublicEmergencyProfile />} />

          {/* Protected Navigation Chrome Layout Routes */}
          <Route element={<MainLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/profile/setup" element={<ProfileSetup />} />
            <Route path="/profile/conditions" element={<Conditions />} />
            <Route path="/profile/medications" element={<Medications />} />
            <Route path="/profile/reminders" element={<Reminders />} />
            <Route path="/profile/emergency-contacts" element={<EmergencyContacts />} />
            <Route path="/documents" element={<Documents />} />
            <Route path="/qr/my-code" element={<MyQR />} />
            <Route path="/qr/scan" element={<ScanQR />} />
            <Route path="/records" element={<Records />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/reports" element={<Reports />} />
          </Route>

          {/* Root Redirects */}
          <Route path="/" element={<Navigate to="/splash" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
