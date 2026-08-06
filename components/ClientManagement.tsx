import React, { useState } from 'react';
import { Client, Assignment } from '../types';
import { 
  Search, Filter, Mail, Phone, Calendar, Edit2, Trash2, 
  ExternalLink, UserCheck, Eye, Plus, ShieldCheck, MapPin, Contact2 
} from 'lucide-react';

interface ClientManagementProps {
  clients: Client[];
  assignments: Assignment[];
  isAdmin?: boolean;
  onEditClient: (client: Client | null) => void;
  onDeleteClient: (id: string) => void;
  onSelectClient: (clientId: string) => void;
}

export const ClientManagement: React.FC<ClientManagementProps> = ({
  clients,
  assignments,
  isAdmin = true,
  onEditClient,
  onDeleteClient,
  onSelectClient
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [filterReligion, setFilterReligion] = useState<string>('All');

  const filtered = clients.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.phone.includes(searchTerm);
    const matchesStatus = filterStatus === 'All' || c.status === filterStatus;
    const matchesReligion = filterReligion === 'All' || c.religion === filterReligion;
    return matchesSearch && matchesStatus && matchesReligion;
  });

  const getReligionStyle = (religion: string) => {
    switch (religion) {
      case 'Hindu': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Muslim': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Christian': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-purple-100 text-purple-800 border-purple-200';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Search & Filtering Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col lg:flex-row gap-4 justify-between items-center">
        <div className="relative w-full lg:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search by client name, phone or email..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-medium text-slate-800"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-start lg:justify-end">
          {isAdmin && (
            <button
              type="button"
              onClick={() => onEditClient(null)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5 shrink-0"
            >
              <Plus size={16} />
              <span>Add New Client</span>
            </button>
          )}

          <div className="flex items-center gap-2 pl-2 border-l border-slate-200 shrink-0">
            <Filter className="text-slate-400" size={16} />
            <select
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-extrabold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="All">All Booking Statuses</option>
              <option value="Booked">Booked Work</option>
              <option value="Lead">Lead</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          <select
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-extrabold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shrink-0"
            value={filterReligion}
            onChange={(e) => setFilterReligion(e.target.value)}
          >
            <option value="All">All Traditions</option>
            <option value="Hindu">Hindu</option>
            <option value="Muslim">Muslim</option>
            <option value="Christian">Christian</option>
            <option value="Others">Others</option>
          </select>
        </div>
      </div>

      {/* 6-COLUMN CARDS GRID LAYOUT */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {filtered.map((c) => {
          const clientTasks = assignments.filter(a => a.clientId === c.id);
          return (
            <div
              key={c.id}
              className="bg-white rounded-3xl border border-slate-200 shadow-2xs hover:shadow-md hover:border-indigo-300 transition-all p-4 flex flex-col justify-between space-y-3 group relative overflow-hidden"
            >
              <div className="space-y-2">
                {/* Header Badge */}
                <div className="flex items-center justify-between gap-1.5">
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border ${getReligionStyle(c.religion)}`}>
                    {c.religion}
                  </span>
                  <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 text-[10px] font-black rounded-md">
                    {c.status || 'Booked'}
                  </span>
                </div>

                {/* Client Name */}
                <div className="pt-1">
                  <h4 
                    onClick={() => onSelectClient(c.id)}
                    className="font-extrabold text-slate-900 text-sm truncate hover:text-indigo-600 cursor-pointer transition-colors flex items-center gap-1"
                  >
                    <span className="truncate">{c.name}</span>
                    <ExternalLink size={11} className="text-slate-400 shrink-0" />
                  </h4>
                  <p className="text-[10px] text-slate-500 truncate mt-0.5">{c.phone || c.email}</p>
                </div>

                {/* Confirmed Functions Pills */}
                <div className="pt-1.5 border-t border-slate-200/60 space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Functions ({c.events?.length || 0}):</p>
                  {c.events && c.events.length > 0 ? (
                    <div className="space-y-1 max-h-20 overflow-y-auto pr-0.5">
                      {c.events.map(ev => (
                        <div key={ev.id} className="bg-slate-50 p-1.5 rounded-lg border border-slate-200/80 text-[10px] flex justify-between items-center">
                          <span className="font-bold text-slate-800 truncate">{ev.type}</span>
                          <span className="font-semibold text-indigo-600 shrink-0 ml-1">{ev.date}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[10px] text-slate-400 italic">No events logged</p>
                  )}
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between gap-1.5">
                <button
                  type="button"
                  onClick={() => onSelectClient(c.id)}
                  className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[11px] rounded-xl transition-all flex items-center justify-center gap-1 shadow-2xs"
                >
                  <Contact2 size={12} />
                  <span>CRM</span>
                </button>

                {isAdmin && (
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => onEditClient(c)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="Edit Client"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteClient(c.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete Client"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filtered.length === 0 && (
        <div className="py-16 px-6 text-center bg-white rounded-3xl border border-dashed border-slate-200">
          <div className="max-w-md mx-auto space-y-3">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm">
              <Contact2 size={28} />
            </div>
            <h3 className="text-base font-bold text-slate-900">No Client Records Found</h3>
            <p className="text-xs text-slate-500">Try clearing or adjusting your search filters.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientManagement;
