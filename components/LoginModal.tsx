import React, { useState } from 'react';
import { Employee } from '../types';
import { Lock, Mail, UserCheck, ShieldAlert, KeyRound, Sparkles, LogIn, CheckCircle2, Info } from 'lucide-react';
import { signInWithGoogle, matchOrCreateEmployeeFromGoogleUser } from '../services/firebaseAuthService';

interface LoginProps {
  employees: Employee[];
  onLoginSuccess: (roleId: string) => void;
  isOpen: boolean;
  onClose?: () => void;
  isModalMode?: boolean;
}

export const BASE_DEFAULT_PASSWORD = 'studio123';
export const ADMIN_DEFAULT_PASSWORD = 'admin123';

const LoginModal: React.FC<LoginProps> = ({ 
  employees, 
  onLoginSuccess, 
  isOpen, 
  onClose,
  isModalMode = false 
}) => {
  const [selectedUser, setSelectedUser] = useState<string>('admin'); // 'admin' or employee.id
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isGoogleLoading, setIsGoogleLoading] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setErrorMsg('');
    const { user, error } = await signInWithGoogle();
    setIsGoogleLoading(false);

    if (error || !user) {
      setErrorMsg(error || 'Google Sign-In failed or was cancelled.');
      return;
    }

    const { roleId, employee, isNewAccount } = matchOrCreateEmployeeFromGoogleUser(user, employees);
    onLoginSuccess(roleId);

    if (isNewAccount && employee) {
      alert(`🎉 Welcome ${employee.name}! A new employee account has been created for your email (${employee.email}) in the Studio Database.`);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const targetEmp = employees.find(emp => emp.id === selectedUser);
    const expectedPassword = selectedUser === 'admin' 
      ? ADMIN_DEFAULT_PASSWORD 
      : (targetEmp?.password || BASE_DEFAULT_PASSWORD);

    if (passwordInput === expectedPassword) {
      onLoginSuccess(selectedUser);
      setPasswordInput('');
      setErrorMsg('');
    } else {
      setErrorMsg(`Authentication failed: Incorrect password for ${selectedUser === 'admin' ? 'Admin Director' : targetEmp?.name || 'selected employee'}. Please enter the correct account password.`);
    }
  };

  const getTargetUserLabel = () => {
    if (selectedUser === 'admin') return 'Studio Operations Director (Admin)';
    const emp = employees.find(e => e.id === selectedUser);
    return emp ? `${emp.name} (${emp.role})` : 'Select Profile';
  };

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300`}>
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-md overflow-hidden relative animate-in zoom-in-95 duration-200">
        
        {/* Header Header */}
        <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 p-8 text-white relative">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-indigo-500/30 border border-indigo-400/40 rounded-xl flex items-center justify-center font-bold text-xl text-indigo-200">
              C
            </div>
            <div>
              <h2 className="text-xl font-extrabold tracking-tight">Convex Entertainments</h2>
              <p className="text-xs text-indigo-300">Studio Management Portal</p>
            </div>
          </div>
          <h3 className="text-lg font-bold text-white mt-4">Profile Login</h3>
          <p className="text-xs text-indigo-200/90 mt-1">Select an employee account or admin profile and enter password.</p>
        </div>

        <div className="p-6 space-y-5">
          {/* Google / Gmail Auth Button */}
          <div>
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading}
              className="w-full py-3 px-4 bg-white hover:bg-slate-50 text-slate-800 font-bold rounded-xl border border-slate-300 shadow-sm hover:shadow transition-all text-sm flex items-center justify-center gap-3 active:scale-[0.99] disabled:opacity-60"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{isGoogleLoading ? 'Authenticating with Google...' : 'Sign in with Gmail / Google'}</span>
            </button>
            <p className="text-[11px] text-slate-500 font-medium text-center mt-2">
              🔒 Collecting Gmail addresses for instant Admin & Employee access mapping.
            </p>
          </div>

          <div className="relative flex items-center justify-center my-2">
            <div className="border-t border-slate-200 w-full"></div>
            <span className="bg-white px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 shrink-0">
              OR PASSCODE LOGIN
            </span>
            <div className="border-t border-slate-200 w-full"></div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Select Profile
              </label>
              <div className="relative">
                <UserCheck className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <select
                  value={selectedUser}
                  onChange={(e) => {
                    setSelectedUser(e.target.value);
                    setErrorMsg('');
                  }}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
                >
                  <option value="admin">👑 Studio Operations Director (Admin)</option>
                  <optgroup label="Employee Accounts">
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>
                        👤 {emp.name} — {emp.role} ({emp.department})
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="password"
                  placeholder="Enter account password"
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordInput(e.target.value);
                    setErrorMsg('');
                  }}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  required
                />
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-semibold flex items-start gap-2">
                <ShieldAlert size={16} className="shrink-0 text-red-500 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/25 transition-all text-sm flex items-center justify-center gap-2"
            >
              <LogIn size={18} />
              Log In as {selectedUser === 'admin' ? 'Admin' : 'Employee'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
