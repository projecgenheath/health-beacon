/**
 * Types for Laboratory Request System
 * Based on DBSync - Webservice v2.0 specification
 */

// Request Status
export type RequestStatus =
    | 'pending'           // Aguardando coleta
    | 'collected'         // Coletado
    | 'in_transit'        // Em trânsito
    | 'received'          // Recebido no laboratório
    | 'in_analysis'       // Em análise
    | 'technical_release' // Liberação técnica
    | 'clinical_release'  // Liberação clínica
    | 'completed'         // Concluído
    | 'cancelled_temp'    // Cancelado temporariamente (CTP)
    | 'cancelled_def'     // Cancelado definitivamente (CDP)
    | 'pending_recollect' // Pendente de recoleta
    | 'mpp_temporary';    // MPP temporário

// Sample Type
export type SampleType =
    | 'blood'
    | 'urine'
    | 'stool'
    | 'saliva'
    | 'tissue'
    | 'other';

// Exam Request Interface
export interface ExamRequest {
    id: string;
    request_number: string;              // Número do pedido (gerado internamente)
    external_request_number?: string;    // Número do pedido externo (do apoiado)
    laboratory_id: string;               // ID do laboratório que recebeu o pedido
    patient_id: string;                  // ID do paciente
    requester_id?: string;               // ID do médico solicitante

    // Patient Information
    patient_name: string;
    patient_cpf?: string;                // Obrigatório para Citometria
    patient_birth_date: string;
    patient_sex: 'M' | 'F' | 'O';
    patient_weight?: number;             // Obrigatório para CLCRE
    patient_height?: number;             // Obrigatório para CLCRE

    // Contact Information
    patient_phone?: string;
    patient_email?: string;
    patient_address?: string;

    // Request Details
    request_date: string;
    collection_date?: string;
    priority: 'routine' | 'urgent' | 'stat';
    status: RequestStatus;

    // Clinical Information
    clinical_indication?: string;
    additional_notes?: string;

    // Timestamps
    created_at: string;
    updated_at: string;
    completed_at?: string;
}

// Exam Procedure Interface
export interface ExamProcedure {
    id: string;
    request_id: string;
    procedure_code: string;              // Código do exame (mnemônico DB)
    procedure_name: string;
    sample_type: SampleType;
    sample_code?: string;                // Código de barras da amostra

    // Procedure-specific fields
    hematocrit_value?: number;           // Para FOERI
    urine_volume?: number;               // Para PTU24
    collection_region?: string;          // Para BIOP

    // Status
    status: RequestStatus;
    result_available: boolean;
    result_released_at?: string;

    // Sample tracking
    sample_collected_at?: string;
    sample_received_at?: string;
    sample_checkout_at?: string;

    // Timestamps
    created_at: string;
    updated_at: string;
}

// Exam Result Interface
export interface ExamResult {
    id: string;
    procedure_id: string;
    request_id: string;

    // Result data
    result_type: 'parametric' | 'pdf' | 'text';
    result_value?: string;
    result_unit?: string;
    reference_range?: string;
    result_status: 'normal' | 'abnormal' | 'critical';

    // PDF/Document
    result_pdf_url?: string;
    result_pdf_base64?: string;

    // Technical information
    method?: string;
    equipment?: string;
    performed_by?: string;

    // Release information
    technical_release_at?: string;
    technical_release_by?: string;
    clinical_release_at?: string;
    clinical_release_by?: string;

    // Timestamps
    created_at: string;
    updated_at: string;
}

// Sample Label Interface
export interface SampleLabel {
    id: string;
    procedure_id: string;
    request_number: string;
    sample_barcode: string;              // Código de barras CODE 128
    procedure_mnemonics: string[];       // Lista de mnemônicos

    // Label specifications (5cm x 2.5cm or 5cm x 3.0cm)
    label_script: string;                // Script ZPL para impressão térmica
    label_size: '5x2.5' | '5x3.0';

    // Print tracking
    printed: boolean;
    printed_at?: string;
    print_count: number;

    // Timestamps
    created_at: string;
}

// Request Activity Log
export interface RequestActivityLog {
    id: string;
    request_id: string;
    procedure_id?: string;

    activity_type:
    | 'created'
    | 'status_changed'
    | 'sample_collected'
    | 'sample_received'
    | 'result_released'
    | 'cancelled'
    | 'recoleta_requested'
    | 'note_added';

    previous_status?: RequestStatus;
    new_status?: RequestStatus;

    description: string;
    performed_by?: string;

    created_at: string;
}

// DTO for creating a new request
export interface CreateExamRequestDTO {
    patient_id: string;
    patient_name: string;
    patient_cpf?: string;
    patient_birth_date: string;
    patient_sex: 'M' | 'F' | 'O';
    patient_weight?: number;
    patient_height?: number;
    patient_phone?: string;
    patient_email?: string;
    patient_address?: string;

    priority: 'routine' | 'urgent' | 'stat';
    clinical_indication?: string;
    additional_notes?: string;

    procedures: Array<{
        procedure_code: string;
        procedure_name: string;
        sample_type: SampleType;
        hematocrit_value?: number;
        urine_volume?: number;
        collection_region?: string;
    }>;
}

// Statistics for laboratory dashboard
export interface LabRequestStats {
    total_requests: number;
    pending_requests: number;
    in_progress_requests: number;
    completed_today: number;
    pending_results: number;
    critical_results: number;
    pending_recollections: number;
}
