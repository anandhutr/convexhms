import React, { useState } from 'react';
import { Employee } from '../types';
import { Search, Filter, Edit2, Trash2, Eye, UserPlus, Users, RotateCcw, Archive } from 'lucide-react';
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

const EmployeeList: React.FC<EmployeeListProps> = ({ 
  employees, 
  isAdmin = true, 
  onEdit, 
  onDelete, 
  onView,
  onReactivate,
  onNewWork,
  onNewClient,
  onUpdateAccessLevel
}) => {
  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDept, setFilterDept] = useState<string>('All');

  const activeEmployees = employees.filter(e => e.status !== 'Terminated' && (e as any).status !== 'Archived');
  const archivedEmployees = employees.filter(e => e.status === 'Terminated' || (e as any).status === 'Archived');

  const currentList = activeTab === 'active' ? activeEmployees : archivedEmployees;

  const filtered = currentList.filter(e => {
    const matchesSearch = e.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         e.role.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = filterDept === 'All' || e.department === filterDept;
    return matchesSearch && matchesDept;
  });

  const handleResetFilters = () => {
    setSearchTerm('');
    setFilterDept('All');
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden space-y-0">
      {/* Top Bar with Search & Tab Selection */}
      <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Active vs Archived Crew Tab Toggle */}
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('active')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'active' 
                  ? 'bg-white text-indigo-700 shadow-2xs font-extrabold' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users size={14} />
              <span>Active Crew ({activeEmployees.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('archived')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'archived' 
                  ? 'bg-white text-amber-800 shadow-2xs font-extrabold' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Archive size={14} />
              <span>Archived Staff ({archivedEmployees.length})</span>
            </button>
          </div>

          <div className="relative w-full md:w-64 hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search by name or role..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-start md:justify-end">
          {isAdmin && (
            <button
              type="button"
              onClick={() => onEdit(null)}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 shrink-0"
            >
              <UserPlus size={15} />
              <span>New Employee</span>
            </button>
          )}

          <div className="flex items-center gap-2 pl-2 border-l border-slate-200 shrink-0">
            <Filter className="text-slate-400" size={16} />
            <select
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-medium"
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

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Employee</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Access Level</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Status</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Performance</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Joining Date</th>
              {isAdmin && <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Salary</th>}
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((e) => {
              const isArchivedRow = e.status === 'Terminated' || (e as any).status === 'Archived';
              return (
                <tr key={e.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 border border-indigo-200 overflow-hidden flex items-center justify-center font-bold shrink-0">
                        {e.profilePicture ? (
                          <img src={e.profilePicture} alt={e.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-indigo-600">{e.name.charAt(0)}</span>
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 flex items-center gap-2">
                          <span>{e.name}</span>
                          {isArchivedRow && (
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-extrabold rounded-full">
                              Archived
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-slate-500">{e.role} • {e.department}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {isAdmin && onUpdateAccessLevel && !isArchivedRow ? (
                      <select
                        value={e.accessLevel || 'employee'}
                        onChange={(evt) => onUpdateAccessLevel(e.id, evt.target.value as 'admin' | 'employee')}
                        className={`px-2.5 py-1 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                          e.accessLevel === 'admin' 
                            ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100' 
                            : 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
                        }`}
                      >
                        <option value="employee">👤 Employee</option>
                        <option value="admin">👑 Admin</option>
                      </select>
                    ) : (
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        e.accessLevel === 'admin' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {e.accessLevel === 'admin' ? '👑 Admin' : '👤 Employee'}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      isArchivedRow ? 'bg-amber-100 text-amber-800 font-bold' :
                      e.status === 'Active' ? 'bg-green-100 text-green-700' : 
                      e.status === 'On Leave' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {isArchivedRow ? 'Archived' : e.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-slate-100 rounded-full h-1.5">
                        <div 
                          className="bg-indigo-500 h-1.5 rounded-full" 
                          style={{ width: `${e.performanceScore * 10}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-slate-700">{e.performanceScore}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{e.dateJoined}</td>
                  {isAdmin && <td className="px-6 py-4 text-sm font-medium text-slate-900">${e.salary.toLocaleString()}</td>}
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => onView(e)} 
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" 
                        title="View Profile & Work Details"
                      >
                        <Eye size={18} />
                      </button>

                      {isAdmin && (
                        <>
                          {!isArchivedRow ? (
                            <>
                              <button 
                                onClick={() => onEdit(e)} 
                                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" 
                                title="Edit Profile"
                              >
                                <Edit2 size={18} />
                              </button>
                              <button 
                                onClick={() => onDelete(e.id)} 
                                className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" 
                                title="Archive Employee"
                              >
                                <Archive size={18} />
                              </button>
                            </>
                          ) : (
                            onReactivate && (
                              <button
                                onClick={() => onReactivate(e.id)}
                                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold rounded-xl text-xs transition-colors flex items-center gap-1"
                                title="Reactivate Account"
                              >
                                <RotateCcw size={14} />
                                <span>Reactivate</span>
                              </button>
                            )
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Helpful Empty State Illustration with CTA Buttons */}
        {filtered.length === 0 && (
          <div className="py-16 px-6 text-center bg-slate-50/50">
            <div className="max-w-md mx-auto space-y-4">
              <div className="w-20 h-20 mx-auto rounded-3xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm">
                <Users size={36} />
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {activeTab === 'archived' ? 'No Archived Staff' : 'No Team Members Found'}
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {activeTab === 'archived'
                    ? 'There are no archived or terminated employees in your records.'
                    : searchTerm || filterDept !== 'All' 
                    ? `No employees match "${searchTerm}" in the "${filterDept}" department. Try adjusting or clearing your filters.`
                    : 'Your employee directory is empty. Start onboarding team members to assign project tasks.'}
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                {activeTab === 'active' && (
                  <button
                    onClick={() => onEdit(null)}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2"
                  >
                    <UserPlus size={16} />
                    Add New Employee
                  </button>
                )}

                {(searchTerm || filterDept !== 'All') && (
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
    </div>
  );
};

export default EmployeeList;
