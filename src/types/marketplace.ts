export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
    // Allows to automatically instantiate createClient with right options
    // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
    __InternalSupabase: {
        PostgrestVersion: "14.1"
    }
    public: {
        Tables: {
            collection_appointments: {
                Row: {
                    collection_type: string | null
                    created_at: string
                    home_address: string | null
                    id: string
                    laboratory_id: string
                    notes: string | null
                    patient_id: string
                    quotation_id: string
                    scheduled_date: string
                    scheduled_time: string
                    status: string | null
                    updated_at: string
                }
                Insert: {
                    collection_type?: string | null
                    created_at?: string
                    home_address?: string | null
                    id?: string
                    laboratory_id: string
                    notes?: string | null
                    patient_id: string
                    quotation_id: string
                    scheduled_date: string
                    scheduled_time: string
                    status?: string | null
                    updated_at?: string
                }
                Update: {
                    collection_type?: string | null
                    created_at?: string
                    home_address?: string | null
                    id?: string
                    laboratory_id?: string
                    notes?: string | null
                    patient_id?: string
                    quotation_id?: string
                    scheduled_date?: string
                    scheduled_time?: string
                    status?: string | null
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "collection_appointments_laboratory_id_fkey"
                        columns: ["laboratory_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "collection_appointments_patient_id_fkey"
                        columns: ["patient_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "collection_appointments_quotation_id_fkey"
                        columns: ["quotation_id"]
                        isOneToOne: false
                        referencedRelation: "quotations"
                        referencedColumns: ["id"]
                    },
                ]
            }
            exam_requests: {
                Row: {
                    created_at: string
                    description: string | null
                    exam_types: string[]
                    id: string
                    patient_id: string
                    preferred_date: string | null
                    selected_quotation_id: string | null
                    status: string | null
                    document_url: string | null
                    updated_at: string
                    urgency_level: string | null
                }
                Insert: {
                    created_at?: string
                    description?: string | null
                    exam_types: string[]
                    id?: string
                    patient_id: string
                    preferred_date?: string | null
                    selected_quotation_id?: string | null
                    status?: string | null
                    updated_at?: string
                    urgency_level?: string | null
                }
                Update: {
                    created_at?: string
                    description?: string | null
                    exam_types?: string[]
                    id?: string
                    patient_id?: string
                    preferred_date?: string | null
                    selected_quotation_id?: string | null
                    status?: string | null
                    updated_at?: string
                    urgency_level?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "exam_requests_patient_id_fkey"
                        columns: ["patient_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
            quotations: {
                Row: {
                    created_at: string
                    estimated_delivery_days: number | null
                    exam_request_id: string
                    id: string
                    items: Json
                    laboratory_id: string
                    notes: string | null
                    status: string | null
                    total_price: number
                    updated_at: string
                    valid_until: string
                }
                Insert: {
                    created_at?: string
                    estimated_delivery_days?: number | null
                    exam_request_id: string
                    id?: string
                    items: Json
                    laboratory_id: string
                    notes?: string | null
                    status?: string | null
                    total_price: number
                    updated_at?: string
                    valid_until: string
                }
                Update: {
                    created_at?: string
                    estimated_delivery_days?: number | null
                    exam_request_id?: string
                    id?: string
                    items?: Json
                    laboratory_id?: string
                    notes?: string | null
                    status?: string | null
                    total_price?: number
                    updated_at?: string
                    valid_until?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "quotations_exam_request_id_fkey"
                        columns: ["exam_request_id"]
                        isOneToOne: false
                        referencedRelation: "exam_requests"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "quotations_laboratory_id_fkey"
                        columns: ["laboratory_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
            notifications: {
                Row: {
                    created_at: string
                    id: string
                    link: string | null
                    message: string
                    read: boolean | null
                    title: string
                    type: string
                    user_id: string
                }
                Insert: {
                    created_at?: string
                    id?: string
                    link?: string | null
                    message: string
                    read?: boolean | null
                    title: string
                    type: string
                    user_id: string
                }
                Update: {
                    created_at?: string
                    id?: string
                    link?: string | null
                    message?: string
                    read?: boolean | null
                    title?: string
                    type?: string
                    user_id?: string
                }
                Relationships: []
            }
            profiles: {
                Row: {
                    address_city: string | null
                    address_complement: string | null
                    address_country: string | null
                    address_neighborhood: string | null
                    address_number: string | null
                    address_state: string | null
                    address_street: string | null
                    allergies: string | null
                    average_rating: number | null
                    avatar_url: string | null
                    birth_date: string | null
                    chronic_diseases: string | null
                    cnpj: string | null
                    cpf: string | null
                    db_codigo_apoiado: string | null
                    db_usuario: string | null
                    db_senha_integracao: string | null
                    created_at: string
                    description: string | null
                    emergency_phone: string | null
                    ethnicity: string | null
                    full_name: string | null
                    gender: string | null
                    height: number | null
                    id: string
                    laboratory_name: string | null
                    latitude: number | null
                    longitude: number | null
                    marital_status: string | null
                    operating_hours: Json | null
                    phone: string | null
                    services_offered: string[] | null
                    sex: string | null
                    total_reviews: number | null
                    updated_at: string
                    user_id: string
                    user_type: Database["public"]["Enums"]["user_type"] | null
                    weight: number | null
                }
                Insert: {
                    address_city?: string | null
                    address_complement?: string | null
                    address_country?: string | null
                    address_neighborhood?: string | null
                    address_number?: string | null
                    address_state?: string | null
                    address_street?: string | null
                    allergies?: string | null
                    average_rating?: number | null
                    avatar_url?: string | null
                    birth_date?: string | null
                    chronic_diseases?: string | null
                    cnpj?: string | null
                    cpf?: string | null
                    db_codigo_apoiado?: string | null
                    db_usuario?: string | null
                    db_senha_integracao?: string | null
                    created_at?: string
                    description?: string | null
                    emergency_phone?: string | null
                    ethnicity?: string | null
                    full_name?: string | null
                    gender?: string | null
                    height?: number | null
                    id?: string
                    laboratory_name?: string | null
                    latitude?: number | null
                    longitude?: number | null
                    marital_status?: string | null
                    operating_hours?: Json | null
                    phone?: string | null
                    services_offered?: string[] | null
                    sex?: string | null
                    total_reviews?: number | null
                    updated_at?: string
                    user_id: string
                    user_type?: Database["public"]["Enums"]["user_type"] | null
                    weight?: number | null
                }
                Update: {
                    address_city?: string | null
                    address_complement?: string | null
                    address_country?: string | null
                    address_neighborhood?: string | null
                    address_number?: string | null
                    address_state?: string | null
                    address_street?: string | null
                    allergies?: string | null
                    average_rating?: number | null
                    avatar_url?: string | null
                    birth_date?: string | null
                    chronic_diseases?: string | null
                    cnpj?: string | null
                    cpf?: string | null
                    db_codigo_apoiado?: string | null
                    db_usuario?: string | null
                    db_senha_integracao?: string | null
                    created_at?: string
                    description?: string | null
                    emergency_phone?: string | null
                    ethnicity?: string | null
                    full_name?: string | null
                    gender?: string | null
                    height?: number | null
                    id?: string
                    laboratory_name?: string | null
                    latitude?: number | null
                    longitude?: number | null
                    marital_status?: string | null
                    operating_hours?: Json | null
                    phone?: string | null
                    services_offered?: string[] | null
                    sex?: string | null
                    total_reviews?: number | null
                    updated_at?: string
                    user_id?: string
                    user_type?: Database["public"]["Enums"]["user_type"] | null
                    weight?: number | null
                }
                Relationships: []
            }
            // ... other existing tables
        }
        Enums: {
            user_type: "patient" | "laboratory"
        }
    }
}

export type UserType = Database["public"]["Enums"]["user_type"];

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type ExamRequest = Database["public"]["Tables"]["exam_requests"]["Row"];
export type Quotation = Database["public"]["Tables"]["quotations"]["Row"];
export type CollectionAppointment = Database["public"]["Tables"]["collection_appointments"]["Row"];
export type Notification = Database["public"]["Tables"]["notifications"]["Row"];

export interface QuotationItem {
    exam_name: string;
    price: number;
    preparation_required?: string;
}

export interface QuotationWithLaboratory extends Quotation {
    laboratory: Profile;
    distance_km?: number;
}
