import React, { useState, useEffect } from 'react';
import { MOCK_EMPLOYEES, MOCK_CLIENTS, MOCK_ASSIGNMENTS } from './constants';
import { Employee, AppState, Assignment, AssignmentStatus, Client } from './types';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import EmployeeList from './components/EmployeeList';
import EmployeeModal from './components/EmployeeModal';
import AiInsights from './components/AiInsights';
import Assignments from './components/Assignments';
import AssignmentModal from './components/AssignmentModal';
import ClientManagement from './components/ClientManagement';
import ClientDetail from './components/ClientDetail';
import ClientModal from './components/ClientModal';
import LoginModal, { BASE_DEFAULT_PASSWORD, ADMIN_DEFAULT_PASSWORD } from './components/LoginModal';
import ConfirmModal from './components/ConfirmModal';
import EmployeeDetailModal from './components/EmployeeDetailModal';
import LeaveManagement from './components/LeaveManagement';
import { GoogleCalendarButton } from './components/GoogleCalendarButton';
import { getDueTasks } from './components/DueNotificationsBanner';
import { Plus, Search as SearchIcon, X, Sparkles, RefreshCw, UserCheck, LogOut, KeyRound, Sun, Moon, Menu } from 'lucide-react';
import { generateEventCreativeBrief } from './services/geminiService';
import ExpenseTracker from './components/ExpenseTracker';
import NotificationCenter from './components/NotificationCenter';
import DailyCalendarTracker from './components/DailyCalendarTracker';
import MonthlyPayrollHistory from './components/MonthlyPayrollHistory';
import { 
  testFirestoreConnection,
  seedInitialFirestoreData,
  subscribeClients,
  subscribeAssignments,
  subscribeEmployees,
  subscribeLeaveRequests,
  subscribeLeavePolicy,
  subscribeExpenses,
  saveExpenseToFirestore,
  deleteExpenseFromFirestore,
  subscribeNotifications,
  saveNotificationToFirestore,
  deleteNotificationFromFirestore,
  saveClientToFirestore,
  deleteClientFromFirestore,
  saveAssignmentToFirestore,
  deleteAssignmentFromFirestore,
  saveEmployeeToFirestore,
  deleteEmployeeFromFirestore,
  saveLeaveRequestToFirestore,
  deleteLeaveRequestFromFirestore,
  saveLeavePolicyToFirestore,
  DEFAULT_LEAVE_POLICY
} from './services/firestoreService';
import { 
  subscribeAuthUser, 
  logoutUser, 
  matchOrCreateEmployeeFromGoogleUser 
} from './services/firebaseAuthService';

const LOCAL_STORAGE_KEY = 'convex_hr_employees';
const ASSIGNMENTS_KEY = 'convex_hr_assignments';
const CLIENTS_KEY = 'convex_hr_clients';
const DISMISSED_NOTIFS_KEY = 'convex_hr_dismissed_notifications';
const CURRENT_ROLE_KEY = 'convex_hr_current_role';
const LOGGED_IN_KEY = 'convex_hr_is_logged_in';

const App: React.FC = () => {
  // Initialize states from localStorage or defaults
  const [employees, setEmployees] = useState<Employee[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      const parsed: Employee[] = JSON.parse(saved);
      // Ensure all employees have default base password
      return parsed.map(emp => ({ ...emp, password: emp.password || BASE_DEFAULT_PASSWORD }));
    }
    return MOCK_EMPLOYEES.map(emp => ({ ...emp, password: BASE_DEFAULT_PASSWORD }));
  });

  const [assignments, setAssignments] = useState<Assignment[]>(() => {
    const saved = localStorage.getItem(ASSIGNMENTS_KEY);
    return saved ? JSON.parse(saved) : MOCK_ASSIGNMENTS;
  });

  const [clients, setClients] = useState<Client[]>(() => {
    const saved = localStorage.getItem(CLIENTS_KEY);
    return saved ? JSON.parse(saved) : MOCK_CLIENTS;
  });

  const [dismissedNotifications, setDismissedNotifications] = useState<string[]>(() => {
    const saved = localStorage.getItem(DISMISSED_NOTIFS_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  const [currentRoleId, setCurrentRoleId] = useState<string>(() => {
    const saved = localStorage.getItem(CURRENT_ROLE_KEY);
    return saved || 'admin';
  });

  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);

  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [assignmentModalClientId, setAssignmentModalClientId] = useState<string | null>(null);
  const [assignmentModalEventId, setAssignmentModalEventId] = useState<string | null>(null);

  const [state, setState] = useState<Omit<AppState, 'employees' | 'assignments' | 'clients'>>({
    selectedEmployee: null,
    selectedAssignment: null,
    selectedClient: null,
    isModalOpen: false,
    isAssignmentModalOpen: false,
    isClientModalOpen: false,
    view: 'dashboard'
  });

  const [aiBrief, setAiBrief] = useState<{ clientName: string, text: string } | null>(null);
  const [loadingBrief, setLoadingBrief] = useState(false);

  // Global Confirmation Dialog State
  const [confirmModalConfig, setConfirmModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    type?: 'danger' | 'warning' | 'archive';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  // Employee Detail Modal State
  const [viewingEmployee, setViewingEmployee] = useState<Employee | null>(null);
  const [isEmployeeDetailOpen, setIsEmployeeDetailOpen] = useState(false);

  // Leave Management State
  const [leaveRequests, setLeaveRequests] = useState<import('./types').LeaveRequest[]>([]);
  const [leavePolicy, setLeavePolicy] = useState<import('./types').LeavePolicyConfig>(DEFAULT_LEAVE_POLICY);

  // Theme & Mobile Responsiveness State
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('convex_theme') as 'light' | 'dark') || 'light';
  });
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('convex_theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  // Expenses & System Notifications State
  const [expenses, setExpenses] = useState<import('./types').TaskExpense[]>([]);
  const [systemNotifications, setSystemNotifications] = useState<import('./types').SystemNotification[]>([]);

  // Sync persistence & Firestore Subscriptions
  useEffect(() => {
    testFirestoreConnection();
    const formattedEmployees = MOCK_EMPLOYEES.map(emp => ({ ...emp, password: BASE_DEFAULT_PASSWORD }));
    seedInitialFirestoreData(MOCK_CLIENTS, MOCK_ASSIGNMENTS, formattedEmployees);

    const unsubClients = subscribeClients(firestoreClients => {
      setClients(firestoreClients);
    });

    const unsubAssignments = subscribeAssignments(firestoreAssignments => {
      setAssignments(firestoreAssignments);
    });

    const unsubEmployees = subscribeEmployees(firestoreEmployees => {
      if (firestoreEmployees.length > 0) {
        const namesToRemove = ['arjun mehta', 'sarah khan', 'vikram singh', 'priya sharma', 'sarah jenkins', 'vikram verma'];

        // Purge from Firestore DB
        firestoreEmployees.forEach(emp => {
          if (namesToRemove.includes(emp.name.toLowerCase().trim()) || ['1', '2', '3', '4'].includes(emp.id)) {
            deleteEmployeeFromFirestore(emp.id);
          }
        });

        const activeList = firestoreEmployees.filter(emp => 
          !namesToRemove.includes(emp.name.toLowerCase().trim()) && !['1', '2', '3', '4'].includes(emp.id)
        );

        const sanitized = activeList.map(emp => {
          let dept: Department = emp.department;
          if ((dept as string) === 'Production' || (dept as string) === 'Photography & Editing' || (dept as string) === 'Studio Operations Crew') {
            dept = 'Video Editor';
          } else if ((dept as string) === 'Post-Production') {
            dept = 'Photo Editor';
          } else if ((dept as string) === 'Creative' || (dept as string) === 'Marketing') {
            dept = 'Creative Designer';
          } else if ((dept as string) === 'Finance') {
            dept = 'Executive Board';
          }
          return { ...emp, department: dept };
        });

        setEmployees(sanitized);
      }
    });

    const unsubLeaveRequests = subscribeLeaveRequests(requests => {
      setLeaveRequests(requests);
    });

    const unsubLeavePolicy = subscribeLeavePolicy(policy => {
      setLeavePolicy(policy);
    });

    const unsubExpenses = subscribeExpenses(fetchedExpenses => {
      setExpenses(fetchedExpenses);
    });

    const unsubNotifications = subscribeNotifications(fetchedNotifs => {
      setSystemNotifications(fetchedNotifs);
    });

    const unsubAuth = subscribeAuthUser((authUser) => {
      if (authUser) {
        const { roleId } = matchOrCreateEmployeeFromGoogleUser(authUser, employees);
        setCurrentRoleId(roleId);
        setIsLoggedIn(true);
      }
    });

    return () => {
      unsubClients();
      unsubAssignments();
      unsubEmployees();
      unsubLeaveRequests();
      unsubLeavePolicy();
      unsubExpenses();
      unsubNotifications();
      unsubAuth();
    };
  }, []);

  useEffect(() => localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(employees)), [employees]);
  useEffect(() => localStorage.setItem(ASSIGNMENTS_KEY, JSON.stringify(assignments)), [assignments]);
  useEffect(() => localStorage.setItem(CLIENTS_KEY, JSON.stringify(clients)), [clients]);
  useEffect(() => localStorage.setItem(DISMISSED_NOTIFS_KEY, JSON.stringify(dismissedNotifications)), [dismissedNotifications]);
  useEffect(() => localStorage.setItem(CURRENT_ROLE_KEY, currentRoleId), [currentRoleId]);
  useEffect(() => localStorage.setItem(LOGGED_IN_KEY, JSON.stringify(isLoggedIn)), [isLoggedIn]);

  const currentLoggedInEmp = currentRoleId !== 'admin' ? employees.find(e => e.id === currentRoleId) : null;
  const isCurrentAdmin = currentRoleId === 'admin' || currentLoggedInEmp?.accessLevel === 'admin';

  // Restrict access to Directory and Expenses for non-admin employees (Clients tab is accessible to all)
  useEffect(() => {
    if (!isCurrentAdmin && (state.view === 'directory' || state.view === 'expenses')) {
      setState(prev => ({ ...prev, view: 'dashboard' }));
    }
  }, [currentRoleId, isCurrentAdmin, state.view]);

  const handleSetView = (view: AppState['view']) => {
    if (!isCurrentAdmin && (view === 'directory' || view === 'expenses')) {
      return;
    }
    setState(prev => ({ ...prev, view }));
    if (view !== 'clients') {
      setSelectedClientId(null);
    }
  };

  const handleSelectClient = (clientId: string) => {
    setSelectedClientId(clientId);
    setState(prev => ({ ...prev, view: 'clients' }));
  };

  const handleBackToClientList = () => {
    setSelectedClientId(null);
  };

  const handleLogout = () => {
    logoutUser();
    setIsLoggedIn(false);
    setIsLoginModalOpen(true);
  };

  const handleLoginSuccess = (roleId: string) => {
    setCurrentRoleId(roleId);
    setIsLoggedIn(true);
    setIsLoginModalOpen(false);
  };

  const handleDismissNotification = (id: string) => {
    setDismissedNotifications(prev => prev.includes(id) ? prev : [...prev, id]);
  };

  const handleDismissAllNotifications = () => {
    const activeDue = getDueTasks(assignments, clients, employees, []);
    const activeIds = activeDue.map(item => item.task.id);
    setDismissedNotifications(prev => Array.from(new Set([...prev, ...activeIds])));
  };

  const handleOpenEmployeeModal = (employee: Employee | null = null) => {
    setState(prev => ({ ...prev, selectedEmployee: employee, isModalOpen: true }));
  };

  const handleOpenAssignmentModal = (assignment: Assignment | null = null) => {
    setAssignmentModalClientId(assignment?.clientId || null);
    setAssignmentModalEventId(assignment?.eventId || null);
    setState(prev => ({ ...prev, selectedAssignment: assignment, isAssignmentModalOpen: true }));
  };

  const handleAssignWorkForClient = (client: Client, eventId?: string) => {
    setAssignmentModalClientId(client.id);
    setAssignmentModalEventId(eventId || null);
    setState(prev => ({ ...prev, selectedAssignment: null, isAssignmentModalOpen: true }));
  };

  const handleOpenClientModal = (client: Client | null = null) => {
    setState(prev => ({ ...prev, selectedClient: client, isClientModalOpen: true }));
  };

  const handleSubmitEmployee = (data: Partial<Employee>) => {
    if (state.selectedEmployee) {
      const updated = { ...state.selectedEmployee, ...data } as Employee;
      setEmployees(prev => prev.map(e => e.id === state.selectedEmployee?.id ? updated : e));
      saveEmployeeToFirestore(updated);
      setState(prev => ({ ...prev, isModalOpen: false, selectedEmployee: null }));
    } else {
      const newEmployee = { 
        ...data, 
        id: Math.random().toString(36).substr(2, 9), 
        dateJoined: new Date().toISOString().split('T')[0],
        password: data.password || BASE_DEFAULT_PASSWORD 
      } as Employee;
      setEmployees(prev => [newEmployee, ...prev]);
      saveEmployeeToFirestore(newEmployee);
      setState(prev => ({ ...prev, isModalOpen: false }));
    }
  };

  const handleSubmitAssignment = (data: Partial<Assignment>) => {
    const isAssigningToOther = !isCurrentAdmin && data.assigneeId && data.assigneeId !== currentRoleId;
    const assignedEmp = employees.find(e => e.id === data.assigneeId);

    if (state.selectedAssignment) {
      const updated = { ...state.selectedAssignment, ...data } as Assignment;
      setAssignments(prev => prev.map(a => a.id === state.selectedAssignment?.id ? updated : a));
      saveAssignmentToFirestore(updated);

      if (isAssigningToOther) {
        saveNotificationToFirestore({
          id: Math.random().toString(36).substr(2, 9),
          type: 'assign_request',
          title: 'Task Re-assignment Approval Needed',
          message: `${currentLoggedInEmp?.name || 'Staff'} requested to re-assign task "${updated.title}" to ${assignedEmp?.name || 'another staff member'}.`,
          targetId: updated.id,
          targetType: 'assignment',
          requestedBy: {
            id: currentLoggedInEmp?.id || 'emp',
            name: currentLoggedInEmp?.name || 'Employee',
            role: currentLoggedInEmp?.role || 'Staff'
          },
          createdAt: new Date().toISOString(),
          status: 'pending'
        });
        alert(`⏳ Task re-assignment submitted for Admin Approval! An admin must approve assigning "${updated.title}" to ${assignedEmp?.name || 'this employee'}.`);
      }

      setState(prev => ({ ...prev, isAssignmentModalOpen: false, selectedAssignment: null }));
    } else {
      const newTask = { 
        ...data, 
        id: Math.random().toString(36).substr(2, 9), 
        createdAt: new Date().toISOString(),
        approvalStatus: isAssigningToOther ? 'pending' : 'approved'
      } as Assignment;

      setAssignments(prev => [newTask, ...prev]);
      saveAssignmentToFirestore(newTask);

      if (isAssigningToOther) {
        saveNotificationToFirestore({
          id: Math.random().toString(36).substr(2, 9),
          type: 'assign_request',
          title: 'Task Assignment Approval Request',
          message: `${currentLoggedInEmp?.name || 'Staff'} requested to assign task "${newTask.title}" to ${assignedEmp?.name || 'another staff member'}.`,
          targetId: newTask.id,
          targetType: 'assignment',
          requestedBy: {
            id: currentLoggedInEmp?.id || 'emp',
            name: currentLoggedInEmp?.name || 'Employee',
            role: currentLoggedInEmp?.role || 'Staff'
          },
          createdAt: new Date().toISOString(),
          status: 'pending'
        });
        alert(`⏳ Task assignment submitted for Admin Approval! An admin must approve assigning "${newTask.title}" to ${assignedEmp?.name || 'this employee'}.`);
      }

      setState(prev => ({ ...prev, isAssignmentModalOpen: false }));
    }
    setAssignmentModalClientId(null);
    setAssignmentModalEventId(null);
  };

  const handleSubmitClient = (data: Partial<Client>) => {
    if (state.selectedClient) {
      const updated = { ...state.selectedClient, ...data } as Client;
      setClients(prev => prev.map(c => c.id === state.selectedClient?.id ? updated : c));
      saveClientToFirestore(updated);
      setState(prev => ({ ...prev, isClientModalOpen: false, selectedClient: null }));
    } else {
      const newClient = { ...data, id: Math.random().toString(36).substr(2, 9) } as Client;
      setClients(prev => [newClient, ...prev]);
      saveClientToFirestore(newClient);
      setState(prev => ({ ...prev, isClientModalOpen: false }));
    }
  };

  const handleUpdateAssignmentStatus = (id: string, status: AssignmentStatus) => {
    setAssignments(prev => prev.map(a => {
      if (a.id === id) {
        const updated = { ...a, status };
        saveAssignmentToFirestore(updated);
        return updated;
      }
      return a;
    }));
  };

  const handleToggleSubtask = (taskId: string, subtaskId: string) => {
    setAssignments(prev => prev.map(a => {
      if (a.id !== taskId) return a;
      const subtasks = a.subtasks || [];
      const updatedSubtasks = subtasks.map(st => st.id === subtaskId ? { ...st, completed: !st.completed } : st);
      const allCompleted = updatedSubtasks.length > 0 && updatedSubtasks.every(st => st.completed);
      const updated = {
        ...a,
        subtasks: updatedSubtasks,
        status: allCompleted ? 'Done' : a.status
      };
      saveAssignmentToFirestore(updated);
      return updated;
    }));
  };

  const handleDeleteAssignment = (id: string) => {
    setAssignments(prev => prev.filter(a => a.id !== id));
    deleteAssignmentFromFirestore(id);
  };

  const requestDeleteAssignment = (id: string) => {
    const taskObj = assignments.find(a => a.id === id);
    setConfirmModalConfig({
      isOpen: true,
      title: 'Delete Work Task',
      message: `Are you sure you want to delete task "${taskObj?.title || 'Selected Task'}"?`,
      confirmText: 'Delete Task',
      type: 'danger',
      onConfirm: () => handleDeleteAssignment(id)
    });
  };

  const handleDeleteClient = (id: string) => {
    setClients(prev => prev.filter(c => c.id !== id));
    deleteClientFromFirestore(id);
    
    // Cleanup associated tasks for this deleted client
    setAssignments(prev => {
      const toKeep = prev.filter(a => a.clientId !== id);
      const toRemove = prev.filter(a => a.clientId === id);
      toRemove.forEach(a => deleteAssignmentFromFirestore(a.id));
      return toKeep;
    });

    if (selectedClientId === id) {
      setSelectedClientId(null);
    }
  };

  const requestDeleteClient = (id: string) => {
    const clientObj = clients.find(c => c.id === id);
    setConfirmModalConfig({
      isOpen: true,
      title: 'Delete Client Profile',
      message: `Are you sure you want to delete "${clientObj?.name || 'this client'}"? All associated shoot functions and assigned tasks will also be deleted.`,
      confirmText: 'Delete Client',
      type: 'danger',
      onConfirm: () => handleDeleteClient(id)
    });
  };

  const requestArchiveEmployee = (id: string) => {
    const empObj = employees.find(e => e.id === id);
    setConfirmModalConfig({
      isOpen: true,
      title: 'Archive Employee Profile',
      message: `Are you sure you want to archive "${empObj?.name || 'this employee'}"? They will be moved to the Archived Staff tab and can be reactivated anytime with all work history intact.`,
      confirmText: 'Archive Employee',
      type: 'archive',
      onConfirm: () => handleArchiveEmployee(id)
    });
  };

  const handleArchiveEmployee = (id: string) => {
    setEmployees(prev => prev.map(e => {
      if (e.id === id) {
        const updated = { ...e, status: 'Terminated' as const };
        saveEmployeeToFirestore(updated);
        return updated;
      }
      return e;
    }));
  };

  const handleReactivateEmployee = (id: string) => {
    setEmployees(prev => prev.map(e => {
      if (e.id === id) {
        const updated = { ...e, status: 'Active' as const };
        saveEmployeeToFirestore(updated);
        return updated;
      }
      return e;
    }));
  };

  const handleViewEmployee = (emp: Employee) => {
    setViewingEmployee(emp);
    setIsEmployeeDetailOpen(true);
  };

  const handleDeleteEmployee = (id: string) => {
    requestArchiveEmployee(id);
  };

  const handleUpdateEmployeeAccessLevel = (employeeId: string, newAccess: 'admin' | 'employee') => {
    setEmployees(prev => prev.map(e => {
      if (e.id === employeeId) {
        const updated = { ...e, accessLevel: newAccess };
        saveEmployeeToFirestore(updated);
        return updated;
      }
      return e;
    }));
  };

  const handleSaveLeaveRequest = (request: import('./types').LeaveRequest) => {
    setLeaveRequests(prev => {
      const exists = prev.some(r => r.id === request.id);
      return exists ? prev.map(r => r.id === request.id ? request : r) : [request, ...prev];
    });
    saveLeaveRequestToFirestore(request);

    // Sync employee status to 'On Leave' if approved and active today
    const todayStr = new Date().toISOString().split('T')[0];
    if (request.status === 'Approved' && todayStr >= request.startDate && todayStr <= request.endDate) {
      const targetEmp = employees.find(e => e.id === request.employeeId);
      if (targetEmp && targetEmp.status !== 'On Leave') {
        const updatedEmp = { ...targetEmp, status: 'On Leave' as const };
        setEmployees(prev => prev.map(e => e.id === targetEmp.id ? updatedEmp : e));
        saveEmployeeToFirestore(updatedEmp);
      }
    }
  };

  const handleDeleteLeaveRequest = (requestId: string) => {
    setLeaveRequests(prev => prev.filter(r => r.id !== requestId));
    deleteLeaveRequestFromFirestore(requestId);
  };

  const handleUpdateLeavePolicy = (policy: import('./types').LeavePolicyConfig) => {
    setLeavePolicy(policy);
    saveLeavePolicyToFirestore(policy);
  };

  const handleGenerateBrief = async (client: Client) => {
    setLoadingBrief(true);
    const text = await generateEventCreativeBrief(client);
    setAiBrief({ clientName: client.name, text });
    setLoadingBrief(false);
  };

  const activeClientObject = clients.find(c => c.id === selectedClientId);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col lg:flex-row relative transition-colors duration-200">
      {/* Mobile Top Navigation Bar */}
      <header className="lg:hidden bg-slate-900 dark:bg-slate-950 text-white p-4 flex items-center justify-between border-b border-slate-800 sticky top-0 z-30 shadow-md">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileNavOpen(true)}
            className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
          >
            <Menu size={22} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-black text-sm">
              C
            </div>
            <span className="font-black text-sm tracking-wider">CONVEX</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            {theme === 'dark' ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-indigo-300" />}
          </button>
          <NotificationCenter 
            notifications={systemNotifications}
            isAdmin={isCurrentAdmin}
            onApproveRequest={() => {}}
            onRejectRequest={() => {}}
          />
        </div>
      </header>

      <Sidebar 
        currentView={state.view} 
        onNavigate={(v) => { handleSetView(v); setIsMobileNavOpen(false); }} 
        currentRoleId={currentRoleId}
        employees={employees}
        onLogout={handleLogout}
        onSwitchProfile={() => setIsLoginModalOpen(true)}
        onEditMyProfile={() => {
          if (currentLoggedInEmp) {
            handleOpenEmployeeModal(currentLoggedInEmp);
          }
        }}
        theme={theme}
        onToggleTheme={toggleTheme}
        isMobileOpen={isMobileNavOpen}
        onCloseMobileMenu={() => setIsMobileNavOpen(false)}
      />
      
      <main className="flex-1 lg:ml-64 ml-0 min-w-0 p-3 sm:p-6 lg:p-8 min-h-screen overflow-x-hidden">
        {/* Desktop Top Header Bar */}
        <div className="hidden lg:flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                placeholder="Search studio resources..." 
                className="pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl w-64 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm text-slate-900 dark:text-slate-100"
              />
            </div>
            <GoogleCalendarButton />
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-600 dark:text-slate-300 hover:text-indigo-600 transition-colors shadow-2xs flex items-center gap-2 text-xs font-bold"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            >
              {theme === 'dark' ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} className="text-indigo-500" />}
              <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
            </button>
            {/* Real-time Admin Notification Center Bell */}
            <NotificationCenter 
              notifications={systemNotifications}
              isAdmin={isCurrentAdmin}
              onApproveRequest={(notif) => {
                if (notif.targetId && notif.type === 'edit_request') {
                  const targetTask = assignments.find(a => a.id === notif.targetId);
                  if (targetTask) handleOpenAssignmentModal(targetTask);
                } else if (notif.targetId && notif.type === 'delete_request') {
                  deleteAssignmentFromFirestore(notif.targetId);
                  setAssignments(prev => prev.filter(a => a.id !== notif.targetId));
                } else if (notif.targetId && notif.type === 'assign_request') {
                  const targetTask = assignments.find(a => a.id === notif.targetId);
                  if (targetTask) {
                    const approvedTask = { ...targetTask, approvalStatus: 'approved' };
                    setAssignments(prev => prev.map(a => a.id === targetTask.id ? approvedTask : a));
                    saveAssignmentToFirestore(approvedTask);
                  }
                }
                saveNotificationToFirestore({ ...notif, status: 'approved' });
              }}
              onRejectRequest={(notif) => {
                saveNotificationToFirestore({ ...notif, status: 'rejected' });
              }}
              onDismissNotif={(id) => {
                deleteNotificationFromFirestore(id);
              }}
              onClearAllNotifs={() => {
                systemNotifications.forEach(n => deleteNotificationFromFirestore(n.id));
                setSystemNotifications([]);
              }}
            />

            {state.view !== 'employees' && (
              <div className="flex items-center gap-2.5 flex-wrap">
                <button 
                  type="button"
                  onClick={() => {
                    setAssignmentModalClientId(null);
                    setAssignmentModalEventId(null);
                    handleOpenAssignmentModal();
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-500/20 text-xs shrink-0"
                >
                  <Plus size={15} />
                  <span>New Work</span>
                </button>

                {isCurrentAdmin && (
                  <button 
                    type="button"
                    onClick={() => handleOpenClientModal()}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all shadow-md text-xs shrink-0"
                  >
                    <Plus size={15} />
                    <span>New Client</span>
                  </button>
                )}

                {isCurrentAdmin && (
                  <button 
                    type="button"
                    onClick={() => handleOpenEmployeeModal(null)}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold rounded-xl transition-all text-xs shrink-0"
                  >
                    <Plus size={15} />
                    <span>New Employee</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Main Content View Switcher */}
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
          {state.view === 'dashboard' && (
            <Dashboard 
              employees={employees}
              assignments={assignments}
              clients={clients}
              dismissedNotifications={dismissedNotifications}
              currentRoleId={currentRoleId}
              onRoleChange={setCurrentRoleId}
              onSwitchProfile={() => setIsLoginModalOpen(true)}
              onDismissNotification={handleDismissNotification}
              onDismissAllNotifications={handleDismissAllNotifications}
              onSelectClient={handleSelectClient}
              onUpdateStatus={handleUpdateAssignmentStatus}
              onToggleSubtask={handleToggleSubtask}
              onNavigateToTasks={() => handleSetView('assignments')}
              onNewTask={() => {
                setAssignmentModalClientId(null);
                setAssignmentModalEventId(null);
                handleOpenAssignmentModal();
              }}
              onNewClient={() => handleOpenClientModal()}
              onGenerateBrief={handleGenerateBrief}
            />
          )}

          {state.view === 'directory' && (
            <EmployeeList 
              employees={employees} 
              isAdmin={currentRoleId === 'admin' || employees.find(e => e.id === currentRoleId)?.accessLevel === 'admin'}
              onEdit={handleOpenEmployeeModal} 
              onDelete={requestArchiveEmployee}
              onReactivate={handleReactivateEmployee}
              onView={handleViewEmployee}
              onUpdateAccessLevel={handleUpdateEmployeeAccessLevel}
              onNewWork={() => {
                setAssignmentModalClientId(null);
                setAssignmentModalEventId(null);
                handleOpenAssignmentModal();
              }}
              onNewClient={() => handleOpenClientModal()}
            />
          )}

          {state.view === 'assignments' && (
            <Assignments 
              assignments={assignments} 
              employees={employees}
              clients={clients}
              expenses={expenses}
              dismissedNotifications={dismissedNotifications}
              currentRoleId={currentRoleId}
              onDismissNotification={handleDismissNotification}
              onDismissAllNotifications={handleDismissAllNotifications}
              onSelectClient={handleSelectClient}
              onEdit={handleOpenAssignmentModal}
              onUpdateStatus={handleUpdateAssignmentStatus}
              onToggleSubtask={handleToggleSubtask}
              onDelete={requestDeleteAssignment}
              onViewExpenses={isCurrentAdmin ? () => handleNavigate('expenses') : undefined}
              onNewTask={(clientId) => {
                if (clientId) {
                  const clientObj = clients.find(c => c.id === clientId);
                  if (clientObj) {
                    handleAssignWorkForClient(clientObj);
                    return;
                  }
                }
                setAssignmentModalClientId(null);
                setAssignmentModalEventId(null);
                handleOpenAssignmentModal();
              }}
            />
          )}

          {state.view === 'clients' && (
            activeClientObject ? (
              <ClientDetail 
                client={activeClientObject}
                allClients={clients}
                assignments={assignments}
                employees={employees}
                expenses={expenses}
                isAdmin={isCurrentAdmin}
                currentRoleId={currentRoleId}
                onSelectClient={handleSelectClient}
                onBack={handleBackToClientList}
                onEditClient={handleOpenClientModal}
                onUpdateClient={(updated) => {
                  setClients(prev => prev.map(c => c.id === updated.id ? updated : c));
                  saveClientToFirestore(updated);
                }}
                onAssignWork={handleAssignWorkForClient}
                onGenerateBrief={handleGenerateBrief}
                onUpdateAssignmentStatus={handleUpdateAssignmentStatus}
                onToggleSubtask={handleToggleSubtask}
                onDeleteAssignment={requestDeleteAssignment}
                onEditAssignment={handleOpenAssignmentModal}
                onDeleteClient={requestDeleteClient}
                onViewExpenses={isCurrentAdmin ? () => handleNavigate('expenses') : undefined}
              />
            ) : (
              <ClientManagement 
                clients={clients}
                assignments={assignments}
                onSelectClient={handleSelectClient}
                onAssignWork={handleAssignWorkForClient}
                onEdit={handleOpenClientModal}
                onDelete={requestDeleteClient}
                onGenerateBrief={handleGenerateBrief}
              />
            )
          )}

          {state.view === 'expenses' && (
            isCurrentAdmin ? (
              <ExpenseTracker 
                expenses={expenses}
                assignments={assignments}
                clients={clients}
                employees={employees}
                currentRoleId={currentRoleId}
                onSaveExpense={(exp) => {
                  saveExpenseToFirestore(exp);
                  saveNotificationToFirestore({
                    id: Math.random().toString(36).substr(2, 9),
                    type: 'expense_added',
                    title: 'New Work Expense Logged',
                    message: `${currentLoggedInEmp?.name || 'Staff'} logged an expense of ₹${exp.amount.toLocaleString()} for "${exp.title}".`,
                    targetId: exp.id,
                    targetType: 'expense',
                    requestedBy: {
                      id: currentLoggedInEmp?.id || 'emp',
                      name: currentLoggedInEmp?.name || 'Staff',
                      role: currentLoggedInEmp?.role || 'Staff'
                    },
                    createdAt: new Date().toISOString(),
                    status: 'pending'
                  });
                }}
                onDeleteExpense={(id) => {
                  deleteExpenseFromFirestore(id);
                }}
              />
            ) : (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm max-w-xl mx-auto my-12">
                <div className="w-16 h-16 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-center text-amber-600 mx-auto mb-4">
                  <Receipt size={32} />
                </div>
                <h2 className="text-xl font-extrabold text-slate-800">Access Restricted</h2>
                <p className="text-sm text-slate-500 mt-2 font-medium">Work Expenses management is confidential and restricted to System Admins only.</p>
              </div>
            )
          )}

          {state.view === 'leaves' && (
            <LeaveManagement 
              employees={employees}
              currentRoleId={currentRoleId}
              leaveRequests={leaveRequests}
              leavePolicy={leavePolicy}
              onSaveLeaveRequest={handleSaveLeaveRequest}
              onDeleteLeaveRequest={handleDeleteLeaveRequest}
              onUpdateLeavePolicy={handleUpdateLeavePolicy}
            />
          )}

          {state.view === 'calendar' && (
            <DailyCalendarTracker 
              clients={clients}
              assignments={assignments}
              employees={employees}
              onSelectClient={handleSelectClient}
              onNewTask={handleOpenAssignmentModal}
            />
          )}

          {state.view === 'payroll' && (
            <MonthlyPayrollHistory 
              employees={employees}
              assignments={assignments}
              expenses={expenses}
              clients={clients}
              isAdmin={isCurrentAdmin}
            />
          )}

          {state.view === 'ai-insights' && <AiInsights employees={employees} />}
        </div>
      </main>

      {/* Modals */}
      <EmployeeModal 
        isOpen={state.isModalOpen} 
        onClose={() => setState(prev => ({ ...prev, isModalOpen: false }))} 
        onSubmit={handleSubmitEmployee} 
        initialData={state.selectedEmployee} 
        isAdmin={isCurrentAdmin}
      />

      <AssignmentModal 
        isOpen={state.isAssignmentModalOpen} 
        onClose={() => setState(prev => ({ ...prev, isAssignmentModalOpen: false }))} 
        onSubmit={handleSubmitAssignment} 
        employees={employees} 
        clients={clients}
        initialData={state.selectedAssignment}
        initialClientId={assignmentModalClientId}
        initialEventId={assignmentModalEventId}
      />

      <ClientModal 
        isOpen={state.isClientModalOpen} 
        onClose={() => setState(prev => ({ ...prev, isClientModalOpen: false }))} 
        onSubmit={handleSubmitClient} 
        initialData={state.selectedClient} 
      />

      {/* Employee Detail & Work History Modal */}
      <EmployeeDetailModal
        employee={viewingEmployee}
        isOpen={isEmployeeDetailOpen}
        onClose={() => setIsEmployeeDetailOpen(false)}
        assignments={assignments}
        clients={clients}
        onSelectClient={(clientId) => {
          setIsEmployeeDetailOpen(false);
          handleSelectClient(clientId);
        }}
      />

      {/* Global Deletion/Archive Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModalConfig.isOpen}
        title={confirmModalConfig.title}
        message={confirmModalConfig.message}
        confirmText={confirmModalConfig.confirmText}
        type={confirmModalConfig.type}
        onConfirm={confirmModalConfig.onConfirm}
        onClose={() => setConfirmModalConfig(prev => ({ ...prev, isOpen: false }))}
      />

      {/* Profile Authentication & Login Modal */}

      <LoginModal 
        employees={employees}
        onLoginSuccess={handleLoginSuccess}
        isOpen={!isLoggedIn || isLoginModalOpen}
        onClose={() => {
          if (isLoggedIn) setIsLoginModalOpen(false);
        }}
      />

      {/* AI Brief Sidebar Overlay */}
      {aiBrief && (
        <div className="fixed inset-0 z-[60] flex justify-end">
          <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm" onClick={() => setAiBrief(null)} />
          <div className="relative w-full max-w-lg bg-white h-full shadow-2xl p-8 overflow-y-auto animate-in slide-in-from-right duration-300">
            <button onClick={() => setAiBrief(null)} className="absolute top-6 right-6 p-2 hover:bg-slate-100 rounded-full text-slate-400"><X size={20} /></button>
            <div className="flex items-center gap-3 mb-6 text-indigo-600">
              <Sparkles size={24} />
              <h2 className="text-xl font-bold">AI Creative Brief</h2>
            </div>
            <p className="text-sm font-bold text-slate-500 mb-2 uppercase tracking-widest">Client: {aiBrief.clientName}</p>
            <div className="prose prose-slate prose-sm max-w-none">
              <div dangerouslySetInnerHTML={{ __html: aiBrief.text.replace(/\n/g, '<br/>') }} className="text-slate-600 leading-relaxed" />
            </div>
          </div>
        </div>
      )}

      {loadingBrief && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-white/60 backdrop-blur-sm">
          <div className="text-center space-y-4 bg-white p-8 rounded-3xl shadow-xl border border-slate-100">
            <RefreshCw className="animate-spin text-indigo-600 mx-auto" size={40} />
            <p className="font-bold text-slate-800 text-lg">Gemini AI is generating the creative brief...</p>
            <p className="text-xs text-slate-500">Analyzing cultural themes, shot ideas, and function requirements.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
