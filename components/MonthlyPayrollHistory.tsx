import React, { useState } from 'react';
import { Employee, Assignment, TaskExpense, Client } from '../types';
import { 
  DollarSign, Calendar, Search, Filter, CheckCircle2, 
  User, Briefcase, ChevronLeft, ChevronRight, Phone, Mail, Award, Edit2, Check 
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
  const [editingPayoutTaskId, setEditingPayoutTaskId] = useState<string | null>(null);
  const [tempPayoutValue, setTempPayoutValue] = useState<string>('');

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

  const handleSaveTaskPayout = (task: Assignment) => {
    const val = parseFloat(tempPayoutValue);
    if (isNaN(val) || val < 0) return;

    const updatedTask = {
      ...task,
      payoutAmount: val,
      payoutPaidDate: new Date().toISOString().split('T')[0]
    };

    saveAssignmentToFirestore(updatedTask);
    setEditingPayoutTaskId(null);
  };

  // Calculate monthly stats
  let totalDisbursedMonth = 0;
  let totalTasksCompletedMonth = completedTasksInMonth.length;

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
            Month-by-month history of completed production tasks, function shoots, and salary payouts per crew member.
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
            ₹{assignments
              .filter(t => t.status === 'Done' && (isInSelectedMonth(t.dueDate) || isInSelectedMonth(t.updatedAt)))
              .reduce((sum, t) => sum + (t.payoutAmount || 0), 0) +
              expenses
                .filter(e => isInSelectedMonth(e.date))
                .reduce((sum, e) => sum + e.amount, 0)
            }
          </p>
          <p className="text-[11px] text-slate-300 font-medium">Task compensation + logged expenses in {monthNames[selectedMonth]}</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Completed Work Tasks</span>
          <p className="text-2xl font-black text-slate-900">{totalTasksCompletedMonth}</p>
          <p className="text-[11px] text-slate-500 font-medium">Finished production tasks & function assignments</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Active Talent Pool</span>
          <p className="text-2xl font-black text-indigo-600">{employees.length} Crew Members</p>
          <p className="text-[11px] text-slate-500 font-medium">HR, Video, Photo, Creative & Management crew</p>
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

      {/* Crew Breakdown Cards */}
      <div className="space-y-4">
        {filteredEmployees.map(emp => {
          // Finished tasks for this employee in selected month
          const empDoneTasks = completedTasksInMonth.filter(t => t.assigneeId === emp.id);
          
          // Direct expenses paid to this employee in selected month
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
              className="bg-white rounded-3xl border border-slate-200 shadow-2xs hover:shadow-md transition-all p-5 space-y-4"
            >
              {/* Header: Employee Profile & Monthly Total */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 border-2 border-indigo-100 overflow-hidden flex items-center justify-center font-black text-indigo-700 text-lg shrink-0">
                    {emp.profilePicture ? (
                      <img src={emp.profilePicture} alt={emp.name} className="w-full h-full object-cover" />
                    ) : (
                      <span>{emp.name.charAt(0)}</span>
                    )}
                  </div>

                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                      <span>{emp.name}</span>
                      <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 text-[10px] font-extrabold rounded-md uppercase">
                        {emp.department}
                      </span>
                    </h3>
                    <p className="text-xs font-bold text-slate-500">{emp.role} • 📞 {emp.phone || 'No phone'}</p>
                  </div>
                </div>

                <div className="text-right shrink-0 bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-2xl">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 block">
                    Total Compensation ({monthNames[selectedMonth]})
                  </span>
                  <span className="text-xl font-black text-emerald-800">
                    ₹{totalMonthlyCompensation.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Completed Tasks History */}
              <div className="space-y-3">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-emerald-600" />
                  <span>Finished Work Assignments ({empDoneTasks.length})</span>
                </h4>

                {empDoneTasks.length > 0 ? (
                  <div className="space-y-2">
                    {empDoneTasks.map(task => {
                      const client = clients.find(c => c.id === task.clientId);
                      const isEditing = editingPayoutTaskId === task.id;

                      return (
                        <div key={task.id} className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-extrabold text-slate-900">{task.title}</span>
                              {client && (
                                <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 text-[10px] font-bold rounded-md">
                                  Client: {client.name}
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-500 mt-0.5">Completed Date: {task.dueDate}</p>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {isEditing ? (
                              <div className="flex items-center gap-1">
                                <span className="font-bold text-slate-700">₹</span>
                                <input
                                  type="number"
                                  className="w-24 px-2 py-1 bg-white border border-indigo-400 rounded-lg text-xs font-bold"
                                  value={tempPayoutValue}
                                  onChange={e => setTempPayoutValue(e.target.value)}
                                  placeholder="Amount"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleSaveTaskPayout(task)}
                                  className="p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                                  title="Save Payout"
                                >
                                  <Check size={14} />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className="font-black text-slate-900 bg-white border border-slate-200 px-3 py-1 rounded-xl">
                                  ₹{task.payoutAmount ? task.payoutAmount.toLocaleString() : '0'} Payout
                                </span>
                                {isAdmin && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingPayoutTaskId(task.id);
                                      setTempPayoutValue(String(task.payoutAmount || ''));
                                    }}
                                    className="p-1 text-slate-400 hover:text-indigo-600 rounded transition-colors"
                                    title="Set Task Payout"
                                  >
                                    <Edit2 size={14} />
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-2xl border border-dashed border-slate-200">
                    No completed work tasks logged for {emp.name} in {monthNames[selectedMonth]}.
                  </p>
                )}
              </div>

              {/* Direct Expenses Tagged / Paid to this Crew Member */}
              {empExpensesPaid.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                    Direct Expenses / Advances Paid to {emp.name}:
                  </h4>
                  <div className="space-y-1.5">
                    {empExpensesPaid.map(exp => (
                      <div key={exp.id} className="p-2.5 bg-amber-50/60 border border-amber-200/80 rounded-xl flex justify-between items-center text-xs">
                        <div>
                          <span className="font-bold text-slate-900">{exp.title}</span>
                          <span className="text-[10px] text-amber-800 block">Category: {exp.category} ({exp.date})</span>
                        </div>
                        <span className="font-black text-amber-900 bg-white px-2.5 py-0.5 rounded-lg border border-amber-300">
                          ₹{exp.amount.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MonthlyPayrollHistory;
