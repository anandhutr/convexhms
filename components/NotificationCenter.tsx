import React from 'react';
import { SystemNotification, Assignment } from '../types';
import { 
  Bell, Check, X, AlertCircle, Edit2, Trash2, CheckCircle2, 
  MessageSquare, Receipt, PlusCircle, ShieldAlert, Sparkles, Clock 
} from 'lucide-react';

interface NotificationCenterProps {
  notifications: SystemNotification[];
  isOpen: boolean;
  onClose: () => void;
  isAdmin: boolean;
  onApproveRequest: (notification: SystemNotification) => void;
  onRejectRequest: (notification: SystemNotification) => void;
  onClearNotification: (notificationId: string) => void;
  onClearAll: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  notifications,
  isOpen,
  onClose,
  isAdmin,
  onApproveRequest,
  onRejectRequest,
  onClearNotification,
  onClearAll,
}) => {
  if (!isOpen) return null;

  const pendingRequests = notifications.filter(n => n.status === 'pending');

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={onClose} />
      
      <div className="relative bg-white w-full max-w-md h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-250">
        {/* Drawer Header */}
        <div className="p-5 border-b border-slate-100 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-500/20 text-indigo-300 rounded-xl border border-indigo-400/30 relative">
              <Bell size={18} />
              {pendingRequests.length > 0 && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full ring-2 ring-slate-900 animate-ping" />
              )}
            </div>
            <div>
              <h2 className="font-extrabold text-sm text-white">Function Notifications</h2>
              <p className="text-[10px] text-slate-300">Live studio activity & change requests</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {notifications.length > 0 && (
              <button
                onClick={onClearAll}
                className="text-[11px] text-slate-400 hover:text-white underline font-semibold mr-1"
              >
                Clear All
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
          {notifications.map((notif) => {
            const isPendingRequest = notif.status === 'pending' && (notif.type === 'edit_request' || notif.type === 'delete_request' || notif.type === 'assign_request');

            return (
              <div 
                key={notif.id} 
                className={`p-4 rounded-2xl border transition-all ${
                  isPendingRequest 
                    ? 'bg-amber-50/90 border-amber-300 shadow-sm' 
                    : 'bg-white border-slate-200 shadow-2xs'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`p-2 rounded-xl text-xs font-bold shrink-0 ${
                      notif.type === 'edit_request' ? 'bg-amber-500 text-white' :
                      notif.type === 'delete_request' ? 'bg-red-500 text-white' :
                      notif.type === 'assign_request' ? 'bg-blue-600 text-white' :
                      notif.type === 'task_created' ? 'bg-indigo-600 text-white' :
                      notif.type === 'status_change' ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-white'
                    }`}>
                      {notif.type === 'edit_request' ? <Edit2 size={14} /> :
                       notif.type === 'delete_request' ? <Trash2 size={14} /> :
                       notif.type === 'assign_request' ? <PlusCircle size={14} /> :
                       notif.type === 'status_change' ? <CheckCircle2 size={14} /> : <Bell size={14} />}
                    </div>

                    <div className="min-w-0">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">
                        {notif.type.replace('_', ' ')}
                      </span>
                      <h4 className="font-extrabold text-slate-900 text-xs truncate">{notif.title}</h4>
                    </div>
                  </div>

                  <button
                    onClick={() => onClearNotification(notif.id)}
                    className="text-slate-300 hover:text-slate-600 p-1"
                  >
                    <X size={13} />
                  </button>
                </div>

                <p className="text-xs text-slate-700 mt-2 font-medium leading-snug">{notif.message}</p>

                <div className="flex items-center justify-between text-[10px] text-slate-400 mt-3 pt-2 border-t border-slate-100 font-semibold">
                  <div className="flex items-center gap-1 text-slate-600">
                    <Clock size={11} />
                    <span>{new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <span>By: {notif.requestedBy?.name || 'System'}</span>
                </div>

                {/* Admin Approval Action Buttons for Edit/Delete Requests */}
                {isAdmin && isPendingRequest && (
                  <div className="mt-3 pt-3 border-t border-amber-200 flex items-center justify-end gap-2">
                    <button
                      onClick={() => onRejectRequest(notif)}
                      className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition-all"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => onApproveRequest(notif)}
                      className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1"
                    >
                      <Check size={13} />
                      Approve & Execute
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {notifications.length === 0 && (
            <div className="p-12 text-center text-slate-400 space-y-2">
              <Bell size={36} className="mx-auto text-slate-300" />
              <p className="font-bold text-slate-700 text-xs">No Notifications</p>
              <p className="text-[11px] text-slate-400">All function notifications and task edit requests will appear here in real-time.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationCenter;
