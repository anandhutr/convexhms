import React, { useState } from 'react';
import { Client, Religion, Assignment } from '../types';
import { 
  Search, Filter, Mail, Phone, Calendar, Edit2, Trash2, 
  Sparkles, Plus, ExternalLink, Briefcase, Contact2, RotateCcw, UserPlus 
} from 'lucide-react';

interface ClientManagementProps {
  clients: Client[];
  assignments?: Assignment[];
  onSelectClient: (clientId: string) => void;
  onAssignWork: (client: Client) => void;
  onEdit: (client: Client | null) => void;
  onDelete: (id: string) => void;
  onGenerateBrief: (client: Client) => void;
}

const ClientManagement: React.FC<ClientManagementProps> = ({ 
  clients, 
  assignments = [],
  onSelectClient,
  onAssignWork,
  onEdit, 
  onDelete, 
  onGenerateBrief 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterReligion, setFilterReligion] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<string>('All');

  const filtered = clients.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRel = filterReligion === 'All' || c.religion === filterReligion;
    const matchesStatus = filterStatus === 'All' || c.status === filterStatus;
    return matchesSearch && matchesRel && matchesStatus;
  });

  const handleResetFilters = () => {
    setSearchTerm('');
    setFilterReligion('All');
    setFilterStatus('All');
  };

  const getReligionStyle = (rel: Religion) => {
    switch(rel) {
      case 'Hindu': return 'bg-orange-100 text-orange-700';
      case 'Muslim': return 'bg-green-100 text-green-700';
      case 'Christian': return 'bg-blue-100 text-blue-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col lg:flex-row gap-4 justify-between items-center">
          <div className="relative w-full lg:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search by client name or email..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <div className="flex items-center gap-2">
              <Filter className="text-slate-400" size={16} />
              <select
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium"
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
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium"
              value={filterReligion}
              onChange={(e) => setFilterReligion(e.target.value)}
            >
              <option value="All">All Religions</option>
              <option value="Hindu">Hindu</option>
              <option value="Muslim">Muslim</option>
              <option value="Christian">Christian</option>
              <option value="Others">Others</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Client Profile</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Tradition</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Confirmed Events</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Assigned Work</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-right">Actions</th>
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
                          onClick={() => onSelectClient(c.id)}
                          className="w-10 h-10 rounded-xl bg-indigo-100 hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center font-bold text-indigo-700 shrink-0"
                          title="Click to open dedicated client page"
                        >
                          {c.name.charAt(0)}
                        </button>
                        <div>
                          <button
                            onClick={() => onSelectClient(c.id)}
                            className="font-bold text-slate-900 hover:text-indigo-600 transition-colors text-left flex items-center gap-1.5"
                          >
                            <span>{c.name}</span>
                            <ExternalLink size={12} className="text-slate-400 group-hover:text-indigo-600" />
                          </button>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="flex items-center gap-1 text-[10px] text-slate-400"><Mail size={10} /> {c.email}</span>
                            <span className="flex items-center gap-1 text-[10px] text-slate-400"><Phone size={10} /> {c.phone}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getReligionStyle(c.religion)}`}>
                        {c.religion}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {c.events.slice(0, 2).map(ev => (
                          <div key={ev.id} className="flex items-center gap-2 text-xs text-slate-600">
                            <Calendar size={12} className="text-indigo-500 shrink-0" />
                            <span className="font-semibold text-slate-800">{ev.type}:</span>
                            <span className="text-slate-500">{ev.date || 'TBD'}</span>
                          </div>
                        ))}
                        {c.events.length > 2 && <p className="text-[10px] text-indigo-500 font-medium">+ {c.events.length - 2} more events</p>}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-1">
                          <Briefcase size={12} className="text-indigo-600" />
                          {clientTasks.length} task{clientTasks.length !== 1 ? 's' : ''}
                        </span>
                        <button
                          onClick={() => onAssignWork(c)}
                          className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1"
                          title="Assign Work for this Client"
                        >
                          <Plus size={12} /> Assign Work
                        </button>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        c.status === 'Booked' ? 'bg-indigo-100 text-indigo-700' : 
                        c.status === 'Lead' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {c.status}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button 
                          onClick={() => onSelectClient(c.id)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
                        >
                          View Page
                        </button>
                        <button 
                          onClick={() => onGenerateBrief(c)}
                          title="Generate AI Brief"
                          className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        >
                          <Sparkles size={16} />
                        </button>
                        <button 
                          onClick={() => onEdit(c)}
                          className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            onDelete(c.id);
                          }}
                          title="Delete Client Profile"
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Empty State Illustration with CTA */}
          {filtered.length === 0 && (
            <div className="py-16 px-6 text-center bg-slate-50/50">
              <div className="max-w-md mx-auto space-y-4">
                <div className="w-20 h-20 mx-auto rounded-3xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm">
                  <Contact2 size={36} />
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-900">No Client Profiles Found</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    {searchTerm || filterReligion !== 'All' || filterStatus !== 'All'
                      ? 'No client accounts match your current search query or tradition/status filters.'
                      : 'You have no registered client portfolios. Create a client account to log confirmed event shoots.'}
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    onClick={() => onEdit(null)}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2"
                  >
                    <UserPlus size={16} />
                    Add New Client
                  </button>

                  {(searchTerm || filterReligion !== 'All' || filterStatus !== 'All') && (
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
    </div>
  );
};

export default ClientManagement;
