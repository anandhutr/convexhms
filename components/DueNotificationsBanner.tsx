import React, { useState } from 'react';
import { Assignment, Client, Employee, AssignmentStatus } from '../types';
import { 
  AlertTriangle, CheckCircle2, X, ChevronDown, ChevronUp, 
  Contact2, User, Check, Sparkles, BellRing
} from 'lucide-react';

interface DueNotificationsProps {
  assignments: Assignment[];
  clients: Client[];
  employees: Employee[];
  dismissedIds: string[];
  onDismiss: (id: string) => void;
  onDismissAll: () => void;
  onUpdateStatus: (id: string, status: AssignmentStatus) => void;
  onSelectClient?: (clientId: string) => void;
}

export interface DueTaskItem {
  task: Assignment;
  isOverdue: boolean;
  isDueToday: boolean;
  daysDiff: number;
  client?: Client;
  assignee?: Employee;
}

export const getDueTasks = (
  assignments: Assignment[], 
  clients: Client[], 
  employees: Employee[],
  dismissedIds: string[]
): DueTaskItem[] => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return assignments
    .filter(a => a.status !== 'Done' && !dismissedIds.includes(a.id))
    .map(task => {
      const dueDate = new Date(task.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      
      const diffTime = dueDate.getTime() - today.getTime();
      const daysDiff = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      const isOverdue = daysDiff < 0;
      const isDueToday = daysDiff === 0;

      const client = clients.find(c => c.id === task.clientId);
      const assignee = employees.find(e => e.id === task.assigneeId);

      return {
        task,
        isOverdue,
        isDueToday,
        daysDiff,
        client,
        assignee
      };
    })
    .sort((a, b) => a.daysDiff - b.daysDiff); // Sort most overdue first
};

// Expandable Notification Banner for Work Tracking (Assignments)
export const ExpandableDueNotifications: React.FC<DueNotificationsProps> = ({
  assignments,
  clients,
  employees,
  dismissedIds,
  onDismiss,
  onDismissAll,
  onUpdateStatus,
  onSelectClient
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const dueItems = getDueTasks(assignments, clients, employees, dismissedIds);

  if (dueItems.length === 0) return null;

  const overdueItems = dueItems.filter(i => i.isOverdue);
  const todayItems = dueItems.filter(i => i.isDueToday);

  return (
    <div className="bg-gradient-to-r from-amber-500/10 via-red-500/10 to-indigo-500/10 border border-amber-200/90 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500 text-white rounded-xl shadow-md shrink-0 flex items-center justify-center">
            <BellRing size={20} className="animate-bounce" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                Production Work Due Alerts
              </h3>
              <span className="px-2.5 py-0.5 bg-red-500 text-white text-[11px] font-black rounded-full shadow-sm">
                {dueItems.length} Pending
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              {overdueItems.length > 0 && <strong className="text-red-600 font-bold">{overdueItems.length} overdue</strong>}
              {overdueItems.length > 0 && todayItems.length > 0 && ', '}
              {todayItems.length > 0 && <strong className="text-amber-700 font-bold">{todayItems.length} due today</strong>}
              . Review or mark complete directly.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-3.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5"
          >
            {isExpanded ? (
              <>
                <span>Collapse Alerts</span>
                <ChevronUp size={14} />
              </>
            ) : (
              <>
                <span>Expand Notifications</span>
                <ChevronDown size={14} />
              </>
            )}
          </button>

          {isExpanded && (
            <button
              onClick={onDismissAll}
              className="px-3 py-1.5 text-slate-500 hover:text-slate-800 text-xs font-semibold hover:underline transition-all"
            >
              Dismiss All
            </button>
          )}
        </div>
      </div>

      {/* Expandable Body */}
      {isExpanded && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-2 border-t border-amber-200/50 animate-in slide-in-from-top-2 duration-200">
          {dueItems.slice(0, 6).map(({ task, isOverdue, isDueToday, daysDiff, client, assignee }) => (
            <div 
              key={task.id} 
              className={`p-3.5 rounded-xl border bg-white shadow-sm flex flex-col justify-between space-y-2 relative group hover:border-indigo-400 transition-all ${
                isOverdue ? 'border-red-300 bg-red-50/30' : 
                isDueToday ? 'border-amber-300 bg-amber-50/30' : 'border-slate-200'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                    isOverdue ? 'bg-red-100 text-red-700' :
                    isDueToday ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {isOverdue ? `Overdue ${Math.abs(daysDiff)}d` : isDueToday ? 'Due Today' : `Due in ${daysDiff}d`}
                  </span>

                  <button
                    onClick={() => onDismiss(task.id)}
                    className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Dismiss alert"
                  >
                    <X size={14} />
                  </button>
                </div>

                <h4 className="font-bold text-slate-900 text-xs line-clamp-1">{task.title}</h4>
                
                {client && (
                  <button
                    onClick={() => onSelectClient && onSelectClient(client.id)}
                    className="text-[11px] font-semibold text-indigo-600 hover:underline flex items-center gap-1 mt-1 truncate"
                  >
                    <Contact2 size={11} className="shrink-0" />
                    <span className="truncate">{client.name}</span>
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                <span className="truncate font-medium">{assignee?.name || 'Unassigned'}</span>
                <button
                  onClick={() => onUpdateStatus(task.id, 'Done')}
                  className="px-2.5 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-extrabold rounded-lg text-[10px] transition-colors flex items-center gap-1"
                >
                  <Check size={12} /> Mark Done
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
