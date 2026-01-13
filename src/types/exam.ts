export type ExamStatus = 'healthy' | 'warning' | 'danger' | 'normal' | 'abnormal';
export type ExamType = 'laboratory' | 'imaging' | 'pathology';

export interface ExamResult {
  id: string;
  examId?: string;
  name: string;
  value: number;
  textValue?: string | null;      // Para exames de imagem/patologia
  unit: string;
  referenceMin: number;
  referenceMax: number;
  status: ExamStatus;
  date: string;
  category: string;
  examType?: ExamType;            // Tipo do exame
  description?: string | null;    // Descrição detalhada (laudos)
  conclusion?: string | null;     // Conclusão do médico
  fileUrl?: string | null;
  fileName?: string | null;
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
  normal?: number;     // Para exames de imagem/patologia
  abnormal?: number;   // Para exames de imagem/patologia
  lastUpdate: string;
}
