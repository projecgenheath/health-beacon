export type ExamStatus = 'healthy' | 'warning' | 'danger';

export interface ExamResult {
  id: string;
  name: string;
  value: number;
  unit: string;
  referenceMin: number;
  referenceMax: number;
  status: ExamStatus;
  date: string;
  category: string;
}

export interface ExamHistory {
  examName: string;
  unit: string;
  referenceMin: number;
  referenceMax: number;
  history: {
    date: string;
    value: number;
    status: ExamStatus;
  }[];
}

export interface HealthSummary {
  totalExams: number;
  healthy: number;
  warning: number;
  danger: number;
  lastUpdate: string;
}
