// Known medical correlations between exams
export interface ExamCorrelation {
    exam1: string;
    exam2: string;
    relationship: 'positive' | 'negative' | 'related';
    description: {
        'pt-BR': string;
        'en-US': string;
        'es-ES': string;
    };
}

export const EXAM_CORRELATIONS: ExamCorrelation[] = [
    {
        exam1: 'GLICOSE',
        exam2: 'HEMOGLOBINA GLICADA',
        relationship: 'positive',
        description: {
            'pt-BR': 'A hemoglobina glicada reflete a média de glicose dos últimos 2-3 meses',
            'en-US': 'Glycated hemoglobin reflects the average glucose over the last 2-3 months',
            'es-ES': 'La hemoglobina glicada refleja el promedio de glucosa de los últimos 2-3 meses',
        },
    },
    {
        exam1: 'COLESTEROL TOTAL',
        exam2: 'LDL',
        relationship: 'positive',
        description: {
            'pt-BR': 'LDL alto contribui para o aumento do colesterol total',
            'en-US': 'High LDL contributes to increased total cholesterol',
            'es-ES': 'El LDL alto contribuye al aumento del colesterol total',
        },
    },
    {
        exam1: 'COLESTEROL TOTAL',
        exam2: 'HDL',
        relationship: 'related',
        description: {
            'pt-BR': 'HDL é o "bom" colesterol que ajuda a remover o LDL do sangue',
            'en-US': 'HDL is the "good" cholesterol that helps remove LDL from the blood',
            'es-ES': 'El HDL es el colesterol "bueno" que ayuda a eliminar el LDL de la sangre',
        },
    },
    {
        exam1: 'CREATININA',
        exam2: 'UREIA',
        relationship: 'positive',
        description: {
            'pt-BR': 'Ambos são marcadores de função renal - elevação conjunta pode indicar problemas renais',
            'en-US': 'Both are kidney function markers - joint elevation may indicate kidney problems',
            'es-ES': 'Ambos son marcadores de función renal - la elevación conjunta puede indicar problemas renales',
        },
    },
    {
        exam1: 'TGO',
        exam2: 'TGP',
        relationship: 'positive',
        description: {
            'pt-BR': 'São enzimas hepáticas - elevação conjunta pode indicar dano no fígado',
            'en-US': 'They are liver enzymes - joint elevation may indicate liver damage',
            'es-ES': 'Son enzimas hepáticas - la elevación conjunta puede indicar daño hepático',
        },
    },
    {
        exam1: 'TSH',
        exam2: 'T4 LIVRE',
        relationship: 'negative',
        description: {
            'pt-BR': 'TSH alto com T4 baixo sugere hipotireoidismo; TSH baixo com T4 alto sugere hipertireoidismo',
            'en-US': 'High TSH with low T4 suggests hypothyroidism; low TSH with high T4 suggests hyperthyroidism',
            'es-ES': 'TSH alto con T4 bajo sugiere hipotiroidismo; TSH bajo con T4 alto sugiere hipertiroidismo',
        },
    },
    {
        exam1: 'HEMOGLOBINA',
        exam2: 'HEMATOCRITO',
        relationship: 'positive',
        description: {
            'pt-BR': 'Ambos avaliam a capacidade de transporte de oxigênio do sangue',
            'en-US': 'Both evaluate the oxygen-carrying capacity of the blood',
            'es-ES': 'Ambos evalúan la capacidad de transporte de oxígeno de la sangre',
        },
    },
    {
        exam1: 'FERRO SERICO',
        exam2: 'FERRITINA',
        relationship: 'positive',
        description: {
            'pt-BR': 'Ferritina é a reserva de ferro do corpo; ambos baixos indicam anemia ferropriva',
            'en-US': 'Ferritin is the body\'s iron reserve; both low indicate iron deficiency anemia',
            'es-ES': 'La ferritina es la reserva de hierro del cuerpo; ambos bajos indican anemia ferropénica',
        },
    },
    {
        exam1: 'VITAMINA D',
        exam2: 'CALCIO',
        relationship: 'related',
        description: {
            'pt-BR': 'Vitamina D ajuda na absorção de cálcio; deficiência pode levar a problemas ósseos',
            'en-US': 'Vitamin D helps calcium absorption; deficiency can lead to bone problems',
            'es-ES': 'La vitamina D ayuda en la absorción de calcio; la deficiencia puede causar problemas óseos',
        },
    },
    {
        exam1: 'TRIGLICERIDES',
        exam2: 'VLDL',
        relationship: 'positive',
        description: {
            'pt-BR': 'VLDL transporta triglicerídeos; níveis altos de ambos aumentam risco cardiovascular',
            'en-US': 'VLDL carries triglycerides; high levels of both increase cardiovascular risk',
            'es-ES': 'El VLDL transporta triglicéridos; niveles altos de ambos aumentan el riesgo cardiovascular',
        },
    },
];

// Reference ranges by age and sex
export interface ReferenceRange {
    exam: string;
    unit: string;
    ranges: {
        sex: 'M' | 'F' | 'all';
        ageMin?: number;
        ageMax?: number;
        min: number;
        max: number;
    }[];
}

export const REFERENCE_RANGES: ReferenceRange[] = [
    {
        exam: 'HEMOGLOBINA',
        unit: 'g/dL',
        ranges: [
            { sex: 'M', ageMin: 18, min: 13.5, max: 17.5 },
            { sex: 'F', ageMin: 18, min: 12.0, max: 16.0 },
            { sex: 'M', ageMin: 0, ageMax: 17, min: 11.5, max: 15.5 },
            { sex: 'F', ageMin: 0, ageMax: 17, min: 11.5, max: 15.5 },
        ],
    },
    {
        exam: 'GLICOSE',
        unit: 'mg/dL',
        ranges: [
            { sex: 'all', min: 70, max: 99 },
        ],
    },
    {
        exam: 'COLESTEROL TOTAL',
        unit: 'mg/dL',
        ranges: [
            { sex: 'all', ageMax: 19, min: 0, max: 170 },
            { sex: 'all', ageMin: 20, min: 0, max: 200 },
        ],
    },
    {
        exam: 'LDL',
        unit: 'mg/dL',
        ranges: [
            { sex: 'all', min: 0, max: 100 },
        ],
    },
    {
        exam: 'HDL',
        unit: 'mg/dL',
        ranges: [
            { sex: 'M', min: 40, max: 200 },
            { sex: 'F', min: 50, max: 200 },
        ],
    },
    {
        exam: 'TRIGLICERIDES',
        unit: 'mg/dL',
        ranges: [
            { sex: 'all', min: 0, max: 150 },
        ],
    },
    {
        exam: 'CREATININA',
        unit: 'mg/dL',
        ranges: [
            { sex: 'M', min: 0.7, max: 1.3 },
            { sex: 'F', min: 0.6, max: 1.1 },
        ],
    },
    {
        exam: 'TSH',
        unit: 'mUI/L',
        ranges: [
            { sex: 'all', min: 0.4, max: 4.0 },
        ],
    },
    {
        exam: 'VITAMINA D',
        unit: 'ng/mL',
        ranges: [
            { sex: 'all', min: 30, max: 100 },
        ],
    },
];

// Function to find correlations for a given exam
export function findCorrelations(examName: string): ExamCorrelation[] {
    const normalized = examName.toUpperCase().trim();
    return EXAM_CORRELATIONS.filter(
        (c) =>
            c.exam1.includes(normalized) ||
            c.exam2.includes(normalized) ||
            normalized.includes(c.exam1) ||
            normalized.includes(c.exam2)
    );
}

// Function to get reference range for a specific exam/sex/age
export function getReferenceRange(
    examName: string,
    sex: 'M' | 'F',
    age: number
): { min: number; max: number; unit: string } | null {
    const normalized = examName.toUpperCase().trim();
    const examRef = REFERENCE_RANGES.find(
        (r) => r.exam === normalized || normalized.includes(r.exam)
    );

    if (!examRef) return null;

    // Find the most specific range
    const range = examRef.ranges.find((r) => {
        const sexMatch = r.sex === 'all' || r.sex === sex;
        const ageMinMatch = r.ageMin === undefined || age >= r.ageMin;
        const ageMaxMatch = r.ageMax === undefined || age <= r.ageMax;
        return sexMatch && ageMinMatch && ageMaxMatch;
    });

    if (!range) return null;

    return { min: range.min, max: range.max, unit: examRef.unit };
}
