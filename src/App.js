import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import { CitizenLayout } from './layouts/CitizenLayout';
import { OfficerLayout } from './layouts/OfficerLayout';

// Landing Page
import { LandingPage } from './pages/LandingPage';

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
// Admin Layout & Pages 
import { AdminLayout } from './layouts/AdminLayout';
import { AdminHome } from './pages/admin/AdminHome';
import { UserManagement } from './pages/admin/UserManagement';
import { DepartmentConfig } from './pages/admin/DepartmentConfig';

export default function App() {
  return (
    <Routes>
      {/* Landing / Role Selector */}
      <Route path="/" element={<LandingPage />} />

      {/* Citizen / Customer Portal Routes */}
      <Route path="/citizen" element={<CitizenLayout pageTitle="Citizen Dashboard" />}>
        <Route index element={<CitizenHome />} />
        <Route path="report" element={<ReportIssue />} />
        <Route path="complaints" element={<MyComplaints />} />
        <Route path="complaints/:id" element={<ComplaintDetails />} />
        <Route path="feedback" element={<MyFeedback />} />
        <Route path="profile" element={<CitizenProfile />} />
        <Route path="help" element={<HelpSupport />} />
      </Route>

      {/* Municipal Officer Portal Routes */}
      <Route path="/officer" element={<OfficerLayout pageTitle="Municipal Operations Command" />}>
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
      {/* System Administrator Portal Routes  */}
      <Route path="/admin" element={<AdminLayout pageTitle="System Administration" />}>
        <Route index element={<AdminHome />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="departments" element={<DepartmentConfig />} />
      </Route>

      {/* Fallback route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
