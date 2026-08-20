import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Database,
  Sparkles,
  Filter,
  Scaling,
  BarChart3,
  Users,
  Boxes,
  Lightbulb,
  Flag,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Loader2,
  RotateCcw,
  Trash2,
  Play,
  Table2,
} from 'lucide-react';
import {
  ATTRIBUTES,
  ATTRIBUTE_LABELS,
  type AnalysisResult,
  type Attribute,
  type Response,
} from '@/lib/types';
import { formatNum, analyze, getVector } from '@/lib/datamining';
import { ScatterChart, BarChart, CorrelationMatrix, ClusterVisualization } from './Charts';

export const STAGES = [
  { id: 0, name: 'Data Collection', icon: Database, color: '#38bdf8' },
  { id: 1, name: 'Data Cleaning', icon: Sparkles, color: '#34d399' },
  { id: 2, name: 'Preprocessing', icon: Scaling, color: '#fbbf24' },
  { id: 3, name: 'Exploratory Analysis', icon: BarChart3, color: '#f472b6' },
  { id: 4, name: 'Similarity', icon: Users, color: '#60a5fa' },
  { id: 5, name: 'Clustering', icon: Boxes, color: '#a78bfa' },
  { id: 6, name: 'Pattern Discovery', icon: Lightbulb, color: '#facc15' },
  { id: 7, name: 'Interpretation', icon: Flag, color: '#22d3ee' },
] as const;

type StageProps = {
  analysis: AnalysisResult;
  active: boolean;
};

function StageHeader({ index, title, subtitle }: { index: number; title: string; subtitle: string }) {
  const stage = STAGES[index];
  const Icon = stage.icon;
  return (
    <div className="flex items-center gap-3 mb-4">
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: `${stage.color}22`, border: `1px solid ${stage.color}55` }}
      >
        <Icon className="w-5 h-5" style={{ color: stage.color }} />
      </div>
      <div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-slate-500">STAGE {index + 1} / 8</span>
        </div>
        <h3 className="text-lg font-bold text-white">{title}</h3>
        <p className="text-sm text-slate-400">{subtitle}</p>
      </div>
    </div>
  );
}

function DataTable({ records }: { records: Response[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-700/50">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-800/50">
            <th className="px-3 py-2 text-left font-medium text-slate-400">ID</th>
            <th className="px-3 py-2 text-right font-medium text-slate-400">Age</th>
            <th className="px-3 py-2 text-right font-medium text-slate-400">Sleep</th>
            <th className="px-3 py-2 text-right font-medium text-slate-400">Study</th>
            <th className="px-3 py-2 text-right font-medium text-slate-400">Recreation</th>
          </tr>
        </thead>
        <tbody>
          {records.map((r, i) => (
            <tr
              key={r.id}
              className="border-t border-slate-800 hover:bg-slate-800/30 transition-colors"
              style={{ animation: `fadeInRow 0.3s ease ${i * 0.05}s both` }}
            >
              <td className="px-3 py-2 font-mono text-sky-300">{r.participant_id}</td>
              <td className="px-3 py-2 text-right text-slate-200 tabular-nums">{formatNum(r.age, 0)}</td>
              <td className="px-3 py-2 text-right text-slate-200 tabular-nums">{formatNum(r.sleep_hours, 1)}</td>
              <td className="px-3 py-2 text-right text-slate-200 tabular-nums">{formatNum(r.study_hours, 1)}</td>
              <td className="px-3 py-2 text-right text-slate-200 tabular-nums">{formatNum(r.recreation_hours, 1)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function StageCollection({ analysis, active }: StageProps) {
  if (!active) return null;
  return (
    <div className="space-y-4">
      <StageHeader
        index={0}
        title="Data Collection"
        subtitle="Raw data submitted by participants in real time"
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <DataTable records={analysis.records} />
        </div>
        <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700/50">
          <div className="flex items-center gap-2 mb-3 text-slate-300">
            <Table2 className="w-4 h-4 text-sky-400" />
            <span className="font-medium text-sm">Dataset Summary</span>
          </div>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-400">Records</dt>
              <dd className="font-mono text-slate-200">{analysis.records.length}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-400">Variables</dt>
              <dd className="font-mono text-slate-200">{ATTRIBUTES.length}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-400">Data points</dt>
              <dd className="font-mono text-slate-200">{analysis.records.length * ATTRIBUTES.length}</dd>
            </div>
          </dl>
          <p className="text-xs text-slate-500 mt-3 leading-relaxed">
            Data mining starts with collecting useful data. Each row is one participant's lifestyle attributes.
          </p>
        </div>
      </div>
    </div>
  );
}

export function StageCleaning({ analysis, active }: StageProps) {
  if (!active) return null;
  const { cleaning } = analysis;
  return (
    <div className="space-y-4">
      <StageHeader
        index={1}
        title="Data Cleaning"
        subtitle="Checking for missing, invalid, and duplicate records"
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {cleaning.checks.map((check, i) => (
          <div
            key={i}
            className="flex items-start gap-3 bg-slate-800/30 rounded-lg p-4 border border-slate-700/50"
            style={{ animation: `fadeInRow 0.3s ease ${i * 0.08}s both` }}
          >
            {check.passed ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            ) : (
              <XCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1 min-w-0">
              <p className={`font-medium text-sm ${check.passed ? 'text-slate-200' : 'text-rose-300'}`}>
                {check.label}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">{check.detail}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700/50 text-sm text-slate-300 leading-relaxed">
        <Filter className="w-4 h-4 text-emerald-400 inline mr-2" />
        Real-world data is rarely this clean, but we're keeping the demonstration manageable. In production, data cleaning handles outliers, encoding errors, and missing values.
      </div>
    </div>
  );
}

export function StagePreprocessing({ analysis, active }: StageProps) {
  if (!active) return null;
  const { records, standardized, mean, std } = analysis;
  return (
    <div className="space-y-4">
      <StageHeader
        index={2}
        title="Data Preprocessing"
        subtitle="Standardizing attributes so they're on the same scale"
      />
      <p className="text-sm text-slate-400 leading-relaxed">
        Age, sleep, study, and recreation have different ranges. Standardization (z-score) transforms each variable to have mean 0 and standard deviation 1, so no single attribute dominates the analysis.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700/50">
          <h4 className="text-sm font-medium text-amber-300 mb-3">Raw Data (original scale)</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-slate-400">
                  <th className="px-2 py-1 text-left">ID</th>
                  {ATTRIBUTES.map((a) => (
                    <th key={a} className="px-2 py-1 text-right">{ATTRIBUTE_LABELS[a]}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {records.slice(0, 8).map((r) => (
                  <tr key={r.id} className="border-t border-slate-800">
                    <td className="px-2 py-1 font-mono text-sky-300">{r.participant_id}</td>
                    {getVector(r).map((v, i) => (
                      <td key={i} className="px-2 py-1 text-right text-slate-200 tabular-nums">
                        {formatNum(v, 1)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700/50">
          <h4 className="text-sm font-medium text-emerald-300 mb-3">Standardized Data (z-score)</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-slate-400">
                  <th className="px-2 py-1 text-left">ID</th>
                  {ATTRIBUTES.map((a) => (
                    <th key={a} className="px-2 py-1 text-right">{ATTRIBUTE_LABELS[a]}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {standardized.slice(0, 8).map((s) => (
                  <tr key={s.id} className="border-t border-slate-800">
                    <td className="px-2 py-1 font-mono text-emerald-300">{s.id}</td>
                    {s.values.map((v, i) => (
                      <td
                        key={i}
                        className={`px-2 py-1 text-right tabular-nums font-mono ${
                          v > 0 ? 'text-emerald-300/80' : v < 0 ? 'text-rose-300/70' : 'text-slate-400'
                        }`}
                      >
                        {v > 0 ? '+' : ''}{formatNum(v, 2)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {ATTRIBUTES.map((a, i) => (
          <div key={a} className="bg-slate-800/30 rounded-lg p-3 border border-slate-700/50 text-center">
            <p className="text-xs text-slate-400 mb-1">{ATTRIBUTE_LABELS[a]}</p>
            <p className="text-sm text-slate-200">
              <span className="text-slate-500">μ=</span>{formatNum(mean[i], 2)}
            </p>
            <p className="text-sm text-slate-200">
              <span className="text-slate-500">σ=</span>{formatNum(std[i], 2)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function StageExploratory({ analysis, active }: StageProps) {
  if (!active) return null;
  return (
    <div className="space-y-4">
      <StageHeader
        index={3}
        title="Exploratory Analysis"
        subtitle="Visualizing the data before running algorithms"
      />
      <p className="text-sm text-slate-400 leading-relaxed">
        Scatter plots reveal relationships between variables. Can you spot any trends before the algorithm finds them?
      </p>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {(
          [
            ['sleep_hours', 'study_hours'],
            ['study_hours', 'recreation_hours'],
            ['age', 'study_hours'],
            ['sleep_hours', 'recreation_hours'],
          ] as [Attribute, Attribute][]
        ).map(([x, y]) => (
          <div key={`${x}-${y}`} className="bg-slate-800/30 rounded-lg p-3 border border-slate-700/50">
            <ScatterChart records={analysis.records} xAttr={x} yAttr={y} height={200} />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
        {ATTRIBUTES.map((a) => (
          <div key={a} className="bg-slate-800/30 rounded-lg p-3 border border-slate-700/50">
            <BarChart records={analysis.records} attribute={a} height={160} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function StageSimilarity({ analysis, active }: StageProps) {
  if (!active) return null;
  return (
    <div className="space-y-4">
      <StageHeader
        index={4}
        title="Similarity Analysis"
        subtitle="Finding which participants have the most similar lifestyles"
      />
      <p className="text-sm text-slate-400 leading-relaxed">
        Using Euclidean distance on standardized data, we measure how close each participant's lifestyle is to every other participant. Smaller distance = more similar.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {analysis.similarities.slice(0, 12).map((sim) => (
          <div
            key={sim.target}
            className="bg-slate-800/30 rounded-lg p-4 border border-slate-700/50"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-sky-500/20 flex items-center justify-center font-mono text-sm text-sky-300 font-bold">
                {sim.target}
              </div>
              <span className="text-sm text-slate-400">most similar to:</span>
            </div>
            <div className="space-y-2">
              {sim.matches.map((m, i) => (
                <div key={m.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-6 h-6 rounded flex items-center justify-center font-mono text-xs"
                      style={{
                        background: i === 0 ? 'rgba(52,211,153,0.2)' : 'rgba(148,163,184,0.1)',
                        color: i === 0 ? '#34d399' : '#cbd5e1',
                      }}
                    >
                      {m.id}
                    </span>
                    <span className="text-slate-300 text-xs">{m.closeness}</span>
                  </div>
                  <span className="text-xs font-mono text-slate-500">d={formatNum(m.distance, 3)}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function StageClustering({ analysis, active }: StageProps) {
  if (!active) return null;
  return (
    <div className="space-y-4">
      <StageHeader
        index={5}
        title="Clustering (K-Means)"
        subtitle={`Grouping ${analysis.records.length} participants into ${analysis.clusters.k} clusters`}
      />
      <p className="text-sm text-slate-400 leading-relaxed">
        K-Means assigns participants to clusters based on similarity. We didn't tell the algorithm who belongs where — it discovered groups from the data in {analysis.clusters.iterations} iterations.
      </p>
      <ClusterVisualization records={analysis.records} clusters={analysis.clusters} />

      <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700/50">
        <h4 className="text-sm font-medium text-slate-300 mb-3">Cluster Members</h4>
        <div className="space-y-2">
          {analysis.clusters.labels.map((label, ci) => {
            const members = analysis.records.filter((_, i) => analysis.clusters.assignments[i] === ci);
            if (members.length === 0) return null;
            const colors = ['#38bdf8', '#34d399', '#fbbf24', '#f472b6', '#a78bfa', '#fb923c'];
            return (
              <div key={ci} className="flex items-center gap-2 flex-wrap">
                <span
                  className="rounded-full px-3 py-1 text-xs font-medium"
                  style={{ background: `${colors[ci]}22`, color: colors[ci], border: `1px solid ${colors[ci]}55` }}
                >
                  {label}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {members.map((m) => (
                    <span
                      key={m.id}
                      className="font-mono text-xs px-2 py-0.5 rounded bg-slate-700/40 text-slate-300"
                    >
                      {m.participant_id}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function StagePatterns({ analysis, active }: StageProps) {
  if (!active) return null;
  return (
    <div className="space-y-4">
      <StageHeader
        index={6}
        title="Pattern Discovery"
        subtitle="Correlations and relationships found in the data"
      />
      <p className="text-sm text-slate-400 leading-relaxed">
        The algorithm computed Pearson correlation coefficients between every pair of variables. These are patterns observed in this sample, not universal truths.
      </p>

      <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700/50 flex justify-center">
        <CorrelationMatrix correlations={analysis.correlations} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {analysis.correlations.map((c, i) => {
          const abs = Math.abs(c.r);
          const isNotable = abs >= 0.4;
          return (
            <div
              key={i}
              className={`rounded-lg p-4 border ${
                isNotable
                  ? 'bg-amber-500/10 border-amber-500/30'
                  : 'bg-slate-800/30 border-slate-700/50'
              }`}
              style={{ animation: `fadeInRow 0.3s ease ${i * 0.05}s both` }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {isNotable && <Lightbulb className="w-4 h-4 text-amber-400" />}
                  <span className="text-sm font-medium text-slate-200 capitalize">
                    {ATTRIBUTE_LABELS[c.a]} ↔ {ATTRIBUTE_LABELS[c.b]}
                  </span>
                </div>
                <span
                  className={`font-mono text-sm font-bold ${
                    c.r > 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  r = {c.r > 0 ? '+' : ''}{formatNum(c.r, 3)}
                </span>
              </div>
              <p className="text-xs text-slate-400">{c.description}</p>
              <div className="flex gap-2 mt-2">
                <span className="text-xs px-2 py-0.5 rounded bg-slate-700/40 text-slate-400 capitalize">
                  {c.strength}
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-700/40 text-slate-400 capitalize">
                  {c.direction}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function StageInterpretation({ analysis, active }: StageProps) {
  if (!active) return null;
  const { summary } = analysis;
  return (
    <div className="space-y-4">
      <StageHeader
        index={7}
        title="Interpretation"
        subtitle="What the data mining process discovered"
      />
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-xl border border-cyan-500/30 p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Records Analyzed', value: summary.recordsAnalyzed, color: '#38bdf8' },
            { label: 'Clusters Found', value: summary.clustersFound, color: '#34d399' },
            { label: 'Variables Analyzed', value: summary.variablesAnalyzed, color: '#fbbf24' },
            { label: 'Notable Patterns', value: summary.patternsFound, color: '#f472b6' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl font-bold tabular-nums" style={{ color: stat.color }}>
                {stat.value}
              </div>
              <div className="text-xs text-slate-400 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <h4 className="text-sm font-medium text-cyan-300">Key Findings</h4>
          {analysis.correlations
            .filter((c) => Math.abs(c.r) >= 0.4)
            .map((c, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-slate-300">
                <ArrowRight className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                <span>{c.description}</span>
              </div>
            ))}
          {analysis.clusters.labels.map((label, i) => {
            const members = analysis.records.filter(
              (_, idx) => analysis.clusters.assignments[idx] === i,
            );
            if (members.length === 0) return null;
            return (
              <div key={i} className="flex items-start gap-2 text-sm text-slate-300">
                <ArrowRight className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>
                  <strong className="text-slate-200">{label}</strong>: {members.map((m) => m.participant_id).join(', ')}
                </span>
              </div>
            );
          })}
        </div>

        <div className="mt-6 pt-4 border-t border-slate-700/50">
          <p className="text-sm text-slate-400 italic leading-relaxed">
            "This is data mining: collecting data, preparing it, analyzing it, finding hidden patterns, and turning those patterns into useful information."
          </p>
        </div>
      </div>
    </div>
  );
}

type DashboardProps = {
  records: Response[];
  onReset: () => void;
  onClear: () => void;
  participantUrl: string;
};

export default function PresentationDashboard({ records, onReset, onClear, participantUrl }: DashboardProps) {
  const [stage, setStage] = useState(-1);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const canAnalyze = records.length >= 2;

  const startAnalysis = async () => {
    if (!canAnalyze) return;
    setAnalyzing(true);
    const result = analyze(records);
    setAnalysis(result);
    setAnalyzing(false);
    setStage(0);
  };

  const reset = () => {
    setStage(-1);
    setAnalysis(null);
    onReset();
  };

  if (stage === -1) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center py-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/30 text-sm text-sky-300 mb-4">
            <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
            LIVE DATA MINING
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-3 tracking-tight">
            Data Mining Scanner
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Participants submit their lifestyle data. The scanner collects, cleans, processes, and mines it in real time — demonstrating the full data mining pipeline.
          </p>
        </div>

        {/* Stats + QR */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Response counter */}
          <div className="lg:col-span-2 bg-slate-900/60 backdrop-blur rounded-2xl border border-slate-700/50 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Database className="w-5 h-5 text-sky-400" />
                Live Responses
              </h2>
              <div className="flex items-center gap-2">
                {records.length > 0 && (
                  <button
                    onClick={onClear}
                    className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-rose-400 transition-colors px-3 py-1.5 rounded-lg border border-slate-700/50 hover:border-rose-500/30"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Clear All
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-baseline gap-2 mb-6">
              <span className="text-5xl font-bold tabular-nums text-white">{records.length}</span>
              <span className="text-slate-400">/ 70 responses</span>
            </div>

            {/* Progress bar */}
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden mb-6">
              <div
                className="h-full bg-gradient-to-r from-sky-500 to-cyan-400 rounded-full transition-all duration-500"
                style={{ width: `${(records.length / 70) * 100}%` }}
              />
            </div>

            {/* Response chips */}
            <div className="flex flex-wrap gap-2 min-h-[60px]">
              {records.length === 0 && (
                <p className="text-sm text-slate-500 italic">Waiting for participants to submit data...</p>
              )}
              {records.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center gap-2 rounded-lg px-3 py-1.5 bg-slate-800/60 border border-slate-700/50 text-sm"
                  style={{ animation: 'fadeInRow 0.3s ease both' }}
                >
                  <span className="font-mono text-sky-300 font-medium">{r.participant_id}</span>
                  <span className="text-xs text-slate-500">
                    {formatNum(r.age, 0)}y · {formatNum(r.sleep_hours, 1)}s · {formatNum(r.study_hours, 1)}st · {formatNum(r.recreation_hours, 1)}r
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <button
                onClick={startAnalysis}
                disabled={!canAnalyze || analyzing}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-400 hover:to-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold transition-all"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5" />
                    Start Data Mining
                  </>
                )}
              </button>
              {records.length > 0 && (
                <button
                  onClick={reset}
                  className="flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset
                </button>
              )}
            </div>
            {!canAnalyze && records.length > 0 && (
              <p className="text-xs text-slate-500 mt-2">Need at least 2 responses to run analysis.</p>
            )}
            {records.length === 0 && (
              <p className="text-xs text-slate-500 mt-2">Share the QR code or link with participants to collect data.</p>
            )}
          </div>

          {/* QR Code */}
          <div className="bg-slate-900/60 backdrop-blur rounded-2xl border border-slate-700/50 p-6 flex flex-col items-center justify-center">
            <h3 className="text-sm font-medium text-slate-300 mb-4">Participant Link</h3>
            <div className="bg-white p-4 rounded-xl">
              <QRCodeSVG value={participantUrl} size={180} level="M" />
            </div>
            <p className="text-xs text-slate-400 mt-4 text-center break-all">{participantUrl}</p>
            <a
              href={participantUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 text-xs text-sky-400 hover:text-sky-300 transition-colors"
            >
              Open participant form
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
      </div>
    );
  }

  const stageComponents = [
    <StageCollection key="0" analysis={analysis} active={stage >= 0} />,
    <StageCleaning key="1" analysis={analysis} active={stage >= 1} />,
    <StagePreprocessing key="2" analysis={analysis} active={stage >= 2} />,
    <StageExploratory key="3" analysis={analysis} active={stage >= 3} />,
    <StageSimilarity key="4" analysis={analysis} active={stage >= 4} />,
    <StageClustering key="5" analysis={analysis} active={stage >= 5} />,
    <StagePatterns key="6" analysis={analysis} active={stage >= 6} />,
    <StageInterpretation key="7" analysis={analysis} active={stage >= 7} />,
  ];

  return (
    <div className="space-y-6">
      {/* Stage progress bar */}
      <div className="sticky top-0 z-20 bg-slate-950/80 backdrop-blur-xl py-3 -mx-4 px-4 border-b border-slate-800">
        <div className="flex items-center gap-1 overflow-x-auto">
          {STAGES.map((s) => {
            const Icon = s.icon;
            const isDone = stage > s.id;
            const isActive = stage === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setStage(s.id)}
                className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs whitespace-nowrap transition-colors flex-shrink-0"
                style={{
                  background: isActive ? `${s.color}22` : 'transparent',
                  border: isActive ? `1px solid ${s.color}55` : '1px solid transparent',
                }}
              >
                {isDone ? (
                  <CheckCircle2 className="w-3.5 h-3.5" style={{ color: s.color }} />
                ) : (
                  <Icon className="w-3.5 h-3.5" style={{ color: isActive ? s.color : '#64748b' }} />
                )}
                <span
                  className={isActive ? 'text-slate-200 font-medium' : isDone ? 'text-slate-400' : 'text-slate-600'}
                >
                  {s.name}
                </span>
              </button>
            );
          })}
          <button
            onClick={reset}
            className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-200 whitespace-nowrap flex-shrink-0 ml-2"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Restart
          </button>
        </div>
      </div>

      {/* Active stage content */}
      <div className="bg-slate-900/40 backdrop-blur rounded-2xl border border-slate-700/50 p-6 min-h-[400px]">
        {stageComponents[stage] || stageComponents[0]}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={() => setStage(Math.max(0, stage - 1))}
          disabled={stage <= 0}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ArrowRight className="w-4 h-4 rotate-180" />
          Previous
        </button>
        <span className="text-sm text-slate-500">
          Stage {stage + 1} of 8
        </span>
        <button
          onClick={() => setStage(Math.min(7, stage + 1))}
          disabled={stage >= 7}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          Next
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
