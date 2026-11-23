import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { useCivic } from './context/CivicContext';

import { SupervisorHome } from './pages/supervisor/SupervisorHome';
import { AssignedWorkOrders } from './pages/supervisor/AssignedWorkOrders';
import { WorkerAssignments } from './pages/supervisor/WorkerAssignments';
import { RepairProgressTracking } from './pages/supervisor/RepairProgressTracking';
import { PhotoEvidence } from './pages/supervisor/PhotoEvidence';
import { MaterialInventory } from './pages/supervisor/MaterialInventory';
import { MaterialRequests } from './pages/supervisor/MaterialRequests';
import { ProgressReports } from './pages/supervisor/ProgressReports';
import { SupervisorNotifications } from './pages/supervisor/SupervisorNotifications';
import { SupervisorProfile } from './pages/supervisor/SupervisorProfile';

// Layouts
import { CitizenLayout } from './layouts/CitizenLayout';
import { OfficerLayout } from './layouts/OfficerLayout';
import { SupervisorLayout } from './layouts/SupervisorLayout';
import { AdminLayout } from './layouts/AdminLayout';

// Landing and Login Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';

// Citizen Pages (Member 1)
import { CitizenHome } from './pages/citizen/CitizenHome';
import { ReportIssue } from './pages/citizen/ReportIssue';
import { MyComplaints } from './pages/citizen/MyComplaints';
import { ComplaintDetails } from './pages/citizen/ComplaintDetails';
import { MyFeedback } from './pages/citizen/MyFeedback';
import { CitizenProfile } from './pages/citizen/CitizenProfile';
import { HelpSupport } from './pages/citizen/HelpSupport';

// Officer Pages (Member 2)
import { OfficerHome } from './pages/officer/OfficerHome';
import { ComplaintManagement } from './pages/officer/ComplaintManagement';
import { ComplaintMap } from './pages/officer/ComplaintMap';
import { DuplicateDetection } from './pages/officer/DuplicateDetection';
import { WorkOrders } from './pages/officer/WorkOrders';
import { SupervisorAssignments } from './pages/supervisor/SupervisorAssignments';
import { InventoryMaterials } from './pages/officer/InventoryMaterials';
import { RepairVerification } from './pages/officer/RepairVerification';
import { ReportsAnalytics } from './pages/officer/ReportsAnalytics';
import { OfficerNotifications } from './pages/officer/OfficerNotifications';
import { AuditHistory } from './pages/officer/AuditHistory';
import { OfficerProfile } from './pages/officer/OfficerProfile';
import { getMyComplaints, getOfficerComplaints, getNotifications } from './services/api';

// Admin Pages (Member 4)
import { AdminHome } from './pages/admin/AdminHome';
import { UserManagement } from './pages/admin/UserManagement';
import { DepartmentConfig } from './pages/admin/DepartmentConfig';
import { SystemAnalytics } from './pages/admin/SystemAnalytics';
import { AdminProfile } from './pages/admin/AdminProfile';

function roleHome(role) {
  if (role === 'CITIZEN') return '/citizen';
  if (role === 'OFFICER') return '/officer';
  if (role === 'ADMIN') return '/admin';
  if (role === 'SUPERVISOR') return '/supervisor';
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
  return user ? <Navigate to={roleHome(user.role)} replace /> : <LandingPage />;
}

function FieldOfficerNotice() {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen grid place-items-center">Restoring your secure session…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'SUPERVISOR') return <Navigate to="/supervisor" replace />;
  return <Navigate to={roleHome(user.role)} replace />;
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
  const {
    setCurrentRole,
    setCitizenProfile,
    setOfficerProfile,
    setSupervisorProfile,
    syncPersistedComplaints,
    syncPersistedNotifications } = useCivic();

  useEffect(() => {
    if (!user) {
      syncPersistedComplaints([]);
      syncPersistedNotifications([]);
      return;
    }
    let active = true;
    let complaintRefreshTimer;
    syncPersistedComplaints([]);
    syncPersistedNotifications([]);
    const role = user.role === 'CITIZEN' ? 'citizen' : user.role === 'ADMIN' ? 'admin' : user.role === 'SUPERVISOR' ? 'supervisor' : 'officer';
    setCurrentRole(role);
    const refreshNotifications = () => getNotifications().then((records) => { if (active) syncPersistedNotifications(records); }).catch(() => {});
    refreshNotifications();
    const notificationTimer = window.setInterval(refreshNotifications, 30000);
    if (user.role === 'CITIZEN') {
      const refreshComplaints = () => getMyComplaints().then((records) => { if (active) syncPersistedComplaints(records); }).catch(() => {});
      refreshComplaints();
      complaintRefreshTimer = window.setInterval(refreshComplaints, 30000);
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
      const refreshComplaints = () => getOfficerComplaints().then((result) => {
        if (active) syncPersistedComplaints(result?.complaints || []);
      }).catch(() => {});
      refreshComplaints();
      complaintRefreshTimer = window.setInterval(refreshComplaints, 30000);
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
    return () => {
      active = false;
      if (complaintRefreshTimer) window.clearInterval(complaintRefreshTimer);
      window.clearInterval(notificationTimer);
    };
  }, [user?.id, user?.role]);

  return (
    <Routes>
      {/* Landing / Login Routes */}
      <Route path="/" element={<HomeRoute />} />
      <Route path="/landing" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage initialMode="login" />} />
      <Route path="/signup" element={<LoginPage initialMode="signup" />} />
      <Route path="/field-officer-unavailable" element={<FieldOfficerNotice />} />
      <Route path="/account-unavailable" element={<AccountPortalNotice />} />

      {/* Citizen / Customer Portal Routes (Member 1) */}
      <Route
        path="/citizen"
        element={
          <ProtectedRoute roles={['CITIZEN']}>
            <CitizenLayout pageTitle="Citizen Dashboard" />
          </ProtectedRoute>
        }
      >
        <Route index element={<CitizenHome />} />
        <Route path="report" element={<ReportIssue />} />
        <Route path="complaints" element={<MyComplaints />} />
        <Route path="complaints/:id" element={<ComplaintDetails />} />
        <Route path="feedback" element={<MyFeedback />} />
        <Route path="profile" element={<CitizenProfile />} />
        <Route path="help" element={<HelpSupport />} />
      </Route>

      {/* Municipal Officer Portal Routes (Member 2) */}
      <Route
        path="/officer"
        element={
          <ProtectedRoute roles={['OFFICER']}>
            <OfficerLayout pageTitle="Municipal Operations Command" />
          </ProtectedRoute>
        }
      >
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

      {/* Field Supervisor Portal Routes (Member 3) */}
      <Route
        path="/supervisor"
        element={
          <ProtectedRoute roles={['SUPERVISOR']}>
            <SupervisorLayout pageTitle="Field Operations & Supervision" />
          </ProtectedRoute>
        }
      >
        <Route index element={<SupervisorHome />} />
        <Route path="field-assignments" element={<SupervisorAssignments />} />
        <Route path="officer-notifications" element={<OfficerNotifications />} />
        <Route path="work-orders" element={<AssignedWorkOrders />} />
        <Route path="worker-assignments" element={<WorkerAssignments />} />
        <Route path="repair-progress" element={<RepairProgressTracking />} />
        <Route path="photo-evidence" element={<PhotoEvidence />} />
        <Route path="material-inventory" element={<MaterialInventory />} />
        <Route path="material-requests" element={<MaterialRequests />} />
        <Route path="progress-reports" element={<ProgressReports />} />
        <Route path="notifications" element={<SupervisorNotifications />} />
        <Route path="profile" element={<SupervisorProfile />} />
      </Route>

      {/* System Administrator Portal Routes (Member 4) */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute roles={['ADMIN']}>
            <AdminLayout pageTitle="Admin Dashboard" />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminHome />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="departments" element={<DepartmentConfig />} />
        <Route path="analytics" element={<SystemAnalytics />} />
        <Route path="audit" element={<AuditHistory />} />
        <Route path="profile" element={<AdminProfile />} />
      </Route>

      {/* Fallback route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}


