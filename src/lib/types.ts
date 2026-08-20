export interface Response {
  id: string;
  participant_id: string;
  age: number;
  sleep_hours: number;
  study_hours: number;
  recreation_hours: number;
  created_at: string;
}

export const ATTRIBUTES = ['age', 'sleep_hours', 'study_hours', 'recreation_hours'] as const;
export type Attribute = (typeof ATTRIBUTES)[number];

export const ATTRIBUTE_LABELS: Record<Attribute, string> = {
  age: 'Age',
  sleep_hours: 'Sleep',
  study_hours: 'Study',
  recreation_hours: 'Recreation',
};

export const ATTRIBUTE_UNITS: Record<Attribute, string> = {
  age: 'yrs',
  sleep_hours: 'hrs',
  study_hours: 'hrs',
  recreation_hours: 'hrs',
};

export const ATTRIBUTE_COLORS: Record<Attribute, string> = {
  age: '#60a5fa',
  sleep_hours: '#34d399',
  study_hours: '#fbbf24',
  recreation_hours: '#f472b6',
};

export type CleanCheck = {
  label: string;
  passed: boolean;
  detail: string;
};

export type ClusterResult = {
  assignments: number[];
  centroids: number[][];
  k: number;
  iterations: number;
  labels: string[];
};

export type CorrelationResult = {
  a: Attribute;
  b: Attribute;
  r: number;
  strength: string;
  direction: string;
  description: string;
};

export type SimilarityResult = {
  target: string;
  matches: { id: string; distance: number; closeness: string }[];
};

export type StandardizedRecord = {
  id: string;
  values: number[];
};

export type CleaningResult = {
  totalReceived: number;
  checks: CleanCheck[];
  validCount: number;
  duplicateIds: string[];
};

export type AnalysisResult = {
  records: Response[];
  cleaning: CleaningResult;
  standardized: StandardizedRecord[];
  mean: number[];
  std: number[];
  correlations: CorrelationResult[];
  clusters: ClusterResult;
  similarities: SimilarityResult[];
  summary: {
    recordsAnalyzed: number;
    clustersFound: number;
    variablesAnalyzed: number;
    patternsFound: number;
  };
};
