import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Response } from '@/lib/types';
import ParticleField from '@/components/ParticleField';
import ParticipantForm from '@/components/ParticipantForm';
import PresentationDashboard from '@/components/PresentationDashboard';
import { Presentation, UserPlus, Database, Github, Activity } from 'lucide-react';

type Mode = 'home' | 'participant' | 'presenter';

export default function App() {
  const [mode, setMode] = useState<Mode>('home');
  const [records, setRecords] = useState<Response[]>([]);

  const fetchRecords = useCallback(async () => {
    const { data, error } = await supabase
      .from('responses')
      .select('*')
      .order('created_at', { ascending: true });
    if (error) {
      console.error('Failed to fetch responses:', error);
      return;
    }
    if (data) {
      setRecords(data as Response[]);
    }
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  useEffect(() => {
    const channel = supabase
      .channel('responses-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'responses' }, () => {
        fetchRecords();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchRecords]);

  const handleClear = async () => {
    await supabase.from('responses').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  };

  const participantUrl = typeof window !== 'undefined' ? `${window.location.origin}?mode=participant` : '';

  // Auto-switch based on URL param
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlMode = params.get('mode');
    if (urlMode === 'participant') setMode('participant');
    else if (urlMode === 'presenter') setMode('presenter');
  }, []);

  if (mode === 'participant') {
    return (
      <ParticipantForm
        existingIds={records.map((r) => r.participant_id)}
        onBack={() => setMode('home')}
      />
    );
  }

  if (mode === 'presenter') {
    return (
      <div className="relative min-h-screen overflow-hidden bg-slate-950">
        <ParticleField count={70} intensity="scanning" className="fixed inset-0 opacity-30 pointer-events-none" />
        <div className="relative z-10">
          <PresentationDashboard
            records={records}
            onReset={() => fetchRecords()}
            onClear={handleClear}
            participantUrl={participantUrl}
          />
        </div>
      </div>
    );
  }

  // Home / landing page
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950">
      <ParticleField count={80} intensity="normal" className="fixed inset-0 opacity-50" />

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Nav */}
        <nav className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-sky-500/20 border border-sky-500/40 flex items-center justify-center">
              <Activity className="w-5 h-5 text-sky-400" />
            </div>
            <span className="font-bold text-white text-lg tracking-tight">DataMining<span className="text-sky-400">Live</span></span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Github className="w-4 h-4" />
            <span>Seminar Demo</span>
          </div>
        </nav>

        {/* Hero */}
        <main className="flex-1 flex flex-col items-center justify-center px-6 py-12 max-w-5xl mx-auto w-full">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/30 text-sm text-sky-300 mb-6 animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
            Real-time Data Mining Demonstration
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white text-center mb-6 tracking-tight animate-slide-up leading-tight">
            Watch Data Mining<br />
            <span className="bg-gradient-to-r from-sky-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent">
              Happen in Real Time
            </span>
          </h1>

          <p className="text-lg text-slate-400 text-center max-w-2xl mb-10 animate-slide-up leading-relaxed">
            An interactive seminar tool that collects lifestyle data from participants and runs a live 8-stage data mining pipeline — from collection to interpretation.
          </p>

          {/* Mode cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl animate-slide-up">
            <button
              onClick={() => setMode('presenter')}
              className="group relative bg-slate-900/60 backdrop-blur rounded-2xl border border-slate-700/50 p-8 text-left hover:border-sky-500/50 transition-all hover:scale-[1.02]"
            >
              <div className="w-12 h-12 rounded-xl bg-sky-500/20 border border-sky-500/40 flex items-center justify-center mb-4">
                <Presentation className="w-6 h-6 text-sky-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Presenter Mode</h3>
              <p className="text-sm text-slate-400 leading-relaxed mb-4">
                Display the live dashboard on your projector. Collect data via QR code and run the full 8-stage mining pipeline with charts and explanations.
              </p>
              <span className="text-sm text-sky-400 font-medium group-hover:text-sky-300 transition-colors">
                Open Dashboard →
              </span>
            </button>

            <button
              onClick={() => setMode('participant')}
              className="group relative bg-slate-900/60 backdrop-blur rounded-2xl border border-slate-700/50 p-8 text-left hover:border-emerald-500/50 transition-all hover:scale-[1.02]"
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mb-4">
                <UserPlus className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Participant Mode</h3>
              <p className="text-sm text-slate-400 leading-relaxed mb-4">
                Submit your anonymous lifestyle data (age, sleep, study, recreation) to the live scanner. Takes less than 30 seconds.
              </p>
              <span className="text-sm text-emerald-400 font-medium group-hover:text-emerald-300 transition-colors">
                Enter Data →
              </span>
            </button>
          </div>

          {/* Feature row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-12 w-full max-w-3xl">
            {[
              { icon: Database, label: '8-Stage Pipeline', value: 'Collection → Interpretation' },
              { icon: Activity, label: 'Real-time Sync', value: 'Live data from participants' },
              { icon: Presentation, label: 'Up to 70', value: 'Participants supported' },
              { icon: UserPlus, label: '4 Variables', value: 'Age · Sleep · Study · Recreation' },
            ].map((f) => (
              <div key={f.label} className="text-center">
                <f.icon className="w-5 h-5 text-slate-500 mx-auto mb-2" />
                <div className="text-sm font-medium text-slate-300">{f.label}</div>
                <div className="text-xs text-slate-500 mt-0.5">{f.value}</div>
              </div>
            ))}
          </div>
        </main>

        <footer className="px-6 py-4 text-center text-xs text-slate-600">
          Data Mining Live — Built for interactive seminar demonstrations
        </footer>
      </div>
    </div>
  );
}
