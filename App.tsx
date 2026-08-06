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
import { Plus, Search as SearchIcon, X, Sparkles, RefreshCw, UserCheck, LogOut, KeyRound } from 'lucide-react';
import { generateEventCreativeBrief } from './services/geminiService';
import { 
  testFirestoreConnection,
  seedInitialFirestoreData,
  subscribeClients,
  subscribeAssignments,
  subscribeEmployees,
  subscribeLeaveRequests,
  subscribeLeavePolicy,
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
      if (firestoreEmployees.length > 0) setEmployees(firestoreEmployees);
    });

    const unsubLeaveRequests = subscribeLeaveRequests(requests => {
      setLeaveRequests(requests);
    });

    const unsubLeavePolicy = subscribeLeavePolicy(policy => {
      setLeavePolicy(policy);
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
      unsubAuth();
    };
  }, []);

  useEffect(() => localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(employees)), [employees]);
  useEffect(() => localStorage.setItem(ASSIGNMENTS_KEY, JSON.stringify(assignments)), [assignments]);
  useEffect(() => localStorage.setItem(CLIENTS_KEY, JSON.stringify(clients)), [clients]);
  useEffect(() => localStorage.setItem(DISMISSED_NOTIFS_KEY, JSON.stringify(dismissedNotifications)), [dismissedNotifications]);
  useEffect(() => localStorage.setItem(CURRENT_ROLE_KEY, currentRoleId), [currentRoleId]);
  useEffect(() => localStorage.setItem(LOGGED_IN_KEY, JSON.stringify(isLoggedIn)), [isLoggedIn]);

  // Restrict access to Directory and Client CRM for non-admin employees
  useEffect(() => {
    if (currentRoleId !== 'admin' && (state.view === 'directory' || state.view === 'clients')) {
      setState(prev => ({ ...prev, view: 'dashboard' }));
    }
  }, [currentRoleId, state.view]);

  const handleSetView = (view: AppState['view']) => {
    if (currentRoleId !== 'admin' && (view === 'directory' || view === 'clients')) {
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
    if (state.selectedAssignment) {
      const updated = { ...state.selectedAssignment, ...data } as Assignment;
      setAssignments(prev => prev.map(a => a.id === state.selectedAssignment?.id ? updated : a));
      saveAssignmentToFirestore(updated);
      setState(prev => ({ ...prev, isAssignmentModalOpen: false, selectedAssignment: null }));
    } else {
      const newTask = { ...data, id: Math.random().toString(36).substr(2, 9), createdAt: new Date().toISOString() } as Assignment;
      setAssignments(prev => [newTask, ...prev]);
      saveAssignmentToFirestore(newTask);
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
      message: `Are you sure you want to delete "${clientObj?.name || 'this client'}"? All associated shoot events and assigned tasks will also be deleted.`,
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
  const currentLoggedInEmp = currentRoleId !== 'admin' ? employees.find(e => e.id === currentRoleId) : null;

  return (
    <div className="min-h-screen bg-slate-50 flex relative">
      <Sidebar 
        currentView={state.view} 
        setView={handleSetView} 
        currentRoleId={currentRoleId}
        employees={employees}
        onLogout={handleLogout}
        onSwitchProfile={() => setIsLoginModalOpen(true)}
      />
      
      <main className="flex-1 ml-64 p-8 overflow-y-auto">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                placeholder="Search studio resources..." 
                className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl w-64 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm"
              />
            </div>
            <GoogleCalendarButton />
          </div>

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

              {(!currentLoggedInEmp || currentRoleId === 'admin') && (
                <button 
                  type="button"
                  onClick={() => handleOpenClientModal()}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all shadow-md text-xs shrink-0"
                >
                  <Plus size={15} />
                  <span>New Client</span>
                </button>
              )}

              {(!currentLoggedInEmp || currentRoleId === 'admin') && (
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
              dismissedNotifications={dismissedNotifications}
              currentRoleId={currentRoleId}
              onDismissNotification={handleDismissNotification}
              onDismissAllNotifications={handleDismissAllNotifications}
              onSelectClient={handleSelectClient}
              onEdit={handleOpenAssignmentModal}
              onUpdateStatus={handleUpdateAssignmentStatus}
              onToggleSubtask={handleToggleSubtask}
              onDelete={requestDeleteAssignment}
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

          {state.view === 'ai-insights' && <AiInsights employees={employees} />}
        </div>
      </main>

      {/* Modals */}
      <EmployeeModal 
        isOpen={state.isModalOpen} 
        onClose={() => setState(prev => ({ ...prev, isModalOpen: false }))} 
        onSubmit={handleSubmitEmployee} 
        initialData={state.selectedEmployee} 
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
            <p className="text-xs text-slate-500">Analyzing cultural themes, shot ideas, and event requirements.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
