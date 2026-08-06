
import React, { useState } from 'react';
import { Sparkles, Brain, Zap, RefreshCw, User } from 'lucide-react';
import { Employee } from '../types';
import { generateTeamInsights, generateEmployeeReview } from '../services/geminiService';

interface AiInsightsProps {
  employees: Employee[];
}

const AiInsights: React.FC<AiInsightsProps> = ({ employees }) => {
  const [teamInsight, setTeamInsight] = useState<string | null>(null);
  const [employeeReview, setEmployeeReview] = useState<{ id: string, text: string } | null>(null);
  const [loadingTeam, setLoadingTeam] = useState(false);
  const [loadingReview, setLoadingReview] = useState<string | null>(null);

  const fetchTeamInsights = async () => {
    setLoadingTeam(true);
    const result = await generateTeamInsights(employees);
    setTeamInsight(result);
    setLoadingTeam(false);
  };

  const fetchEmployeeReview = async (employee: Employee) => {
    setLoadingReview(employee.id);
    const result = await generateEmployeeReview(employee);
    setEmployeeReview({ id: employee.id, text: result });
    setLoadingReview(null);
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">AI Strategy Hub</h2>
          <p className="text-slate-500">Gemini-driven workforce analytics and performance optimization.</p>
        </div>
        <button 
          onClick={fetchTeamInsights}
          disabled={loadingTeam}
          className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
        >
          {loadingTeam ? <RefreshCw className="animate-spin" size={20} /> : <Sparkles size={20} />}
          Analyze Full Team
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Team Insights Section */}
          <div className="p-8 bg-white rounded-3xl shadow-sm border border-slate-100 min-h-[400px] flex flex-col">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                <Brain size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-800">Team Dynamics & Strategy</h3>
            </div>
            
            {loadingTeam ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 space-y-4">
                <RefreshCw size={48} className="animate-spin text-indigo-500" />
                <p>Gemini is analyzing your studio's talent pool...</p>
              </div>
            ) : teamInsight ? (
              <div className="prose prose-slate max-w-none">
                <div dangerouslySetInnerHTML={{ __html: teamInsight.replace(/\n/g, '<br/>') }} className="text-slate-600 leading-relaxed" />
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-center space-y-4">
                <div className="p-6 bg-slate-50 rounded-full">
                  <Sparkles size={48} />
                </div>
                <p>Click "Analyze Full Team" to generate an AI-powered <br/> strategic review of your workforce.</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-bold text-slate-800 px-2">Individual Performance Reviews</h4>
          <div className="space-y-3">
            {employees.map(e => (
              <div key={e.id} className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:border-indigo-200 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 border border-indigo-200 overflow-hidden flex items-center justify-center text-xs font-bold">
                      {e.profilePicture ? (
                        <img src={e.profilePicture} alt={e.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-indigo-600">{e.name.charAt(0)}</span>
                      )}
                    </div>
                    <span className="font-semibold text-slate-800">{e.name}</span>
                  </div>
                  <button 
                    onClick={() => fetchEmployeeReview(e)}
                    disabled={loadingReview === e.id}
                    className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {loadingReview === e.id ? <RefreshCw className="animate-spin" size={16} /> : <Zap size={16} />}
                  </button>
                </div>
                {employeeReview?.id === e.id && (
                  <div className="mt-3 p-3 bg-slate-50 rounded-xl text-xs text-slate-600 border border-slate-200">
                    <div dangerouslySetInnerHTML={{ __html: employeeReview.text.slice(0, 150) + '...' }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AiInsights;
