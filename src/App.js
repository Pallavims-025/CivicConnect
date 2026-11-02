import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { useAuth } from './context/AuthContext';
import { useCivic } from './context/CivicContext';

// Layouts
import { CitizenLayout } from './layouts/CitizenLayout';
import { OfficerLayout } from './layouts/OfficerLayout';
import { AdminLayout } from './layouts/AdminLayout';

// Landing Page
import { LoginPage } from './pages/LoginPage';

// Citizen Pages
import { CitizenHome } from './pages/citizen/CitizenHome';
import { ReportIssue } from './pages/citizen/ReportIssue';
import { MyComplaints } from './pages/citizen/MyComplaints';
import { ComplaintDetails } from './pages/citizen/ComplaintDetails';
import { MyFeedback } from './pages/citizen/MyFeedback';
import { CitizenProfile } from './pages/citizen/CitizenProfile';
import { HelpSupport } from './pages/citizen/HelpSupport';

// Officer Pages
import { OfficerHome } from './pages/officer/OfficerHome';
import { ComplaintManagement } from './pages/officer/ComplaintManagement';
import { ComplaintMap } from './pages/officer/ComplaintMap';
import { DuplicateDetection } from './pages/officer/DuplicateDetection';
import { WorkOrders } from './pages/officer/WorkOrders';
import { InventoryMaterials } from './pages/officer/InventoryMaterials';
import { RepairVerification } from './pages/officer/RepairVerification';
import { ReportsAnalytics } from './pages/officer/ReportsAnalytics';
import { OfficerNotifications } from './pages/officer/OfficerNotifications';
import { AuditHistory } from './pages/officer/AuditHistory';
import { OfficerProfile } from './pages/officer/OfficerProfile';

// Admin Pages (Member 4)
import { AdminHome } from './pages/admin/AdminHome';
import { UserManagement } from './pages/admin/UserManagement';
import { DepartmentConfig } from './pages/admin/DepartmentConfig';

function roleHome(role) {
  if (role === 'CITIZEN') return '/citizen';
  if (role === 'OFFICER') return '/officer';
  if (role === 'ADMIN') return '/admin';
  if (role === 'SUPERVISOR') return '/field-officer-unavailable';
  return '/account-unavailable';
}

function ProtectedRoute({ roles, children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="min-h-screen grid place-items-center text-slate-600">Restoring your secure session…</div>;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (!roles.includes(user.role)) return <Navigate to={roleHome(user.role)} replace />;
  return children;
}

function HomeRoute() {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen grid place-items-center text-slate-600">Restoring your secure session…</div>;
  return <Navigate to={user ? roleHome(user.role) : '/login'} replace />;
}

function FieldOfficerNotice() {
  const { user, loading, logout } = useAuth();
  if (loading) return <div className="min-h-screen grid place-items-center">Restoring your secure session…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'SUPERVISOR') return <Navigate to={roleHome(user.role)} replace />;
  return (
    <main className="min-h-screen bg-civic-bg grid place-items-center p-6">
      <section className="max-w-lg w-full bg-white rounded-3xl border border-slate-200 shadow-xl p-8 text-center">
        <div className="mx-auto mb-5 w-14 h-14 rounded-2xl bg-blue-50 text-civic-blue grid place-items-center"><Shield className="w-7 h-7" /></div>
        <h1 className="text-2xl font-extrabold text-civic-text">Field Officer access is ready</h1>
        <p className="mt-3 text-slate-600">Hello {user.name}. Your account is authenticated, but the Field Officer dashboard is not available yet.</p>
        <button onClick={logout} className="mt-7 px-5 py-2.5 rounded-xl bg-civic-blue text-white font-semibold">Sign out</button>
      </section>
    </main>
  );
}

function AccountPortalNotice() {
  const { user, loading, logout } = useAuth();
  if (loading) return <div className="min-h-screen grid place-items-center">Restoring your secure session…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (['CITIZEN', 'OFFICER', 'ADMIN', 'SUPERVISOR'].includes(user.role)) return <Navigate to={roleHome(user.role)} replace />;
  return (
    <main className="min-h-screen bg-civic-bg grid place-items-center p-6">
      <section className="max-w-lg w-full bg-white rounded-3xl border border-slate-200 shadow-xl p-8 text-center">
        <h1 className="text-2xl font-extrabold text-civic-text">Portal not available</h1>
        <p className="mt-3 text-slate-600">Your {user.role} account is authenticated, but this project does not include a dashboard for that role.</p>
        <button onClick={logout} className="mt-7 px-5 py-2.5 rounded-xl bg-civic-blue text-white font-semibold">Sign out</button>
      </section>
    </main>
  );
}

export default function App() {
  const { user } = useAuth();
  const { setCurrentRole, setCitizenProfile, setOfficerProfile } = useCivic();
  useEffect(() => {
    if (!user) return;
    const role = user.role === 'CITIZEN' ? 'citizen' : user.role === 'ADMIN' ? 'admin' : 'officer';
    setCurrentRole(role);
    if (user.role === 'CITIZEN') {
      setCitizenProfile((previous) => ({
        ...previous,
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone || 'Not provided',
        ward: user.ward || 'Not assigned',
        address: user.address || 'Not provided',
        joinedDate: user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—',
        avatarUrl: user.avatarUrl || '',
      }));
    } else if (user.role === 'OFFICER') {
      setOfficerProfile((previous) => ({
        ...previous,
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone || 'Not provided',
        title: user.title || 'Municipal Officer',
        department: user.department?.name || 'Not assigned',
        wardCoverage: user.wardCoverage || user.ward || 'Not assigned',
        avatarUrl: user.avatarUrl || '',
      }));
    }
  }, [user?.role]);

  return (
    <Routes>
      <Route path="/" element={<HomeRoute />} />
      <Route path="/login" element={<LoginPage initialMode="login" />} />
      <Route path="/signup" element={<LoginPage initialMode="signup" />} />
      <Route path="/field-officer-unavailable" element={<FieldOfficerNotice />} />
      <Route path="/account-unavailable" element={<AccountPortalNotice />} />
      {/* Citizen / Customer Portal Routes */}
      <Route path="/citizen" element={<ProtectedRoute roles={['CITIZEN']}><CitizenLayout pageTitle="Citizen Dashboard" /></ProtectedRoute>}>
        <Route index element={<CitizenHome />} />
        <Route path="report" element={<ReportIssue />} />
        <Route path="complaints" element={<MyComplaints />} />
        <Route path="complaints/:id" element={<ComplaintDetails />} />
        <Route path="feedback" element={<MyFeedback />} />
        <Route path="profile" element={<CitizenProfile />} />
        <Route path="help" element={<HelpSupport />} />
      </Route>

      {/* Municipal Officer Portal Routes */}
      <Route path="/officer" element={<ProtectedRoute roles={['OFFICER']}><OfficerLayout pageTitle="Municipal Operations Command" /></ProtectedRoute>}>
        <Route index element={<OfficerHome />} />
        <Route path="complaints" element={<ComplaintManagement />} />
        <Route path="map" element={<ComplaintMap />} />
        <Route path="duplicates" element={<DuplicateDetection />} />
        <Route path="work-orders" element={<WorkOrders />} />
        <Route path="inventory" element={<InventoryMaterials />} />
        <Route path="verifications" element={<RepairVerification />} />
        <Route path="analytics" element={<ReportsAnalytics />} />
        <Route path="notifications" element={<OfficerNotifications />} />
        <Route path="audit" element={<AuditHistory />} />
        <Route path="profile" element={<OfficerProfile />} />
      </Route>

      {/* System Administrator Portal Routes (Member 4) */}
      <Route path="/admin" element={<ProtectedRoute roles={['ADMIN']}><AdminLayout pageTitle="System Administration & Master Config" /></ProtectedRoute>}>
        <Route index element={<AdminHome />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="departments" element={<DepartmentConfig />} />
        <Route path="audit" element={<AuditHistory />} />
      </Route>

      {/* Fallback route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
