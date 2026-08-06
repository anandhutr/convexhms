import React, { useState } from 'react';
import { Client, Assignment, Employee, AssignmentStatus, Religion, ClientEvent, EventCrewMember, EventHddStorage, CrewRole, SideType } from '../types';
import { 
  ArrowLeft, Calendar, MapPin, Mail, Phone, Sparkles, Plus, 
  CheckCircle2, Clock, AlertCircle, ChevronRight, User, Edit2, 
  Trash2, FileText, ChevronDown, ChevronUp, CheckSquare, Building2, Briefcase, ExternalLink, ShieldAlert,
  Camera, Video, HardDrive, Copy, Check, Users, PhoneCall, X, Folder, UserPlus, HardDriveDownload
} from 'lucide-react';
import TaskProgressBar from './TaskProgressBar';
import ConfirmModal from './ConfirmModal';
import { createGoogleCalendarEvent, googleSignIn, getCalendarAccessToken } from '../services/googleCalendarService';

interface ClientDetailProps {
  client: Client;
  allClients: Client[];
  assignments: Assignment[];
  employees: Employee[];
  onSelectClient: (clientId: string) => void;
  onBack: () => void;
  onEditClient: (client: Client) => void;
  onUpdateClient?: (client: Client) => void;
  onAssignWork: (client: Client, eventId?: string) => void;
  onGenerateBrief: (client: Client) => void;
  onUpdateAssignmentStatus: (assignmentId: string, status: AssignmentStatus) => void;
  onToggleSubtask?: (taskId: string, subtaskId: string) => void;
  onDeleteAssignment: (assignmentId: string) => void;
  onEditAssignment: (assignment: Assignment) => void;
  onDeleteClient?: (clientId: string) => void;
}

const ClientDetail: React.FC<ClientDetailProps> = ({
  client,
  allClients,
  assignments,
  employees,
  onSelectClient,
  onBack,
  onEditClient,
  onUpdateClient,
  onAssignWork,
  onGenerateBrief,
  onUpdateAssignmentStatus,
  onToggleSubtask,
  onDeleteAssignment,
  onEditAssignment,
  onDeleteClient,
}) => {
  const [taskFilter, setTaskFilter] = useState<string>('All');
  const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>({});

  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    type?: 'danger' | 'warning' | 'archive';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  // Crew Modal State
  const [isCrewModalOpen, setIsCrewModalOpen] = useState(false);
  const [selectedEventIdForCrew, setSelectedEventIdForCrew] = useState<string | null>(null);
  const [editingCrewId, setEditingCrewId] = useState<string | null>(null);
  const [crewName, setCrewName] = useState('');
  const [crewPhone, setCrewPhone] = useState('');
  const [crewRole, setCrewRole] = useState<CrewRole>('Photographer');
  const [crewSide, setCrewSide] = useState<SideType>('Bride');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');

  // HDD Storage Modal State
  const [isHddModalOpen, setIsHddModalOpen] = useState(false);
  const [selectedEventIdForHdd, setSelectedEventIdForHdd] = useState<string | null>(null);
  const [editingHddId, setEditingHddId] = useState<string | null>(null);
  const [hddName, setHddName] = useState('');
  const [folderPath, setFolderPath] = useState('');
  const [copiedBy, setCopiedBy] = useState('');
  const [copiedDate, setCopiedDate] = useState('');
  const [hddNotes, setHddNotes] = useState('');

  // Clipboard copy indicator
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Google Calendar Sync State
  const [syncingCalendarEventId, setSyncingCalendarEventId] = useState<string | null>(null);
  const [calendarSyncResults, setCalendarSyncResults] = useState<Record<string, { success: boolean; htmlLink?: string; error?: string }>>({});

  const handleSyncToGoogleCalendar = async (eventToSync: ClientEvent) => {
    let token = getCalendarAccessToken();
    if (!token) {
      try {
        const res = await googleSignIn();
        if (!res) return;
        token = res.accessToken;
      } catch (err: any) {
        alert(`Google Calendar connection failed: ${err.message || 'Error'}`);
        return;
      }
    }

    setSyncingCalendarEventId(eventToSync.id);
    const result = await createGoogleCalendarEvent(client, eventToSync);
    setSyncingCalendarEventId(null);

    setCalendarSyncResults(prev => ({
      ...prev,
      [eventToSync.id]: result
    }));

    if (result.success) {
      alert(`✅ Event "${eventToSync.type}" successfully blocked on Google Calendar!`);
    } else {
      alert(`⚠️ Could not sync with Google Calendar: ${result.error}`);
    }
  };

  const toggleTaskExpand = (taskId: string) => {
    setExpandedTasks(prev => ({ ...prev, [taskId]: !prev[taskId] }));
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Crew Management Actions
  const openAddCrewModal = (eventId: string, crewMember?: EventCrewMember) => {
    setSelectedEventIdForCrew(eventId);
    if (crewMember) {
      setEditingCrewId(crewMember.id);
      setCrewName(crewMember.name);
      setCrewPhone(crewMember.phone);
      setCrewRole(crewMember.role);
      setCrewSide(crewMember.side);
      setSelectedEmployeeId(crewMember.employeeId || '');
    } else {
      setEditingCrewId(null);
      setCrewName('');
      setCrewPhone('');
      setCrewRole('Photographer');
      setCrewSide('Bride');
      setSelectedEmployeeId('');
    }
    setIsCrewModalOpen(true);
  };

  const handleSelectEmployeeForCrew = (empId: string) => {
    setSelectedEmployeeId(empId);
    if (empId) {
      const emp = employees.find(e => e.id === empId);
      if (emp) {
        setCrewName(emp.name);
        if (emp.role.toLowerCase().includes('photo')) setCrewRole('Photographer');
        else if (emp.role.toLowerCase().includes('editor') || emp.role.toLowerCase().includes('video') || emp.role.toLowerCase().includes('cinema')) setCrewRole('Videographer');
      }
    }
  };

  const handleSaveCrewMember = () => {
    if (!selectedEventIdForCrew || !crewName.trim()) return;

    const newCrewItem: EventCrewMember = {
      id: editingCrewId || 'crew_' + Date.now(),
      name: crewName.trim(),
      phone: crewPhone.trim(),
      role: crewRole,
      side: crewSide,
      employeeId: selectedEmployeeId || undefined
    };

    const updatedEvents = client.events.map(ev => {
      if (ev.id !== selectedEventIdForCrew) return ev;
      const existingCrew = ev.crew || [];
      const updatedCrew = editingCrewId
        ? existingCrew.map(c => c.id === editingCrewId ? newCrewItem : c)
        : [...existingCrew, newCrewItem];
      return { ...ev, crew: updatedCrew };
    });

    if (onUpdateClient) {
      onUpdateClient({ ...client, events: updatedEvents });
    }
    setIsCrewModalOpen(false);
  };

  const handleDeleteCrewMember = (eventId: string, crewId: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Remove Crew Member',
      message: 'Are you sure you want to remove this assigned crew member from the shoot schedule?',
      confirmText: 'Remove Crew',
      type: 'danger',
      onConfirm: () => {
        const updatedEvents = client.events.map(ev => {
          if (ev.id !== eventId) return ev;
          return { ...ev, crew: (ev.crew || []).filter(c => c.id !== crewId) };
        });
        if (onUpdateClient) {
          onUpdateClient({ ...client, events: updatedEvents });
        }
      }
    });
  };

  // HDD Storage Actions
  const openAddHddModal = (eventId: string, hddItem?: EventHddStorage) => {
    setSelectedEventIdForHdd(eventId);
    if (hddItem) {
      setEditingHddId(hddItem.id);
      setHddName(hddItem.hddName);
      setFolderPath(hddItem.folderPath);
      setCopiedBy(hddItem.copiedBy);
      setCopiedDate(hddItem.copiedDate || new Date().toISOString().split('T')[0]);
      setHddNotes(hddItem.notes || '');
    } else {
      setEditingHddId(null);
      setHddName('');
      setFolderPath('');
      setCopiedBy('');
      setCopiedDate(new Date().toISOString().split('T')[0]);
      setHddNotes('');
    }
    setIsHddModalOpen(true);
  };

  const handleSaveHdd = () => {
    if (!selectedEventIdForHdd || !hddName.trim() || !folderPath.trim()) return;

    const newHddItem: EventHddStorage = {
      id: editingHddId || 'hdd_' + Date.now(),
      hddName: hddName.trim(),
      folderPath: folderPath.trim(),
      copiedBy: copiedBy.trim() || 'Studio Team',
      copiedDate: copiedDate || new Date().toISOString().split('T')[0],
      notes: hddNotes.trim()
    };

    const updatedEvents = client.events.map(ev => {
      if (ev.id !== selectedEventIdForHdd) return ev;
      const existingHdd = ev.hddStorage || [];
      const updatedHdd = editingHddId
        ? existingHdd.map(h => h.id === editingHddId ? newHddItem : h)
        : [...existingHdd, newHddItem];
      return { ...ev, hddStorage: updatedHdd };
    });

    if (onUpdateClient) {
      onUpdateClient({ ...client, events: updatedEvents });
    }
    setIsHddModalOpen(false);
  };

  const handleDeleteHdd = (eventId: string, hddId: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete HDD Log Entry',
      message: 'Are you sure you want to delete this HDD backup drive log?',
      confirmText: 'Delete HDD Log',
      type: 'danger',
      onConfirm: () => {
        const updatedEvents = client.events.map(ev => {
          if (ev.id !== eventId) return ev;
          return { ...ev, hddStorage: (ev.hddStorage || []).filter(h => h.id !== hddId) };
        });
        if (onUpdateClient) {
          onUpdateClient({ ...client, events: updatedEvents });
        }
      }
    });
  };

  // Filter assignments for this client
  const clientAssignments = assignments.filter(a => a.clientId === client.id);
  const filteredAssignments = clientAssignments.filter(a => taskFilter === 'All' || a.status === taskFilter);

  const getAssignee = (id: string) => employees.find(e => e.id === id);

  const religionStyles: Record<Religion, string> = {
    Hindu: 'bg-amber-50 text-amber-700 border-amber-200',
    Muslim: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Christian: 'bg-blue-50 text-blue-700 border-blue-200',
    Others: 'bg-slate-50 text-slate-700 border-slate-200',
  };

  const statusColors = {
    Booked: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    Lead: 'bg-amber-100 text-amber-700 border-amber-200',
    Completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  };

  const priorityColors = {
    Low: 'bg-slate-100 text-slate-600',
    Medium: 'bg-blue-100 text-blue-600',
    High: 'bg-orange-100 text-orange-600',
    Urgent: 'bg-red-100 text-red-600 animate-pulse',
  };

  const statusIcons = {
    'To Do': <Clock className="text-slate-400" size={14} />,
    'In Progress': <ChevronRight className="text-blue-500" size={14} />,
    'Review': <AlertCircle className="text-amber-500" size={14} />,
    'Done': <CheckCircle2 className="text-emerald-500" size={14} />,
  };

  const doneCount = clientAssignments.filter(a => a.status === 'Done').length;
  const inProgressCount = clientAssignments.filter(a => a.status === 'In Progress').length;
  const totalCount = clientAssignments.length;
  const completionPercent = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  const packageAmt = client.packageAmount || 0;
  const advancePaid = client.advancePaid || 0;
  const balanceAmt = Math.max(0, packageAmt - advancePaid);
  const workScopeText = client.workScope === 'Single' ? 'Single Side Work' : 'Bride & Groom (Both Sides)';

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* Top Navigation & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 transition-all flex items-center gap-1.5 shadow-2xs text-xs font-semibold"
          >
            <ArrowLeft size={16} />
            <span>Back to Clients</span>
          </button>
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <span>Clients</span>
            <span>/</span>
            <span className="font-bold text-slate-800">{client.name}</span>
          </div>
        </div>

        {/* Client Switcher */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-slate-500 hidden sm:inline">Switch Client:</label>
          <div className="relative">
            <select
              value={client.id}
              onChange={(e) => onSelectClient(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 pr-7 text-xs font-bold text-slate-700 shadow-2xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
            >
              {allClients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.status})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Client Profile Hero */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 lg:p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/50 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-5 relative z-10">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700 text-white flex items-center justify-center font-black text-2xl shadow-md shadow-indigo-500/20 shrink-0">
              {client.name.charAt(0)}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <h1 className="text-xl lg:text-2xl font-black text-slate-900 tracking-tight">{client.name}</h1>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${statusColors[client.status]}`}>
                  {client.status} Work
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${religionStyles[client.religion]}`}>
                  {client.religion} Tradition
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${
                  client.workScope === 'Single' 
                    ? 'bg-blue-50 text-blue-700 border-blue-200' 
                    : 'bg-amber-50 text-amber-800 border-amber-200'
                }`}>
                  👑 {workScopeText}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-slate-500 mt-2 font-medium">
                <div className="flex items-center gap-1.5">
                  <Mail size={14} className="text-indigo-500 shrink-0" />
                  <span>{client.email || 'No email provided'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Phone size={14} className="text-indigo-500 shrink-0" />
                  <span>{client.phone}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar size={14} className="text-indigo-500 shrink-0" />
                  <span>{client.events.length} Event{client.events.length !== 1 ? 's' : ''}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            <button
              onClick={() => onAssignWork(client)}
              className="flex-1 sm:flex-none items-center justify-center gap-1.5 px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-500/20 text-xs flex"
            >
              <Plus size={16} />
              Assign Work
            </button>

            <button
              onClick={() => onGenerateBrief(client)}
              className="flex-1 sm:flex-none items-center justify-center gap-1.5 px-3.5 py-2 bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold rounded-xl hover:bg-indigo-100 transition-all text-xs flex"
            >
              <Sparkles size={16} />
              AI Brief
            </button>

            <button
              onClick={() => onEditClient(client)}
              className="px-3.5 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors flex items-center justify-center gap-1.5 text-xs"
            >
              <Edit2 size={15} />
              Edit Profile
            </button>

            {onDeleteClient && (
              <button
                onClick={() => {
                  setConfirmModal({
                    isOpen: true,
                    title: 'Delete Client Profile',
                    message: `Are you sure you want to delete "${client.name}"? This action cannot be undone and will delete associated tasks.`,
                    confirmText: 'Delete Client',
                    type: 'danger',
                    onConfirm: () => {
                      onDeleteClient(client.id);
                      onBack();
                    }
                  });
                }}
                className="px-3.5 py-2 bg-red-50 text-red-600 border border-red-200 font-bold rounded-xl hover:bg-red-100 transition-colors flex items-center justify-center gap-1.5 text-xs"
              >
                <Trash2 size={15} />
                Delete Profile
              </button>
            )}
          </div>
        </div>

        {/* Financial & Payment Compact Dashboard Card */}
        <div className="mt-5 p-4 bg-gradient-to-r from-slate-900 to-indigo-950 rounded-2xl text-white shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-800/50 pb-3 mb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-indigo-500/20 text-indigo-300 rounded-lg border border-indigo-400/30">
                <FileText size={16} />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-white">Payment & Commercial Breakdown</h3>
                <p className="text-[10px] text-slate-300 font-medium">Package pricing, advance collected, & pending balance</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-1 text-[10px] font-black uppercase rounded-lg border tracking-wider ${
                packageAmt > 0 && balanceAmt <= 0
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
                  : advancePaid > 0
                  ? 'bg-blue-500/20 text-blue-300 border-blue-400/40'
                  : 'bg-amber-500/20 text-amber-300 border-amber-400/40'
              }`}>
                {packageAmt > 0 && balanceAmt <= 0 ? '✓ Paid In Full' : advancePaid > 0 ? 'Partial Advance Paid' : 'Pending Advance'}
              </span>
              <button 
                type="button" 
                onClick={() => onEditClient(client)}
                className="text-[11px] text-indigo-300 hover:text-white font-bold underline ml-1"
              >
                Update Payments
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-2.5 bg-white/5 border border-white/10 rounded-xl">
              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Total Package</span>
              <p className="text-base font-black text-white mt-0.5">₹{packageAmt.toLocaleString()}</p>
            </div>

            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
              <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider">Advance Collected</span>
              <p className="text-base font-black text-emerald-400 mt-0.5">₹{advancePaid.toLocaleString()}</p>
            </div>

            <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl">
              <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider">Balance Due</span>
              <p className="text-base font-black text-amber-400 mt-0.5">₹{balanceAmt.toLocaleString()}</p>
            </div>

            <div className="p-2.5 bg-white/5 border border-white/10 rounded-xl">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Work Tasks</span>
                <span className="text-[10px] font-extrabold text-emerald-400">{completionPercent}% Done</span>
              </div>
              <p className="text-base font-black text-white mt-0.5">{doneCount}/{totalCount} Tasks</p>
            </div>
          </div>

          {client.paymentNotes && (
            <div className="mt-3 text-[11px] text-slate-300 italic bg-white/5 px-3 py-1.5 rounded-lg border border-white/5 flex items-center gap-2">
              <span className="font-extrabold text-amber-300 not-italic uppercase text-[9px] shrink-0">Note:</span>
              <span className="truncate">{client.paymentNotes}</span>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* EVENT CREW ALLOCATION & HDD STORAGE BACKUPS SECTION       */}
      {/* ========================================================= */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2.5">
            <Calendar className="text-indigo-600" size={22} />
            <span>Event Management & Crew/HDD Allocation</span>
          </h2>
          <span className="text-xs font-bold bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full">
            {client.events.length} Scheduled Event{client.events.length !== 1 ? 's' : ''}
          </span>
        </div>

        {client.events.map((ev: ClientEvent) => {
          const eventTasks = clientAssignments.filter(a => a.eventId === ev.id);
          const totalCrewCount = ev.crew?.length || 0;
          const totalHddCount = ev.hddStorage?.length || 0;

          return (
            <div key={ev.id} className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden space-y-0">
              {/* Event Header Banner */}
              <div className="p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 font-black text-[10px] uppercase rounded-full tracking-wider">
                      {ev.type} Ceremony
                    </span>
                    <span className={`px-2.5 py-0.5 font-black text-[10px] uppercase rounded-full border ${
                      ev.sideType === 'Both' 
                        ? 'bg-amber-500/20 text-amber-300 border-amber-400/40' 
                        : 'bg-blue-500/20 text-blue-300 border-blue-400/40'
                    }`}>
                      {ev.sideType === 'Both' ? '👑 Both Sides (Bride & Groom)' : '👤 Single Side Work'}
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-white">{ev.type} — {client.name}</h3>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300">
                    <span className="flex items-center gap-1.5"><Calendar size={13} className="text-indigo-400" /> {ev.date || 'Date TBD'}</span>
                    <span className="flex items-center gap-1.5"><MapPin size={13} className="text-indigo-400" /> {ev.venue || 'Venue TBD'}</span>
                  </div>
                  {ev.notes && (
                    <p className="text-xs text-slate-400 italic pt-1">"{ev.notes}"</p>
                  )}
                </div>

                {/* Header Actions */}
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleSyncToGoogleCalendar(ev)}
                    disabled={syncingCalendarEventId === ev.id}
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 shadow-sm border border-blue-400/30"
                  >
                    <Calendar size={14} />
                    <span>
                      {syncingCalendarEventId === ev.id ? 'Syncing...' : 'Block on Google Cal'}
                    </span>
                  </button>

                  {calendarSyncResults[ev.id]?.htmlLink && (
                    <a
                      href={calendarSyncResults[ev.id].htmlLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 hover:bg-emerald-500/30 font-bold text-[11px] rounded-xl flex items-center gap-1 transition-all"
                    >
                      <span>Open in Calendar</span>
                      <ExternalLink size={12} />
                    </a>
                  )}

                  <button
                    type="button"
                    onClick={() => openAddCrewModal(ev.id)}
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
                  >
                    <UserPlus size={14} />
                    <span>Add Crew</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => openAddHddModal(ev.id)}
                    className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 border border-slate-700"
                  >
                    <HardDrive size={14} />
                    <span>Add HDD Path</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onAssignWork(client, ev.id)}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
                  >
                    <Plus size={14} />
                    <span>Assign Task</span>
                  </button>
                </div>
              </div>

              {/* Event Details Grid */}
              <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 bg-slate-50/40">
                {/* 1. Photographers & Videographers Assignment */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                        <Users size={16} />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-sm">Assigned Crew Members</h4>
                        <p className="text-[11px] text-slate-500 font-medium">Bride Side & Groom Side Photographers & Videographers</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg">
                      {totalCrewCount} Person{totalCrewCount !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {ev.crew && ev.crew.length > 0 ? (
                    <div className="space-y-3">
                      {ev.crew.map((member) => (
                        <div key={member.id} className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between gap-3 hover:border-indigo-200 transition-all">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`p-2.5 rounded-xl text-white font-bold shrink-0 ${
                              member.role === 'Photographer' ? 'bg-indigo-600' :
                              member.role === 'Videographer' ? 'bg-violet-600' :
                              member.role === 'Drone Operator' ? 'bg-sky-600' : 'bg-slate-700'
                            }`}>
                              {member.role === 'Photographer' ? <Camera size={15} /> :
                               member.role === 'Videographer' ? <Video size={15} /> : <User size={15} />}
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h5 className="font-bold text-slate-900 text-xs truncate">{member.name}</h5>
                                <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider shrink-0 ${
                                  member.side === 'Bride' ? 'bg-rose-100 text-rose-700 border border-rose-200' :
                                  member.side === 'Groom' ? 'bg-indigo-100 text-indigo-700 border border-indigo-200' :
                                  'bg-amber-100 text-amber-800 border border-amber-200'
                                }`}>
                                  {member.side === 'Bride' ? '👰 Bride Side' : member.side === 'Groom' ? '🤵 Groom Side' : '✨ Both / General'}
                                </span>
                              </div>

                              <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 font-semibold">
                                <span className="text-slate-600">{member.role}</span>
                                <span>•</span>
                                <div className="flex items-center gap-1">
                                  <PhoneCall size={11} className="text-emerald-600 shrink-0" />
                                  <a href={`tel:${member.phone}`} className="hover:underline text-slate-800">{member.phone || 'No phone'}</a>
                                  {member.phone && (
                                    <button
                                      type="button"
                                      onClick={() => handleCopy(member.phone, `phone_${member.id}`)}
                                      className="p-0.5 text-slate-400 hover:text-indigo-600 transition-colors ml-0.5"
                                      title="Copy Phone Number"
                                    >
                                      {copiedText === `phone_${member.id}` ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => openAddCrewModal(ev.id, member)}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="Edit Crew Member"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteCrewMember(ev.id, member.id)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Remove Crew Member"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400 text-xs flex flex-col items-center gap-1.5">
                      <Users size={20} className="text-slate-300" />
                      <span>No photographers or videographers assigned yet.</span>
                      <button 
                        type="button"
                        onClick={() => openAddCrewModal(ev.id)} 
                        className="text-indigo-600 font-bold hover:underline mt-1"
                      >
                        + Assign Bride/Groom Crew
                      </button>
                    </div>
                  )}
                </div>

                {/* 2. HDD Storage & RAW Backup Log */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-slate-100 text-slate-800 rounded-xl">
                        <HardDrive size={16} />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-sm">HDD Storage & RAW Backups</h4>
                        <p className="text-[11px] text-slate-500 font-medium">Drive Labels, Folder Paths & Copied By Log</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg">
                      {totalHddCount} Record{totalHddCount !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {ev.hddStorage && ev.hddStorage.length > 0 ? (
                    <div className="space-y-3">
                      {ev.hddStorage.map((hdd) => (
                        <div key={hdd.id} className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2 hover:border-indigo-200 transition-all">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="px-2 py-0.5 bg-slate-900 text-white text-[10px] font-extrabold rounded-md flex items-center gap-1 shrink-0">
                                <HardDrive size={11} /> {hdd.hddName}
                              </span>
                              <span className="text-[11px] font-bold text-slate-700">
                                Copied by: <span className="text-indigo-700 font-extrabold">{hdd.copiedBy}</span>
                              </span>
                              {hdd.copiedDate && (
                                <span className="text-[10px] text-slate-400 font-semibold">({new Date(hdd.copiedDate).toLocaleDateString()})</span>
                              )}
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => openAddHddModal(ev.id, hdd)}
                                className="p-1 text-slate-400 hover:text-indigo-600 rounded transition-colors"
                              >
                                <Edit2 size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteHdd(ev.id, hdd.id)}
                                className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>

                          {/* Path Bar */}
                          <div className="flex items-center justify-between gap-2 font-mono text-[11px] bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-800">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <Folder size={13} className="text-amber-500 shrink-0" />
                              <span className="truncate">{hdd.folderPath}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleCopy(hdd.folderPath, `hdd_${hdd.id}`)}
                              className="p-1 text-slate-400 hover:text-indigo-600 shrink-0 transition-colors"
                              title="Copy Folder Path"
                            >
                              {copiedText === `hdd_${hdd.id}` ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                            </button>
                          </div>

                          {hdd.notes && (
                            <p className="text-[11px] text-slate-500 italic px-1">{hdd.notes}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400 text-xs flex flex-col items-center gap-1.5">
                      <HardDrive size={20} className="text-slate-300" />
                      <span>No hard drive backup paths recorded for this event.</span>
                      <button 
                        type="button"
                        onClick={() => openAddHddModal(ev.id)} 
                        className="text-indigo-600 font-bold hover:underline mt-1"
                      >
                        + Add HDD Path & Copied Person
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ========================================================= */}
      {/* WORK ASSIGNMENTS TABLE                                     */}
      {/* ========================================================= */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Briefcase size={20} className="text-indigo-600" />
            Work Assignments ({clientAssignments.length})
          </h2>

          <div className="flex items-center gap-3">
            <select
              value={taskFilter}
              onChange={(e) => setTaskFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="All">All Statuses</option>
              <option value="To Do">To Do</option>
              <option value="In Progress">In Progress</option>
              <option value="Review">Review</option>
              <option value="Done">Done</option>
            </select>

            <button
              type="button"
              onClick={() => onAssignWork(client)}
              className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-1 shadow-sm"
            >
              <Plus size={14} />
              New Task
            </button>
          </div>
        </div>

        {filteredAssignments.length > 0 ? (
          <div className="overflow-x-auto bg-white rounded-2xl border border-slate-200 shadow-2xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-extrabold uppercase text-slate-500 tracking-wider">
                  <th className="py-3 px-3 w-8 text-center"></th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-4">Task & Priority</th>
                  <th className="py-3 px-4">Assignee</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredAssignments.map((task) => {
                  const assignee = getAssignee(task.assigneeId);
                  const linkedEvent = client.events.find(e => e.id === task.eventId);
                  const isExpanded = !!expandedTasks[task.id];
                  const totalSubtasks = task.subtasks?.length || 0;
                  const completedSubtasks = task.subtasks?.filter(s => s.completed).length || 0;

                  return (
                    <React.Fragment key={task.id}>
                      <tr className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => toggleTaskExpand(task.id)}
                            className="p-1 text-slate-400 hover:text-indigo-600 rounded transition-colors"
                            title="Toggle Task Details"
                          >
                            {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                          </button>
                        </td>

                        <td className="py-3 px-3 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            {statusIcons[task.status]}
                            <select
                              value={task.status}
                              onChange={(e) => onUpdateAssignmentStatus(task.id, e.target.value as AssignmentStatus)}
                              className="bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 px-1.5 py-0.5 outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                            >
                              <option value="To Do">To Do</option>
                              <option value="In Progress">In Progress</option>
                              <option value="Review">Review</option>
                              <option value="Done">Done</option>
                            </select>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider shrink-0 ${priorityColors[task.priority]}`}>
                              {task.priority}
                            </span>
                            <span className="font-bold text-slate-900 text-xs sm:text-sm">{task.title}</span>
                            {linkedEvent && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 shrink-0">
                                📅 {linkedEvent.type}
                              </span>
                            )}
                            {totalSubtasks > 0 && (
                              <button
                                type="button"
                                onClick={() => toggleTaskExpand(task.id)}
                                className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 flex items-center gap-1 shrink-0"
                              >
                                <CheckSquare size={11} />
                                <span>{completedSubtasks}/{totalSubtasks}</span>
                              </button>
                            )}
                          </div>
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-slate-100 overflow-hidden border border-slate-200 flex items-center justify-center shrink-0 text-[10px] font-bold text-slate-600">
                              {assignee?.profilePicture ? (
                                <img src={assignee.profilePicture} className="w-full h-full object-cover" alt={assignee.name} />
                              ) : (
                                <User size={12} className="text-slate-400" />
                              )}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-800 leading-tight">{assignee?.name || 'Unassigned'}</p>
                              <p className="text-[10px] text-slate-400 leading-tight">{assignee?.role || 'Crew'}</p>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap text-slate-600 font-medium">
                          <div className="flex items-center gap-1.5 text-xs">
                            <Calendar size={13} className="text-slate-400" />
                            <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                          </div>
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => onEditAssignment(task)}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="Edit Task"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeleteAssignment(task.id)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete Task"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr className="bg-slate-50/70">
                          <td colSpan={6} className="px-6 py-3 border-b border-slate-100">
                            <div className="space-y-2 text-xs text-slate-600">
                              {task.description && (
                                <p className="bg-white p-2.5 rounded-lg border border-slate-200 leading-relaxed text-slate-700">
                                  {task.description}
                                </p>
                              )}
                              <TaskProgressBar task={task} onToggleSubtask={onToggleSubtask} />
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-200 space-y-3">
            <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-500 flex items-center justify-center mx-auto">
              <Briefcase size={24} />
            </div>
            <div>
              <p className="font-bold text-slate-800">No work assignments found</p>
              <p className="text-xs text-slate-500 mt-1">
                Assign studio work derived from this client's confirmed events to track production progress.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onAssignWork(client)}
              className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition-colors inline-flex items-center gap-1.5 shadow-md shadow-indigo-500/20"
            >
              <Plus size={14} />
              Assign Work Now
            </button>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* MODAL 1: ADD / EDIT CREW MEMBER (PHOTOGRAPHER / VIDEO)   */}
      {/* ========================================================= */}
      {isCrewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={() => setIsCrewModalOpen(false)} />
          <div className="relative bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-100 text-indigo-700 rounded-xl">
                  <UserPlus size={18} />
                </div>
                <h3 className="font-bold text-slate-800 text-base">
                  {editingCrewId ? 'Edit Crew Assignment' : 'Assign Photographer / Videographer'}
                </h3>
              </div>
              <button 
                type="button" 
                onClick={() => setIsCrewModalOpen(false)} 
                className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleSaveCrewMember(); }} className="p-5 space-y-4">
              {/* Optional Quick Pick from Studio Team */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Quick Pick from Studio Employees</label>
                <select
                  value={selectedEmployeeId}
                  onChange={(e) => handleSelectEmployeeForCrew(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="">-- Choose Employee (Optional) --</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.role} - {emp.department})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Crew Member Name *</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Aakash Patel"
                  value={crewName}
                  onChange={(e) => setCrewName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Phone Number *</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. +91 98111 22334"
                  value={crewPhone}
                  onChange={(e) => setCrewPhone(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Role *</label>
                  <select
                    value={crewRole}
                    onChange={(e) => setCrewRole(e.target.value as CrewRole)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none"
                  >
                    <option value="Photographer">📷 Photographer</option>
                    <option value="Videographer">🎥 Videographer</option>
                    <option value="Drone Operator">🚁 Drone Operator</option>
                    <option value="Assistant">🤝 Assistant</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Side Assignment *</label>
                  <select
                    value={crewSide}
                    onChange={(e) => setCrewSide(e.target.value as SideType)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none"
                  >
                    <option value="Bride">👰 Bride Side</option>
                    <option value="Groom">🤵 Groom Side</option>
                    <option value="Both">✨ Both Sides / General</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCrewModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-indigo-500/20"
                >
                  {editingCrewId ? 'Update Crew' : 'Add Crew Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: ADD / EDIT HDD STORAGE PATH & COPIED PERSON LOG  */}
      {/* ========================================================= */}
      {isHddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={() => setIsHddModalOpen(false)} />
          <div className="relative bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-slate-900 text-white rounded-xl">
                  <HardDrive size={18} />
                </div>
                <h3 className="font-bold text-slate-800 text-base">
                  {editingHddId ? 'Edit HDD Backup Log' : 'Log HDD Storage & RAW Path'}
                </h3>
              </div>
              <button 
                type="button" 
                onClick={() => setIsHddModalOpen(false)} 
                className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleSaveHdd(); }} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Hard Drive / SSD Name *</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. WD MyPassport 4TB Red (#A1)"
                  value={hddName}
                  onChange={(e) => setHddName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Folder Path / Directory *</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. /RAW_BACKUPS/2026_ROYAL_WEDDING/BRIDE_CAM_A"
                  value={folderPath}
                  onChange={(e) => setFolderPath(e.target.value)}
                  className="w-full px-3.5 py-2 font-mono text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">Copied By *</label>
                  <span className="text-[10px] text-indigo-600 font-extrabold uppercase">Select team or type custom</span>
                </div>

                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      setCopiedBy(e.target.value);
                    }
                  }}
                  value={
                    [
                      ...employees.map(e => e.name),
                      ...(client.events.flatMap(ev => ev.crew || []).map(c => c.name))
                    ].includes(copiedBy) ? copiedBy : ''
                  }
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="">-- Quick Select Person (Employees & Photographers) --</option>
                  {employees.length > 0 && (
                    <optgroup label="Studio Employees">
                      {employees.map(emp => (
                        <option key={`emp_select_${emp.id}`} value={emp.name}>
                          👤 {emp.name} ({emp.role})
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {client.events.flatMap(ev => ev.crew || []).length > 0 && (
                    <optgroup label="Event Crew & Photographers">
                      {Array.from(
                        new Map(
                          client.events
                            .flatMap(ev => ev.crew || [])
                            .map(c => [c.name, c])
                        ).values()
                      ).map(crew => (
                        <option key={`crew_select_${crew.id}`} value={crew.name}>
                          📷 {crew.name} ({crew.role} - {crew.side} Side)
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600">Copied Person Name *</label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. Arjun Mehta"
                      value={copiedBy}
                      onChange={(e) => setCopiedBy(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600">Copied Date</label>
                    <input
                      type="date"
                      value={copiedDate}
                      onChange={(e) => setCopiedDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Notes / Details</label>
                <input
                  type="text"
                  placeholder="e.g. Sony A7IV RAW photos + 4K MOV 10-bit video dumps"
                  value={hddNotes}
                  onChange={(e) => setHddNotes(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsHddModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all shadow-md"
                >
                  {editingHddId ? 'Update Record' : 'Save HDD Log'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        type={confirmModal.type}
        onConfirm={confirmModal.onConfirm}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

export default ClientDetail;
