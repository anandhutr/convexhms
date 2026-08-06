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
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col lg:flex-row gap-4 justify-between items-center">
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

        {/* CLIENT TABLE VIEW */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Client Profile</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Tradition</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Confirmed Functions</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Assigned Work</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Status</th>
                {isAdmin && <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((c) => {
                const clientTasks = assignments.filter(a => a.clientId === c.id);
                return (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => onSelectClient(c.id)}
                          className="w-10 h-10 rounded-xl bg-indigo-100 hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center font-bold text-indigo-700 shrink-0 shadow-2xs"
                          title="Click to open dedicated client page"
                        >
                          {c.name.charAt(0)}
                        </button>
                        <div>
                          <button
                            type="button"
                            onClick={() => onSelectClient(c.id)}
                            className="font-extrabold text-slate-900 hover:text-indigo-600 transition-colors text-left flex items-center gap-1.5 text-xs sm:text-sm"
                          >
                            <span>{c.name}</span>
                            <ExternalLink size={12} className="text-slate-400 group-hover:text-indigo-600" />
                          </button>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="flex items-center gap-1 text-[10px] text-slate-500"><Mail size={10} /> {c.email}</span>
                            <span className="flex items-center gap-1 text-[10px] text-slate-500"><Phone size={10} /> {c.phone}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${getReligionStyle(c.religion)}`}>
                        {c.religion}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1.5 max-w-xs">
                        {c.events && c.events.length > 0 ? (
                          c.events.map(e => (
                            <span key={e.id} className="px-2 py-0.5 bg-slate-100 text-slate-700 font-bold rounded-lg text-[10px] border border-slate-200">
                              {e.type} ({e.date})
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-400 italic">No events logged</span>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 font-bold rounded-full text-xs border border-indigo-100">
                        {clientTasks.length} Task(s)
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-green-100 text-green-700 font-bold rounded-full text-xs">
                        {c.status || 'Booked'}
                      </span>
                    </td>

                    {isAdmin && (
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button 
                            type="button"
                            onClick={() => onSelectClient(c.id)} 
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" 
                            title="View Client Details"
                          >
                            <Eye size={18} />
                          </button>
                          <button 
                            type="button"
                            onClick={() => onEditClient(c)} 
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" 
                            title="Edit Client Profile"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button 
                            type="button"
                            onClick={() => onDeleteClient(c.id)} 
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" 
                            title="Delete Client"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="py-16 px-6 text-center bg-slate-50/50">
              <div className="max-w-md mx-auto space-y-3">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm">
                  <Contact2 size={28} />
                </div>
                <h3 className="text-base font-bold text-slate-900">No Client Records Found</h3>
                <p className="text-xs text-slate-500">Try adjusting your search query or filters.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientManagement;
