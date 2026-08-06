import React, { useState, useEffect } from 'react';
import { X, Sparkles, RefreshCw, Contact2, Calendar, Plus, Trash2, CheckSquare, Square, ListTodo } from 'lucide-react';
import { Assignment, Employee, Client, Priority, AssignmentStatus, SubTask } from '../types';
import { suggestAssignee } from '../services/geminiService';

interface AssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (task: Partial<Assignment>) => void;
  employees: Employee[];
  clients: Client[];
  initialData?: Assignment | null;
  initialClientId?: string | null;
  initialEventId?: string | null;
}

const AssignmentModal: React.FC<AssignmentModalProps> = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  employees, 
  clients,
  initialData,
  initialClientId,
  initialEventId
}) => {
  const [loadingSuggestion, setLoadingSuggestion] = useState(false);
  const [suggestionReason, setSuggestionReason] = useState<string | null>(null);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  
  const [formData, setFormData] = useState<Partial<Assignment>>({
    title: '',
    description: '',
    assigneeId: employees[0]?.id || '',
    priority: 'Medium',
    status: 'To Do',
    dueDate: new Date().toISOString().split('T')[0],
    clientId: '',
    eventId: '',
    subtasks: []
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        clientId: initialData.clientId || '',
        eventId: initialData.eventId || '',
        subtasks: initialData.subtasks || []
      });
    } else {
      const defaultClientId = initialClientId || '';
      const defaultEventId = initialEventId || '';

      setFormData({
        title: '',
        description: '',
        assigneeId: employees[0]?.id || '',
        priority: 'Medium',
        status: 'To Do',
        dueDate: new Date().toISOString().split('T')[0],
        clientId: defaultClientId,
        eventId: defaultEventId,
        subtasks: []
      });
    }
    setSuggestionReason(null);
    setNewSubtaskTitle('');
  }, [initialData, initialClientId, initialEventId, isOpen]);

  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim()) return;
    const newSt: SubTask = {
      id: Math.random().toString(36).substr(2, 9),
      title: newSubtaskTitle.trim(),
      completed: false
    };
    setFormData(prev => ({
      ...prev,
      subtasks: [...(prev.subtasks || []), newSt]
    }));
    setNewSubtaskTitle('');
  };

  const handleToggleSubtaskInModal = (subtaskId: string) => {
    setFormData(prev => ({
      ...prev,
      subtasks: (prev.subtasks || []).map(st => 
        st.id === subtaskId ? { ...st, completed: !st.completed } : st
      )
    }));
  };

  const handleRemoveSubtask = (subtaskId: string) => {
    setFormData(prev => ({
      ...prev,
      subtasks: (prev.subtasks || []).filter(st => st.id !== subtaskId)
    }));
  };

  const handleAddDefaultCheckpoints = () => {
    const defaults: SubTask[] = [
      { id: Math.random().toString(36).substr(2, 9), title: 'Equipment & Crew Prep Briefing', completed: false },
      { id: Math.random().toString(36).substr(2, 9), title: 'Footage Ingestion & Media Backup', completed: false },
      { id: Math.random().toString(36).substr(2, 9), title: 'Primary Cut & Color Grading', completed: false },
      { id: Math.random().toString(36).substr(2, 9), title: 'Client Review & Final Export', completed: false }
    ];
    setFormData(prev => ({
      ...prev,
      subtasks: [...(prev.subtasks || []), ...defaults]
    }));
  };

  const selectedClient = clients.find(c => c.id === formData.clientId);

  const handleClientChange = (newClientId: string) => {
    const clientObj = clients.find(c => c.id === newClientId);
    const firstEventId = clientObj?.events[0]?.id || '';

    setFormData(prev => {
      const updated = {
        ...prev,
        clientId: newClientId,
        eventId: firstEventId
      };

      // Auto-suggest title if blank
      if (!prev.title && clientObj) {
        const evType = clientObj.events[0]?.type || 'Event';
        updated.title = `${evType} Production for ${clientObj.name}`;
      }

      return updated;
    });
  };

  const handleEventChange = (newEventId: string) => {
    setFormData(prev => ({ ...prev, eventId: newEventId }));
  };

  const handleSmartSuggest = async () => {
    if (!formData.title || !formData.description) {
      alert("Please fill in the title and description first.");
      return;
    }
    setLoadingSuggestion(true);
    const result = await suggestAssignee(formData.title, formData.description, employees);
    
    const matchId = result.match(/RECOMMENDED_ID:\s*(\S+)/);
    const matchReason = result.match(/REASON:\s*(.+)/);
    
    if (matchId && matchId[1]) {
      setFormData(prev => ({ ...prev, assigneeId: matchId[1].trim() }));
      setSuggestionReason(matchReason ? matchReason[1] : "AI suggested based on skills.");
    }
    setLoadingSuggestion(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-800">
              {initialData ? 'Edit Work Assignment' : 'New Studio Work Assignment'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Assign work derived from client CRM confirmed projects.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <form className="p-6 space-y-4 max-h-[80vh] overflow-y-auto" onSubmit={(e) => {
          e.preventDefault();
          onSubmit(formData);
        }}>

          {/* Client & Confirmed Work Selection */}
          <div className="p-4 bg-indigo-50/60 border border-indigo-100 rounded-2xl space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-700 uppercase tracking-wider">
              <Contact2 size={16} />
              Assign Work From Client CRM
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Select Client</label>
                <select
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                  value={formData.clientId || ''}
                  onChange={e => handleClientChange(e.target.value)}
                >
                  <option value="">Internal Studio / General Task</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.status})
                    </option>
                  ))}
                </select>
              </div>

              {selectedClient && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Confirmed Event / Project</label>
                  <select
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                    value={formData.eventId || ''}
                    onChange={e => handleEventChange(e.target.value)}
                  >
                    <option value="">All Events for {selectedClient.name}</option>
                    {selectedClient.events.map(ev => (
                      <option key={ev.id} value={ev.id}>
                        {ev.type} ({ev.date || 'TBD'})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-700">Task Title</label>
            <input 
              required
              placeholder="e.g. Color Grade Wedding Highlights for Rohan & Ananya"
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-700">Description & Deliverables</label>
            <textarea 
              required
              rows={3}
              placeholder="Detailed production instructions, deliverables, or technical specs..."
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700">Priority</label>
              <select 
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                value={formData.priority}
                onChange={e => setFormData({...formData, priority: e.target.value as Priority})}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700">Due Date</label>
              <input 
                type="date"
                required
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                value={formData.dueDate}
                onChange={e => setFormData({...formData, dueDate: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-slate-700">Assign To</label>
              <button
                type="button"
                onClick={handleSmartSuggest}
                disabled={loadingSuggestion}
                className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 disabled:opacity-50"
              >
                {loadingSuggestion ? <RefreshCw className="animate-spin" size={12} /> : <Sparkles size={12} />}
                Smart Suggest
              </button>
            </div>
            <select 
              required
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              value={formData.assigneeId}
              onChange={e => setFormData({...formData, assigneeId: e.target.value})}
            >
              <option value="">Select an employee</option>
              {employees.map(e => (
                <option key={e.id} value={e.id}>{e.name} ({e.role})</option>
              ))}
            </select>
            {suggestionReason && (
              <p className="text-[10px] text-indigo-500 bg-indigo-50 p-2 rounded-lg italic">
                <strong>Gemini:</strong> {suggestionReason}
              </p>
            )}
          </div>

          {/* Sub-tasks & Checkpoints Section */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                <ListTodo size={16} className="text-indigo-600" />
                Sub-tasks & Progress Checkpoints ({formData.subtasks?.length || 0})
              </label>
              
              <button
                type="button"
                onClick={handleAddDefaultCheckpoints}
                className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
              >
                + Add Standard Production Checkpoints
              </button>
            </div>

            {/* List of current subtasks */}
            {formData.subtasks && formData.subtasks.length > 0 && (
              <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                {formData.subtasks.map((st) => (
                  <div 
                    key={st.id} 
                    className={`flex items-center justify-between p-2 rounded-xl border text-xs transition-colors ${
                      st.completed ? 'bg-emerald-50/60 border-emerald-200 text-slate-500' : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleToggleSubtaskInModal(st.id)}
                      className="flex items-center gap-2 font-medium flex-1 text-left"
                    >
                      {st.completed ? (
                        <CheckSquare size={16} className="text-emerald-600 shrink-0" />
                      ) : (
                        <Square size={16} className="text-slate-400 shrink-0" />
                      )}
                      <span className={st.completed ? 'line-through' : ''}>{st.title}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRemoveSubtask(st.id)}
                      className="p-1 text-slate-400 hover:text-red-600 rounded-lg transition-colors ml-2 shrink-0"
                      title="Delete sub-task"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add new subtask row */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add a sub-task or checkpoint step..."
                className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                value={newSubtaskTitle}
                onChange={e => setNewSubtaskTitle(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSubtask();
                  }
                }}
              />
              <button
                type="button"
                onClick={handleAddSubtask}
                className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl text-xs transition-colors flex items-center gap-1 shrink-0"
              >
                <Plus size={14} />
                Add Step
              </button>
            </div>
          </div>

          {initialData && (
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700">Status</label>
              <select 
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                value={formData.status}
                onChange={e => setFormData({...formData, status: e.target.value as AssignmentStatus})}
              >
                <option value="To Do">To Do</option>
                <option value="In Progress">In Progress</option>
                <option value="Review">Review</option>
                <option value="Done">Done</option>
              </select>
            </div>
          )}
          
          <div className="pt-4 flex gap-3 justify-end">
            <button 
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-slate-600 font-semibold hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/30"
            >
              {initialData ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AssignmentModal;
