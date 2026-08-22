import React, { useState } from 'react';
import { HRProvider, useHR } from './context/HRContext';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { DemoJudgeToolbar } from './components/common/DemoJudgeToolbar';
import { NotificationDrawer } from './components/common/NotificationDrawer';
import { ToastContainer } from './components/common/ToastContainer';
import { AuthModal } from './components/auth/AuthModal';
import { LoginPage } from './components/auth/LoginPage';
import { AuditLogsDrawer } from './components/common/AuditLogsDrawer';

import { EmployeeDashboard } from './components/dashboard/EmployeeDashboard';
import { AdminDashboard } from './components/dashboard/AdminDashboard';
import { EmployeeDirectory } from './components/employees/EmployeeDirectory';
import { EmployeeProfileModal } from './components/employees/EmployeeProfileModal';
import { AddEmployeeModal } from './components/employees/AddEmployeeModal';
import { AttendanceView } from './components/attendance/AttendanceView';
import { LeaveManagement } from './components/leaves/LeaveManagement';
import { PayrollView } from './components/payroll/PayrollView';
import { AnalyticsView } from './components/analytics/AnalyticsView';

const MainLayout: React.FC = () => {
  const { activeTab, currentRole, isNotificationOpen, setIsNotificationOpen, currentUser } = useHR();
  const [isAddEmployeeOpen, setIsAddEmployeeOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // If user is not authenticated / logged out, redirect completely to the Login Page
  if (!currentUser) {
    return (
      <>
        <LoginPage />
        <AuditLogsDrawer />
        <ToastContainer />
      </>
    );
  }

  // Render active view based on tab selection
  const renderActiveView = () => {
    switch (activeTab) {
      case 'admin':
        if (currentRole === 'admin') {
          return <AdminDashboard isDedicatedAdminRoute={true} onOpenAddEmployee={() => setIsAddEmployeeOpen(true)} />;
        }
        return (
          <div className="max-w-xl mx-auto my-12 p-8 bg-white rounded-3xl border border-slate-200 shadow-xl text-center space-y-4">
            <div className="w-14 h-14 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-center mx-auto text-rose-600">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-slate-900 font-display">Administrator Access Restricted</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              The <code>/admin</code> console and user provisioning portal is restricted to authorized System Administrators. You are currently logged in as a standard employee.
            </p>
            <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-200/80 text-left space-y-1.5">
              <div className="text-xs font-bold text-purple-900">Administrator Account Required:</div>
              <div className="text-xs text-purple-800 font-mono">Email: sarveshv6413@gmail.com</div>
              <div className="text-xs text-purple-800 font-mono">Password: SarvesH@07</div>
            </div>
          </div>
        );
      case 'dashboard':
        return currentRole === 'admin' ? (
          <AdminDashboard onOpenAddEmployee={() => setIsAddEmployeeOpen(true)} />
        ) : (
          <EmployeeDashboard />
        );
      case 'employees':
        return <EmployeeDirectory onOpenAddEmployee={() => setIsAddEmployeeOpen(true)} />;
      case 'attendance':
        return <AttendanceView />;
      case 'leaves':
        return <LeaveManagement />;
      case 'payroll':
        return <PayrollView />;
      case 'analytics':
        return <AnalyticsView />;
      default:
        return currentRole === 'admin' ? (
          <AdminDashboard onOpenAddEmployee={() => setIsAddEmployeeOpen(true)} />
        ) : (
          <EmployeeDashboard />
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50 text-slate-900 font-sans selection:bg-purple-500 selection:text-white">
      
      {/* Hackathon Judge Toolbar */}
      <DemoJudgeToolbar />

      {/* Main Header */}
      <Header onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)} />

      {/* App Workspace Body */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Responsive Desktop & Mobile Sidebar */}
        <Sidebar
          isOpenMobile={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        {/* Dynamic Main Workspace Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {renderActiveView()}
        </main>
      </div>

      {/* Global Drawers & Modals */}
      <NotificationDrawer
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
      />

      <AuditLogsDrawer />

      <EmployeeProfileModal />

      <AddEmployeeModal
        isOpen={isAddEmployeeOpen}
        onClose={() => setIsAddEmployeeOpen(false)}
      />

      <AuthModal />

      {/* Global Toast Feedback Engine */}
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <HRProvider>
      <MainLayout />
    </HRProvider>
  );
}
