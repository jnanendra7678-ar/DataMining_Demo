import { useMemo } from 'react';
import { ATTRIBUTE_COLORS, type Attribute, type Response } from '@/lib/types';
import { formatNum } from '@/lib/datamining';

type ScatterChartProps = {
  records: Response[];
  xAttr: Attribute;
  yAttr: Attribute;
  clusters?: number[];
  height?: number;
};

const CLUSTER_COLORS = [
  '#38bdf8',
  '#34d399',
  '#fbbf24',
  '#f472b6',
  '#a78bfa',
  '#fb923c',
];

export function ScatterChart({
  records,
  xAttr,
  yAttr,
  clusters,
  height = 280,
}: ScatterChartProps) {
  const { points, xMin, xMax, yMin, yMax } = useMemo(() => {
    if (records.length === 0) {
      return { points: [], xMin: 0, xMax: 1, yMin: 0, yMax: 1 };
    }
    const xs = records.map((r) => r[xAttr]);
    const ys = records.map((r) => r[yAttr]);
    const xMin = Math.min(...xs) - 0.5;
    const xMax = Math.max(...xs) + 0.5;
    const yMin = Math.min(...ys) - 0.5;
    const yMax = Math.max(...ys) + 0.5;
    const points = records.map((r, i) => ({
      id: r.participant_id,
      x: r[xAttr],
      y: r[yAttr],
      cluster: clusters?.[i] ?? 0,
    }));
    return { points, xMin, xMax, yMin, yMax };
  }, [records, xAttr, yAttr, clusters]);

  const padding = { top: 20, right: 20, bottom: 40, left: 45 };
  const w = 100;
  const h = 100;
  const plotW = w - padding.left - padding.right;
  const plotH = h - padding.top - padding.bottom;

  const toX = (v: number) =>
    padding.left + ((v - xMin) / (xMax - xMin || 1)) * plotW;
  const toY = (v: number) =>
    padding.top + plotH - ((v - yMin) / (yMax - yMin || 1)) * plotH;

  // Trend line via least squares
  const trend = useMemo(() => {
    if (points.length < 2) return null;
    const n = points.length;
    const sx = points.reduce((a, p) => a + p.x, 0);
    const sy = points.reduce((a, p) => a + p.y, 0);
    const sxx = points.reduce((a, p) => a + p.x * p.x, 0);
    const sxy = points.reduce((a, p) => a + p.x * p.y, 0);
    const slope = (n * sxy - sx * sy) / (n * sxx - sx * sx || 1);
    const intercept = (sy - slope * sx) / n;
    return { slope, intercept };
  }, [points]);

  return (
    <div style={{ height }} className="w-full">
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="w-full h-full"
      >
        {/* Grid */}
        {[0, 0.25, 0.5, 0.75, 1].map((t) => (
          <line
            key={`gx${t}`}
            x1={padding.left + t * plotW}
            y1={padding.top}
            x2={padding.left + t * plotW}
            y2={padding.top + plotH}
            stroke="rgba(148,163,184,0.12)"
            strokeWidth="0.2"
          />
        ))}
        {[0, 0.25, 0.5, 0.75, 1].map((t) => (
          <line
            key={`gy${t}`}
            x1={padding.left}
            y1={padding.top + t * plotH}
            x2={padding.left + plotW}
            y2={padding.top + t * plotH}
            stroke="rgba(148,163,184,0.12)"
            strokeWidth="0.2"
          />
        ))}

        {/* Axes */}
        <line
          x1={padding.left}
          y1={padding.top + plotH}
          x2={padding.left + plotW}
          y2={padding.top + plotH}
          stroke="rgba(148,163,184,0.4)"
          strokeWidth="0.3"
        />
        <line
          x1={padding.left}
          y1={padding.top}
          x2={padding.left}
          y2={padding.top + plotH}
          stroke="rgba(148,163,184,0.4)"
          strokeWidth="0.3"
        />

        {/* Trend line */}
        {trend && (
          <line
            x1={toX(xMin)}
            y1={toY(trend.intercept + trend.slope * xMin)}
            x2={toX(xMax)}
            y2={toY(trend.intercept + trend.slope * xMax)}
            stroke={ATTRIBUTE_COLORS[xAttr]}
            strokeWidth="0.3"
            strokeDasharray="1.5,1"
            opacity="0.5"
          />
        )}

        {/* Points */}
        {points.map((p) => {
          const color = clusters ? CLUSTER_COLORS[p.cluster % CLUSTER_COLORS.length] : ATTRIBUTE_COLORS[xAttr];
          return (
            <g key={p.id}>
              <circle
                cx={toX(p.x)}
                cy={toY(p.y)}
                r="1.4"
                fill={color}
                opacity="0.85"
              />
              <text
                x={toX(p.x) + 1.5}
                y={toY(p.y) + 0.8}
                fontSize="2.2"
                fill="rgba(226,232,240,0.7)"
              >
                {p.id}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="flex justify-between px-2 -mt-7 text-xs text-slate-400">
        <span className="font-medium text-slate-300 capitalize">{xAttr.replace('_', ' ')}</span>
        <span className="font-medium text-slate-300 capitalize">{yAttr.replace('_', ' ')}</span>
      </div>
    </div>
  );
}

type BarChartProps = {
  records: Response[];
  attribute: Attribute;
  clusters?: number[];
  height?: number;
};

export function BarChart({ records, attribute, clusters, height = 220 }: BarChartProps) {
  const max = useMemo(() => {
    if (records.length === 0) return 1;
    return Math.max(...records.map((r) => r[attribute])) * 1.15;
  }, [records, attribute]);

  return (
    <div style={{ height }} className="w-full overflow-hidden">
      <svg
        viewBox={`0 0 ${Math.max(records.length * 8, 20)} 100`}
        preserveAspectRatio="none"
        className="w-full h-full"
        style={{ height: 'calc(100% - 20px)' }}
      >
        {records.map((r, i) => {
          const val = r[attribute];
          const barH = (val / max) * 75;
          const color = clusters
            ? CLUSTER_COLORS[clusters[i] % CLUSTER_COLORS.length]
            : ATTRIBUTE_COLORS[attribute];
          return (
            <g key={r.id}>
              <rect
                x={i * 8 + 1.5}
                y={90 - barH}
                width="5"
                height={barH}
                rx="1"
                fill={color}
                opacity="0.85"
              />
              <text
                x={i * 8 + 4}
                y={95}
                fontSize="3"
                fill="rgba(226,232,240,0.6)"
                textAnchor="middle"
              >
                {r.participant_id}
              </text>
            </g>
          );
        })}
        <line x1="0" y1="90" x2={Math.max(records.length * 8, 20)} y2="90" stroke="rgba(148,163,184,0.3)" strokeWidth="0.3" />
      </svg>
      <div className="flex justify-between px-2 mt-1 text-xs text-slate-400">
        <span className="font-medium text-slate-300 capitalize">{attribute.replace('_', ' ')}</span>
        <span>max: {formatNum(max, 1)}</span>
      </div>
    </div>
  );
}

type CorrelationMatrixProps = {
  correlations: { a: Attribute; b: Attribute; r: number }[];
};

export function CorrelationMatrix({ correlations }: CorrelationMatrixProps) {
  const attrs: Attribute[] = ['age', 'sleep_hours', 'study_hours', 'recreation_hours'];
  const labels = ['Age', 'Sleep', 'Study', 'Rec.'];

  const getR = (a: Attribute, b: Attribute): number => {
    if (a === b) return 1;
    const found = correlations.find(
      (c) => (c.a === a && c.b === b) || (c.a === b && c.b === a),
    );
    return found ? found.r : 0;
  };

  const colorFor = (r: number): string => {
    if (r > 0.6) return 'rgba(52,211,153,0.7)';
    if (r > 0.3) return 'rgba(52,211,153,0.35)';
    if (r > -0.3) return 'rgba(148,163,184,0.15)';
    if (r > -0.6) return 'rgba(244,114,182,0.35)';
    return 'rgba(244,114,182,0.7)';
  };

  return (
    <div className="inline-block">
      <div className="grid" style={{ gridTemplateColumns: `60px repeat(4, 1fr)` }}>
        <div />
        {labels.map((l) => (
          <div key={l} className="text-center text-xs font-medium text-slate-400 pb-1">
            {l}
          </div>
        ))}
        {attrs.map((rowAttr, i) => (
          <div key={rowAttr} className="contents">
            <div className="text-xs font-medium text-slate-400 flex items-center pr-2 justify-end">
              {labels[i]}
            </div>
            {attrs.map((colAttr) => {
              const r = getR(rowAttr, colAttr);
              return (
                <div
                  key={colAttr}
                  className="m-0.5 rounded flex items-center justify-center text-xs font-mono"
                  style={{
                    background: colorFor(r),
                    color: Math.abs(r) > 0.5 ? '#fff' : 'rgba(226,232,240,0.7)',
                    minHeight: '36px',
                  }}
                  title={`${labels[i]} vs ${labels[attrs.indexOf(colAttr)]}: r=${r.toFixed(3)}`}
                >
                  {r.toFixed(2)}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

type ClusterVisualizationProps = {
  records: Response[];
  clusters: { assignments: number[]; centroids: number[][]; k: number; labels: string[] };
};

export function ClusterVisualization({ records, clusters }: ClusterVisualizationProps) {
  if (records.length === 0) return null;

  // Use first two standardized dimensions for viz (age, sleep)
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="bg-slate-800/30 rounded-lg p-3 border border-slate-700/50">
          <p className="text-xs text-slate-400 mb-2">Sleep vs Study (colored by cluster)</p>
          <ScatterChart
            records={records}
            xAttr="sleep_hours"
            yAttr="study_hours"
            clusters={clusters.assignments}
            height={220}
          />
        </div>
        <div className="bg-slate-800/30 rounded-lg p-3 border border-slate-700/50">
          <p className="text-xs text-slate-400 mb-2">Study vs Recreation (colored by cluster)</p>
          <ScatterChart
            records={records}
            xAttr="study_hours"
            yAttr="recreation_hours"
            clusters={clusters.assignments}
            height={220}
          />
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {clusters.labels.map((label, i) => (
          <div
            key={i}
            className="flex items-center gap-2 rounded-full px-3 py-1.5 text-xs"
            style={{
              background: `${CLUSTER_COLORS[i % CLUSTER_COLORS.length]}22`,
              border: `1px solid ${CLUSTER_COLORS[i % CLUSTER_COLORS.length]}55`,
            }}
          >
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ background: CLUSTER_COLORS[i % CLUSTER_COLORS.length] }}
            />
            <span className="text-slate-200 font-medium">{label}</span>
            <span className="text-slate-400">
              ({clusters.assignments.filter((a) => a === i).length} members)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
