import React, { useEffect, useState } from 'react';
import { Calendar, CheckCircle2, LogIn, LogOut, RefreshCw } from 'lucide-react';
import { 
  initCalendarAuth, 
  googleSignIn, 
  googleSignOut, 
  getCalendarAccessToken 
} from '../services/googleCalendarService';
import { User } from 'firebase/auth';

interface GoogleCalendarButtonProps {
  compact?: boolean;
}

export const GoogleCalendarButton: React.FC<GoogleCalendarButtonProps> = ({ compact = false }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = initCalendarAuth(
      (u, token) => {
        setUser(u);
        setIsConnected(!!token);
      },
      () => {
        setUser(null);
        setIsConnected(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleConnect = async () => {
    setIsLoading(true);
    try {
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        setIsConnected(true);
      }
    } catch (err: any) {
      alert(`Google Calendar login failed: ${err.message || 'Error authenticating'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (window.confirm('Disconnect Google Calendar sync?')) {
      await googleSignOut();
      setUser(null);
      setIsConnected(false);
    }
  };

  if (compact) {
    if (isConnected) {
      return (
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold">
          <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
          <span>Google Cal Connected</span>
        </div>
      );
    }
    return (
      <button
        type="button"
        onClick={handleConnect}
        disabled={isLoading}
        className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold transition-all"
      >
        <Calendar size={13} className="text-blue-600 shrink-0" />
        <span>{isLoading ? 'Connecting...' : 'Connect Google Calendar'}</span>
      </button>
    );
  }

  if (isConnected) {
    return (
      <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-1.5 rounded-xl text-xs font-bold shadow-2xs">
        <div className="flex items-center gap-1.5">
          <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
          <span>Google Calendar Active</span>
        </div>
        <button
          type="button"
          onClick={handleDisconnect}
          title="Disconnect Google Calendar"
          className="p-1 hover:bg-emerald-100 rounded-md text-emerald-700 transition-colors ml-1"
        >
          <LogOut size={13} />
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={handleConnect}
      disabled={isLoading}
      className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 hover:border-indigo-300 text-slate-700 font-bold text-xs rounded-xl shadow-2xs hover:shadow-xs transition-all shrink-0"
    >
      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
      </svg>
      <span>{isLoading ? 'Connecting...' : 'Connect Google Calendar'}</span>
    </button>
  );
};
