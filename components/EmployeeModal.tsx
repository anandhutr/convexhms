import React, { useState, useEffect, useRef } from 'react';
import { X, Upload, User, KeyRound } from 'lucide-react';
import { Employee, Department } from '../types';
import { DEPARTMENTS } from '../constants';
import { BASE_DEFAULT_PASSWORD } from './LoginModal';

interface EmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (employee: Partial<Employee>) => void;
  initialData?: Employee | null;
  isAdmin?: boolean;
}

const EmployeeModal: React.FC<EmployeeModalProps> = ({ isOpen, onClose, onSubmit, initialData, isAdmin = true }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<Partial<Employee>>({
    name: '',
    email: '',
    phone: '',
    role: '',
    department: 'HR',
    salary: 50000,
    status: 'Active',
    performanceScore: 5.0,
    bio: '',
    profilePicture: '',
    password: BASE_DEFAULT_PASSWORD,
    accessLevel: 'employee'
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        password: initialData.password || BASE_DEFAULT_PASSWORD,
        accessLevel: initialData.accessLevel || 'employee'
      });
    } else {
      setFormData({
        name: '',
        email: '',
        role: '',
        department: 'HR',
        salary: 50000,
        status: 'Active',
        performanceScore: 5.0,
        bio: '',
        profilePicture: '',
        password: BASE_DEFAULT_PASSWORD,
        accessLevel: 'employee'
      });
    }
  }, [initialData, isOpen]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) { // 1MB limit for local storage friendliness
        alert("File too large. Please select an image under 1MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, profilePicture: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-800">
            {initialData ? 'Edit Employee Profile' : 'Add New Employee'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <form className="p-6 overflow-y-auto max-h-[80vh]" onSubmit={(e) => {
          e.preventDefault();
          onSubmit(formData);
        }}>
          <div className="flex flex-col items-center mb-6">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full bg-slate-100 border-2 border-slate-200 overflow-hidden flex items-center justify-center">
                {formData.profilePicture ? (
                  <img src={formData.profilePicture} alt="Profile Preview" className="w-full h-full object-cover" />
                ) : (
                  <User size={40} className="text-slate-300" />
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 flex items-center justify-center bg-black/40 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Upload size={20} />
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleFileChange} 
              />
            </div>
            <p className="text-xs text-slate-500 mt-2 font-medium">Click to upload profile picture</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700">Full Name</label>
              <input 
                required
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700">Email Address</label>
              <input 
                required
                type="email"
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700 flex items-center justify-between">
                <span>Mobile Phone Number</span>
                <span className="text-red-500 text-xs font-bold">*Mandatory</span>
              </label>
              <input 
                required
                type="tel"
                placeholder="+91 98765 43210"
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800"
                value={formData.phone || ''}
                onChange={e => setFormData({...formData, phone: e.target.value})}
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700">Role Title</label>
              <input 
                required
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                value={formData.role}
                onChange={e => setFormData({...formData, role: e.target.value})}
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700">Department</label>
              <select 
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                value={formData.department}
                onChange={e => setFormData({...formData, department: e.target.value as Department})}
              >
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            {isAdmin && (
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">System Access Level</label>
                <select 
                  className="w-full px-4 py-2 bg-indigo-50/60 border border-indigo-200 rounded-xl font-bold text-indigo-900 text-sm"
                  value={formData.accessLevel || 'employee'}
                  onChange={e => setFormData({...formData, accessLevel: e.target.value as 'admin' | 'employee'})}
                >
                  <option value="employee">👤 Staff / Employee (Work Tracking & Dashboard)</option>
                  <option value="admin">👑 Admin (Full Access: Clients, Financials & HR)</option>
                </select>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700">
                Account Password
              </label>
              <div className="relative">
                <input 
                  type="password"
                  placeholder="Set account password"
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  value={formData.password || ''}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                />
              </div>
            </div>

            {isAdmin && (
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Salary (Annual ₹)</label>
                <input 
                  required
                  type="number"
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  value={formData.salary}
                  onChange={e => setFormData({...formData, salary: Number(e.target.value)})}
                />
              </div>
            )}

            <div className="space-y-1 md:col-span-2">
              <label className="text-sm font-semibold text-slate-700">Performance Score (1-10)</label>
              <input 
                required
                type="number"
                step="0.1"
                min="0"
                max="10"
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                value={formData.performanceScore}
                onChange={e => setFormData({...formData, performanceScore: Number(e.target.value)})}
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-sm font-semibold text-slate-700">Short Bio / Achievements</label>
              <textarea 
                rows={3}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl resize-none"
                value={formData.bio}
                onChange={e => setFormData({...formData, bio: e.target.value})}
              />
            </div>
          </div>
          
          <div className="mt-8 pt-4 border-t border-slate-100 flex gap-3 justify-end">
            <button 
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-slate-600 font-semibold hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/30"
            >
              {initialData ? 'Save Changes' : 'Add Employee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmployeeModal;
