import React, { useState } from 'react';
import { HRProvider, useHR } from './context/HRContext';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { NotificationDrawer } from './components/common/NotificationDrawer';
import { ToastContainer } from './components/common/ToastContainer';
import { AuthModal } from './components/auth/AuthModal';
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
  const {
    activeTab,
    currentRole,
    isNotificationOpen,
    setIsNotificationOpen,
    currentUser,
    openAuthModal,
  } = useHR();

  const [isAddEmployeeOpen, setIsAddEmployeeOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return currentRole === 'admin'
          ? <AdminDashboard />
          : <EmployeeDashboard />;

      case 'employees':
        return (
          <EmployeeDirectory
            onOpenAddEmployee={() => setIsAddEmployeeOpen(true)}
          />
        );

      case 'attendance':
        return <AttendanceView />;

      case 'leaves':
        return <LeaveManagement />;

      case 'payroll':
        return <PayrollView />;

      case 'analytics':
        return <AnalyticsView />;

      default:
        return currentRole === 'admin'
          ? <AdminDashboard />
          : <EmployeeDashboard />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-purple-500 selection:text-white transition-colors duration-200">

      {/* Main Header */}
      <Header
        onToggleMobileSidebar={() =>
          setIsMobileSidebarOpen(!isMobileSidebarOpen)
        }
      />

      {/* App Workspace Body */}
      <div className="flex-1 flex overflow-hidden">

        {/* Responsive Desktop & Mobile Sidebar */}
        <Sidebar
          isOpenMobile={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        {/* Dynamic Main Workspace Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-50/50 dark:bg-slate-950 transition-colors">
          {currentUser ? (
            renderActiveView()
          ) : (
            <div className="max-w-md mx-auto my-16 text-center p-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 flex items-center justify-center mx-auto mb-4 font-bold text-lg">
                🔒
              </div>

              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">
                Signed Out
              </h2>

              <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
                Your session was securely terminated. Please sign in to access Dayflow HRMS.
              </p>

              <button
                onClick={() => openAuthModal('signin')}
                className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-medium text-xs transition-colors shadow-md shadow-purple-600/20 cursor-pointer"
              >
                Sign In With Database
              </button>
            </div>
          )}
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