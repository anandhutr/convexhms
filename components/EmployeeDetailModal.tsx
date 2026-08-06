import React, { useState } from 'react';
import { 
  X, User, Mail, Briefcase, Building2, Calendar, 
  Award, Shield, CheckCircle2, Clock, AlertCircle, 
  ClipboardList, RotateCcw, Archive, Edit2, ChevronRight, UserCheck
} from 'lucide-react';
import { Employee, Assignment, Client } from '../types';

interface EmployeeDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
  assignments: Assignment[];
  clients: Client[];
  isAdmin?: boolean;
  onReactivate?: (id: string) => void;
  onArchive?: (id: string) => void;
  onEdit?: (employee: Employee) => void;
  onSelectClient?: (clientId: string) => void;
}

const EmployeeDetailModal: React.FC<EmployeeDetailModalProps> = ({
  isOpen,
  onClose,
  employee,
  assignments,
  clients,
  isAdmin = true,
  onReactivate,
  onArchive,
  onEdit,
  onSelectClient
}) => {
  const [taskFilter, setTaskFilter] = useState<'All' | 'Done' | 'In Progress' | 'To Do'>('All');

  if (!isOpen || !employee) return null;

  const employeeAssignments = assignments.filter(a => a.assigneeId === employee.id);
  
  const doneTasks = employeeAssignments.filter(a => a.status === 'Done');
  const inProgressTasks = employeeAssignments.filter(a => a.status === 'In Progress' || a.status === 'Review');
  const todoTasks = employeeAssignments.filter(a => a.status === 'To Do');

  const filteredTasks = employeeAssignments.filter(a => {
    if (taskFilter === 'All') return true;
    if (taskFilter === 'Done') return a.status === 'Done';
    if (taskFilter === 'In Progress') return a.status === 'In Progress' || a.status === 'Review';
    if (taskFilter === 'To Do') return a.status === 'To Do';
    return true;
  });

  const getClientName = (clientId?: string) => {
    if (!clientId) return 'Internal Studio Operation';
    const c = clients.find(client => client.id === clientId);
    return c ? c.name : 'Client Project';
  };

  const isArchived = employee.status === 'Terminated' || (employee as any).status === 'Archived';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative bg-white rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Banner */}
        <div className={`p-6 border-b flex items-start justify-between relative ${
          isArchived 
            ? 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-100' 
            : 'bg-gradient-to-r from-indigo-50 via-slate-50 to-purple-50 border-slate-100'
        }`}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white border-2 border-indigo-200 overflow-hidden shadow-sm flex items-center justify-center font-bold text-xl text-indigo-600 shrink-0">
              {employee.profilePicture ? (
                <img src={employee.profilePicture} alt={employee.name} className="w-full h-full object-cover" />
              ) : (
                <span>{employee.name.charAt(0)}</span>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-xl font-extrabold text-slate-900">{employee.name}</h2>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  isArchived 
                    ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                    : employee.status === 'Active' 
                    ? 'bg-emerald-100 text-emerald-800' 
                    : 'bg-slate-100 text-slate-700'
                }`}>
                  {isArchived ? '📦 Archived / Terminated' : employee.status}
                </span>

                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  employee.accessLevel === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-slate-100 text-slate-700'
                }`}>
                  {employee.accessLevel === 'admin' ? '👑 Admin' : '👤 Employee'}
                </span>
              </div>

              <p className="text-xs text-slate-600 font-medium mt-1">
                {employee.role} • <span className="text-indigo-600 font-semibold">{employee.department} Department</span>
              </p>
              
              <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                <Mail size={12} /> {employee.email}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAdmin && onEdit && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(employee);
                }}
                className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold shadow-2xs transition-all flex items-center gap-1.5"
              >
                <Edit2 size={14} />
                <span>Edit Profile</span>
              </button>
            )}

            <button 
              onClick={onClose}
              className="p-2 hover:bg-slate-200/60 rounded-full text-slate-400 hover:text-slate-700 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Archive Status Banner if Archived */}
          {isArchived && isAdmin && onReactivate && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                  <Archive size={15} />
                  This crew profile is currently archived
                </p>
                <p className="text-[11px] text-amber-700">
                  All past work history, performance metrics, and task records are safely retained in Firestore.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  onReactivate(employee.id);
                  onClose();
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5 shrink-0"
              >
                <RotateCcw size={14} />
                <span>Reactivate & Restore Account</span>
              </button>
            </div>
          )}

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-center">
              <p className="text-xs font-semibold text-slate-500">Total Assigned Work</p>
              <p className="text-xl font-black text-slate-900 mt-1">{employeeAssignments.length}</p>
            </div>

            <div className="p-3.5 bg-emerald-50/60 border border-emerald-100 rounded-2xl text-center">
              <p className="text-xs font-semibold text-emerald-700">Completed Work</p>
              <p className="text-xl font-black text-emerald-800 mt-1">{doneTasks.length}</p>
            </div>

            <div className="p-3.5 bg-blue-50/60 border border-blue-100 rounded-2xl text-center">
              <p className="text-xs font-semibold text-blue-700">In Progress / Review</p>
              <p className="text-xl font-black text-blue-800 mt-1">{inProgressTasks.length}</p>
            </div>

            <div className="p-3.5 bg-purple-50/60 border border-purple-100 rounded-2xl text-center">
              <p className="text-xs font-semibold text-purple-700">Performance Score</p>
              <p className="text-xl font-black text-purple-800 mt-1">{employee.performanceScore} / 10</p>
            </div>
          </div>

          {/* Bio & Details */}
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Employee Background & Bio</h4>
            <p className="text-xs text-slate-700 leading-relaxed italic">
              {employee.bio || "No detailed bio provided for this crew member."}
            </p>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-2 border-t border-slate-200/60">
              <span>📅 Joined: <strong className="text-slate-800">{employee.dateJoined}</strong></span>
              {isAdmin && <span>💰 Salary: <strong className="text-slate-800">${employee.salary?.toLocaleString()}</strong></span>}
            </div>
          </div>

          {/* Work Details Section */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <ClipboardList className="text-indigo-600" size={18} />
                <h3 className="text-sm font-bold text-slate-900">Work Details & Assigned Tasks ({employeeAssignments.length})</h3>
              </div>

              {/* Task Status Filters */}
              <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold shrink-0">
                {(['All', 'Done', 'In Progress', 'To Do'] as const).map(st => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setTaskFilter(st)}
                    className={`px-2.5 py-1 rounded-lg transition-all ${
                      taskFilter === st ? 'bg-white text-indigo-700 shadow-2xs font-extrabold' : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* List of Tasks */}
            {filteredTasks.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl space-y-1">
                <p className="text-xs font-bold text-slate-700">No tasks found matching filter "{taskFilter}"</p>
                <p className="text-[11px] text-slate-400">There are no work assignments logged for this filter category.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {filteredTasks.map(task => (
                  <div 
                    key={task.id}
                    className="p-3.5 bg-white border border-slate-200 hover:border-indigo-300 rounded-2xl transition-all shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900 text-xs">{task.title}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                          task.status === 'Done' ? 'bg-emerald-100 text-emerald-800' :
                          task.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                          task.status === 'Review' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {task.status}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          task.priority === 'Urgent' ? 'bg-red-100 text-red-700' :
                          task.priority === 'High' ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {task.priority} Priority
                        </span>
                      </div>

                      <p className="text-xs text-slate-500 line-clamp-1">{task.description}</p>

                      <div className="flex items-center gap-3 text-[11px] text-slate-400 font-medium">
                        <span>Project: <strong className="text-indigo-600">{getClientName(task.clientId)}</strong></span>
                        {task.dueDate && <span>Due: <strong>{task.dueDate}</strong></span>}
                      </div>
                    </div>

                    {task.clientId && onSelectClient && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onSelectClient(task.clientId!);
                        }}
                        className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl text-xs transition-colors shrink-0 flex items-center gap-1 self-start sm:self-center"
                      >
                        <span>View Client</span>
                        <ChevronRight size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <p className="text-[11px] text-slate-400">ID: {employee.id}</p>

          <div className="flex items-center gap-2">
            {!isArchived && isAdmin && onArchive && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onArchive(employee.id);
                }}
                className="px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold rounded-xl text-xs border border-amber-200 transition-colors flex items-center gap-1.5"
              >
                <Archive size={14} />
                <span>Archive Staff Profile</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs transition-colors"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default EmployeeDetailModal;
