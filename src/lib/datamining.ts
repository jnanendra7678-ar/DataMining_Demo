import {
  ATTRIBUTES,
  type Attribute,
  type AnalysisResult,
  type CleaningResult,
  type ClusterResult,
  type CorrelationResult,
  type Response,
  type SimilarityResult,
  type StandardizedRecord,
} from './types';

export function getVector(r: Response): number[] {
  return [r.age, r.sleep_hours, r.study_hours, r.recreation_hours];
}

export function mean(xs: number[]): number {
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

export function std(xs: number[], m?: number): number {
  const mu = m ?? mean(xs);
  const variance = xs.reduce((a, b) => a + (b - mu) ** 2, 0) / xs.length;
  return Math.sqrt(variance);
}

export function standardize(records: Response[]): {
  data: StandardizedRecord[];
  means: number[];
  stds: number[];
} {
  const vectors = records.map(getVector);
  const means = ATTRIBUTES.map((_, i) => mean(vectors.map((v) => v[i])));
  const stds = ATTRIBUTES.map((_, i) => {
    const s = std(vectors.map((v) => v[i]), means[i]);
    return s < 1e-9 ? 1 : s;
  });
  const data = records.map((r) => ({
    id: r.participant_id,
    values: getVector(r).map((v, i) => (v - means[i]) / stds[i]),
  }));
  return { data, means, stds };
}

export function euclidean(a: number[], b: number[]): number {
  return Math.sqrt(a.reduce((s, v, i) => s + (v - b[i]) ** 2, 0));
}

export function pearson(xs: number[], ys: number[]): number {
  const n = xs.length;
  if (n < 2) return 0;
  const mx = mean(xs);
  const my = mean(ys);
  let num = 0;
  let dx = 0;
  let dy = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - mx) * (ys[i] - my);
    dx += (xs[i] - mx) ** 2;
    dy += (ys[i] - my) ** 2;
  }
  const denom = Math.sqrt(dx * dy);
  if (denom < 1e-9) return 0;
  return num / denom;
}

function strengthLabel(r: number): string {
  const a = Math.abs(r);
  if (a >= 0.7) return 'strong';
  if (a >= 0.4) return 'moderate';
  return 'weak';
}

function describeCorrelation(a: Attribute, b: Attribute, r: number): string {
  const dir = r > 0 ? 'higher' : 'lower';
  const other = r > 0 ? 'higher' : 'lower';
  return `Participants with ${dir} ${label(a)} tend to have ${other} ${label(b)}.`;
}

function label(a: Attribute): string {
  const m: Record<Attribute, string> = {
    age: 'age',
    sleep_hours: 'sleep time',
    study_hours: 'study time',
    recreation_hours: 'recreation time',
  };
  return m[a];
}

export function computeCorrelations(records: Response[]): CorrelationResult[] {
  const vectors = records.map(getVector);
  const results: CorrelationResult[] = [];
  for (let i = 0; i < ATTRIBUTES.length; i++) {
    for (let j = i + 1; j < ATTRIBUTES.length; j++) {
      const xs = vectors.map((v) => v[i]);
      const ys = vectors.map((v) => v[j]);
      const r = pearson(xs, ys);
      const a = ATTRIBUTES[i];
      const b = ATTRIBUTES[j];
      results.push({
        a,
        b,
        r,
        strength: strengthLabel(r),
        direction: r > 0 ? 'positive' : 'negative',
        description: describeCorrelation(a, b, r),
      });
    }
  }
  return results.sort((x, y) => Math.abs(y.r) - Math.abs(x.r));
}

export function kMeans(
  data: StandardizedRecord[],
  k: number,
  maxIter = 100,
  seed = 42,
): ClusterResult {
  if (data.length === 0 || k < 1) {
    return { assignments: [], centroids: [], k: 0, iterations: 0, labels: [] };
  }
  const kEff = Math.min(k, data.length);
  const dim = data[0].values.length;

  // Seeded RNG for reproducible initial centroid selection
  let rng = seed;
  const random = () => {
    rng = (rng * 16807) % 2147483647;
    return (rng - 1) / 2147483646;
  };

  // K-means++ initialization
  const firstIdx = Math.floor(random() * data.length);
  const centroids: number[][] = [data[firstIdx].values.slice()];
  const distances = data.map(() => Infinity);

  for (let c = 1; c < kEff; c++) {
    for (let i = 0; i < data.length; i++) {
      const d = euclidean(data[i].values, centroids[centroids.length - 1]);
      distances[i] = Math.min(distances[i], d);
    }
    const sum = distances.reduce((a, b) => a + b, 0);
    if (sum < 1e-9) {
      // All points identical to existing centroids; pick random
      centroids.push(data[Math.floor(random() * data.length)].values.slice());
    } else {
      let threshold = random() * sum;
      let chosen = 0;
      for (let i = 0; i < data.length; i++) {
        threshold -= distances[i];
        if (threshold <= 0) {
          chosen = i;
          break;
        }
      }
      centroids.push(data[chosen].values.slice());
    }
  }

  let assignments = new Array(data.length).fill(0);
  let iterations = 0;

  for (let iter = 0; iter < maxIter; iter++) {
    iterations++;
    let changed = false;
    const newAssignments = data.map((d) => {
      let best = 0;
      let bestDist = Infinity;
      for (let c = 0; c < centroids.length; c++) {
        const dist = euclidean(d.values, centroids[c]);
        if (dist < bestDist) {
          bestDist = dist;
          best = c;
        }
      }
      return best;
    });

    for (let i = 0; i < assignments.length; i++) {
      if (newAssignments[i] !== assignments[i]) changed = true;
    }
    assignments = newAssignments;

    // Update centroids
    for (let c = 0; c < centroids.length; c++) {
      const members = data.filter((_, i) => assignments[i] === c);
      if (members.length === 0) continue;
      centroids[c] = ATTRIBUTES.map((_, d) =>
        mean(members.map((m) => m.values[d])),
      );
    }

    if (!changed && iter > 0) break;
  }

  const clusterLabels = [
    'Cluster A',
    'Cluster B',
    'Cluster C',
    'Cluster D',
    'Cluster E',
    'Cluster F',
  ];

  return {
    assignments,
    centroids,
    k: kEff,
    iterations,
    labels: clusterLabels.slice(0, kEff),
  };
}

function interpretClusters(
  data: StandardizedRecord[],
  clusters: ClusterResult,
  records: Response[],
): string[] {
  const labels: string[] = [];
  for (let c = 0; c < clusters.k; c++) {
    const members = data.filter((_, i) => clusters.assignments[i] === c);
    if (members.length === 0) {
      labels.push(`Cluster ${String.fromCharCode(65 + c)}`);
      continue;
    }
    const avgStd = ATTRIBUTES.map((_, d) => mean(members.map((m) => m.values[d])));
    const studyIdx = ATTRIBUTES.indexOf('study_hours');
    const recIdx = ATTRIBUTES.indexOf('recreation_hours');
    const sleepIdx = ATTRIBUTES.indexOf('sleep_hours');

    if (avgStd[studyIdx] > 0.3 && avgStd[recIdx] < -0.2) {
      labels.push(`Cluster ${String.fromCharCode(65 + c)} — Study-focused`);
    } else if (avgStd[recIdx] > 0.3 && avgStd[studyIdx] < -0.2) {
      labels.push(`Cluster ${String.fromCharCode(65 + c)} — Recreation-focused`);
    } else if (avgStd[sleepIdx] > 0.3 && avgStd[studyIdx] < -0.2) {
      labels.push(`Cluster ${String.fromCharCode(65 + c)} — Well-rested`);
    } else {
      labels.push(`Cluster ${String.fromCharCode(65 + c)} — Balanced`);
    }
  }
  return labels;
}

export function computeSimilarities(
  data: StandardizedRecord[],
  topN = 3,
): SimilarityResult[] {
  return data.map((target) => {
    const others = data
      .filter((d) => d.id !== target.id)
      .map((d) => ({
        id: d.id,
        distance: euclidean(target.values, d.values),
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, topN);

    const maxDist = others.length > 0 ? others[others.length - 1].distance : 1;

    const matches = others.map((o) => ({
      id: o.id,
      distance: o.distance,
      closeness:
        o.distance < maxDist * 0.4
          ? 'Very similar'
          : o.distance < maxDist * 0.7
            ? 'Similar'
            : 'Somewhat similar',
    }));

    return { target: target.id, matches };
  });
}

export function cleanData(records: Response[]): CleaningResult {
  const totalReceived = records.length;
  const checks = [
    {
      label: 'No missing values',
      passed: records.every((r) =>
        [r.age, r.sleep_hours, r.study_hours, r.recreation_hours].every(
          (v) => v != null && !isNaN(v),
        ),
      ),
      detail: `${totalReceived} records checked for null/NaN fields`,
    },
    {
      label: 'No duplicate records',
      passed: records.length === new Set(records.map((r) => r.participant_id)).size,
      detail: `${records.length} submissions, ${new Set(records.map((r) => r.participant_id)).size} unique participant IDs`,
    },
    {
      label: 'All ages valid (0–130)',
      passed: records.every((r) => r.age > 0 && r.age < 130),
      detail: 'Age column within plausible human range',
    },
    {
      label: 'All time values valid (0–24h)',
      passed: records.every((r) =>
        [r.sleep_hours, r.study_hours, r.recreation_hours].every(
          (v) => v >= 0 && v <= 24,
        ),
      ),
      detail: 'Sleep, study, and recreation hours within 0–24 range',
    },
    {
      label: 'No impossible daily totals (>26h)',
      passed: records.every(
        (r) => r.sleep_hours + r.study_hours + r.recreation_hours <= 26,
      ),
      detail: 'Sleep + study + recreation does not exceed available daily hours',
    },
  ];

  const duplicateIds = records
    .map((r) => r.participant_id)
    .filter((id, i, arr) => arr.indexOf(id) !== i);

  return {
    totalReceived,
    checks,
    validCount: totalReceived,
    duplicateIds: [...new Set(duplicateIds)],
  };
}

export function pickK(records: Response[]): number {
  if (records.length === 0) return 0;
  if (records.length <= 3) return 2;
  if (records.length <= 8) return 3;
  return Math.min(6, Math.max(3, Math.round(Math.sqrt(records.length / 2))));
}

export function analyze(records: Response[]): AnalysisResult {
  const sorted = [...records].sort((a, b) =>
    a.participant_id.localeCompare(b.participant_id, undefined, { numeric: true }),
  );
  const cleaning = cleanData(sorted);
  const { data: standardized, means, stds } = standardize(sorted);
  const correlations = computeCorrelations(sorted);
  const k = pickK(sorted);
  const clusters = kMeans(standardized, k);
  clusters.labels = interpretClusters(standardized, clusters, sorted);
  const similarities = computeSimilarities(standardized);

  const notablePatterns = correlations.filter(
    (c) => Math.abs(c.r) >= 0.4,
  ).length;

  return {
    records: sorted,
    cleaning,
    standardized,
    mean: means,
    std: stds,
    correlations,
    clusters,
    similarities,
    summary: {
      recordsAnalyzed: sorted.length,
      clustersFound: clusters.k,
      variablesAnalyzed: ATTRIBUTES.length,
      patternsFound: notablePatterns,
    },
  };
}

export function nextParticipantId(existing: string[]): string {
  const used = new Set(existing);
  let n = 1;
  while (used.has(`P${n}`)) n++;
  return `P${n}`;
}

export function formatNum(v: number, decimals = 2): string {
  return v.toFixed(decimals);
}
