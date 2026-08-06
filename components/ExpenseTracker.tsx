import React, { useState } from 'react';
import { TaskExpense, Assignment, Client, Employee, ExpenseCategory } from '../types';
import { 
  Receipt, Plus, Search, Filter, IndianRupee, Briefcase, Calendar, 
  Trash2, User, CheckCircle2, TrendingUp, Tag, FileText, AlertCircle, Sparkles, X,
  Building2, ArrowUpRight, DollarSign, PieChart, Layers, Eye
} from 'lucide-react';

interface ExpenseTrackerProps {
  expenses: TaskExpense[];
  assignments: Assignment[];
  clients: Client[];
  employees: Employee[];
  currentRoleId: string;
  onSaveExpense: (expense: TaskExpense) => void;
  onDeleteExpense: (expenseId: string) => void;
}

const CATEGORIES: { name: ExpenseCategory; color: string; icon: string }[] = [
  { name: 'Travel', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: '✈️' },
  { name: 'Equipment', color: 'bg-purple-100 text-purple-700 border-purple-200', icon: '📷' },
  { name: 'Food & Stay', color: 'bg-amber-100 text-amber-800 border-amber-200', icon: '🏨' },
  { name: 'Freelancer/Vendor', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: '🤝' },
  { name: 'Software/Assets', color: 'bg-cyan-100 text-cyan-700 border-cyan-200', icon: '💻' },
  { name: 'Other', color: 'bg-slate-100 text-slate-700 border-slate-200', icon: '📦' },
];

export const ExpenseTracker: React.FC<ExpenseTrackerProps> = ({
  expenses = [],
  assignments = [],
  clients = [],
  employees = [],
  currentRoleId,
  onSaveExpense,
  onDeleteExpense,
}) => {
  const [activeTab, setActiveTab] = useState<'client-ledger' | 'all-expenses'>('client-ledger');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedClientFilter, setSelectedClientFilter] = useState<string>('All');

  // Selected Client for Detail Modal
  const [selectedClientForDetail, setSelectedClientForDetail] = useState<Client | null>(null);

  // Expense Add Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState<ExpenseCategory>('Travel');
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [expenseNotes, setExpenseNotes] = useState('');
  const [paidToPerson, setPaidToPerson] = useState('');

  const currentEmp = employees.find(e => e.id === currentRoleId);
  const isAdmin = currentRoleId === 'admin' || currentEmp?.accessLevel === 'admin';

  const handleOpenAddModal = (clientId?: string, assignmentId?: string) => {
    setExpenseTitle('');
    setExpenseAmount('');
    setExpenseCategory('Travel');
    setPaidToPerson('');
    
    const prefilledClient = clientId || (clients[0]?.id || '');
    setSelectedClientId(prefilledClient);
    
    const clientTasks = assignments.filter(a => a.clientId === prefilledClient);
    setSelectedAssignmentId(assignmentId || (clientTasks[0]?.id || ''));
    
    setExpenseDate(new Date().toISOString().split('T')[0]);
    setExpenseNotes('');
    setIsModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseTitle.trim() || !expenseAmount || parseFloat(expenseAmount) <= 0) {
      alert('Please enter a valid expense title and amount.');
      return;
    }

    const targetClientId = selectedClientId || (selectedClientForDetail ? selectedClientForDetail.id : '');
    const linkedClient = clients.find(c => c.id === targetClientId);
    const linkedAssignment = assignments.find(a => a.id === selectedAssignmentId);
    const matchedEmp = employees.find(emp => emp.name.toLowerCase() === paidToPerson.trim().toLowerCase());

    const newExpense: TaskExpense = {
      id: 'exp_' + Date.now(),
      clientId: targetClientId || undefined,
      clientName: linkedClient?.name || (targetClientId ? 'Client Work' : undefined),
      assignmentId: selectedAssignmentId || 'general',
      assignmentTitle: linkedAssignment ? linkedAssignment.title : (linkedClient ? `${linkedClient.name} - General Work` : 'General Studio Expense'),
      title: expenseTitle.trim(),
      amount: parseFloat(expenseAmount),
      category: expenseCategory,
      date: expenseDate || new Date().toISOString().split('T')[0],
      addedBy: currentRoleId,
      addedByName: currentEmp ? currentEmp.name : 'Admin',
      paidTo: paidToPerson.trim() || undefined,
      paidToEmployeeId: matchedEmp?.id,
      notes: expenseNotes.trim(),
      status: isAdmin ? 'Approved' : 'Pending'
    };

    onSaveExpense(newExpense);
    setExpenseTitle('');
    setExpenseAmount('');
    setPaidToPerson('');
    setExpenseNotes('');
    setIsModalOpen(false);
  };

  // Helper calculations for expenses per client
  const getClientExpenses = (clientId: string) => {
    return expenses.filter(e => e.clientId === clientId || assignments.some(a => a.clientId === clientId && a.id === e.assignmentId));
  };

  const getClientTotalExpenses = (clientId: string) => {
    return getClientExpenses(clientId).reduce((sum, e) => sum + e.amount, 0);
  };

  // Total summary stats
  const totalRevenueAllClients = clients.reduce((sum, c) => sum + (c.packagePrice || 0), 0);
  const totalExpensesAllLogs = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalNetProfitAllClients = totalRevenueAllClients - totalExpensesAllLogs;
  const overallProfitMargin = totalRevenueAllClients > 0 ? Math.round((totalNetProfitAllClients / totalRevenueAllClients) * 100) : 0;

  // Filter clients
  const filteredClients = clients.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (c.location || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClientFilter = selectedClientFilter === 'All' || c.id === selectedClientFilter;
    return matchesSearch && matchesClientFilter;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2.5">
            <Receipt className="text-indigo-600" size={24} />
            <span>Work Expenses & Client Profitability Ledger</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Track client work revenues, incurred shoot expenses, recipient payouts, and real-time net profit margins.
          </p>
        </div>

        <button
          onClick={() => handleOpenAddModal()}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl text-xs transition-all shadow-md shadow-indigo-500/20 flex items-center gap-2"
        >
          <Plus size={16} />
          <span>Log New Work Expense</span>
        </button>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Work Revenues</span>
          <p className="text-2xl font-black text-slate-900">₹{totalRevenueAllClients.toLocaleString()}</p>
          <p className="text-[11px] text-slate-500 font-medium">{clients.length} Client Portfolios</p>
        </div>

        <div className="p-5 bg-amber-50/70 border border-amber-200 rounded-3xl shadow-2xs space-y-1">
          <span className="text-[10px] font-black uppercase tracking-wider text-amber-800">Total Work Expenses</span>
          <p className="text-2xl font-black text-amber-900">₹{totalExpensesAllLogs.toLocaleString()}</p>
          <p className="text-[11px] text-amber-700 font-medium">{expenses.length} Expense Logs</p>
        </div>

        <div className="p-5 bg-emerald-50/80 border border-emerald-200 rounded-3xl shadow-2xs space-y-1">
          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800">Net Studio Profit</span>
          <p className="text-2xl font-black text-emerald-900">₹{totalNetProfitAllClients.toLocaleString()}</p>
          <p className="text-[11px] text-emerald-700 font-medium">Margin: {overallProfitMargin}%</p>
        </div>

        <div className="p-5 bg-slate-900 text-white rounded-3xl shadow-2xs space-y-1">
          <span className="text-[10px] font-black uppercase tracking-wider text-indigo-300">Active Talent & Vendors</span>
          <p className="text-2xl font-black text-indigo-400">{employees.length} Recipient Crew</p>
          <p className="text-[11px] text-slate-300 font-medium">Tagged to work expenses</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-3">
        <Search size={18} className="text-slate-400" />
        <input
          type="text"
          placeholder="Search client work expenses by client name or location..."
          className="w-full text-xs font-medium bg-transparent border-none outline-none text-slate-800"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      {/* ========================================================= */}
      {/* WORK EXPENSES CARDS GRID LAYOUT (3 CARDS PER ROW)         */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {filteredClients.map((client) => {
          const clientPkgRevenue = client.packagePrice || 0;
          const clientExpensesList = getClientExpenses(client.id);
          const clientTotalExpenses = getClientTotalExpenses(client.id);
          const clientNetProfit = clientPkgRevenue - clientTotalExpenses;
          const clientProfitMargin = clientPkgRevenue > 0 ? Math.round((clientNetProfit / clientPkgRevenue) * 100) : 0;

          return (
            <div 
              key={client.id}
              className="bg-white rounded-3xl border border-slate-200 shadow-2xs hover:shadow-md hover:border-indigo-300 transition-all p-5 space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                {/* Header: Client Name & Ceremony Tag */}
                <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 bg-gradient-to-br from-indigo-600 to-indigo-800 text-white rounded-2xl flex items-center justify-center font-black text-base shrink-0 shadow-2xs">
                      {client.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-extrabold text-slate-900 text-sm truncate">{client.name}</h3>
                      <p className="text-[11px] font-bold text-slate-500 truncate mt-0.5">
                        📍 {client.location || 'Studio Project'}
                      </p>
                    </div>
                  </div>

                  <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 text-[10px] font-extrabold rounded-md uppercase tracking-wider shrink-0">
                    {client.eventType}
                  </span>
                </div>

                {/* Financial Summary Pill Box */}
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl space-y-2 text-xs">
                  <div className="flex justify-between items-center text-slate-600 font-semibold text-[11px]">
                    <span>Work Revenue:</span>
                    <strong className="text-slate-900">₹{clientPkgRevenue.toLocaleString()}</strong>
                  </div>

                  <div className="flex justify-between items-center text-amber-800 font-semibold text-[11px]">
                    <span>Incurred Expenses:</span>
                    <strong className="text-amber-900">₹{clientTotalExpenses.toLocaleString()}</strong>
                  </div>

                  <div className="flex justify-between items-center pt-1 border-t border-slate-200/60">
                    <span className="text-slate-600 font-bold text-[11px]">Net Profit:</span>
                    <span className={`font-black text-xs ${clientNetProfit >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                      ₹{clientNetProfit.toLocaleString()} ({clientProfitMargin}%)
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Footer Action Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedClientForDetail(client)}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5"
                >
                  <Eye size={15} />
                  <span>View Expenses & Add Expense</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ========================================================= */}
      {/* CLIENT EXPENSE DETAIL & ADD EXPENSE MODAL WINDOW          */}
      {/* ========================================================= */}
      {selectedClientForDetail && (() => {
        const client = selectedClientForDetail;
        const clientPkgRevenue = client.packagePrice || 0;
        const clientExpensesList = getClientExpenses(client.id);
        const clientTotalExpenses = getClientTotalExpenses(client.id);
        const clientNetProfit = clientPkgRevenue - clientTotalExpenses;
        const clientProfitMargin = clientPkgRevenue > 0 ? Math.round((clientNetProfit / clientPkgRevenue) * 100) : 0;
        const clientTasks = assignments.filter(a => a.clientId === client.id);

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={() => setSelectedClientForDetail(null)} />

            <div className="relative bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
              {/* Header */}
              <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600 border border-indigo-400 overflow-hidden flex items-center justify-center font-black text-white text-lg shrink-0">
                    {client.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-white text-base flex items-center gap-2">
                      <span>{client.name}</span>
                      <span className="px-2.5 py-0.5 bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 text-[10px] font-black rounded-md uppercase">
                        {client.eventType}
                      </span>
                    </h3>
                    <p className="text-xs text-indigo-300 mt-0.5">
                      📍 {client.location || 'Studio Project'} • Revenue: <strong>₹{clientPkgRevenue.toLocaleString()}</strong>
                    </p>
                  </div>
                </div>

                <button 
                  onClick={() => setSelectedClientForDetail(null)} 
                  className="p-2 text-slate-400 hover:text-white rounded-full bg-white/10"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 overflow-y-auto space-y-6 flex-1">
                {/* Financial P&L Breakdown Card */}
                <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Revenue</span>
                    <span className="text-lg font-black text-slate-900">₹{clientPkgRevenue.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">Total Incurred</span>
                    <span className="text-lg font-black text-amber-900">₹{clientTotalExpenses.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">Net Profit</span>
                    <span className={`text-lg font-black ${clientNetProfit >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                      ₹{clientNetProfit.toLocaleString()} ({clientProfitMargin}%)
                    </span>
                  </div>
                </div>

                {/* Form to Add Expense directly for this Client */}
                <div className="p-5 bg-indigo-50/60 border border-indigo-200/80 rounded-2xl space-y-4">
                  <h4 className="font-extrabold text-indigo-950 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Plus size={14} className="text-indigo-600" />
                    <span>Log New Work Expense for {client.name}</span>
                  </h4>

                  <form onSubmit={handleFormSubmit} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">Expense Title / Item *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Travel Cab / Freelancer Drone Fee"
                          value={expenseTitle}
                          onChange={e => setExpenseTitle(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">Expense Amount (₹) *</label>
                        <input
                          type="number"
                          required
                          min="1"
                          placeholder="e.g. 12000"
                          value={expenseAmount}
                          onChange={e => setExpenseAmount(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-black text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">Paid To (Recipient / Crew / Vendor)</label>
                        <input
                          type="text"
                          placeholder="e.g. Arjun / Catering / CRE"
                          value={paidToPerson}
                          onChange={e => setPaidToPerson(e.target.value)}
                          list="modal-crew-recipients"
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                        <datalist id="modal-crew-recipients">
                          {employees.map(emp => (
                            <option key={emp.id} value={emp.name}>{emp.name} ({emp.role})</option>
                          ))}
                        </datalist>
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">Expense Category</label>
                        <select
                          value={expenseCategory}
                          onChange={e => setExpenseCategory(e.target.value as ExpenseCategory)}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        >
                          {CATEGORIES.map(c => (
                            <option key={c.name} value={c.name}>{c.icon} {c.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="flex justify-end pt-1">
                      <button
                        type="submit"
                        className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5"
                      >
                        <Plus size={14} />
                        <span>Save Expense & Deduct Net Profit</span>
                      </button>
                    </div>
                  </form>
                </div>

                {/* Itemized Incurred Expense Logs */}
                <div className="space-y-3">
                  <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider flex items-center justify-between">
                    <span>Incurred Expense Logs for {client.name} ({clientExpensesList.length})</span>
                    <span className="text-amber-800 font-black">Total: ₹{clientTotalExpenses.toLocaleString()}</span>
                  </h4>

                  {clientExpensesList.length > 0 ? (
                    <div className="space-y-2">
                      {clientExpensesList.map(exp => {
                        const catObj = CATEGORIES.find(c => c.name === exp.category) || CATEGORIES[5];
                        return (
                          <div key={exp.id} className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-3 text-xs">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-extrabold text-slate-900">{exp.title}</span>
                                <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase ${catObj.color}`}>
                                  {catObj.icon} {exp.category}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2 flex-wrap">
                                <span>📅 {exp.date}</span>
                                {exp.paidTo && (
                                  <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 text-[10px]">
                                    👤 Paid To: {exp.paidTo}
                                  </span>
                                )}
                              </p>
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                              <span className="font-black text-slate-900 text-sm">₹{exp.amount.toLocaleString()}</span>
                              {isAdmin && (
                                <button
                                  type="button"
                                  onClick={() => onDeleteExpense(exp.id)}
                                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Delete Expense"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs">
                      No expenses logged for {client.name} yet.
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedClientForDetail(null)}
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

export default ExpenseTracker;
