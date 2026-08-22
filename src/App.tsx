import React, { useState } from 'react';
import { HRProvider, useHR } from './context/HRContext';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { DemoJudgeToolbar } from './components/common/DemoJudgeToolbar';
import { NotificationDrawer } from './components/common/NotificationDrawer';
import { ToastContainer } from './components/common/ToastContainer';
import { AuthModal } from './components/auth/AuthModal';

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
  const { activeTab, currentRole, isNotificationOpen, setIsNotificationOpen } = useHR();
  const [isAddEmployeeOpen, setIsAddEmployeeOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Render active view based on tab selection
  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return currentRole === 'admin' ? <AdminDashboard /> : <EmployeeDashboard />;
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
        return currentRole === 'admin' ? <AdminDashboard /> : <EmployeeDashboard />;
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
