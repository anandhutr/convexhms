import React, { useState } from 'react';
import { Employee, Assignment, TaskExpense, Client } from '../types';
import { 
  DollarSign, Calendar, Search, Filter, CheckCircle2, 
  User, Briefcase, ChevronLeft, ChevronRight, Phone, Mail, Award, 
  Edit2, Check, X, Eye, FileText, ArrowUpRight 
} from 'lucide-react';
import { saveAssignmentToFirestore } from '../services/firestoreService';

interface MonthlyPayrollHistoryProps {
  employees: Employee[];
  assignments: Assignment[];
  expenses: TaskExpense[];
  clients: Client[];
  isAdmin?: boolean;
}

export const MonthlyPayrollHistory: React.FC<MonthlyPayrollHistoryProps> = ({
  employees = [],
  assignments = [],
  expenses = [],
  clients = [],
  isAdmin = true,
}) => {
  const today = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(today.getMonth()); // 0-indexed
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State for Crew Detail & Work Payout Update
  const [selectedEmployeeForModal, setSelectedEmployeeForModal] = useState<Employee | null>(null);
  const [taskPayoutInputs, setTaskPayoutInputs] = useState<Record<string, string>>({});
  const [savedSuccessTaskId, setSavedSuccessTaskId] = useState<string | null>(null);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const prevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(prev => prev - 1);
    } else {
      setSelectedMonth(prev => prev - 1);
    }
  };

  const nextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(prev => prev + 1);
    } else {
      setSelectedMonth(prev => prev + 1);
    }
  };

  // Helper to check if date falls in selected year & month
  const isInSelectedMonth = (dateStr?: string) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    return d.getFullYear() === selectedYear && d.getMonth() === selectedMonth;
  };

  // Completed Tasks in selected month
  const completedTasksInMonth = assignments.filter(t => 
    t.status === 'Done' && (isInSelectedMonth(t.dueDate) || isInSelectedMonth(t.updatedAt))
  );

  // Expenses paid out in selected month
  const expensesInMonth = expenses.filter(e => isInSelectedMonth(e.date));

  // Filter employees
  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         emp.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         emp.department.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const handleUpdateTaskPayout = (task: Assignment, customVal?: string) => {
    const rawVal = customVal !== undefined ? customVal : taskPayoutInputs[task.id];
    const val = parseFloat(rawVal);
    if (isNaN(val) || val < 0) return;

    const updatedTask = {
      ...task,
      payoutAmount: val,
      payoutPaidDate: new Date().toISOString().split('T')[0]
    };

    saveAssignmentToFirestore(updatedTask);
    setSavedSuccessTaskId(task.id);
    setTimeout(() => setSavedSuccessTaskId(null), 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header & Month Selector */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2.5">
            <DollarSign className="text-emerald-600" size={24} />
            <span>Monthly Crew Payouts & Work Completion History</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Month-by-month history of finished production tasks, function shoots, and individual work payouts per crew member.
          </p>
        </div>

        {/* Month Navigation Controls */}
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 p-1.5 rounded-2xl shadow-2xs">
          <button
            type="button"
            onClick={prevMonth}
            className="p-2 hover:bg-white rounded-xl text-slate-700 transition-colors shadow-2xs"
            title="Previous Month"
          >
            <ChevronLeft size={18} />
          </button>

          <span className="px-4 font-black text-sm text-slate-900 min-w-[140px] text-center">
            {monthNames[selectedMonth]} {selectedYear}
          </span>

          <button
            type="button"
            onClick={nextMonth}
            className="p-2 hover:bg-white rounded-xl text-slate-700 transition-colors shadow-2xs"
            title="Next Month"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* KPI Overview Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-slate-900 to-indigo-950 p-5 rounded-3xl text-white shadow-sm space-y-1">
          <span className="text-[10px] font-black uppercase tracking-wider text-indigo-300">Total Monthly Payout Disbursed</span>
          <p className="text-2xl font-black text-emerald-400">
            ₹{(
              assignments
                .filter(t => t.status === 'Done' && (isInSelectedMonth(t.dueDate) || isInSelectedMonth(t.updatedAt)))
                .reduce((sum, t) => sum + (t.payoutAmount || 0), 0) +
              expenses
                .filter(e => isInSelectedMonth(e.date))
                .reduce((sum, e) => sum + e.amount, 0)
            ).toLocaleString()}
          </p>
          <p className="text-[11px] text-slate-300 font-medium">Work payouts + direct expenses in {monthNames[selectedMonth]}</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Finished Work Assignments</span>
          <p className="text-2xl font-black text-slate-900">{completedTasksInMonth.length}</p>
          <p className="text-[11px] text-slate-500 font-medium">Tasks completed in {monthNames[selectedMonth]}</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Active Talent Directory</span>
          <p className="text-2xl font-black text-indigo-600">{employees.length} Crew Members</p>
          <p className="text-[11px] text-slate-500 font-medium">HR, Video, Photo, Creative & Executive crew</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-3">
        <Search size={18} className="text-slate-400" />
        <input
          type="text"
          placeholder="Search crew history by name, role or department..."
          className="w-full text-xs font-medium bg-transparent border-none outline-none text-slate-800"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      {/* 4 CARDS PER ROW GRID LAYOUT */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {filteredEmployees.map(emp => {
          const empDoneTasks = completedTasksInMonth.filter(t => t.assigneeId === emp.id);
          const empExpensesPaid = expensesInMonth.filter(e => 
            e.paidToEmployeeId === emp.id || 
            (e.paidTo && e.paidTo.toLowerCase().includes(emp.name.toLowerCase()))
          );

          const totalTaskPayouts = empDoneTasks.reduce((sum, t) => sum + (t.payoutAmount || 0), 0);
          const totalExpensePayouts = empExpensesPaid.reduce((sum, e) => sum + e.amount, 0);
          const totalMonthlyCompensation = totalTaskPayouts + totalExpensePayouts;

          return (
            <div 
              key={emp.id}
              className="bg-white rounded-3xl border border-slate-200 shadow-2xs hover:shadow-md hover:border-indigo-300 transition-all p-5 flex flex-col justify-between space-y-4 group relative overflow-hidden"
            >
              <div className="space-y-3">
                {/* Header: Avatar, Name & Dept Badge */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 border-2 border-indigo-100 overflow-hidden flex items-center justify-center font-black text-indigo-700 text-base shrink-0 shadow-2xs">
                      {emp.profilePicture ? (
                        <img src={emp.profilePicture} alt={emp.name} className="w-full h-full object-cover" />
                      ) : (
                        <span>{emp.name.charAt(0)}</span>
                      )}
                    </div>

                    <div className="min-w-0">
                      <h3 className="font-extrabold text-slate-900 text-sm truncate">{emp.name}</h3>
                      <p className="text-[11px] font-bold text-slate-500 truncate mt-0.5">{emp.role}</p>
                    </div>
                  </div>

                  <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 text-[10px] font-extrabold rounded-md uppercase tracking-wider shrink-0">
                    {emp.department}
                  </span>
                </div>

                {/* Metrics Pill Box */}
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl space-y-1 text-xs">
                  <div className="flex justify-between items-center text-slate-600 font-semibold text-[11px]">
                    <span>Finished Work:</span>
                    <strong className="text-slate-900">{empDoneTasks.length} Task(s)</strong>
                  </div>
                  <div className="flex justify-between items-center text-slate-600 font-semibold text-[11px]">
                    <span>Direct Expenses:</span>
                    <strong className="text-slate-900">₹{totalExpensePayouts.toLocaleString()}</strong>
                  </div>
                </div>
              </div>

              {/* Card Footer: Total Payout & Open Detail Modal Button */}
              <div className="pt-3 border-t border-slate-100 space-y-3">
                <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-2xl text-center">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 block">
                    {monthNames[selectedMonth]} Payout
                  </span>
                  <span className="text-lg font-black text-emerald-800 block mt-0.5">
                    ₹{totalMonthlyCompensation.toLocaleString()}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedEmployeeForModal(emp)}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5"
                >
                  <Eye size={14} />
                  <span>View Finished Work & Pay</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ========================================================= */}
      {/* CREW MEMBER MONTHLY WORK PAYOUT DETAIL MODAL               */}
      {/* ========================================================= */}
      {selectedEmployeeForModal && (() => {
        const emp = selectedEmployeeForModal;
        const empDoneTasks = completedTasksInMonth.filter(t => t.assigneeId === emp.id);
        const empExpensesPaid = expensesInMonth.filter(e => 
          e.paidToEmployeeId === emp.id || 
          (e.paidTo && e.paidTo.toLowerCase().includes(emp.name.toLowerCase()))
        );

        const totalTaskPayouts = empDoneTasks.reduce((sum, t) => sum + (t.payoutAmount || 0), 0);
        const totalExpensePayouts = empExpensesPaid.reduce((sum, e) => sum + e.amount, 0);
        const totalMonthlyCompensation = totalTaskPayouts + totalExpensePayouts;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={() => setSelectedEmployeeForModal(null)} />
            
            <div className="relative bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
              {/* Modal Header */}
              <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600 border border-indigo-400 overflow-hidden flex items-center justify-center font-black text-white text-lg shrink-0">
                    {emp.profilePicture ? (
                      <img src={emp.profilePicture} alt={emp.name} className="w-full h-full object-cover" />
                    ) : (
                      <span>{emp.name.charAt(0)}</span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-white text-base flex items-center gap-2">
                      <span>{emp.name}</span>
                      <span className="px-2.5 py-0.5 bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 text-[10px] font-black rounded-md uppercase">
                        {emp.department}
                      </span>
                    </h3>
                    <p className="text-xs text-indigo-300 mt-0.5">
                      Monthly Work Payout Breakdown for <strong>{monthNames[selectedMonth]} {selectedYear}</strong>
                    </p>
                  </div>
                </div>

                <button 
                  onClick={() => setSelectedEmployeeForModal(null)} 
                  className="p-2 text-slate-400 hover:text-white rounded-full bg-white/10"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-6 flex-1">
                {/* Total Summary Card */}
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider block">Total Monthly Compensation</span>
                    <span className="text-2xl font-black text-emerald-900 mt-0.5 block">
                      ₹{totalMonthlyCompensation.toLocaleString()}
                    </span>
                  </div>

                  <div className="text-xs text-emerald-800 font-semibold space-y-0.5 text-right">
                    <p>Work Payouts: <strong>₹{totalTaskPayouts.toLocaleString()}</strong></p>
                    <p>Expenses / Advances: <strong>₹{totalExpensePayouts.toLocaleString()}</strong></p>
                  </div>
                </div>

                {/* Finished Work Tasks Section with Inline Update Payout Field */}
                <div className="space-y-3">
                  <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-600" />
                    <span>Finished Work Assignments & Payment Fields ({empDoneTasks.length})</span>
                  </h4>

                  {empDoneTasks.length > 0 ? (
                    <div className="space-y-3">
                      {empDoneTasks.map(task => {
                        const client = clients.find(c => c.id === task.clientId);
                        const currentInputVal = taskPayoutInputs[task.id] !== undefined 
                          ? taskPayoutInputs[task.id] 
                          : String(task.payoutAmount || '');

                        return (
                          <div 
                            key={task.id} 
                            className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 hover:border-indigo-300 transition-all"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-extrabold text-slate-900 text-sm">{task.title}</span>
                                  {client && (
                                    <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 text-[10px] font-bold rounded-md">
                                      Client: {client.name}
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-slate-500 mt-0.5">Completion Date: {task.dueDate}</p>
                              </div>

                              {/* Editable Payment Field Against Each Completed Work */}
                              <div className="flex items-center gap-2 shrink-0 bg-white p-2 rounded-xl border border-slate-200 shadow-2xs">
                                <span className="font-bold text-slate-700 text-xs">Payout (₹):</span>
                                <input
                                  type="number"
                                  min="0"
                                  placeholder="Enter Payout ₹"
                                  className="w-28 px-2.5 py-1 bg-slate-50 border border-slate-300 rounded-lg text-xs font-black text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                  value={currentInputVal}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setTaskPayoutInputs(prev => ({ ...prev, [task.id]: val }));
                                  }}
                                />

                                <button
                                  type="button"
                                  onClick={() => handleUpdateTaskPayout(task, currentInputVal)}
                                  className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-lg transition-all shadow-xs flex items-center gap-1"
                                >
                                  {savedSuccessTaskId === task.id ? (
                                    <>
                                      <Check size={13} className="text-emerald-300" />
                                      <span>Saved!</span>
                                    </>
                                  ) : (
                                    <span>Update Pay</span>
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs">
                      No finished work assignments recorded for this employee in {monthNames[selectedMonth]}.
                    </div>
                  )}
                </div>

                {/* Direct Expenses Tagged to Employee */}
                {empExpensesPaid.length > 0 && (
                  <div className="space-y-3 pt-3 border-t border-slate-100">
                    <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                      <FileText size={16} className="text-amber-600" />
                      <span>Direct Expenses / Advances Paid out ({empExpensesPaid.length})</span>
                    </h4>

                    <div className="space-y-2">
                      {empExpensesPaid.map(exp => (
                        <div key={exp.id} className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl flex justify-between items-center text-xs">
                          <div>
                            <span className="font-extrabold text-slate-900">{exp.title}</span>
                            <span className="text-[11px] text-amber-800 block mt-0.5">
                              Category: {exp.category} • Date: {exp.date}
                            </span>
                          </div>
                          <span className="font-black text-amber-900 bg-white px-3 py-1 rounded-xl border border-amber-300">
                            ₹{exp.amount.toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedEmployeeForModal(null)}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl transition-all"
                >
                  Close Detail Window
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default MonthlyPayrollHistory;
