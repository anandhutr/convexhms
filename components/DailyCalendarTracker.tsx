import React, { useState } from 'react';
import { Client, Assignment, Employee, ClientEvent } from '../types';
import { 
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, Contact2, 
  User, Phone, MapPin, CheckCircle2, Clock, Plus, Users, ExternalLink 
} from 'lucide-react';

interface DailyCalendarTrackerProps {
  clients: Client[];
  assignments: Assignment[];
  employees: Employee[];
  onSelectClient?: (clientId: string) => void;
  onNewTask?: (clientId?: string, eventId?: string) => void;
}

export const DailyCalendarTracker: React.FC<DailyCalendarTrackerProps> = ({
  clients = [],
  assignments = [],
  employees = [],
  onSelectClient,
  onNewTask
}) => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  // Month navigation
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDateStr(today.toISOString().split('T')[0]);
  };

  // Calendar math
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Helper to format date string YYYY-MM-DD
  const formatDateStr = (year: number, month: number, day: number) => {
    const m = String(month + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${year}-${m}-${d}`;
  };

  // Flatten all events with client info
  const allEvents = clients.flatMap(client => 
    (client.events || []).map(event => ({
      ...event,
      client
    }))
  );

  // Events & Tasks for the selected date
  const selectedDayEvents = allEvents.filter(ev => ev.date === selectedDateStr);
  const selectedDayTasks = assignments.filter(task => task.dueDate === selectedDateStr);

  const getAssignee = (id: string) => employees.find(e => e.id === id);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2.5">
            <CalendarIcon className="text-indigo-600" size={24} />
            <span>Daily Schedule & Shoot Tracker</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">Calendar overview of scheduled client function shoots, assigned crew rosters, and task deadlines.</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={goToToday}
            className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold text-xs rounded-xl border border-indigo-200 transition-all"
          >
            Today ({new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: MONTHLY CALENDAR GRID (7 Cols on LG) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
          {/* Month Header Navigation */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-extrabold text-slate-900 text-base">
              {monthNames[month]} {year}
            </h3>
            
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={prevMonth}
                className="p-2 hover:bg-slate-100 rounded-xl text-slate-600 transition-colors"
                title="Previous Month"
              >
                <ChevronLeft size={18} />
              </button>

              <button
                type="button"
                onClick={nextMonth}
                className="p-2 hover:bg-slate-100 rounded-xl text-slate-600 transition-colors"
                title="Next Month"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          {/* Days of Week Header */}
          <div className="grid grid-cols-7 text-center text-[11px] font-extrabold uppercase text-slate-400">
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>

          {/* Calendar Grid Days */}
          <div className="grid grid-cols-7 gap-1.5">
            {/* Empty slots for start of month */}
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} className="h-20 bg-slate-50/50 rounded-xl border border-slate-100/50" />
            ))}

            {/* Days in Month */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = formatDateStr(year, month, day);
              const isSelected = dateStr === selectedDateStr;
              const isToday = dateStr === new Date().toISOString().split('T')[0];

              const dayEvents = allEvents.filter(ev => ev.date === dateStr);
              const dayTasks = assignments.filter(task => task.dueDate === dateStr);
              const totalItems = dayEvents.length + dayTasks.length;

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => setSelectedDateStr(dateStr)}
                  className={`h-22 p-2 rounded-2xl border text-left flex flex-col justify-between transition-all relative overflow-hidden ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/70 shadow-sm ring-2 ring-indigo-500/20'
                      : isToday
                      ? 'border-indigo-300 bg-indigo-50/30 font-bold'
                      : 'border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-black rounded-lg px-1.5 py-0.5 ${
                      isToday
                        ? 'bg-indigo-600 text-white'
                        : isSelected
                        ? 'text-indigo-700 font-extrabold'
                        : 'text-slate-800'
                    }`}>
                      {day}
                    </span>

                    {totalItems > 0 && (
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                    )}
                  </div>

                  {/* Day Badges */}
                  <div className="space-y-1 mt-1">
                    {dayEvents.length > 0 && (
                      <div className="px-1.5 py-0.5 bg-amber-500 text-white font-black text-[9px] rounded-md truncate">
                        🎥 {dayEvents.length} Shoot{dayEvents.length > 1 ? 's' : ''}
                      </div>
                    )}

                    {dayTasks.length > 0 && (
                      <div className="px-1.5 py-0.5 bg-indigo-600 text-white font-black text-[9px] rounded-md truncate">
                        📋 {dayTasks.length} Task{dayTasks.length > 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN: SELECTED DAY INSPECTOR & CREW ROSTER (5 Cols on LG) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Selected Date Header */}
          <div className="bg-slate-900 text-white p-5 rounded-3xl shadow-sm space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-indigo-300">Selected Date Inspector</span>
            <h3 className="text-lg font-black text-white">
              {new Date(selectedDateStr + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </h3>
            <p className="text-xs text-slate-300">
              {selectedDayEvents.length} Scheduled Shoot{selectedDayEvents.length !== 1 ? 's' : ''} • {selectedDayTasks.length} Due Task{selectedDayTasks.length !== 1 ? 's' : ''}
            </p>
          </div>

          {/* 1. Scheduled Client Function Shoots & Crew Roster */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <Users size={16} className="text-indigo-600" />
                <span>Client Function Shoots & Crew Roster</span>
              </h4>
              <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-black rounded-full">
                {selectedDayEvents.length} Event{selectedDayEvents.length !== 1 ? 's' : ''}
              </span>
            </div>

            {selectedDayEvents.length > 0 ? (
              <div className="space-y-4">
                {selectedDayEvents.map(event => (
                  <div key={event.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="px-2 py-0.5 bg-amber-500 text-white text-[10px] font-black rounded-md uppercase tracking-wider">
                          {event.type} Ceremony
                        </span>
                        <h5 className="font-extrabold text-slate-900 text-sm mt-1">{event.type} — {event.client.name}</h5>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <MapPin size={12} className="text-slate-400 shrink-0" />
                          <span>{event.venue || 'Venue Address TBD'}</span>
                        </p>
                      </div>

                      {onSelectClient && (
                        <button
                          type="button"
                          onClick={() => onSelectClient(event.client.id)}
                          className="px-2.5 py-1 bg-white hover:bg-slate-100 text-indigo-700 border border-slate-200 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 shrink-0"
                        >
                          <Contact2 size={13} />
                          <span>CRM</span>
                        </button>
                      )}
                    </div>

                    {/* Assigned Crew Roster */}
                    <div className="pt-2 border-t border-slate-200/80 space-y-2">
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Assigned Shoot Crew:</p>
                      {event.crew && event.crew.length > 0 ? (
                        <div className="space-y-1.5">
                          {event.crew.map(crew => (
                            <div key={crew.id} className="p-2 bg-white rounded-xl border border-slate-200/80 flex items-center justify-between text-xs">
                              <div>
                                <span className="font-bold text-slate-900 block">{crew.name}</span>
                                <span className="text-[10px] font-bold text-indigo-600">{crew.role} ({crew.side} side)</span>
                              </div>
                              {crew.phone && (
                                <a href={`tel:${crew.phone}`} className="text-[10px] font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded transition-colors flex items-center gap-1">
                                  <Phone size={11} />
                                  <span>{crew.phone}</span>
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 italic">No photographer or videographer crew assigned to this shoot yet.</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs">
                No client function shoots scheduled for this date.
              </div>
            )}
          </div>

          {/* 2. Tasks Due on Selected Date */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <Clock size={16} className="text-indigo-600" />
                <span>Production Tasks Due</span>
              </h4>
              <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-800 text-[10px] font-black rounded-full">
                {selectedDayTasks.length} Task{selectedDayTasks.length !== 1 ? 's' : ''}
              </span>
            </div>

            {selectedDayTasks.length > 0 ? (
              <div className="space-y-2.5">
                {selectedDayTasks.map(task => {
                  const assignee = getAssignee(task.assigneeId);
                  return (
                    <div key={task.id} className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-3 text-xs">
                      <div>
                        <h5 className="font-extrabold text-slate-900">{task.title}</h5>
                        <p className="text-[10px] text-slate-500 mt-0.5">Pending with: <strong className="text-slate-800">{assignee?.name || 'Unassigned'}</strong></p>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase shrink-0 ${
                        task.status === 'Done' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {task.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-6 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs">
                No task deadlines due on this date.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyCalendarTracker;
