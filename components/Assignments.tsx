import React, { useState } from 'react';
import { Assignment, Employee, Client, AssignmentStatus } from '../types';
import { 
  Calendar, CheckCircle2, Clock, AlertCircle, 
  ChevronRight, ChevronDown, ChevronUp, User, Filter, ClipboardList,
  Contact2, ExternalLink, Edit2, Trash2, Plus, RotateCcw,
  LayoutGrid, Layers, Building2, CheckSquare
} from 'lucide-react';
import { ExpandableDueNotifications } from './DueNotificationsBanner';
import TaskProgressBar from './TaskProgressBar';

interface AssignmentsProps {
  assignments: Assignment[];
  employees: Employee[];
  clients?: Client[];
  dismissedNotifications?: string[];
  currentRoleId?: string;
  onDismissNotification?: (id: string) => void;
  onDismissAllNotifications?: () => void;
  onSelectClient?: (clientId: string) => void;
  onUpdateStatus: (id: string, status: AssignmentStatus) => void;
  onToggleSubtask?: (taskId: string, subtaskId: string) => void;
  onEdit: (assignment: Assignment) => void;
  onDelete: (id: string) => void;
  onNewTask?: (clientId?: string) => void;
}

const Assignments: React.FC<AssignmentsProps> = ({ 
  assignments, 
  employees, 
  clients = [],
  dismissedNotifications = [],
  currentRoleId = 'admin',
  onDismissNotification,
  onDismissAllNotifications,
  onSelectClient,
  onUpdateStatus, 
  onToggleSubtask,
  onEdit, 
  onDelete,
  onNewTask
}) => {
  const [viewMode, setViewMode] = useState<'grouped' | 'individual'>('grouped');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [filterClient, setFilterClient] = useState<string>('All');
  const [filterAssignee, setFilterAssignee] = useState<string>(
    currentRoleId !== 'admin' ? currentRoleId : 'All'
  );

  const currentEmployee = employees.find(e => e.id === currentRoleId);

  const getAssignee = (id: string) => employees.find(e => e.id === id);
  const getClient = (id?: string) => clients.find(c => c.id === id);

  const handleResetFilters = () => {
    setFilterStatus('All');
    setFilterClient('All');
    setFilterAssignee('All');
  };

  const priorityColors = {
    Low: 'bg-slate-100 text-slate-600',
    Medium: 'bg-blue-100 text-blue-600',
    High: 'bg-orange-100 text-orange-600',
    Urgent: 'bg-red-100 text-red-600 animate-pulse'
  };

  const statusIcons = {
    'To Do': <Clock className="text-slate-400" size={16} />,
    'In Progress': <ChevronRight className="text-blue-500" size={16} />,
    'Review': <AlertCircle className="text-amber-500" size={16} />,
    'Done': <CheckCircle2 className="text-emerald-500" size={16} />
  };

  const filtered = assignments.filter(a => {
    const matchesStatus = filterStatus === 'All' || a.status === filterStatus;
    const matchesClient = filterClient === 'All' || 
      (filterClient === 'Internal' ? !a.clientId : a.clientId === filterClient);
    const matchesAssignee = filterAssignee === 'All' || a.assigneeId === filterAssignee;
    return matchesStatus && matchesClient && matchesAssignee;
  });

  // Group filtered tasks by Client ID (or 'internal')
  const groupedTasksMap = filtered.reduce((acc, task) => {
    const key = task.clientId || 'internal';
    if (!acc[key]) acc[key] = [];
    acc[key].push(task);
    return acc;
  }, {} as Record<string, Assignment[]>);

  const groupedKeys = Object.keys(groupedTasksMap);

  const [collapsedClients, setCollapsedClients] = useState<Record<string, boolean>>({});
  const [expandedTaskDetails, setExpandedTaskDetails] = useState<Record<string, boolean>>({});

  const toggleClientCollapse = (key: string) => {
    setCollapsedClients(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleTaskDetail = (taskId: string) => {
    setExpandedTaskDetails(prev => ({ ...prev, [taskId]: !prev[taskId] }));
  };

  const collapseAll = () => {
    const next: Record<string, boolean> = {};
    groupedKeys.forEach(k => { next[k] = true; });
    setCollapsedClients(next);
  };

  const expandAll = () => {
    setCollapsedClients({});
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Compact View Controls & Filter Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode Toggle: Grouped by Client vs Single Cards */}
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('grouped')}
              className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
                viewMode === 'grouped' 
                  ? 'bg-white text-indigo-700 shadow-2xs font-extrabold' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers size={14} />
              <span>Grouped</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('individual')}
              className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
                viewMode === 'individual' 
                  ? 'bg-white text-indigo-700 shadow-2xs font-extrabold' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid size={14} />
              <span>Single Cards</span>
            </button>
          </div>

          {viewMode === 'grouped' && groupedKeys.length > 0 && (
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold shrink-0">
              <button
                type="button"
                onClick={expandAll}
                className="px-2.5 py-1 text-slate-700 hover:text-indigo-700 hover:bg-white rounded-lg transition-all"
              >
                Expand All
              </button>
              <span className="text-slate-300">•</span>
              <button
                type="button"
                onClick={collapseAll}
                className="px-2.5 py-1 text-slate-700 hover:text-indigo-700 hover:bg-white rounded-lg transition-all"
              >
                Collapse All
              </button>
            </div>
          )}

          {/* Quick Filter Pill for Logged In Employee */}
          {currentEmployee && (
            <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold shrink-0">
              <button
                type="button"
                onClick={() => setFilterAssignee(currentEmployee.id)}
                className={`px-3 py-1 rounded-lg transition-all ${filterAssignee === currentEmployee.id ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'}`}
              >
                👤 My Tasks ({assignments.filter(a => a.assigneeId === currentEmployee.id).length})
              </button>
              <button
                type="button"
                onClick={() => setFilterAssignee('All')}
                className={`px-3 py-1 rounded-lg transition-all ${filterAssignee === 'All' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'}`}
              >
                🌐 All Studio Work
              </button>
            </div>
          )}
        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5">
            <Filter className="text-slate-400" size={15} />
            <select
              className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              value={filterAssignee}
              onChange={(e) => setFilterAssignee(e.target.value)}
            >
              <option value="All">All Assignees</option>
              {employees.map(e => (
                <option key={e.id} value={e.id}>👤 {e.name} ({e.role})</option>
              ))}
            </select>
          </div>

          <select
            className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            value={filterClient}
            onChange={(e) => setFilterClient(e.target.value)}
          >
            <option value="All">All Client Projects</option>
            <option value="Internal">Internal Studio Work</option>
            {clients.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <select
            className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="All">All Task Statuses</option>
            <option value="To Do">To Do</option>
            <option value="In Progress">In Progress</option>
            <option value="Review">Review</option>
            <option value="Done">Done</option>
          </select>
        </div>
      </div>

      {/* Expandable Production Due Work Notifications */}
      {onDismissNotification && onDismissAllNotifications && (
        <ExpandableDueNotifications 
          assignments={assignments}
          clients={clients}
          employees={employees}
          dismissedIds={dismissedNotifications}
          onDismiss={onDismissNotification}
          onDismissAll={onDismissAllNotifications}
          onUpdateStatus={onUpdateStatus}
          onSelectClient={onSelectClient}
        />
      )}

      {/* GROUPED BY CLIENT COMPACT ACCORDION VIEW */}
      {viewMode === 'grouped' ? (
        <div className="space-y-3">
          {groupedKeys.map(key => {
            const clientTasks = groupedTasksMap[key];
            const client = key !== 'internal' ? getClient(key) : null;
            const isCollapsed = !!collapsedClients[key];

            const totalCount = clientTasks.length;
            const doneCount = clientTasks.filter(t => t.status === 'Done').length;
            const inProgressCount = clientTasks.filter(t => t.status === 'In Progress').length;
            const completionPercentage = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

            return (
              <div key={key} className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden transition-all">
                {/* Compact Client Banner / Accordion Header */}
                <div 
                  onClick={() => toggleClientCollapse(key)}
                  className="p-3 sm:p-3.5 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-slate-800 transition-colors select-none"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <button 
                      type="button" 
                      className="p-1 rounded-md bg-white/10 text-slate-300 hover:text-white shrink-0"
                    >
                      {isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                    </button>

                    <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center font-bold text-indigo-300 text-sm shrink-0">
                      {client ? client.name.charAt(0) : <Building2 size={16} className="text-indigo-300" />}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-white text-sm sm:text-base truncate">
                          {client ? client.name : 'Internal Studio Operations'}
                        </h3>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 uppercase shrink-0">
                          {client ? (client.company || 'CRM Client') : 'Internal'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-xs shrink-0 pl-7 sm:pl-0">
                    {/* Compact Metrics & Progress Bar */}
                    <div className="flex items-center gap-2 text-slate-300 font-medium">
                      <span className="font-bold text-white bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                        {totalCount} {totalCount === 1 ? 'task' : 'tasks'}
                      </span>
                      <span className="text-emerald-400 font-semibold">{doneCount} done</span>
                      {inProgressCount > 0 && <span className="text-blue-300 hidden md:inline">{inProgressCount} active</span>}
                    </div>

                    <div className="hidden sm:flex items-center gap-2 w-24">
                      <div className="flex-1 bg-slate-800 h-2 rounded-full overflow-hidden border border-slate-700">
                        <div 
                          className="bg-emerald-400 h-full rounded-full transition-all duration-300" 
                          style={{ width: `${completionPercentage}%` }} 
                        />
                      </div>
                      <span className="font-bold text-slate-300 text-[11px]">{completionPercentage}%</span>
                    </div>

                    {/* Quick Client Action Buttons */}
                    <div className="flex items-center gap-1.5 ml-1" onClick={(e) => e.stopPropagation()}>
                      {client && onSelectClient && (
                        <button
                          type="button"
                          onClick={() => onSelectClient(client.id)}
                          className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1 border border-white/10"
                          title="Open Client CRM"
                        >
                          <Contact2 size={13} />
                          <span className="hidden lg:inline">CRM</span>
                        </button>
                      )}
                      {onNewTask && (
                        <button
                          type="button"
                          onClick={() => onNewTask(client?.id)}
                          className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-2xs transition-all flex items-center gap-1"
                          title="Add Task for this Client"
                        >
                          <Plus size={13} />
                          <span>Task</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Compact Tasks Table / List */}
                {!isCollapsed && (
                  <div className="divide-y divide-slate-100 bg-white">
                    {clientTasks.map(task => {
                      const assignee = getAssignee(task.assigneeId);
                      const linkedEvent = client?.events.find(ev => ev.id === task.eventId);
                      const isDetailExpanded = !!expandedTaskDetails[task.id];
                      const totalSubtasks = task.subtasks?.length || 0;
                      const completedSubtasks = task.subtasks?.filter(s => s.completed).length || 0;

                      return (
                        <div key={task.id} className="p-3 hover:bg-slate-50/80 transition-colors">
                          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2">
                            {/* Left: Status, Priority, Title & Event */}
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                              <button
                                type="button"
                                onClick={() => toggleTaskDetail(task.id)}
                                className="text-slate-400 hover:text-indigo-600 transition-colors p-0.5 shrink-0"
                                title="Toggle Task Details"
                              >
                                {isDetailExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                              </button>

                              {/* Status Select Pill */}
                              <div className="flex items-center gap-1 text-xs shrink-0">
                                {statusIcons[task.status]}
                                <select
                                  value={task.status}
                                  onChange={(e) => onUpdateStatus(task.id, e.target.value as AssignmentStatus)}
                                  className="bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 px-1.5 py-0.5 outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                                >
                                  <option value="To Do">To Do</option>
                                  <option value="In Progress">In Progress</option>
                                  <option value="Review">Review</option>
                                  <option value="Done">Done</option>
                                </select>
                              </div>

                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider shrink-0 ${priorityColors[task.priority]}`}>
                                {task.priority}
                              </span>

                              <h4 className="font-bold text-slate-800 text-xs sm:text-sm truncate">
                                {task.title}
                              </h4>

                              {linkedEvent && (
                                <span className="text-[10px] font-medium text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100 shrink-0 hidden sm:inline">
                                  📅 {linkedEvent.type}
                                </span>
                              )}

                              {totalSubtasks > 0 && (
                                <button
                                  type="button"
                                  onClick={() => toggleTaskDetail(task.id)}
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold border flex items-center gap-1 shrink-0 ${
                                    completedSubtasks === totalSubtasks
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                      : 'bg-slate-100 text-slate-600 border-slate-200'
                                  }`}
                                >
                                  <CheckSquare size={11} />
                                  <span>{completedSubtasks}/{totalSubtasks}</span>
                                </button>
                              )}
                            </div>

                            {/* Right: Assignee, Due Date & Actions */}
                            <div className="flex items-center justify-between lg:justify-end gap-3 text-xs shrink-0 pl-6 lg:pl-0">
                              <div className="flex items-center gap-1.5">
                                <div className="w-5 h-5 rounded-full bg-slate-100 overflow-hidden border border-slate-200 flex items-center justify-center shrink-0 text-[9px] font-bold text-slate-600">
                                  {assignee?.profilePicture ? (
                                    <img src={assignee.profilePicture} className="w-full h-full object-cover" alt={assignee.name} />
                                  ) : (
                                    <span>{assignee?.name.charAt(0) || '?'}</span>
                                  )}
                                </div>
                                <span className="font-semibold text-slate-700 truncate max-w-[100px]">
                                  {assignee?.name || 'Unassigned'}
                                </span>
                              </div>

                              <div className="flex items-center gap-1 text-[11px] font-medium text-slate-500">
                                <Calendar size={12} className="text-slate-400" />
                                <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                              </div>

                              <div className="flex items-center gap-1 border-l border-slate-200 pl-2">
                                <button 
                                  onClick={() => onEdit(task)} 
                                  className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100"
                                  title="Edit Task"
                                >
                                  <Edit2 size={13} />
                                </button>
                                <button 
                                  onClick={() => onDelete(task.id)} 
                                  className="p-1 text-slate-400 hover:text-red-600 rounded hover:bg-red-50"
                                  title="Delete Task"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Expandable Task Detail Box (Description & Interactive Subtasks) */}
                          {isDetailExpanded && (
                            <div className="mt-2.5 pt-2.5 border-t border-slate-100 pl-6 space-y-2.5 text-xs text-slate-600 animate-in fade-in duration-200">
                              {task.description && (
                                <p className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/80 leading-relaxed text-slate-700">
                                  {task.description}
                                </p>
                              )}

                              <TaskProgressBar task={task} onToggleSubtask={onToggleSubtask} />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* INDIVIDUAL TASK CARDS VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(task => {
            const assignee = getAssignee(task.assigneeId);
            const client = getClient(task.clientId);
            const linkedEvent = client?.events.find(ev => ev.id === task.eventId);

            return (
              <div key={task.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all group flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${priorityColors[task.priority]}`}>
                      {task.priority} Priority
                    </span>

                    <div className="flex items-center gap-1.5 text-xs font-semibold">
                      {statusIcons[task.status]}
                      <select
                        value={task.status}
                        onChange={(e) => onUpdateStatus(task.id, e.target.value as AssignmentStatus)}
                        className="bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 px-2 py-0.5 outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
                      >
                        <option value="To Do">To Do</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Review">Review</option>
                        <option value="Done">Done</option>
                      </select>
                    </div>
                  </div>

                  {/* Linked Client CRM Banner */}
                  {client && (
                    <div className="mb-3 p-2 bg-indigo-50/70 border border-indigo-100 rounded-xl flex items-center justify-between">
                      <button
                        onClick={() => onSelectClient && onSelectClient(client.id)}
                        className="text-xs font-bold text-indigo-700 hover:text-indigo-900 transition-colors flex items-center gap-1.5 truncate text-left"
                      >
                        <Contact2 size={14} className="shrink-0 text-indigo-600" />
                        <span className="truncate">{client.name}</span>
                        {linkedEvent && <span className="text-[10px] text-indigo-500 font-normal">({linkedEvent.type})</span>}
                        <ExternalLink size={10} className="shrink-0 opacity-60" />
                      </button>
                      <span className="text-[10px] font-bold text-indigo-600 bg-white px-2 py-0.5 rounded border border-indigo-100 shrink-0">
                        CRM Work
                      </span>
                    </div>
                  )}
                  
                  <h3 className="font-bold text-slate-900 mb-1 group-hover:text-indigo-600 transition-colors text-base">{task.title}</h3>
                  <p className="text-xs text-slate-500 line-clamp-2 mb-3 leading-relaxed">{task.description}</p>

                  {/* Progress Bar & Interactive Sub-tasks */}
                  <TaskProgressBar task={task} onToggleSubtask={onToggleSubtask} />
                </div>
                
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-slate-100 overflow-hidden border border-slate-200 flex items-center justify-center shrink-0 font-bold text-slate-600">
                      {assignee?.profilePicture ? (
                        <img src={assignee.profilePicture} className="w-full h-full object-cover" alt={assignee.name} />
                      ) : (
                        <span>{assignee?.name.charAt(0) || <User size={14} className="text-slate-400" />}</span>
                      )}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-800 block truncate">{assignee?.name || 'Unassigned'}</span>
                      <span className="text-[10px] text-slate-400 block">{assignee?.department || 'Crew'}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-[11px] font-medium text-slate-500">
                      <Calendar size={13} className="text-slate-400" />
                      <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => onEdit(task)}
                        className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded transition-colors"
                        title="Edit task"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button 
                        onClick={() => onDelete(task.id)}
                        className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded transition-colors"
                        title="Delete task"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty State Illustration with CTA Buttons */}
      {filtered.length === 0 && (
        <div className="py-16 px-6 text-center bg-white rounded-3xl border border-dashed border-slate-200">
          <div className="max-w-md mx-auto space-y-4">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm">
              <ClipboardList size={36} />
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900">No Work Assignments Found</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                {filterStatus !== 'All' || filterClient !== 'All'
                  ? 'No production tasks match your currently selected status or client filter.'
                  : 'There are no active tasks logged in the studio work tracking system.'}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              {onNewTask && (
                <button
                  onClick={() => onNewTask()}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2"
                >
                  <Plus size={16} />
                  Create New Task
                </button>
              )}

              {(filterStatus !== 'All' || filterClient !== 'All') && (
                <button
                  onClick={handleResetFilters}
                  className="px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs transition-all flex items-center gap-2"
                >
                  <RotateCcw size={14} />
                  Reset Search Filters
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Assignments;
