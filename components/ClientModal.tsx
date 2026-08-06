
import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Calendar, MapPin, AlignLeft, CreditCard, IndianRupee, CheckCircle2 } from 'lucide-react';
import { Client, ClientEvent, Religion, EventType } from '../types';
import { GoogleCalendarButton } from './GoogleCalendarButton';
import { createGoogleCalendarEvent, getCalendarAccessToken } from '../services/googleCalendarService';

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (client: Partial<Client>) => void;
  initialData?: Client | null;
}

const ClientModal: React.FC<ClientModalProps> = ({ isOpen, onClose, onSubmit, initialData }) => {
  const [formData, setFormData] = useState<Partial<Client>>({
    name: '',
    email: '',
    phone: '',
    religion: 'Others',
    workScope: 'Both',
    packageAmount: 0,
    advancePaid: 0,
    paymentNotes: '',
    status: 'Lead',
    events: []
  });

  const [autoSyncCalendar, setAutoSyncCalendar] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        name: '',
        email: '',
        phone: '',
        religion: 'Others',
        workScope: 'Both',
        packageAmount: 0,
        advancePaid: 0,
        paymentNotes: '',
        status: 'Lead',
        events: [{ id: Math.random().toString(), type: 'Wedding', date: '', venue: '', notes: '', sideType: 'Both' }]
      });
    }
  }, [initialData, isOpen]);

  const addEvent = () => {
    const newEvent: ClientEvent = {
      id: Math.random().toString(),
      type: 'Wedding',
      date: '',
      venue: '',
      notes: ''
    };
    setFormData(prev => ({ ...prev, events: [...(prev.events || []), newEvent] }));
  };

  const STANDARD_FUNCTION_TYPES = [
    'Wedding', 'Engagement', 'Save the Date', 'Pre-Wedding Shoot', 
    'Reception', 'Haldi', 'Sangeet', 'Mehendi'
  ];

  const removeEvent = (id: string) => {
    setFormData(prev => ({ ...prev, events: prev.events?.filter(e => e.id !== id) }));
  };

  const updateEvent = (id: string, field: keyof ClientEvent, value: string) => {
    setFormData(prev => ({
      ...prev,
      events: prev.events?.map(e => e.id === id ? { ...e, [field]: value } : e)
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-800">
            {initialData ? 'Edit Client Portfolio' : 'New Client Registration'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <form className="p-6 overflow-y-auto max-h-[80vh] space-y-8" onSubmit={async (e) => {
          e.preventDefault();
          
          if (autoSyncCalendar && formData.events && formData.events.length > 0) {
            const token = getCalendarAccessToken();
            if (token) {
              setIsSyncing(true);
              const mockClientObj = {
                id: formData.id || Math.random().toString(),
                name: formData.name || 'Client',
                phone: formData.phone || '',
                email: formData.email || '',
                religion: formData.religion || 'Others',
                workScope: formData.workScope || 'Both',
                status: formData.status || 'Lead',
                packageAmount: formData.packageAmount || 0,
                advancePaid: formData.advancePaid || 0,
                events: formData.events || []
              };

              let syncedCount = 0;
              for (const ev of formData.events) {
                if (ev.date) {
                  const res = await createGoogleCalendarEvent(mockClientObj as any, ev);
                  if (res.success) syncedCount++;
                }
              }
              setIsSyncing(false);
            }
          }

          onSubmit(formData);
        }}>
          {/* Section: Basic Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-indigo-600 uppercase tracking-wider">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Client Name</label>
                <input 
                  required
                  placeholder="e.g. Rahul & Sneha"
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Religion / Tradition</label>
                <select 
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  value={formData.religion}
                  onChange={e => setFormData({...formData, religion: e.target.value as Religion})}
                >
                  <option value="Hindu">Hindu</option>
                  <option value="Muslim">Muslim</option>
                  <option value="Christian">Christian</option>
                  <option value="Others">Others</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Email Address</label>
                <input 
                  type="email"
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Phone Number</label>
                <input 
                  required
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Work Scope (Both or Single Side)</label>
                <select 
                  className="w-full px-4 py-2 bg-indigo-50/50 border border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none font-bold text-slate-800"
                  value={formData.workScope || 'Both'}
                  onChange={e => setFormData({...formData, workScope: e.target.value as 'Both' | 'Single'})}
                >
                  <option value="Both">Bride & Groom (Both Side Work)</option>
                  <option value="Single">Single Side Work Only</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Current Status</label>
                <select 
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  value={formData.status}
                  onChange={e => setFormData({...formData, status: e.target.value as any})}
                >
                  <option value="Lead">Lead</option>
                  <option value="Booked">Booked</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-1 text-pink-700">
                  <span>👰 Bride Instagram Handle / Link</span>
                </label>
                <input 
                  type="text"
                  placeholder="e.g. @sneha_bride or instagram.com/sneha"
                  className="w-full px-4 py-2 bg-pink-50/50 border border-pink-200 rounded-xl focus:ring-2 focus:ring-pink-500/20 outline-none text-xs font-semibold text-slate-800"
                  value={formData.brideInstagram || ''}
                  onChange={e => setFormData({...formData, brideInstagram: e.target.value})}
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-1 text-indigo-700">
                  <span>🤵 Groom Instagram Handle / Link</span>
                </label>
                <input 
                  type="text"
                  placeholder="e.g. @rahul_groom or instagram.com/rahul"
                  className="w-full px-4 py-2 bg-indigo-50/50 border border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none text-xs font-semibold text-slate-800"
                  value={formData.groomInstagram || ''}
                  onChange={e => setFormData({...formData, groomInstagram: e.target.value})}
                />
              </div>
            </div>
          </div>

          {/* Section: Payment & Commercial Details */}
          <div className="space-y-4 p-5 bg-slate-50/80 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-2">
                <CreditCard size={18} className="text-emerald-600" />
                <span>Package & Payment Terms</span>
              </h3>
              <span className="text-xs font-bold text-slate-500 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                INR (₹)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-extrabold text-slate-700 uppercase">Total Package Amount (₹)</label>
                <input 
                  type="number"
                  placeholder="e.g. 450000"
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none font-bold text-slate-900"
                  value={formData.packageAmount || ''}
                  onChange={e => setFormData({...formData, packageAmount: parseFloat(e.target.value) || 0})}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-extrabold text-slate-700 uppercase">Advance Amount Paid (₹)</label>
                <input 
                  type="number"
                  placeholder="e.g. 200000"
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none font-bold text-emerald-700"
                  value={formData.advancePaid || ''}
                  onChange={e => setFormData({...formData, advancePaid: parseFloat(e.target.value) || 0})}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-extrabold text-slate-700 uppercase">Balance Amount Payable</label>
                <div className="w-full px-4 py-2 bg-amber-50 border border-amber-200 rounded-xl font-black text-amber-900 text-sm flex items-center justify-between">
                  <span>₹{((formData.packageAmount || 0) - (formData.advancePaid || 0)).toLocaleString()}</span>
                  <span className="text-[10px] font-bold uppercase text-amber-700">Auto-Calculated</span>
                </div>
              </div>

              <div className="md:col-span-3 space-y-1">
                <label className="text-xs font-extrabold text-slate-700 uppercase">Payment Notes / Payment Milestones</label>
                <input 
                  placeholder="e.g. Received ₹2L advance via UPI on booking date. Balance payable on wedding day."
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none text-xs text-slate-800"
                  value={formData.paymentNotes || ''}
                  onChange={e => setFormData({...formData, paymentNotes: e.target.value})}
                />
              </div>
            </div>
          </div>

          {/* Section: Dynamic Events */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-gradient-to-r from-blue-50 to-indigo-50 p-3.5 rounded-2xl border border-indigo-100">
              <div className="flex items-center gap-2">
                <Calendar size={18} className="text-blue-600 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Google Calendar Date Blocking</h4>
                  <p className="text-[11px] text-slate-500 font-medium">Sync dates & venues directly into Google Calendar</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <GoogleCalendarButton compact />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-indigo-600 uppercase tracking-wider">Scheduled Functions & Dates</h3>
              <button 
                type="button" 
                onClick={addEvent}
                className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700"
              >
                <Plus size={14} /> Add Function
              </button>
            </div>
            
            <div className="space-y-4">
              {formData.events?.map((ev, index) => {
                const isStandardType = STANDARD_FUNCTION_TYPES.includes(ev.type);
                const selectedSelectValue = isStandardType ? ev.type : 'Other';

                return (
                  <div key={ev.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl relative group">
                    <button 
                      type="button"
                      onClick={() => removeEvent(ev.id)}
                      className="absolute -top-2 -right-2 p-1.5 bg-red-100 text-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={12} />
                    </button>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Function Type</label>
                        <select 
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-semibold"
                          value={selectedSelectValue}
                          onChange={e => {
                            const val = e.target.value;
                            if (val === 'Other') {
                              updateEvent(ev.id, 'type', 'Other');
                            } else {
                              updateEvent(ev.id, 'type', val);
                            }
                          }}
                        >
                          <option value="Wedding">Wedding</option>
                          <option value="Engagement">Engagement</option>
                          <option value="Save the Date">Save the Date</option>
                          <option value="Pre-Wedding Shoot">Pre-Wedding Shoot</option>
                          <option value="Reception">Reception</option>
                          <option value="Haldi">Haldi</option>
                          <option value="Sangeet">Sangeet</option>
                          <option value="Mehendi">Mehendi</option>
                          <option value="Other">Other (Custom Function)</option>
                        </select>

                        {selectedSelectValue === 'Other' && (
                          <div className="mt-1.5">
                            <input 
                              type="text"
                              placeholder="Type custom function name..."
                              className="w-full px-3 py-1.5 bg-indigo-50/70 border border-indigo-200 rounded-lg text-xs font-semibold text-indigo-950 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                              value={ev.type === 'Other' ? '' : ev.type}
                              onChange={e => updateEvent(ev.id, 'type', e.target.value || 'Other')}
                            />
                          </div>
                        )}
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Side Work Scope</label>
                        <select 
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-700"
                          value={ev.sideType || 'Both'}
                          onChange={e => updateEvent(ev.id, 'sideType', e.target.value)}
                        >
                          <option value="Both">Bride & Groom (Both Sides)</option>
                          <option value="Single">Single Side Work</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Function Date</label>
                        <input 
                          type="date"
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm"
                          value={ev.date}
                          onChange={e => updateEvent(ev.id, 'date', e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-extrabold text-indigo-700 uppercase flex items-center gap-1">
                          <MapPin size={12} className="text-indigo-600 shrink-0" />
                          <span>Venue Location / Address *</span>
                        </label>
                        <input 
                          required
                          placeholder="e.g. Leela Palace, Udaipur / Grand Ballroom"
                          className="w-full px-3 py-1.5 bg-white border border-indigo-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 outline-none"
                          value={ev.venue}
                          onChange={e => updateEvent(ev.id, 'venue', e.target.value)}
                        />
                      </div>
                      <div className="md:col-span-4 space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Specific Details / Notes</label>
                        <input 
                          placeholder="e.g. Sangeet themes, Christian choir requirements, etc."
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm"
                          value={ev.notes}
                          onChange={e => updateEvent(ev.id, 'notes', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className="pt-6 flex gap-3 justify-end border-t border-slate-100">
            <button 
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-slate-600 font-semibold hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/30"
            >
              {initialData ? 'Update Portfolio' : 'Save Client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClientModal;
