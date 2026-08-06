import React from 'react';
import { LayoutDashboard, Users, BrainCircuit, ClipboardList, Contact2, LogOut, UserCheck, Calendar, Receipt, X } from 'lucide-react';
import { Employee } from '../types';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  employees: Employee[];
  currentRoleId?: string;
  onSwitchProfile?: () => void;
  onLogout?: () => void;
  onEditMyProfile?: () => void;
  isMobileOpen?: boolean;
  onCloseMobileMenu?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  currentView, 
  onNavigate, 
  employees,
  currentRoleId = 'admin', 
  onSwitchProfile,
  onLogout,
  onEditMyProfile,
  isMobileOpen = false,
  onCloseMobileMenu
}) => {
  const currentEmployee = currentRoleId !== 'admin' ? employees.find(e => e.id === currentRoleId) : null;
  const isAdmin = currentRoleId === 'admin' || currentEmployee?.accessLevel === 'admin';

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'clients', label: 'Clients', icon: Contact2 },
    { id: 'assignments', label: 'Work Tracking', icon: ClipboardList },
    { id: 'calendar', label: 'Calendar Tracker', icon: Calendar },
    { id: 'payroll', label: 'Crew Payout History', icon: Receipt, adminOnly: true },
    { id: 'expenses', label: 'Work Expenses', icon: Receipt, adminOnly: true },
    { id: 'leaves', label: 'Leave Management', icon: Calendar },
    { id: 'directory', label: 'Employee Management', icon: Users, adminOnly: true },
    { id: 'ai-insights', label: 'AI Strategy Hub', icon: BrainCircuit },
  ];

  return (
    <>
      {/* Mobile Drawer Overlay Backdrop */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 lg:hidden"
          onClick={onCloseMobileMenu}
        />
      )}

      <aside className={`w-64 bg-slate-900 text-slate-300 flex flex-col h-screen fixed left-0 top-0 border-r border-slate-800 shrink-0 z-50 transition-transform duration-300 ${
        isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        {/* Brand Header & Mobile Close */}
        <div className="p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 font-black text-base">
              C
            </div>
            <div>
              <h1 className="font-black text-sm text-white tracking-wide uppercase">CONVEX</h1>
              <p className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase">Studio Operations</p>
            </div>
          </div>

          {onCloseMobileMenu && (
            <button 
              onClick={onCloseMobileMenu}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors lg:hidden"
            >
              <X size={18} />
            </button>
          )}
        </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        {menuItems.map((item) => {
          if (item.adminOnly && !isAdmin) return null;

          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer Profile & Action Controls */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40 space-y-3">
        <div className="flex items-center gap-3 p-2 bg-slate-800/60 rounded-xl border border-slate-800">
          <div className="w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center font-black text-xs shrink-0 overflow-hidden">
            {currentEmployee?.profilePicture ? (
              <img src={currentEmployee.profilePicture} className="w-full h-full object-cover" alt={currentEmployee.name} />
            ) : (
              '👑'
            )}
          </div>

          <div className="overflow-hidden flex-1">
            <p className="text-xs font-bold text-white truncate">
              {currentEmployee ? currentEmployee.name : 'System Admin'}
            </p>
            <p className="text-[10px] text-indigo-300 truncate font-medium">
              {currentEmployee ? currentEmployee.role : 'System Admin'}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          {currentEmployee && onEditMyProfile && (
            <button
              type="button"
              onClick={onEditMyProfile}
              className="w-full py-2 px-2.5 bg-indigo-600/30 hover:bg-indigo-600 text-indigo-200 hover:text-white border border-indigo-500/30 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
              title="Edit My Profile"
            >
              <UserCheck size={14} />
              <span>Edit My Profile</span>
            </button>
          )}

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
      </div>
    </aside>
    </>
  );
};

export default Sidebar;
