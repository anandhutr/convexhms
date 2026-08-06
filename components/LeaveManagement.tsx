import React, { useState } from 'react';
import { 
  Calendar, Clock, CheckCircle2, XCircle, AlertCircle, Plus, Settings, 
  User, Check, X, Shield, Filter, Search, CalendarDays, ArrowRight, Trash2, Edit3, MessageSquare
} from 'lucide-react';
import { Employee, LeaveRequest, LeavePolicyConfig, LeaveStatus } from '../types';
import ConfirmModal from './ConfirmModal';

interface LeaveManagementProps {
  employees: Employee[];
  currentRoleId: string;
  leaveRequests: LeaveRequest[];
  leavePolicy: LeavePolicyConfig;
  onSaveLeaveRequest: (request: LeaveRequest) => void;
  onDeleteLeaveRequest: (requestId: string) => void;
  onUpdateLeavePolicy: (policy: LeavePolicyConfig) => void;
}

export const LeaveManagement: React.FC<LeaveManagementProps> = ({
  employees,
  currentRoleId,
  leaveRequests,
  leavePolicy,
  onSaveLeaveRequest,
  onDeleteLeaveRequest,
  onUpdateLeavePolicy
}) => {
  const currentEmployee = currentRoleId !== 'admin' ? employees.find(e => e.id === currentRoleId) : null;
  const isAdmin = currentRoleId === 'admin' || currentEmployee?.accessLevel === 'admin';

  // Navigation sub-tabs
  const [activeTab, setActiveTab] = useState<'requests' | 'pending' | 'policy'>(
    isAdmin && leaveRequests.some(r => r.status === 'Pending') ? 'pending' : 'requests'
  );

  // Filters
  const [filterEmployeeId, setFilterEmployeeId] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedRequestForReview, setSelectedRequestForReview] = useState<LeaveRequest | null>(null);
  const [reviewAction, setReviewAction] = useState<'Approved' | 'Rejected'>('Approved');
  const [adminCommentInput, setAdminCommentInput] = useState('');

  // Confirm Modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type?: 'danger' | 'warning' | 'archive';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  // Apply Leave Form state
  const [formData, setFormData] = useState<{
    targetEmployeeId: string;
    leaveType: string;
    isSingleDay: boolean;
    startDate: string;
    endDate: string;
    reason: string;
  }>({
    targetEmployeeId: currentEmployee ? currentEmployee.id : (employees[0]?.id || ''),
    leaveType: leavePolicy.categories[0] || 'Casual Leave',
    isSingleDay: true,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    reason: ''
  });

  // Policy Edit state
  const [editingMonthlyQuota, setEditingMonthlyQuota] = useState<number>(leavePolicy.monthlyQuota || 2);
  const [newCategoryInput, setNewCategoryInput] = useState('');
  const [policySavedFeedback, setPolicySavedFeedback] = useState(false);

  // Date Math Helpers
  const todayStr = new Date().toISOString().split('T')[0];
  const currentYearMonth = todayStr.substring(0, 7); // e.g. "2026-08"

  const calculateDaysCount = (start: string, end: string, isSingle: boolean) => {
    if (isSingle) return 1;
    if (!start || !end) return 1;
    const d1 = new Date(start);
    const d2 = new Date(end);
    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return 1;
    const diffTime = d2.getTime() - d1.getTime();
    if (diffTime < 0) return 1;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return Math.max(1, diffDays);
  };

  // Balance Metrics Calculation
  const activeEmpId = currentEmployee ? currentEmployee.id : filterEmployeeId !== 'all' ? filterEmployeeId : (employees[0]?.id || '');
  
  const getEmpApprovedLeavesThisMonth = (empId: string) => {
    return leaveRequests
      .filter(r => r.employeeId === empId && r.status === 'Approved' && r.startDate.startsWith(currentYearMonth))
      .reduce((sum, r) => sum + (r.daysCount || 1), 0);
  };

  const getEmpApprovedLeavesThisYear = (empId: string) => {
    const yearStr = todayStr.substring(0, 4);
    return leaveRequests
      .filter(r => r.employeeId === empId && r.status === 'Approved' && r.startDate.startsWith(yearStr))
      .reduce((sum, r) => sum + (r.daysCount || 1), 0);
  };

  const empTakenThisMonth = getEmpApprovedLeavesThisMonth(activeEmpId);
  const empTakenThisYear = getEmpApprovedLeavesThisYear(activeEmpId);
  const empAvailableBalanceMonth = Math.max(0, (leavePolicy.monthlyQuota || 2) - empTakenThisMonth);

  // Admin overall statistics
  const pendingCount = leaveRequests.filter(r => r.status === 'Pending').length;
  const totalApprovedThisMonth = leaveRequests
    .filter(r => r.status === 'Approved' && r.startDate.startsWith(currentYearMonth))
    .reduce((sum, r) => sum + (r.daysCount || 1), 0);
  const staffOnLeaveToday = leaveRequests.filter(r => {
    if (r.status !== 'Approved') return false;
    return todayStr >= r.startDate && todayStr <= r.endDate;
  });

  // Filtered Leave Requests
  const displayedRequests = leaveRequests.filter(r => {
    if (!isAdmin && currentEmployee && r.employeeId !== currentEmployee.id) {
      return false;
    }
    if (activeTab === 'pending' && r.status !== 'Pending') {
      return false;
    }
    if (filterEmployeeId !== 'all' && r.employeeId !== filterEmployeeId) {
      return false;
    }
    if (filterStatus !== 'all' && activeTab !== 'pending' && r.status !== filterStatus) {
      return false;
    }
    if (filterCategory !== 'all' && r.leaveType !== filterCategory) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const emp = employees.find(e => e.id === r.employeeId);
      const empName = emp?.name.toLowerCase() || r.employeeName.toLowerCase();
      const reasonMatch = r.reason.toLowerCase().includes(q);
      const categoryMatch = r.leaveType.toLowerCase().includes(q);
      return empName.includes(q) || reasonMatch || categoryMatch;
    }
    return true;
  }).sort((a, b) => new Date(b.appliedOn).getTime() - new Date(a.appliedOn).getTime());

  // Handlers
  const handleOpenApplyModal = () => {
    setFormData({
      targetEmployeeId: currentEmployee ? currentEmployee.id : (employees[0]?.id || ''),
      leaveType: leavePolicy.categories[0] || 'Casual Leave',
      isSingleDay: true,
      startDate: todayStr,
      endDate: todayStr,
      reason: ''
    });
    setIsApplyModalOpen(true);
  };

  const handleSubmitApplyForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.reason.trim()) {
      alert('Please provide a reason for the leave request.');
      return;
    }

    const applicant = employees.find(emp => emp.id === formData.targetEmployeeId) || currentEmployee;
    const days = calculateDaysCount(formData.startDate, formData.endDate, formData.isSingleDay);

    const newRequest: LeaveRequest = {
      id: Math.random().toString(36).substr(2, 9),
      employeeId: formData.targetEmployeeId,
      employeeName: applicant ? applicant.name : 'Studio Staff',
      employeeEmail: applicant?.email || '',
      leaveType: formData.leaveType,
      startDate: formData.startDate,
      endDate: formData.isSingleDay ? formData.startDate : formData.endDate,
      isSingleDay: formData.isSingleDay,
      daysCount: days,
      reason: formData.reason.trim(),
      status: 'Pending',
      appliedOn: new Date().toISOString()
    };

    onSaveLeaveRequest(newRequest);
    setIsApplyModalOpen(false);
  };

  const handleOpenReviewModal = (request: LeaveRequest, action: 'Approved' | 'Rejected') => {
    setSelectedRequestForReview(request);
    setReviewAction(action);
    setAdminCommentInput('');
    setIsReviewModalOpen(true);
  };

  const handleConfirmReview = () => {
    if (!selectedRequestForReview) return;

    const reviewerName = currentEmployee ? currentEmployee.name : 'Admin Director';
    const updated: LeaveRequest = {
      ...selectedRequestForReview,
      status: reviewAction,
      reviewedBy: reviewerName,
      reviewedOn: new Date().toISOString().split('T')[0],
      adminComment: adminCommentInput.trim() || undefined
    };

    onSaveLeaveRequest(updated);
    setIsReviewModalOpen(false);
    setSelectedRequestForReview(null);
  };

  const handleDeleteRequest = (id: string, title: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Withdraw Leave Request',
      message: `Are you sure you want to delete leave application "${title}"?`,
      type: 'danger',
      onConfirm: () => onDeleteLeaveRequest(id)
    });
  };

  const handleSavePolicy = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateLeavePolicy({
      monthlyQuota: editingMonthlyQuota,
      categories: leavePolicy.categories
    });
    setPolicySavedFeedback(true);
    setTimeout(() => setPolicySavedFeedback(false), 3000);
  };

  const handleAddCategory = () => {
    if (!newCategoryInput.trim()) return;
    const trimmed = newCategoryInput.trim();
    if (leavePolicy.categories.includes(trimmed)) return;
    
    const updatedCategories = [...leavePolicy.categories, trimmed];
    onUpdateLeavePolicy({
      ...leavePolicy,
      categories: updatedCategories
    });
    setNewCategoryInput('');
  };

  const handleRemoveCategory = (cat: string) => {
    if (leavePolicy.categories.length <= 1) {
      alert('Must maintain at least one leave category.');
      return;
    }
    const updatedCategories = leavePolicy.categories.filter(c => c !== cat);
    onUpdateLeavePolicy({
      ...leavePolicy,
      categories: updatedCategories
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Calendar size={22} />
            </span>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Leave Management</h1>
          </div>
          <p className="text-xs text-slate-500 font-medium ml-1">
            Apply for time off, view monthly balances, and manage staff leave approvals.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenApplyModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md shadow-indigo-500/20 text-xs transition-all"
          >
            <Plus size={16} />
            <span>Apply for Leave</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Monthly Balance Card (Employee Context) */}
        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 p-5 rounded-2xl text-white shadow-sm relative overflow-hidden">
          <div className="absolute right-3 bottom-3 opacity-10 text-white">
            <CalendarDays size={80} />
          </div>
          <p className="text-xs font-bold text-indigo-300 uppercase tracking-wider mb-1">
            {currentEmployee ? `${currentEmployee.name}'s Monthly Balance` : 'Standard Monthly Quota'}
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{empAvailableBalanceMonth}</span>
            <span className="text-xs font-bold text-indigo-200">/ {leavePolicy.monthlyQuota || 2} Days Available</span>
          </div>
          <div className="mt-3 text-[11px] text-slate-300 flex items-center justify-between pt-2 border-t border-indigo-800/60">
            <span>Taken this month: <strong>{empTakenThisMonth} days</strong></span>
            <span>Yearly total: <strong>{empTakenThisYear} days</strong></span>
          </div>
        </div>

        {/* Pending Approvals */}
        <div className={`p-5 rounded-2xl border transition-all ${
          pendingCount > 0 
            ? 'bg-amber-50/80 border-amber-200 text-amber-900' 
            : 'bg-white border-slate-200 text-slate-900 shadow-sm'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800">Pending Requests</span>
            <Clock size={18} className={pendingCount > 0 ? 'text-amber-600' : 'text-slate-400'} />
          </div>
          <div className="text-3xl font-black">{pendingCount}</div>
          <p className="text-xs mt-1 text-slate-500 font-medium">Awaiting admin review & approval</p>
        </div>

        {/* Total Approved Leaves This Month */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Approved This Month</span>
            <CheckCircle2 size={18} className="text-emerald-500" />
          </div>
          <div className="text-3xl font-black text-slate-900">{totalApprovedThisMonth} <span className="text-xs font-bold text-slate-400">Days</span></div>
          <p className="text-xs mt-1 text-slate-500 font-medium">Across all studio crew</p>
        </div>

        {/* Staff Currently On Leave Today */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">On Leave Today</span>
            <User size={18} className="text-indigo-500" />
          </div>
          <div className="text-3xl font-black text-slate-900">{staffOnLeaveToday.length}</div>
          <p className="text-xs mt-1 text-slate-500 font-medium truncate">
            {staffOnLeaveToday.length > 0 
              ? staffOnLeaveToday.map(r => r.employeeName).join(', ') 
              : 'All staff active today'}
          </p>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('requests')}
            className={`px-4 py-2 font-bold text-xs rounded-xl transition-all flex items-center gap-2 ${
              activeTab === 'requests' 
                ? 'bg-slate-900 text-white shadow-sm' 
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <CalendarDays size={15} />
            <span>{isAdmin ? 'All Staff Requests & History' : 'My Leave Requests'}</span>
          </button>

          {isAdmin && (
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-4 py-2 font-bold text-xs rounded-xl transition-all flex items-center gap-2 ${
                activeTab === 'pending' 
                  ? 'bg-indigo-600 text-white shadow-sm' 
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Clock size={15} />
              <span>Pending Approvals</span>
              {pendingCount > 0 && (
                <span className="px-1.5 py-0.5 bg-amber-400 text-amber-950 rounded-full text-[10px] font-black">
                  {pendingCount}
                </span>
              )}
            </button>
          )}

          {isAdmin && (
            <button
              onClick={() => setActiveTab('policy')}
              className={`px-4 py-2 font-bold text-xs rounded-xl transition-all flex items-center gap-2 ${
                activeTab === 'policy' 
                  ? 'bg-slate-900 text-white shadow-sm' 
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Settings size={15} />
              <span>Leave Policy Settings</span>
            </button>
          )}
        </div>

        {/* Filter Controls (When in Requests or Pending tab) */}
        {activeTab !== 'policy' && (
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search reason or staff..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 w-48"
              />
            </div>

            {isAdmin && (
              <select
                value={filterEmployeeId}
                onChange={(e) => setFilterEmployeeId(e.target.value)}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="all">All Employees</option>
                {employees
                  .filter(emp => emp.status !== 'Terminated' && (emp as any).status !== 'Archived')
                  .map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))}
              </select>
            )}

            {activeTab !== 'pending' && (
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="all">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
            )}

            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="all">All Leave Types</option>
              {leavePolicy.categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Tab Content 1 & 2: Requests / Pending Table */}
      {activeTab !== 'policy' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          {displayedRequests.length === 0 ? (
            <div className="p-12 text-center">
              <Calendar className="mx-auto text-slate-300 mb-3" size={40} />
              <p className="text-sm font-bold text-slate-700">No leave requests found</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                {activeTab === 'pending' 
                  ? 'There are no pending leave applications awaiting approval at this time.' 
                  : 'No leave records match the selected filters. Use "Apply for Leave" to raise a new request.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4">Leave Type</th>
                    <th className="py-3 px-4">Date & Duration</th>
                    <th className="py-3 px-4">Reason</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {displayedRequests.map((req) => {
                    const emp = employees.find(e => e.id === req.employeeId);
                    return (
                      <tr key={req.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center shrink-0">
                              {emp?.profilePicture ? (
                                <img src={emp.profilePicture} alt={req.employeeName} className="w-full h-full rounded-full object-cover" />
                              ) : (
                                (emp?.name || req.employeeName).charAt(0)
                              )}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900">{emp?.name || req.employeeName}</p>
                              <p className="text-[10px] text-slate-400">{emp?.role || 'Staff'}</p>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="px-2.5 py-1 bg-slate-100 text-slate-700 font-bold rounded-lg text-[11px] border border-slate-200/80">
                            {req.leaveType}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="space-y-0.5">
                            <p className="font-bold text-slate-800">
                              {req.isSingleDay ? req.startDate : `${req.startDate} → ${req.endDate}`}
                            </p>
                            <p className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                              <span>{req.daysCount} {req.daysCount === 1 ? 'Day' : 'Days'}</span>
                              {req.isSingleDay && <span className="bg-indigo-50 text-indigo-600 px-1 rounded text-[9px]">Single Day</span>}
                            </p>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 max-w-xs">
                          <p className="text-slate-700 line-clamp-2 italic">"{req.reason}"</p>
                          {req.adminComment && (
                            <p className="text-[10px] text-indigo-600 mt-1 font-semibold flex items-center gap-1">
                              <MessageSquare size={10} />
                              <span>Admin Note: {req.adminComment}</span>
                            </p>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          {req.status === 'Pending' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 font-bold rounded-full text-[11px]">
                              <Clock size={12} />
                              <span>Pending</span>
                            </span>
                          )}
                          {req.status === 'Approved' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold rounded-full text-[11px]">
                              <CheckCircle2 size={12} />
                              <span>Approved</span>
                            </span>
                          )}
                          {req.status === 'Rejected' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-700 border border-red-200 font-bold rounded-full text-[11px]">
                              <XCircle size={12} />
                              <span>Rejected</span>
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {isAdmin && req.status === 'Pending' && (
                              <>
                                <button
                                  onClick={() => handleOpenReviewModal(req, 'Approved')}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[11px] transition-colors flex items-center gap-1 shadow-sm"
                                >
                                  <Check size={12} />
                                  <span>Approve</span>
                                </button>
                                <button
                                  onClick={() => handleOpenReviewModal(req, 'Rejected')}
                                  className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-[11px] transition-colors flex items-center gap-1 shadow-sm"
                                >
                                  <X size={12} />
                                  <span>Reject</span>
                                </button>
                              </>
                            )}

                            {(isAdmin || (currentEmployee && req.employeeId === currentEmployee.id && req.status === 'Pending')) && (
                              <button
                                onClick={() => handleDeleteRequest(req.id, `${req.leaveType} (${req.startDate})`)}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete or withdraw request"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab Content 3: Admin Policy Settings */}
      {isAdmin && activeTab === 'policy' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Monthly Allowance Configuration */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <CalendarDays className="text-indigo-600" size={20} />
              <h2 className="font-extrabold text-base text-slate-900">Monthly Leave Quota Configuration</h2>
            </div>

            <form onSubmit={handleSavePolicy} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Allowed Monthly Leaves per Employee (Days)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="0"
                    max="30"
                    value={editingMonthlyQuota}
                    onChange={(e) => setEditingMonthlyQuota(Number(e.target.value))}
                    className="w-32 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                  <span className="text-xs text-slate-500 font-medium">days / month</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5">
                  Employees will see their monthly leave allowance automatically updated based on this quota.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-indigo-500/20"
                >
                  Save Monthly Policy
                </button>
                {policySavedFeedback && (
                  <span className="ml-3 text-xs font-bold text-emerald-600 animate-in fade-in">
                    ✓ Policy updated in real-time!
                  </span>
                )}
              </div>
            </form>
          </div>

          {/* Leave Categories Management */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Settings className="text-indigo-600" size={20} />
              <h2 className="font-extrabold text-base text-slate-900">Configured Leave Categories</h2>
            </div>

            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="New Leave Category Name..."
                  value={newCategoryInput}
                  onChange={(e) => setNewCategoryInput(e.target.value)}
                  className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
                <button
                  type="button"
                  onClick={handleAddCategory}
                  className="px-3.5 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800 transition-colors shrink-0"
                >
                  Add Category
                </button>
              </div>

              <div className="space-y-2 pt-2">
                {leavePolicy.categories.map((cat) => (
                  <div key={cat} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200/60 text-xs font-bold text-slate-800">
                    <span>{cat}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveCategory(cat)}
                      className="text-slate-400 hover:text-red-600 transition-colors p-1"
                      title="Remove category"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Apply for Leave Modal */}
      {isApplyModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Plus size={18} />
                </span>
                <h3 className="font-extrabold text-lg text-slate-900">Apply for Leave</h3>
              </div>
              <button 
                onClick={() => setIsApplyModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitApplyForm} className="space-y-4 text-xs">
              {/* Target Employee Selection for Admin */}
              {isAdmin && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Applying Staff Member</label>
                  <select
                    value={formData.targetEmployeeId}
                    onChange={(e) => setFormData(prev => ({ ...prev, targetEmployeeId: e.target.value }))}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    {employees.filter(e => e.status !== 'Terminated').map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name} ({emp.role})</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Leave Category */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Leave Category</label>
                <select
                  value={formData.leaveType}
                  onChange={(e) => setFormData(prev => ({ ...prev, leaveType: e.target.value }))}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  {leavePolicy.categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Single Day vs Date Range Switch */}
              <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                <input
                  type="checkbox"
                  id="singleDayCheckbox"
                  checked={formData.isSingleDay}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    isSingleDay: e.target.checked,
                    endDate: e.target.checked ? prev.startDate : prev.endDate
                  }))}
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                />
                <label htmlFor="singleDayCheckbox" className="font-bold text-slate-800 cursor-pointer">
                  Single Day Leave
                </label>
              </div>

              {/* Date Pickers */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {formData.isSingleDay ? 'Leave Date' : 'Start Date'}
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      startDate: e.target.value,
                      endDate: prev.isSingleDay ? e.target.value : prev.endDate
                    }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                {!formData.isSingleDay && (
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">End Date</label>
                    <input
                      type="date"
                      required
                      min={formData.startDate}
                      value={formData.endDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                )}
              </div>

              {/* Duration Notice */}
              <div className="p-2.5 bg-indigo-50 text-indigo-800 font-bold rounded-xl flex items-center justify-between text-[11px]">
                <span>Calculated Leave Duration:</span>
                <span className="px-2 py-0.5 bg-indigo-600 text-white rounded-md font-extrabold">
                  {calculateDaysCount(formData.startDate, formData.endDate, formData.isSingleDay)} {calculateDaysCount(formData.startDate, formData.endDate, formData.isSingleDay) === 1 ? 'Day' : 'Days'}
                </span>
              </div>

              {/* Reason Input */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Reason for Leave *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Explain reason for leave (e.g. personal emergency, medical appointment, wedding function)..."
                  value={formData.reason}
                  onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsApplyModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md shadow-indigo-500/20"
                >
                  Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Review / Approve / Reject Modal */}
      {isReviewModalOpen && selectedRequestForReview && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-base text-slate-900">
                {reviewAction === 'Approved' ? 'Approve Leave Request' : 'Reject Leave Request'}
              </h3>
              <button 
                onClick={() => setIsReviewModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1 text-xs">
              <p className="font-bold text-slate-900">{selectedRequestForReview.employeeName}</p>
              <p className="text-slate-600">
                <strong>Type:</strong> {selectedRequestForReview.leaveType} ({selectedRequestForReview.daysCount} {selectedRequestForReview.daysCount === 1 ? 'day' : 'days'})
              </p>
              <p className="text-slate-600">
                <strong>Dates:</strong> {selectedRequestForReview.startDate} {selectedRequestForReview.isSingleDay ? '' : `→ ${selectedRequestForReview.endDate}`}
              </p>
              <p className="text-slate-700 italic pt-1">"{selectedRequestForReview.reason}"</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Admin Comment / Note (Optional)
              </label>
              <input
                type="text"
                placeholder={reviewAction === 'Approved' ? 'e.g. Approved. Assigned cover to Alex.' : 'e.g. Rejection reason...'}
                value={adminCommentInput}
                onChange={(e) => setAdminCommentInput(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsReviewModalOpen(false)}
                className="px-4 py-2 border border-slate-200 text-slate-600 font-bold rounded-xl text-xs hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReview}
                className={`px-4 py-2 font-bold rounded-xl text-xs text-white shadow-md ${
                  reviewAction === 'Approved' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                Confirm {reviewAction}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
        onConfirm={confirmModal.onConfirm}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

export default LeaveManagement;
