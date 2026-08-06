import React from 'react';
import { LayoutDashboard, Users, BrainCircuit, ClipboardList, Contact2, LogOut, UserCheck, Calendar, Receipt } from 'lucide-react';
import { Employee } from '../types';

interface SidebarProps {
  currentView: string;
  setView: (view: 'dashboard' | 'directory' | 'ai-insights' | 'assignments' | 'clients' | 'leaves' | 'expenses') => void;
  currentRoleId?: string;
  employees?: Employee[];
  onLogout?: () => void;
  onSwitchProfile?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  currentView, 
  setView, 
  currentRoleId = 'admin', 
  employees = [], 
  onLogout,
  onSwitchProfile 
}) => {
  const currentEmployee = currentRoleId !== 'admin' ? employees.find(e => e.id === currentRoleId) : null;
  const isAdmin = currentRoleId === 'admin' || currentEmployee?.accessLevel === 'admin';

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'clients', label: 'Clients', icon: Contact2 },
    { id: 'assignments', label: 'Work Tracking', icon: ClipboardList },
    { id: 'expenses', label: 'Work Expenses', icon: Receipt, adminOnly: true },
    { id: 'leaves', label: 'Leave Management', icon: Calendar },
    { id: 'directory', label: 'Employee Management', icon: Users, adminOnly: true },
    { id: 'ai-insights', label: 'AI Strategy Hub', icon: BrainCircuit },
  ].filter(item => isAdmin || !item.adminOnly);

  return (
    <aside className="w-64 bg-slate-900 h-screen fixed left-0 top-0 text-white flex flex-col z-20">
      <div className="p-6 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center font-black text-xl shadow-md">
            C
          </div>
          <div>
            <h1 className="font-extrabold text-lg leading-tight tracking-tight">Convex</h1>
            <p className="text-xs text-indigo-300 font-medium">Entertainments</p>
          </div>
        </div>
      </div>
      
      <nav className="flex-1 mt-6 px-4 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id as any)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium text-sm ${
              currentView === item.id 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 font-bold' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <item.icon size={20} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* User Profile & Logout Area */}
      <div className="p-4 border-t border-slate-800 space-y-3">
        <div className="flex items-center gap-3 p-3 bg-slate-800/80 rounded-2xl border border-slate-700/50">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white overflow-hidden flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
            {currentEmployee?.profilePicture ? (
              <img src={currentEmployee.profilePicture} alt={currentEmployee.name} className="w-full h-full object-cover" />
            ) : currentEmployee ? (
              currentEmployee.name.charAt(0)
            ) : (
              '👑'
            )}
          </div>

          <div className="overflow-hidden flex-1">
            <p className="text-xs font-bold text-white truncate">
              {currentEmployee ? currentEmployee.name : 'Studio Director'}
            </p>
            <p className="text-[11px] text-indigo-300 truncate font-medium">
              {currentEmployee ? currentEmployee.role : 'System Admin'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {onSwitchProfile && (
            <button
              onClick={onSwitchProfile}
              className="py-2 px-2.5 bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
              title="Switch Profile"
            >
              <UserCheck size={14} />
              <span>Switch</span>
            </button>
          )}

          {onLogout && (
            <button
              onClick={onLogout}
              className="py-2 px-2.5 bg-red-500/10 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/20 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
              title="Log Out of System"
            >
              <LogOut size={14} />
              <span>Log Out</span>
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
