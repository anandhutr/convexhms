import React, { useState } from 'react';
import { Employee } from '../types';
import { 
  Search, Filter, Edit2, Eye, UserPlus, Users, RotateCcw, Archive, 
  Phone, Mail, Calendar, Award, ShieldCheck, User 
} from 'lucide-react';
import { DEPARTMENTS } from '../constants';

interface EmployeeListProps {
  employees: Employee[];
  isAdmin?: boolean;
  onEdit: (employee: Employee | null) => void;
  onDelete: (id: string) => void;
  onView: (employee: Employee) => void;
  onReactivate?: (id: string) => void;
  onNewWork?: () => void;
  onNewClient?: () => void;
  onUpdateAccessLevel?: (employeeId: string, newAccess: 'admin' | 'employee') => void;
}

export const EmployeeList: React.FC<EmployeeListProps> = ({ 
  employees, 
  isAdmin = true, 
  onEdit, 
  onDelete, 
  onView,
  onReactivate,
  onUpdateAccessLevel
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDept, setFilterDept] = useState<string>('All');

  const activeEmployees = employees.filter(e => e.status !== 'Terminated' && (e as any).status !== 'Archived');

  const filtered = activeEmployees.filter(e => {
    const matchesSearch = e.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         e.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (e.phone && e.phone.includes(searchTerm)) ||
                         e.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = filterDept === 'All' || e.department === filterDept;
    return matchesSearch && matchesDept;
  });

  const handleResetFilters = () => {
    setSearchTerm('');
    setFilterDept('All');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header & Search Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 px-3.5 py-2 rounded-xl text-xs font-extrabold text-indigo-700 shrink-0 shadow-2xs">
            <Users size={16} />
            <span>Active Team Members ({activeEmployees.length})</span>
          </div>

          <div className="relative w-full md:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search by name, role, phone or email..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-medium text-slate-800"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-start md:justify-end">
          {isAdmin && (
            <button
              type="button"
              onClick={() => onEdit(null)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5 shrink-0"
            >
              <UserPlus size={16} />
              <span>Add New Employee</span>
            </button>
          )}

          <div className="flex items-center gap-2 pl-2 border-l border-slate-200 shrink-0">
            <Filter className="text-slate-400" size={16} />
            <select
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-extrabold text-slate-700"
              value={filterDept}
              onChange={(e) => setFilterDept(e.target.value)}
            >
              <option value="All">All Departments</option>
              {DEPARTMENTS.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* CARDS GRID LAYOUT */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {filtered.map((e) => {
          const isArchivedRow = e.status === 'Terminated' || (e as any).status === 'Archived';
          return (
            <div 
              key={e.id}
              className="bg-white rounded-3xl border border-slate-200 shadow-2xs hover:shadow-md hover:border-indigo-300 transition-all p-5 flex flex-col justify-between space-y-4 group relative overflow-hidden"
            >
              {/* Top Card Header: Avatar, Name, Role & Dept Tag */}
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-13 h-13 rounded-2xl bg-indigo-50 border-2 border-indigo-100 overflow-hidden flex items-center justify-center font-black text-indigo-700 shrink-0 shadow-2xs text-lg">
                      {e.profilePicture ? (
                        <img src={e.profilePicture} alt={e.name} className="w-full h-full object-cover" />
                      ) : (
                        <span>{e.name.charAt(0)}</span>
                      )}
                    </div>

                    <div className="min-w-0">
                      <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5 truncate">
                        <span className="truncate">{e.name}</span>
                        {isArchivedRow && (
                          <span className="px-2 py-0.2 bg-amber-100 text-amber-800 text-[9px] font-black rounded-full shrink-0">
                            Archived
                          </span>
                        )}
                      </h3>
                      <p className="text-xs font-bold text-slate-600 truncate mt-0.5">{e.role}</p>
                      <span className="inline-block mt-1 px-2.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 text-[10px] font-extrabold rounded-md uppercase tracking-wider">
                        {e.department}
                      </span>
                    </div>
                  </div>

                  {/* Access Level Badge / Dropdown */}
                  {isAdmin && onUpdateAccessLevel && !isArchivedRow ? (
                    <select
                      value={e.accessLevel || 'employee'}
                      onChange={(evt) => onUpdateAccessLevel(e.id, evt.target.value as 'admin' | 'employee')}
                      className={`px-2 py-1 rounded-xl text-[11px] font-extrabold border transition-all cursor-pointer shrink-0 ${
                        e.accessLevel === 'admin' 
                          ? 'bg-amber-50 text-amber-800 border-amber-300' 
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      <option value="employee">👤 Staff</option>
                      <option value="admin">👑 Admin</option>
                    </select>
                  ) : (
                    <span className={`px-2.5 py-1 rounded-xl text-[10px] font-extrabold shrink-0 ${
                      e.accessLevel === 'admin' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {e.accessLevel === 'admin' ? '👑 Admin' : '👤 Staff'}
                    </span>
                  )}
                </div>

                {/* Contact Information (Mandatory Phone & Email) */}
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl space-y-1.5 text-xs">
                  <div className="flex items-center gap-2 text-slate-700 font-bold">
                    <Phone size={13} className="text-indigo-600 shrink-0" />
                    <span>{e.phone || <span className="text-red-500 font-bold italic">+91 Mobile Mandatory</span>}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600 truncate">
                    <Mail size={13} className="text-slate-400 shrink-0" />
                    <span className="truncate">{e.email}</span>
                  </div>
                </div>

                {/* Performance & Status Row */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-semibold text-[11px]">Performance Score</span>
                    <span className="font-extrabold text-indigo-700">{e.performanceScore} / 10</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5">
                    <div 
                      className="bg-indigo-600 h-1.5 rounded-full transition-all" 
                      style={{ width: `${Math.min(e.performanceScore * 10, 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Card Footer: Joined Date, Salary (Admin only) & Actions */}
              <div className="pt-3 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                  <div className="flex items-center gap-1">
                    <Calendar size={13} className="text-slate-400" />
                    <span>Joined: {e.dateJoined}</span>
                  </div>
                  {/* Financial Salary Details: Strictly RESTRICTED to Super Admin / Admin accounts only! */}
                  {isAdmin && (
                    <span className="font-black text-slate-900 bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-lg text-[11px]">
                      ₹{e.salary ? e.salary.toLocaleString() : '0'} / yr
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => onView(e)}
                    className="flex-1 py-2 bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 font-extrabold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5"
                  >
                    <Eye size={14} />
                    <span>View Profile</span>
                  </button>

                  {isAdmin && (
                    <div className="flex items-center gap-1">
                      {!isArchivedRow ? (
                        <>
                          <button
                            type="button"
                            onClick={() => onEdit(e)}
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
                            title="Edit Profile"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDelete(e.id)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                            title="Archive Employee"
                          >
                            <Archive size={16} />
                          </button>
                        </>
                      ) : (
                        onReactivate && (
                          <button
                            type="button"
                            onClick={() => onReactivate(e.id)}
                            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors"
                            title="Reactivate Account"
                          >
                            <RotateCcw size={16} />
                          </button>
                        )
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filtered.length === 0 && (
        <div className="py-16 px-6 text-center bg-white rounded-3xl border border-dashed border-slate-200">
          <div className="max-w-md mx-auto space-y-4">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm">
              <Users size={36} />
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900">No Team Members Found</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                {searchTerm || filterDept !== 'All' 
                  ? `No employees match "${searchTerm}" in the "${filterDept}" department.`
                  : 'Your employee directory is empty. Add new team members to get started.'}
              </p>
            </div>

            {(searchTerm || filterDept !== 'All') && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs transition-all inline-flex items-center gap-2"
              >
                <RotateCcw size={14} />
                <span>Reset Search Filters</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeList;
