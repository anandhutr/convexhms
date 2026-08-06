import React, { useState } from 'react';
import { Assignment } from '../types';
import { CheckSquare, Square, ChevronDown, ChevronUp } from 'lucide-react';

interface TaskProgressBarProps {
  task: Assignment;
  onToggleSubtask?: (taskId: string, subtaskId: string) => void;
  showSubtasksToggle?: boolean;
}

export const getTaskProgressData = (task: Assignment) => {
  const subtasks = task.subtasks || [];
  const total = subtasks.length;
  
  if (total > 0) {
    const completedCount = subtasks.filter(s => s.completed).length;
    let percent = Math.round((completedCount / total) * 100);
    if (task.status === 'Done') percent = 100;
    return {
      percent,
      completedCount,
      totalCount: total,
      label: `${completedCount} of ${total} sub-tasks`
    };
  }

  // Fallback if no subtasks defined
  if (task.status === 'Done') return { percent: 100, completedCount: 1, totalCount: 1, label: 'Completed (100%)' };
  if (task.status === 'Review') return { percent: 80, completedCount: 3, totalCount: 4, label: 'In Review (80%)' };
  if (task.status === 'In Progress') return { percent: 45, completedCount: 1, totalCount: 2, label: 'In Progress (45%)' };
  return { percent: 10, completedCount: 0, totalCount: 3, label: 'To Do (10%)' };
};

const TaskProgressBar: React.FC<TaskProgressBarProps> = ({ 
  task, 
  onToggleSubtask, 
  showSubtasksToggle = true 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { percent, completedCount, totalCount, label } = getTaskProgressData(task);
  const subtasks = task.subtasks || [];

  const getBarColor = (p: number) => {
    if (p === 100) return 'bg-emerald-500';
    if (p >= 60) return 'bg-indigo-600';
    if (p >= 30) return 'bg-blue-500';
    return 'bg-amber-500';
  };

  return (
    <div className="space-y-1.5 my-2">
      <div className="flex items-center justify-between text-[11px] font-bold">
        <span className="text-slate-500 flex items-center gap-1">
          <span className="text-slate-700">{label}</span>
        </span>
        <span className={`px-1.5 py-0.5 rounded text-[10px] font-black ${
          percent === 100 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
        }`}>
          {percent}%
        </span>
      </div>

      {/* Progress Bar Track */}
      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/80 p-0.5">
        <div 
          className={`h-full rounded-full transition-all duration-500 ${getBarColor(percent)}`}
          style={{ width: `${percent}%` }}
        />
      </div>

      {/* Interactive Sub-tasks Accordion */}
      {showSubtasksToggle && subtasks.length > 0 && (
        <div className="pt-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors"
          >
            {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            <span>{isExpanded ? 'Hide Sub-tasks Checklist' : `Checklist (${completedCount}/${totalCount})`}</span>
          </button>

          {isExpanded && (
            <div className="mt-2 space-y-1.5 p-2 bg-slate-50/90 rounded-xl border border-slate-200/60 text-xs animate-in fade-in duration-200">
              {subtasks.map(st => (
                <button
                  key={st.id}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onToggleSubtask) {
                      onToggleSubtask(task.id, st.id);
                    }
                  }}
                  className={`w-full flex items-center gap-2 p-1.5 rounded-lg text-left transition-colors ${
                    st.completed ? 'bg-emerald-50/80 text-slate-500 line-through' : 'hover:bg-white text-slate-800 font-medium'
                  }`}
                >
                  {st.completed ? (
                    <CheckSquare size={14} className="text-emerald-600 shrink-0" />
                  ) : (
                    <Square size={14} className="text-slate-400 shrink-0" />
                  )}
                  <span className="text-[11px] leading-tight">{st.title}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TaskProgressBar;
