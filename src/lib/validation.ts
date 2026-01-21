import { z } from 'zod';

/**
 * Schemas de validação com Zod para dados críticos do app
 */

// Schema para perfil de usuário
export const profileSchema = z.object({
    full_name: z.string()
        .min(2, 'Nome deve ter pelo menos 2 caracteres')
        .max(100, 'Nome muito longo')
        .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, 'Nome contém caracteres inválidos')
        .transform(val => val.trim()),

    birth_date: z.string()
        .refine(val => {
            const date = new Date(val);
            return !isNaN(date.getTime());
        }, 'Data inválida')
        .refine(val => {
            const date = new Date(val);
            const now = new Date();
            return date < now;
        }, 'Data de nascimento deve ser no passado')
        .refine(val => {
            const date = new Date(val);
            const minDate = new Date();
            minDate.setFullYear(minDate.getFullYear() - 150);
            return date > minDate;
        }, 'Data de nascimento inválida'),

    sex: z.enum(['M', 'F', 'O'], {
        errorMap: () => ({ message: 'Sexo deve ser M, F ou O' })
    }).optional(),

    email_notifications: z.boolean().optional().default(true),

    digest_frequency: z.enum(['none', 'weekly', 'monthly'])
        .optional()
        .default('none'),
});

// Schema para resultado de exame
export const examResultSchema = z.object({
    name: z.string()
        .min(1, 'Nome do exame é obrigatório')
        .max(200, 'Nome muito longo'),

    value: z.number()
        .or(z.string().transform(val => parseFloat(val)))
        .refine(val => !isNaN(val), 'Valor deve ser numérico'),

    unit: z.string()
        .max(50, 'Unidade muito longa'),

    reference_min: z.number().optional().nullable(),
    reference_max: z.number().optional().nullable(),

    status: z.enum(['healthy', 'warning', 'danger']),

    category: z.string().optional().default('Geral'),

    exam_type: z.enum(['laboratory', 'imaging', 'pathology'])
        .optional()
        .default('laboratory'),
});

// Schema para meta de saúde
export const healthGoalSchema = z.object({
    exam_name: z.string()
        .min(1, 'Nome do exame é obrigatório'),

    target_value: z.number()
        .positive('Valor alvo deve ser positivo'),

    target_date: z.string()
        .refine(val => {
            const date = new Date(val);
            return !isNaN(date.getTime()) && date > new Date();
        }, 'Data alvo deve ser no futuro'),

    notes: z.string()
        .max(500, 'Notas muito longas')
        .optional(),
});

// Schema para medicamento
export const medicationSchema = z.object({
    name: z.string()
        .min(1, 'Nome do medicamento é obrigatório')
        .max(200, 'Nome muito longo'),

    dosage: z.string()
        .min(1, 'Dosagem é obrigatória')
        .max(100, 'Dosagem muito longa'),

    frequency: z.string()
        .min(1, 'Frequência é obrigatória'),

    start_date: z.string()
        .refine(val => !isNaN(new Date(val).getTime()), 'Data inválida'),

    end_date: z.string()
        .refine(val => !isNaN(new Date(val).getTime()), 'Data inválida')
        .optional()
        .nullable(),

    notes: z.string()
        .max(500, 'Notas muito longas')
        .optional(),
});

// Schema para link compartilhado
export const sharedLinkSchema = z.object({
    exam_id: z.string().uuid('ID do exame inválido'),

    expires_at: z.string()
        .refine(val => {
            const date = new Date(val);
            return !isNaN(date.getTime()) && date > new Date();
        }, 'Data de expiração deve ser no futuro')
        .optional()
        .nullable(),
});

// Schema para lembrete de exame
export const examReminderSchema = z.object({
    exam_type: z.string()
        .min(1, 'Tipo de exame é obrigatório'),

    frequency_months: z.number()
        .int('Frequência deve ser número inteiro')
        .positive('Frequência deve ser positiva')
        .max(60, 'Frequência máxima é 60 meses'),

    last_done: z.string()
        .refine(val => !isNaN(new Date(val).getTime()), 'Data inválida')
        .optional()
        .nullable(),
});

/**
 * Valida dados contra um schema
 * Retorna { success: true, data } ou { success: false, errors }
 */
export function validateData<T>(
    schema: z.ZodSchema<T>,
    data: unknown
): { success: true; data: T } | { success: false; errors: string[] } {
    try {
        const result = schema.parse(data);
        return { success: true, data: result };
    } catch (error) {
        if (error instanceof z.ZodError) {
            return {
                success: false,
                errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
            };
        }
        return {
            success: false,
            errors: ['Erro de validação desconhecido'],
        };
    }
}

/**
 * Sanitiza string removendo caracteres perigosos
 */
export function sanitizeString(input: string): string {
    return input
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .replace(/[<>\"'&]/g, '') // Remove caracteres especiais
        .trim();
}

/**
 * Sanitiza objeto removendo campos não permitidos
 */
export function sanitizeObject<T extends Record<string, unknown>>(
    obj: T,
    allowedFields: (keyof T)[]
): Partial<T> {
    const sanitized: Partial<T> = {};

    for (const field of allowedFields) {
        if (field in obj) {
            const value = obj[field];
            if (typeof value === 'string') {
                sanitized[field] = sanitizeString(value) as T[keyof T];
            } else {
                sanitized[field] = value;
            }
        }
    }

    return sanitized;
}

/**
 * Valida formato de email
 */
export function isValidEmail(email: string): boolean {
    const emailSchema = z.string().email();
    return emailSchema.safeParse(email).success;
}

/**
 * Valida UUID
 */
export function isValidUUID(uuid: string): boolean {
    const uuidSchema = z.string().uuid();
    return uuidSchema.safeParse(uuid).success;
}
