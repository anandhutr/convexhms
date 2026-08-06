import React, { useState } from 'react';
import { TaskExpense, Assignment, Client, Employee, ExpenseCategory } from '../types';
import { 
  Receipt, Plus, Search, Filter, IndianRupee, Briefcase, Calendar, 
  Trash2, User, CheckCircle2, TrendingUp, Tag, FileText, AlertCircle, Sparkles, X,
  Building2, ArrowUpRight, DollarSign, PieChart, Layers
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
  expenses,
  assignments,
  clients,
  employees,
  currentRoleId,
  onSaveExpense,
  onDeleteExpense,
}) => {
  const [activeTab, setActiveTab] = useState<'client-ledger' | 'all-expenses'>('client-ledger');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedClientFilter, setSelectedClientFilter] = useState<string>('All');

  // Modal state
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
    
    // Filter assignments for prefilled client
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

    const linkedClient = clients.find(c => c.id === selectedClientId);
    const linkedAssignment = assignments.find(a => a.id === selectedAssignmentId);
    const matchedEmp = employees.find(emp => emp.name.toLowerCase() === paidToPerson.trim().toLowerCase());

    const newExpense: TaskExpense = {
      id: 'exp_' + Date.now(),
      clientId: selectedClientId || undefined,
      clientName: linkedClient?.name || (selectedClientId ? 'Client Work' : undefined),
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
    setIsModalOpen(false);
  };

  // Helper calculation for expenses per client
  const getClientExpenses = (clientId: string) => {
    return expenses.filter(e => e.clientId === clientId || assignments.some(a => a.clientId === clientId && a.id === e.assignmentId));
  };

  const getClientTotalExpenses = (clientId: string) => {
    return getClientExpenses(clientId).reduce((sum, e) => sum + e.amount, 0);
  };

  // Grand totals across studio
  const totalRevenue = clients.reduce((sum, c) => sum + (c.packagePrice || 0), 0);
  const totalExpensesAll = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalNetProfit = totalRevenue - totalExpensesAll;
  const overallMargin = totalRevenue > 0 ? Math.round((totalNetProfit / totalRevenue) * 100) : 0;

  // Filtered client list for the ledger
  const filteredClients = clients.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.eventType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.location?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClient = selectedClientFilter === 'All' || c.id === selectedClientFilter;
    return matchesSearch && matchesClient;
  });

  // Filtered expenses for itemized feed
  const filteredExpenses = expenses.filter(exp => {
    const matchesSearch = exp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (exp.assignmentTitle && exp.assignmentTitle.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (exp.clientName && exp.clientName.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCat = selectedCategory === 'All' || exp.category === selectedCategory;
    const matchesClient = selectedClientFilter === 'All' || exp.clientId === selectedClientFilter;
    return matchesSearch && matchesCat && matchesClient;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner & Net Profit KPI Dashboard */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 lg:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="relative z-10 space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-3 py-1 bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 text-[10px] font-black uppercase rounded-full tracking-wider">
                  Client Financial Ledger
                </span>
                <span className="text-xs text-slate-400">• Revenue vs Work Expenses</span>
              </div>
              <h1 className="text-2xl lg:text-3xl font-black text-white tracking-tight flex items-center gap-3">
                <Receipt size={32} className="text-indigo-400" />
                <span>Work Expense & Client Net Profit Tracker</span>
              </h1>
              <p className="text-xs lg:text-sm text-slate-300 mt-1 max-w-xl">
                Every expense is tagged to a Client Work. Track Revenue generated from each client minus incurred shoot expenses to calculate real Net Profit.
              </p>
            </div>

            <button
              onClick={() => handleOpenAddModal()}
              className="px-5 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 text-xs shrink-0"
            >
              <Plus size={18} />
              <span>Log New Work Expense</span>
            </button>
          </div>

          {/* Studio Financial Snapshot Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-4 border-t border-indigo-800/40">
            <div className="p-3.5 bg-white/5 border border-white/10 rounded-2xl">
              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block">Total Client Revenue</span>
              <p className="text-xl lg:text-2xl font-black text-white mt-1">₹{totalRevenue.toLocaleString()}</p>
              <span className="text-[10px] text-slate-400 font-medium">Across {clients.length} Client Package(s)</span>
            </div>

            <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
              <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider block">Total Work Expenses</span>
              <p className="text-xl lg:text-2xl font-black text-amber-400 mt-1">₹{totalExpensesAll.toLocaleString()}</p>
              <span className="text-[10px] text-amber-200/70 font-medium">{expenses.length} Logged Expense Items</span>
            </div>

            <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
              <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider block">Total Net Profit</span>
              <p className="text-xl lg:text-2xl font-black text-emerald-400 mt-1">₹{totalNetProfit.toLocaleString()}</p>
              <span className="text-[10px] text-emerald-300/80 font-bold">Revenue - Incurred Expenses</span>
            </div>

            <div className="p-3.5 bg-indigo-500/10 border border-indigo-400/20 rounded-2xl">
              <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider block">Net Profit Margin</span>
              <p className="text-xl lg:text-2xl font-black text-indigo-300 mt-1">{overallMargin}%</p>
              <span className="text-[10px] text-indigo-200/80 font-bold">Overall Studio Profitability</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main View Switcher & Filter Controls */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl w-fit">
            <button
              onClick={() => setActiveTab('client-ledger')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'client-ledger'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building2 size={15} className="text-indigo-600" />
              <span>Client Works P&L Ledger ({clients.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('all-expenses')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'all-expenses'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Receipt size={15} className="text-indigo-600" />
              <span>Itemized Expenses List ({expenses.length})</span>
            </button>
          </div>

          {/* Search & Select Client Filter */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
              <input
                type="text"
                placeholder="Search Client or Work..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500/20 outline-none"
              />
            </div>

            <select
              value={selectedClientFilter}
              onChange={(e) => setSelectedClientFilter(e.target.value)}
              className="w-full sm:w-auto bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="All">All Clients ({clients.length})</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ================= TAB 1: CLIENT WORKS P&L LEDGER ================= */}
      {activeTab === 'client-ledger' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <PieChart size={18} className="text-indigo-600" />
              <span>Client Work Revenue, Expense & Net Profit Breakdown</span>
            </h2>
            <span className="text-xs text-slate-500 font-medium">Showing {filteredClients.length} Client Work Projects</span>
          </div>

          <div className="grid grid-cols-1 gap-5">
            {filteredClients.map((client) => {
              const clientPkgRevenue = client.packagePrice || 0;
              const clientAdvance = client.advancePayment || 0;
              const clientBalance = Math.max(0, clientPkgRevenue - clientAdvance);
              const clientExpensesList = getClientExpenses(client.id);
              const clientTotalExpenses = getClientTotalExpenses(client.id);
              const clientNetProfit = clientPkgRevenue - clientTotalExpenses;
              const clientProfitMargin = clientPkgRevenue > 0 ? Math.round((clientNetProfit / clientPkgRevenue) * 100) : 0;

              const clientTasks = assignments.filter(a => a.clientId === client.id);

              return (
                <div 
                  key={client.id}
                  className="bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all overflow-hidden"
                >
                  {/* Top Bar - Client Header */}
                  <div className="p-5 bg-slate-50 border-b border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-indigo-800 text-white rounded-2xl flex items-center justify-center font-black text-lg shadow-sm">
                        {client.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-extrabold text-base text-slate-900">{client.name}</h3>
                          <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full text-[10px] font-black uppercase">
                            {client.eventType}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                          📍 {client.location || 'Studio Project'} • 📅 {client.events.length} Shoot Functions • 📋 {clientTasks.length} Work Tasks
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenAddModal(client.id)}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all text-xs flex items-center gap-1.5 shadow-xs"
                      >
                        <Plus size={15} />
                        <span>Add Expense to Work</span>
                      </button>
                    </div>
                  </div>

                  {/* Financial Metrics Cards Grid */}
                  <div className="p-5 grid grid-cols-2 lg:grid-cols-4 gap-3 bg-white">
                    {/* Revenue Card */}
                    <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl">
                      <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Total Work Revenue</span>
                      <p className="text-lg font-black text-slate-900 mt-1">₹{clientPkgRevenue.toLocaleString()}</p>
                      <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-1">
                        <span className="text-emerald-600 font-bold">Advance: ₹{clientAdvance.toLocaleString()}</span>
                        <span>•</span>
                        <span className="text-amber-600 font-bold">Due: ₹{clientBalance.toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Total Expenses Card */}
                    <div className="p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-2xl">
                      <span className="text-[10px] font-extrabold text-amber-800 uppercase tracking-wider block">Work Expenses Incurred</span>
                      <p className="text-lg font-black text-amber-900 mt-1">₹{clientTotalExpenses.toLocaleString()}</p>
                      <span className="text-[10px] font-semibold text-amber-700 mt-1 block">
                        {clientExpensesList.length} expense log(s)
                      </span>
                    </div>

                    {/* Net Profit Card */}
                    <div className={`p-3.5 rounded-2xl border ${
                      clientNetProfit >= 0 
                        ? 'bg-emerald-50/80 border-emerald-200/80 text-emerald-950' 
                        : 'bg-red-50/80 border-red-200/80 text-red-950'
                    }`}>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider block">
                        Net Profit For Work
                      </span>
                      <p className={`text-lg font-black mt-1 ${clientNetProfit >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                        ₹{clientNetProfit.toLocaleString()}
                      </p>
                      <span className="text-[10px] font-extrabold mt-1 block">
                        Formula: Revenue (₹{clientPkgRevenue.toLocaleString()}) - Expenses (₹{clientTotalExpenses.toLocaleString()})
                      </span>
                    </div>

                    {/* Margin Card */}
                    <div className="p-3.5 bg-indigo-50/80 border border-indigo-200/80 rounded-2xl">
                      <span className="text-[10px] font-extrabold text-indigo-800 uppercase tracking-wider block">Profit Margin</span>
                      <p className="text-lg font-black text-indigo-900 mt-1">{clientProfitMargin}% Margin</p>
                      <div className="w-full bg-indigo-200/80 h-1.5 rounded-full mt-2 overflow-hidden">
                        <div 
                          className="bg-indigo-600 h-full rounded-full" 
                          style={{ width: `${Math.min(100, Math.max(0, clientProfitMargin))}%` }} 
                        />
                      </div>
                    </div>
                  </div>

                  {/* Expenses Itemized List under this Client Work */}
                  <div className="p-5 pt-0">
                    <div className="border-t border-slate-100 pt-3">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <Receipt size={14} className="text-indigo-600" />
                          <span>Incurred Expense Logs for {client.name}</span>
                        </h4>
                        <span className="text-[11px] font-extrabold text-amber-700">
                          Total Expense: ₹{clientTotalExpenses.toLocaleString()}
                        </span>
                      </div>

                      {clientExpensesList.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {clientExpensesList.map((exp) => {
                            const catObj = CATEGORIES.find(c => c.name === exp.category) || CATEGORIES[5];
                            return (
                              <div key={exp.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 flex items-center justify-between gap-2">
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-xs text-slate-900">{exp.title}</span>
                                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase ${catObj.color}`}>
                                      {catObj.icon} {exp.category}
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-slate-500 font-medium mt-0.5 flex items-center gap-1.5 flex-wrap">
                                    <span>{exp.assignmentTitle || 'General Work'} • {new Date(exp.date).toLocaleDateString()}</span>
                                    {exp.paidTo && (
                                      <span className="font-extrabold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 text-[9px]">
                                        👤 Paid To: {exp.paidTo}
                                      </span>
                                    )}
                                  </p>
                                </div>
                                <div className="text-right shrink-0">
                                  <span className="font-black text-slate-900 text-sm">₹{exp.amount.toLocaleString()}</span>
                                  {isAdmin && (
                                    <button
                                      onClick={() => onDeleteExpense(exp.id)}
                                      className="text-slate-400 hover:text-red-600 block ml-auto mt-0.5"
                                      title="Delete Expense"
                                    >
                                      <Trash2 size={13} />
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="p-3 bg-slate-50 border border-slate-200/60 rounded-xl text-center text-xs text-slate-400 italic flex items-center justify-between">
                          <span>No expenses logged for this client yet.</span>
                          <button
                            type="button"
                            onClick={() => handleOpenAddModal(client.id)}
                            className="text-indigo-600 hover:underline font-bold text-xs not-italic"
                          >
                            + Log Expense
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredClients.length === 0 && (
              <div className="p-12 text-center text-slate-400 bg-white rounded-3xl border border-slate-200 space-y-2">
                <Building2 size={36} className="mx-auto text-slate-300" />
                <p className="font-bold text-slate-700 text-sm">No clients match search</p>
                <p className="text-xs text-slate-400">Add clients in Client Directory to track work revenue and profit margins.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= TAB 2: ITEMIZED EXPENSES TABLE ================= */}
      {activeTab === 'all-expenses' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-extrabold uppercase text-slate-500 tracking-wider">
                  <th className="py-3 px-4">Expense Item</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Tagged Client Work</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Logged By</th>
                  <th className="py-3 px-4 text-right">Amount (₹)</th>
                  {isAdmin && <th className="py-3 px-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredExpenses.map((exp) => {
                  const catObj = CATEGORIES.find(c => c.name === exp.category) || CATEGORIES[5];
                  return (
                    <tr key={exp.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span>{exp.title}</span>
                            {exp.status === 'Pending' && (
                              <span className="px-1.5 py-0.5 text-[9px] bg-amber-100 text-amber-800 rounded font-black uppercase">
                                Pending Approval
                              </span>
                            )}
                          </div>
                          {exp.notes && <p className="text-[11px] text-slate-400 font-normal italic mt-0.5">{exp.notes}</p>}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${catObj.color}`}>
                          {catObj.icon} {exp.category}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div>
                          <div className="font-bold text-slate-800 flex items-center gap-1">
                            <Building2 size={12} className="text-indigo-500 shrink-0" />
                            <span>{exp.clientName || 'Studio Expense'}</span>
                          </div>
                          {exp.assignmentTitle && (
                            <span className="text-[10px] font-semibold text-slate-400 block">
                              Task: {exp.assignmentTitle}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-slate-600">
                        <div className="flex items-center gap-1">
                          <Calendar size={12} className="text-slate-400" />
                          <span>{new Date(exp.date).toLocaleDateString()}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-slate-700">
                        <div className="flex items-center gap-1">
                          <User size={12} className="text-slate-400" />
                          <span>{exp.addedByName || exp.addedBy}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right font-black text-slate-900 text-sm">
                        ₹{exp.amount.toLocaleString()}
                      </td>

                      {isAdmin && (
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => onDeleteExpense(exp.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Expense Entry"
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filteredExpenses.length === 0 && (
              <div className="p-12 text-center text-slate-400 space-y-2">
                <Receipt size={36} className="mx-auto text-slate-300" />
                <p className="font-bold text-slate-700 text-sm">No expenses found</p>
                <p className="text-xs text-slate-400">Log travel, equipment, or vendor costs linked to shoot assignments.</p>
                <button
                  onClick={() => handleOpenAddModal()}
                  className="mt-2 px-4 py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl hover:bg-indigo-700 transition-all"
                >
                  + Log Expense Now
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add / Tag Expense Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-100 text-indigo-700 rounded-xl">
                  <Receipt size={18} />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">Log Expense for Client Work</h3>
                  <p className="text-[11px] text-slate-500">Expenses reduce client net profit margin</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              {/* Client Selection First */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Tag to Client Work *</label>
                <select
                  value={selectedClientId}
                  onChange={(e) => {
                    const newClientId = e.target.value;
                    setSelectedClientId(newClientId);
                    const clientTasks = assignments.filter(a => a.clientId === newClientId);
                    setSelectedAssignmentId(clientTasks[0]?.id || '');
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                >
                  <option value="">General Studio Expense (No specific client)</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.eventType} - Revenue: ₹{(c.packagePrice || 0).toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              {/* Task Assignment Selection Filtered by Client */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Linked Shoot Task / Work Assignment</label>
                <select
                  value={selectedAssignmentId}
                  onChange={(e) => setSelectedAssignmentId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                >
                  <option value="">General Work under this Client</option>
                  {assignments
                    .filter(a => !selectedClientId || a.clientId === selectedClientId)
                    .map(a => (
                      <option key={a.id} value={a.id}>{a.title} ({a.priority})</option>
                    ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Expense Title / Description *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Travel Cab Fare / Freelancer Videographer Fee"
                  value={expenseTitle}
                  onChange={(e) => setExpenseTitle(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Expense Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="e.g. 15000"
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-extrabold text-indigo-700 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Expense Category</label>
                  <select
                    value={expenseCategory}
                    onChange={(e) => setExpenseCategory(e.target.value as ExpenseCategory)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  >
                    {CATEGORIES.map(c => (
                      <option key={c.name} value={c.name}>{c.icon} {c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Paid To (Recipient / Crew / Vendor)</label>
                  <input
                    type="text"
                    placeholder="e.g. Arjun Mehta / Catering / CRE"
                    value={paidToPerson}
                    onChange={(e) => setPaidToPerson(e.target.value)}
                    list="crew-recipients-list"
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  />
                  <datalist id="crew-recipients-list">
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.name}>{emp.name} ({emp.role})</option>
                    ))}
                  </datalist>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Date Logged</label>
                  <input
                    type="date"
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Notes / Invoice Ref</label>
                <input
                  type="text"
                  placeholder="e.g. Invoice #402 paid via UPI"
                  value={expenseNotes}
                  onChange={(e) => setExpenseNotes(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-500/20"
                >
                  Save Expense & Deduct from Net Profit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpenseTracker;

