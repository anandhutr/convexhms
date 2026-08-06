import React, { useMemo, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell 
} from 'recharts';
import { Employee, Assignment, Client, AssignmentStatus, ClientEvent } from '../types';
import { 
  Users, Award, AlertTriangle, 
  Clock, CheckCircle2, Calendar, Contact2, ArrowRight, X, ExternalLink,
  Briefcase, Shield, UserCheck, Sparkles, Plus, Check, Star, Video, Layers, MapPin, Camera
} from 'lucide-react';
import { getDueTasks } from './DueNotificationsBanner';
import TaskProgressBar from './TaskProgressBar';

interface DashboardProps {
  employees: Employee[];
  assignments?: Assignment[];
  clients?: Client[];
  dismissedNotifications?: string[];
  currentRoleId?: string;
  onRoleChange?: (roleId: string) => void;
  onSwitchProfile?: () => void;
  onDismissNotification?: (id: string) => void;
  onDismissAllNotifications?: () => void;
  onSelectClient?: (clientId: string) => void;
  onUpdateStatus?: (id: string, status: AssignmentStatus) => void;
  onToggleSubtask?: (taskId: string, subtaskId: string) => void;
  onNavigateToTasks?: () => void;
  onNewTask?: () => void;
  onNewClient?: () => void;
  onGenerateBrief?: (client: Client) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  employees,
  assignments = [],
  clients = [],
  dismissedNotifications = [],
  currentRoleId = 'admin',
  onRoleChange,
  onSwitchProfile,
  onDismissNotification,
  onDismissAllNotifications,
  onSelectClient,
  onUpdateStatus,
  onToggleSubtask,
  onNavigateToTasks,
  onNewTask,
  onNewClient,
  onGenerateBrief
}) => {
  const [dueTab, setDueTab] = useState<'all' | 'overdue' | 'today'>('all');
  const [empTaskFilter, setEmpTaskFilter] = useState<'all' | 'pending' | 'done'>('pending');

  const currentEmployee = useMemo(() => {
    if (currentRoleId === 'admin') return null;
    return employees.find(e => e.id === currentRoleId) || null;
  }, [currentRoleId, employees]);

  const isAdmin = currentRoleId === 'admin' || currentEmployee?.accessLevel === 'admin';
  const [adminDashboardView, setAdminDashboardView] = useState<'overview' | 'my-tasks'>('overview');

  // Global admin stats
  const stats = useMemo(() => {
    const totalSalary = employees.reduce((sum, e) => sum + e.salary, 0);
    const avgScore = employees.length > 0 ? employees.reduce((sum, e) => sum + e.performanceScore, 0) / employees.length : 0;
    return {
      totalEmployees: employees.length,
      avgSalary: employees.length > 0 ? Math.round(totalSalary / employees.length) : 0,
      avgScore: avgScore.toFixed(1),
      totalBudget: totalSalary
    };
  }, [employees]);

  // Global due items (Overdue + Due within 5 days)
  const dueItems = useMemo(() => {
    return getDueTasks(assignments, clients, employees, dismissedNotifications)
      .filter(i => i.isOverdue || i.daysDiff <= 5);
  }, [assignments, clients, employees, dismissedNotifications]);

  const overdueCount = dueItems.filter(i => i.isOverdue).length;
  const dueTodayCount = dueItems.filter(i => i.isDueToday).length;

  const filteredDueItems = useMemo(() => {
    if (dueTab === 'overdue') return dueItems.filter(i => i.isOverdue);
    if (dueTab === 'today') return dueItems.filter(i => i.isDueToday);
    return dueItems;
  }, [dueItems, dueTab]);

  // Employee-specific tasks and work items
  const myTasks = useMemo(() => {
    if (!currentEmployee) return [];
    return assignments.filter(a => a.assigneeId === currentEmployee.id);
  }, [currentEmployee, assignments]);

  const myFilteredTasks = useMemo(() => {
    if (empTaskFilter === 'pending') return myTasks.filter(t => t.status !== 'Done');
    if (empTaskFilter === 'done') return myTasks.filter(t => t.status === 'Done');
    return myTasks;
  }, [myTasks, empTaskFilter]);

  const myOverdueTasks = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return myTasks.filter(t => t.status !== 'Done' && new Date(t.dueDate).getTime() < today.getTime());
  }, [myTasks]);

  const myDoneTasks = useMemo(() => myTasks.filter(t => t.status === 'Done'), [myTasks]);

  // Employee linked client events
  const myClientEvents = useMemo(() => {
    if (!currentEmployee) return [];
    const clientIds = Array.from(new Set(myTasks.map(t => t.clientId).filter(Boolean))) as string[];
    return clients.filter(c => clientIds.includes(c.id));
  }, [currentEmployee, myTasks, clients]);

  // All upcoming client shoot events (Next 5 Days)
  const upcomingEvents = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const eventsList: Array<{
      event: ClientEvent;
      client: Client;
      isToday: boolean;
      daysUntil: number;
    }> = [];

    clients.forEach(c => {
      (c.events || []).forEach(ev => {
        if (ev.date && ev.date >= todayStr) {
          const d1 = new Date(todayStr);
          const d2 = new Date(ev.date);
          const diffTime = d2.getTime() - d1.getTime();
          const daysUntil = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          if (daysUntil <= 5) {
            eventsList.push({
              event: ev,
              client: c,
              isToday: ev.date === todayStr,
              daysUntil: Math.max(0, daysUntil)
            });
          }
        }
      });
    });

    return eventsList.sort((a, b) => new Date(a.event.date).getTime() - new Date(b.event.date).getTime());
  }, [clients]);

  // Department teammates
  const departmentTeammates = useMemo(() => {
    if (!currentEmployee) return [];
    return employees.filter(e => e.department === currentEmployee.department && e.id !== currentEmployee.id);
  }, [currentEmployee, employees]);

  const deptData = useMemo(() => {
    const counts: Record<string, number> = {};
    employees.forEach(e => {
      counts[e.department] = (counts[e.department] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [employees]);

  const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e'];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Promoted Admin View Banner & Mode Switcher */}
      {isAdmin && currentEmployee && (
        <div className="bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-slate-100 border border-amber-300/60 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white font-extrabold flex items-center justify-center text-lg shadow-sm shrink-0">
              👑
            </div>
            <div>
              <p className="text-xs font-bold text-amber-900 uppercase tracking-wider">Promoted Admin Access</p>
              <h4 className="text-sm font-extrabold text-slate-900">
                Logged in as Admin: {currentEmployee.name} ({currentEmployee.role})
              </h4>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-slate-200 text-xs font-bold">
            <button
              onClick={() => setAdminDashboardView('overview')}
              className={`px-3.5 py-1.5 rounded-lg transition-all ${
                adminDashboardView === 'overview' 
                  ? 'bg-indigo-600 text-white shadow-xs font-extrabold' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              👑 Studio Admin Overview
            </button>
            <button
              onClick={() => setAdminDashboardView('my-tasks')}
              className={`px-3.5 py-1.5 rounded-lg transition-all ${
                adminDashboardView === 'my-tasks' 
                  ? 'bg-indigo-600 text-white shadow-xs font-extrabold' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              👤 My Personal Tasks ({myTasks.length})
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* ROLE VIEW B: INDIVIDUAL EMPLOYEE ROLE DASHBOARD           */}
      {/* ========================================================= */}
      {(!isAdmin || (isAdmin && currentEmployee && adminDashboardView === 'my-tasks')) ? (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* Employee Hero Profile Badge */}
          <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white rounded-3xl p-6 lg:p-8 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
              <div className="flex items-center gap-5">
                <div className="w-20 h-20 rounded-2xl bg-white/10 border-2 border-white/20 overflow-hidden flex items-center justify-center font-black text-2xl text-white shadow-lg shrink-0">
                  {currentEmployee.profilePicture ? (
                    <img src={currentEmployee.profilePicture} alt={currentEmployee.name} className="w-full h-full object-cover" />
                  ) : (
                    <span>{currentEmployee.name.charAt(0)}</span>
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2.5 py-0.5 bg-indigo-500/40 border border-indigo-400/30 text-indigo-200 rounded-full text-xs font-bold">
                      {currentEmployee.department} Department
                    </span>
                    <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-full text-xs font-bold border border-emerald-500/30">
                      ● {currentEmployee.status}
                    </span>
                  </div>
                  <h3 className="text-2xl font-black text-white">{currentEmployee.name}</h3>
                  <p className="text-sm text-indigo-200 font-medium">{currentEmployee.role}</p>
                </div>
              </div>

              {/* Employee Metrics */}
              <div className="flex flex-wrap items-center gap-4 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                <div className="text-center px-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-300">Performance</p>
                  <p className="text-xl font-black text-amber-300 flex items-center justify-center gap-1 mt-0.5">
                    <Star size={16} fill="currentColor" /> {currentEmployee.performanceScore} / 10
                  </p>
                </div>

                <div className="w-px h-8 bg-white/20 hidden sm:block" />

                <div className="text-center px-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-300">Assigned Tasks</p>
                  <p className="text-xl font-black text-white mt-0.5">{myTasks.length}</p>
                </div>

                <div className="w-px h-8 bg-white/20 hidden sm:block" />

                <div className="text-center px-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-300">Completed Deliverables</p>
                  <p className="text-xl font-black text-emerald-300 mt-0.5">{myDoneTasks.length} Done</p>
                </div>
              </div>
            </div>
          </div>

          {/* Employee Task Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase text-slate-400">Total Work Tasks</p>
                <p className="text-2xl font-black text-slate-900 mt-1">{myTasks.length}</p>
              </div>
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                <Briefcase size={22} />
              </div>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase text-slate-400">Overdue Tasks</p>
                <p className={`text-2xl font-black mt-1 ${myOverdueTasks.length > 0 ? 'text-red-600' : 'text-slate-900'}`}>
                  {myOverdueTasks.length}
                </p>
              </div>
              <div className={`p-3 rounded-xl ${myOverdueTasks.length > 0 ? 'bg-red-50 text-red-600 animate-pulse' : 'bg-slate-100 text-slate-400'}`}>
                <AlertTriangle size={22} />
              </div>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase text-slate-400">Pending Tasks</p>
                <p className="text-2xl font-black text-amber-600 mt-1">{myTasks.length - myDoneTasks.length}</p>
              </div>
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                <Clock size={22} />
              </div>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase text-slate-400">Completed Deliverables</p>
                <p className="text-2xl font-black text-emerald-600 mt-1">{myDoneTasks.length}</p>
              </div>
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                <CheckCircle2 size={22} />
              </div>
            </div>
          </div>

          {/* Assigned Work Tasks List */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 lg:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <Layers className="text-indigo-600" size={22} />
                  My Assigned Work Tasks
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Specific studio tasks assigned to {currentEmployee.name}. Update task progress in real time.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-1 bg-slate-100 rounded-xl flex items-center gap-1 text-xs font-semibold">
                  <button
                    onClick={() => setEmpTaskFilter('pending')}
                    className={`px-3 py-1.5 rounded-lg transition-all ${empTaskFilter === 'pending' ? 'bg-indigo-600 text-white font-bold shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    Pending ({myTasks.length - myDoneTasks.length})
                  </button>
                  <button
                    onClick={() => setEmpTaskFilter('done')}
                    className={`px-3 py-1.5 rounded-lg transition-all ${empTaskFilter === 'done' ? 'bg-emerald-600 text-white font-bold shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    Completed ({myDoneTasks.length})
                  </button>
                  <button
                    onClick={() => setEmpTaskFilter('all')}
                    className={`px-3 py-1.5 rounded-lg transition-all ${empTaskFilter === 'all' ? 'bg-white text-slate-900 font-bold shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    All ({myTasks.length})
                  </button>
                </div>

                {onNewTask && (
                  <button
                    onClick={onNewTask}
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center gap-1.5"
                  >
                    <Plus size={16} /> New Task
                  </button>
                )}
              </div>
            </div>

            {/* Task Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {myFilteredTasks.map(task => {
                const client = clients.find(c => c.id === task.clientId);
                const isOverdue = new Date(task.dueDate).getTime() < new Date().setHours(0,0,0,0) && task.status !== 'Done';

                return (
                  <div 
                    key={task.id}
                    className={`p-5 rounded-2xl border shadow-sm transition-all flex flex-col justify-between space-y-4 hover:shadow-md ${
                      isOverdue 
                        ? 'border-red-200 bg-red-50/20' 
                        : task.status === 'Done'
                        ? 'border-emerald-200 bg-emerald-50/10'
                        : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          task.priority === 'Urgent' ? 'bg-red-100 text-red-700' :
                          task.priority === 'High' ? 'bg-orange-100 text-orange-700' :
                          'bg-indigo-100 text-indigo-700'
                        }`}>
                          {task.priority} Priority
                        </span>

                        <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                          <Calendar size={12} /> {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      </div>

                      <h4 className="font-bold text-slate-900 text-sm">{task.title}</h4>
                      <p className="text-xs text-slate-500 line-clamp-2">{task.description}</p>

                      <TaskProgressBar task={task} onToggleSubtask={onToggleSubtask} />

                      {client && (
                        <button
                          onClick={() => onSelectClient && onSelectClient(client.id)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 border border-indigo-100 rounded-lg text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition-colors"
                        >
                          <Contact2 size={12} />
                          {client.name}
                          <ExternalLink size={10} className="opacity-60" />
                        </button>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-400">Update Status:</span>
                      {onUpdateStatus && (
                        <select
                          value={task.status}
                          onChange={(e) => onUpdateStatus(task.id, e.target.value as AssignmentStatus)}
                          className="bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 px-2.5 py-1 outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
                        >
                          <option value="To Do">To Do</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Review">Review</option>
                          <option value="Done">Done</option>
                        </select>
                      )}
                    </div>
                  </div>
                );
              })}

              {myFilteredTasks.length === 0 && (
                <div className="col-span-full py-16 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-3">
                  <div className="w-16 h-16 mx-auto rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <CheckCircle2 size={32} />
                  </div>
                  <h4 className="font-bold text-slate-800 text-base">No tasks found in this view</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    {empTaskFilter === 'pending' 
                      ? 'You currently have no pending tasks assigned. Great job staying on top of work!' 
                      : 'No completed tasks found in your history.'}
                  </p>
                  {onNewTask && (
                    <button
                      onClick={onNewTask}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all inline-flex items-center gap-2 mt-2"
                    >
                      <Plus size={16} /> Request New Task
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Employee Linked Client Projects */}
          {myClientEvents.length > 0 && (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 lg:p-8 space-y-6">
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                    <Video className="text-indigo-600" size={22} />
                    My Active Client Functions & Projects
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Confirmed client shoots where you are involved as crew or lead editor.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {myClientEvents.map(client => (
                  <div key={client.id} className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-base">{client.name}</h4>
                        <p className="text-xs text-slate-500">{client.email} • {client.phone}</p>
                      </div>
                      <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold">
                        {client.religion}
                      </span>
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-slate-200/60">
                      {client.events.map(ev => (
                        <div key={ev.id} className="bg-white p-2.5 rounded-xl border border-slate-200/80 text-xs flex justify-between items-center">
                          <div>
                            <span className="font-bold text-slate-800">{ev.type}</span>
                            <span className="text-slate-400 ml-2">@ {ev.venue}</span>
                          </div>
                          <span className="font-semibold text-indigo-600 text-[11px]">{ev.date}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <button
                        onClick={() => onSelectClient && onSelectClient(client.id)}
                        className="px-3 py-1.5 bg-indigo-600 text-white font-bold text-xs rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-1.5"
                      >
                        <Contact2 size={14} /> Open Client CRM
                      </button>

                      {onGenerateBrief && (
                        <button
                          onClick={() => onGenerateBrief(client)}
                          className="px-3 py-1.5 bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold text-xs rounded-xl hover:bg-indigo-100 transition-colors flex items-center gap-1.5"
                        >
                          <Sparkles size={14} /> AI Creative Brief
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Department Teammates */}
          {departmentTeammates.length > 0 && (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 lg:p-8 space-y-4">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Users className="text-indigo-600" size={20} />
                Department Teammates ({currentEmployee.department})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {departmentTeammates.map(colleague => (
                  <div key={colleague.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center shrink-0">
                      {colleague.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-xs">{colleague.name}</p>
                      <p className="text-[11px] text-slate-500">{colleague.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ========================================================= */
        /* ROLE VIEW A: GLOBAL STUDIO DIRECTOR / ADMIN VIEW          */
        /* ========================================================= */
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* Primary Key Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="p-5 bg-white rounded-2xl shadow-sm border border-slate-200/80 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Booked Clients</p>
                <p className="text-3xl font-black text-indigo-600 mt-0.5">
                  {clients.filter(c => c.status === 'Booked').length}
                </p>
                <p className="text-[10px] font-bold text-slate-400 mt-1">
                  of {clients.length} total client leads
                </p>
              </div>
              <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600 shrink-0">
                <Contact2 size={22} />
              </div>
            </div>

            <div className="p-5 bg-white rounded-2xl shadow-sm border border-slate-200/80 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Overdue Works</p>
                <p className={`text-3xl font-black mt-0.5 ${overdueCount > 0 ? 'text-red-600' : 'text-slate-900'}`}>
                  {overdueCount}
                </p>
                <p className="text-[10px] font-bold text-slate-400 mt-1">Requires immediate attention</p>
              </div>
              <div className={`p-3 rounded-xl ${overdueCount > 0 ? 'bg-red-50 text-red-600 animate-pulse' : 'bg-slate-100 text-slate-400'} shrink-0`}>
                <AlertTriangle size={22} />
              </div>
            </div>

            <div className="p-5 bg-white rounded-2xl shadow-sm border border-slate-200/80 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Due Today / Soon</p>
                <p className="text-3xl font-black text-amber-600 mt-0.5">
                  {dueItems.length}
                </p>
                <p className="text-[10px] font-bold text-slate-400 mt-1">Pending deliverables</p>
              </div>
              <div className="p-3 rounded-xl bg-amber-50 text-amber-600 shrink-0">
                <Clock size={22} />
              </div>
            </div>

            <div className="p-5 bg-white rounded-2xl shadow-sm border border-slate-200/80 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Active Talent Pool</p>
                <p className="text-3xl font-black text-slate-900 mt-0.5">{stats.totalEmployees}</p>
                <p className="text-[10px] font-bold text-slate-400 mt-1">Studio staff members</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-100 text-slate-700 shrink-0">
                <Users size={22} />
              </div>
            </div>

            <div className="p-5 bg-white rounded-2xl shadow-sm border border-slate-200/80 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Avg Score</p>
                <p className="text-3xl font-black text-emerald-600 mt-0.5">{stats.avgScore}</p>
                <p className="text-[10px] font-bold text-slate-400 mt-1">Out of 10.0 scale</p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 shrink-0">
                <Award size={22} />
              </div>
            </div>
          </div>

          {/* TWO-COLUMN COMPACT LAYOUT: UPCOMING EVENTS & DUE WORK */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* COLUMN 1: Upcoming Shoot Functions */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="text-indigo-600 shrink-0" size={20} />
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900">Upcoming Shoot Functions (Next 5 Days)</h3>
                      <p className="text-[11px] text-slate-400">Scheduled client wedding & function shoots in the next 5 days</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 font-extrabold text-[11px] rounded-lg border border-indigo-100">
                      {upcomingEvents.length} Function(s)
                    </span>
                    {onNewClient && (
                      <button
                        onClick={onNewClient}
                        className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] rounded-lg transition-all shadow-sm flex items-center gap-1"
                      >
                        <Plus size={12} /> Add Function
                      </button>
                    )}
                  </div>
                </div>

                {upcomingEvents.length === 0 ? (
                  <div className="py-12 text-center bg-slate-50/80 rounded-2xl border border-dashed border-slate-200 space-y-2">
                    <Calendar size={32} className="mx-auto text-slate-300" />
                    <p className="font-bold text-slate-700 text-xs">No upcoming functions scheduled</p>
                    <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                      Functions added in Client CRM will appear here automatically with venue & date info.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                    {upcomingEvents.map(({ event, client, isToday, daysUntil }) => (
                      <div 
                        key={`${client.id}-${event.id}`}
                        className={`p-4 rounded-2xl border transition-all space-y-2.5 ${
                          isToday
                            ? 'border-indigo-400 bg-indigo-50/50 shadow-sm ring-1 ring-indigo-500/20'
                            : daysUntil <= 7
                            ? 'border-amber-200 bg-amber-50/30 shadow-sm'
                            : 'border-slate-200 bg-slate-50/30 hover:bg-white hover:shadow-md hover:border-indigo-200'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 font-extrabold text-[10px] rounded-md">
                            {event.type}
                          </span>

                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            isToday 
                              ? 'bg-indigo-600 text-white animate-pulse' 
                              : daysUntil <= 7 
                              ? 'bg-amber-100 text-amber-800' 
                              : 'bg-slate-200 text-slate-700'
                          }`}>
                            {isToday ? 'Today!' : daysUntil === 1 ? 'Tomorrow' : `In ${daysUntil} days`}
                          </span>
                        </div>

                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="font-black text-slate-900 text-sm flex items-center gap-1.5">
                              <Contact2 size={14} className="text-indigo-600 shrink-0" />
                              {client.name}
                            </h4>
                            <p className="text-[11px] text-slate-500 pl-5">{client.religion} • {client.phone}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-200/60">
                          <div className="flex items-center gap-1 text-slate-700 font-semibold">
                            <Calendar size={13} className="text-indigo-500 shrink-0" />
                            <span className="truncate">{event.date} {event.time ? `@ ${event.time}` : ''}</span>
                          </div>

                          <div className="flex items-center gap-1 text-slate-600">
                            <MapPin size={13} className="text-rose-500 shrink-0" />
                            <span className="truncate">{event.venue || 'Venue TBD'}</span>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                          <button
                            onClick={() => onSelectClient && onSelectClient(client.id)}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                          >
                            Open CRM <ExternalLink size={10} />
                          </button>

                          {onGenerateBrief && (
                            <button
                              onClick={() => onGenerateBrief(client)}
                              className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold text-[10px] rounded-md hover:bg-indigo-100 transition-colors flex items-center gap-1"
                            >
                              <Sparkles size={10} /> AI Brief
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* COLUMN 2: Due & Overdue Work Tracker */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Clock className="text-indigo-600 shrink-0" size={20} />
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900">Due Work Tracker (Next 5 Days)</h3>
                      <p className="text-[11px] text-slate-400">Work overdue or due within the next 5 days</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    <div className="p-0.5 bg-slate-100 rounded-lg flex items-center gap-0.5 text-[11px] font-bold">
                      <button
                        onClick={() => setDueTab('all')}
                        className={`px-2 py-1 rounded-md transition-all ${dueTab === 'all' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                      >
                        All ({dueItems.length})
                      </button>
                      <button
                        onClick={() => setDueTab('overdue')}
                        className={`px-2 py-1 rounded-md transition-all ${dueTab === 'overdue' ? 'bg-red-500 text-white' : 'text-slate-600 hover:text-red-600'}`}
                      >
                        Overdue ({overdueCount})
                      </button>
                      <button
                        onClick={() => setDueTab('today')}
                        className={`px-2 py-1 rounded-md transition-all ${dueTab === 'today' ? 'bg-amber-500 text-white' : 'text-slate-600 hover:text-amber-600'}`}
                      >
                        Today ({dueTodayCount})
                      </button>
                    </div>

                    {onNavigateToTasks && (
                      <button
                        onClick={onNavigateToTasks}
                        className="p-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold text-[11px] rounded-lg transition-colors flex items-center gap-1"
                        title="View All Tasks"
                      >
                        <ArrowRight size={13} />
                      </button>
                    )}
                  </div>
                </div>

                {filteredDueItems.length === 0 ? (
                  <div className="py-12 text-center bg-slate-50/80 rounded-2xl border border-dashed border-slate-200 space-y-2">
                    <CheckCircle2 size={32} className="mx-auto text-emerald-500" />
                    <p className="font-bold text-slate-800 text-xs">No pending work items</p>
                    <p className="text-[11px] text-slate-400">All assigned tasks in this view are completed!</p>
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                    {filteredDueItems.map(({ task, isOverdue, isDueToday, daysDiff, client, assignee }) => (
                      <div 
                        key={task.id}
                        className={`p-3.5 rounded-2xl border shadow-2xs transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                          isOverdue 
                            ? 'border-red-200 bg-red-50/40' 
                            : isDueToday 
                            ? 'border-amber-200 bg-amber-50/40' 
                            : 'border-slate-200/80 bg-white hover:border-indigo-200 shadow-2xs'
                        }`}
                      >
                        {/* Work Title & Client Tag */}
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                              isOverdue 
                                ? 'bg-red-500 text-white' 
                                : isDueToday 
                                ? 'bg-amber-500 text-white' 
                                : 'bg-indigo-600 text-white'
                            }`}>
                              {isOverdue ? `Overdue (${Math.abs(daysDiff)}d)` : isDueToday ? 'Due Today' : `Due in ${daysDiff}d`}
                            </span>

                            {client && (
                              <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 truncate max-w-[130px]">
                                👤 {client.name}
                              </span>
                            )}
                          </div>

                          <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm truncate">
                            {task.title}
                          </h4>
                        </div>

                        {/* Pending With Assignee */}
                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 rounded-xl px-2.5 py-1 text-xs">
                            <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 overflow-hidden border border-slate-200 flex items-center justify-center shrink-0 font-bold text-[10px]">
                              {assignee?.profilePicture ? (
                                <img src={assignee.profilePicture} className="w-full h-full object-cover" alt={assignee.name} />
                              ) : (
                                <span>{assignee?.name.charAt(0) || '?'}</span>
                              )}
                            </div>
                            <div>
                              <span className="text-[9px] text-slate-400 font-extrabold uppercase block leading-tight">Pending With</span>
                              <span className="text-xs font-black text-slate-800 block truncate max-w-[110px] leading-tight">
                                {assignee?.name || 'Unassigned'}
                              </span>
                            </div>
                          </div>

                          {onDismissNotification && (
                            <button
                              type="button"
                              onClick={() => onDismissNotification(task.id)}
                              className="p-1 text-slate-300 hover:text-slate-600 rounded-lg transition-colors"
                              title="Dismiss notification"
                            >
                              <X size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Analytics Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Department Distribution */}
            <div className="p-6 bg-white rounded-2xl shadow-sm border border-slate-100">
              <h3 className="font-semibold text-slate-800 mb-6">Department Talent Distribution</h3>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={deptData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={95}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {deptData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
                {deptData.map((d, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-slate-600 truncate">{d.name} ({d.value})</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Performance & Comp Efficiency */}
            <div className="p-6 bg-white rounded-2xl shadow-sm border border-slate-100">
              <h3 className="font-semibold text-slate-800 mb-6">Performance & Comp Efficiency</h3>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={employees}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" fontSize={10} tick={{ fill: '#64748b' }} />
                    <YAxis yAxisId="left" orientation="left" stroke="#6366f1" fontSize={10} />
                    <YAxis yAxisId="right" orientation="right" stroke="#ec4899" fontSize={10} />
                    <Tooltip />
                    <Bar yAxisId="left" dataKey="salary" fill="#6366f1" radius={[4, 4, 0, 0]} name="Salary" />
                    <Bar yAxisId="right" dataKey="performanceScore" fill="#ec4899" radius={[4, 4, 0, 0]} name="Score" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
