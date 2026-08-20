import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { nextParticipantId } from '@/lib/datamining';
import type { Response } from '@/lib/types';
import { Send, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import ParticleField from './ParticleField';

type ParticipantFormProps = {
  existingIds: string[];
  onBack: () => void;
};

export default function ParticipantForm({ existingIds, onBack }: ParticipantFormProps) {
  const [age, setAge] = useState('');
  const [sleep, setSleep] = useState('');
  const [study, setStudy] = useState('');
  const [recreation, setRecreation] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const fields = [
    { key: 'age', label: 'Age', value: age, set: setAge, unit: 'years', min: 5, max: 100, step: 1, placeholder: 'e.g. 20' },
    { key: 'sleep', label: 'Average Sleep', value: sleep, set: setSleep, unit: 'hours/day', min: 0, max: 24, step: 0.5, placeholder: 'e.g. 7.5' },
    { key: 'study', label: 'Average Study Time', value: study, set: setStudy, unit: 'hours/day', min: 0, max: 24, step: 0.5, placeholder: 'e.g. 4' },
    { key: 'recreation', label: 'Average Recreation Time', value: recreation, set: setRecreation, unit: 'hours/day', min: 0, max: 24, step: 0.5, placeholder: 'e.g. 3' },
  ] as const;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    setErrorMsg('');

    const ageNum = parseFloat(age);
    const sleepNum = parseFloat(sleep);
    const studyNum = parseFloat(study);
    const recNum = parseFloat(recreation);

    if ([ageNum, sleepNum, studyNum, recNum].some((v) => isNaN(v))) {
      setStatus('error');
      setErrorMsg('Please fill in all fields with valid numbers.');
      return;
    }
    if (ageNum < 5 || ageNum > 100) {
      setStatus('error');
      setErrorMsg('Age must be between 5 and 100.');
      return;
    }
    if (sleepNum + studyNum + recNum > 26) {
      setStatus('error');
      setErrorMsg('Sleep + study + recreation cannot exceed 26 hours in a day.');
      return;
    }

    const participantId = nextParticipantId(existingIds);

    const { error } = await supabase.from('responses').insert({
      participant_id: participantId,
      age: ageNum,
      sleep_hours: sleepNum,
      study_hours: studyNum,
      recreation_hours: recNum,
    });

    if (error) {
      setStatus('error');
      setErrorMsg(error.message || 'Could not submit. Please try again.');
      return;
    }
    setStatus('success');
  };

  const reset = () => {
    setAge('');
    setSleep('');
    setStudy('');
    setRecreation('');
    setStatus('idle');
    setErrorMsg('');
  };

  if (status === 'success') {
    return (
      <div className="relative min-h-screen overflow-hidden bg-slate-950">
        <ParticleField count={60} intensity="scanning" className="absolute inset-0 opacity-60" />
        <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
          <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-emerald-500/30 p-8 max-w-md w-full text-center shadow-2xl">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Data Received</h2>
            <p className="text-slate-300 mb-1">
              Your lifestyle data has been sent to the data mining scanner.
            </p>
            <p className="text-sm text-slate-400 mb-6">
              The presenter's dashboard will process your data in real time.
            </p>
            <button
              onClick={reset}
              className="w-full py-3 px-6 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-semibold transition-colors"
            >
              Submit Another Response
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950">
      <ParticleField count={60} intensity="normal" className="absolute inset-0 opacity-40" />
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-8">
        <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6 sm:p-8 max-w-md w-full shadow-2xl">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </button>

          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white mb-1">Enter Your Data</h1>
            <p className="text-sm text-slate-400">
              Submit your daily lifestyle info for the live data mining demo. All data is anonymous.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {fields.map((f) => (
              <div key={f.key}>
                <label className="flex items-center justify-between text-sm font-medium text-slate-300 mb-1.5">
                  <span>{f.label}</span>
                  <span className="text-xs text-slate-500">{f.unit}</span>
                </label>
                <input
                  type="number"
                  min={f.min}
                  max={f.max}
                  step={f.step}
                  value={f.value}
                  onChange={(e) => f.set(e.target.value)}
                  placeholder={f.placeholder}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500/60 focus:ring-1 focus:ring-sky-500/40 transition-colors"
                  required
                />
              </div>
            ))}

            {status === 'error' && (
              <div className="flex items-start gap-2 text-sm text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-lg p-3">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={status === 'submitting'}
              className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold transition-colors"
            >
              {status === 'submitting' ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Submit Data
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
