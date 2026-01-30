-- Migration: Laboratory Request Management System
-- Description: Creates tables for managing exam requests, procedures, results, and sample labels
-- Based on DBSync v2.0 specification
-- Created: 2026-01-30

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Request Status Enum
DO $$ BEGIN
  CREATE TYPE request_status AS ENUM (
    'pending',
    'collected',
    'in_transit',
    'received',
    'in_analysis',
    'technical_release',
    'clinical_release',
    'completed',
    'cancelled_temp',
    'cancelled_def',
    'pending_recollect',
    'mpp_temporary'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Sample Type Enum
DO $$ BEGIN
  CREATE TYPE sample_type AS ENUM (
    'blood',
    'urine',
    'stool',
    'saliva',
    'tissue',
    'other'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Priority Enum
DO $$ BEGIN
  CREATE TYPE request_priority AS ENUM (
    'routine',
    'urgent',
    'stat'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Result Status Enum
DO $$ BEGIN
  CREATE TYPE result_status AS ENUM (
    'normal',
    'abnormal',
    'critical'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 1. Exam Requests Table
CREATE TABLE IF NOT EXISTS public.lab_production_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_number TEXT NOT NULL UNIQUE,
  external_request_number TEXT,
  laboratory_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  requester_id UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  
  -- Patient Information
  patient_name TEXT NOT NULL,
  patient_cpf TEXT,
  patient_birth_date DATE NOT NULL,
  patient_sex TEXT NOT NULL CHECK (patient_sex IN ('M', 'F', 'O')),
  patient_weight NUMERIC(5,2),
  patient_height NUMERIC(5,2),
  
  -- Contact Information
  patient_phone TEXT,
  patient_email TEXT,
  patient_address TEXT,
  
  -- Request Details
  request_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  collection_date TIMESTAMP WITH TIME ZONE,
  priority request_priority NOT NULL DEFAULT 'routine',
  status request_status NOT NULL DEFAULT 'pending',
  
  -- Clinical Information
  clinical_indication TEXT,
  additional_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- 2. Exam Procedures Table
CREATE TABLE IF NOT EXISTS public.lab_production_procedures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID NOT NULL REFERENCES public.lab_production_requests(id) ON DELETE CASCADE,
  procedure_code TEXT NOT NULL,
  procedure_name TEXT NOT NULL,
  sample_type sample_type NOT NULL,
  sample_code TEXT,
  
  -- Procedure-specific fields
  hematocrit_value NUMERIC(5,2),
  urine_volume NUMERIC(10,2),
  collection_region TEXT,
  
  -- Status
  status request_status NOT NULL DEFAULT 'pending',
  result_available BOOLEAN NOT NULL DEFAULT FALSE,
  result_released_at TIMESTAMP WITH TIME ZONE,
  
  -- Sample tracking
  sample_collected_at TIMESTAMP WITH TIME ZONE,
  sample_received_at TIMESTAMP WITH TIME ZONE,
  sample_checkout_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 3. Exam Results Table
CREATE TABLE IF NOT EXISTS public.lab_production_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  procedure_id UUID NOT NULL REFERENCES public.lab_production_procedures(id) ON DELETE CASCADE,
  request_id UUID NOT NULL REFERENCES public.lab_production_requests(id) ON DELETE CASCADE,
  
  -- Result data
  result_type TEXT NOT NULL CHECK (result_type IN ('parametric', 'pdf', 'text')),
  result_value TEXT,
  result_unit TEXT,
  reference_range TEXT,
  result_status result_status,
  
  -- PDF/Document
  result_pdf_url TEXT,
  result_pdf_base64 TEXT,
  
  -- Technical information
  method TEXT,
  equipment TEXT,
  performed_by TEXT,
  
  -- Release information
  technical_release_at TIMESTAMP WITH TIME ZONE,
  technical_release_by UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  clinical_release_at TIMESTAMP WITH TIME ZONE,
  clinical_release_by UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 4. Sample Labels Table
CREATE TABLE IF NOT EXISTS public.lab_production_labels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  procedure_id UUID NOT NULL REFERENCES public.lab_production_procedures(id) ON DELETE CASCADE,
  request_number TEXT NOT NULL,
  sample_barcode TEXT NOT NULL UNIQUE,
  procedure_mnemonics TEXT[] NOT NULL,
  
  -- Label specifications
  label_script TEXT NOT NULL,
  label_size TEXT NOT NULL CHECK (label_size IN ('5x2.5', '5x3.0')),
  
  -- Print tracking
  printed BOOLEAN NOT NULL DEFAULT FALSE,
  printed_at TIMESTAMP WITH TIME ZONE,
  print_count INTEGER NOT NULL DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 5. Request Activity Log Table
CREATE TABLE IF NOT EXISTS public.lab_request_activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID NOT NULL REFERENCES public.lab_production_requests(id) ON DELETE CASCADE,
  procedure_id UUID REFERENCES public.lab_production_procedures(id) ON DELETE CASCADE,
  
  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'created',
    'status_changed',
    'sample_collected',
    'sample_received',
    'result_released',
    'cancelled',
    'recoleta_requested',
    'note_added'
  )),
  
  previous_status request_status,
  new_status request_status,
  
  description TEXT NOT NULL,
  performed_by UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_lab_requests_laboratory ON public.lab_production_requests(laboratory_id);
CREATE INDEX IF NOT EXISTS idx_lab_requests_patient ON public.lab_production_requests(patient_id);
CREATE INDEX IF NOT EXISTS idx_lab_requests_status ON public.lab_production_requests(status);
CREATE INDEX IF NOT EXISTS idx_lab_requests_request_date ON public.lab_production_requests(request_date);
CREATE INDEX IF NOT EXISTS idx_lab_procedures_request ON public.lab_production_procedures(request_id);
CREATE INDEX IF NOT EXISTS idx_lab_procedures_status ON public.lab_production_procedures(status);
CREATE INDEX IF NOT EXISTS idx_lab_results_procedure ON public.lab_production_results(procedure_id);
CREATE INDEX IF NOT EXISTS idx_lab_results_request ON public.lab_production_results(request_id);
CREATE INDEX IF NOT EXISTS idx_lab_labels_procedure ON public.lab_production_labels(procedure_id);
CREATE INDEX IF NOT EXISTS idx_lab_activity_logs_request ON public.lab_request_activity_logs(request_id);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_lab_requests_updated_at ON public.lab_production_requests;
CREATE TRIGGER update_lab_requests_updated_at
  BEFORE UPDATE ON public.lab_production_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_lab_procedures_updated_at ON public.lab_production_procedures;
CREATE TRIGGER update_lab_procedures_updated_at
  BEFORE UPDATE ON public.lab_production_procedures
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_lab_results_updated_at ON public.lab_production_results;
CREATE TRIGGER update_lab_results_updated_at
  BEFORE UPDATE ON public.lab_production_results
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to generate request number
CREATE OR REPLACE FUNCTION generate_request_number()
RETURNS TEXT AS $$
DECLARE
  new_number TEXT;
  v_current_date TEXT;
  sequence_num INTEGER;
BEGIN
  v_current_date := TO_CHAR(NOW(), 'YYYYMMDD');
  
  -- Get the next sequence number for today
  SELECT COALESCE(MAX(CAST(SUBSTRING(request_number FROM 10) AS INTEGER)), 0) + 1
  INTO sequence_num
  FROM public.lab_production_requests
  WHERE request_number LIKE v_current_date || '%';
  
  new_number := v_current_date || LPAD(sequence_num::TEXT, 6, '0');
  
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-generate request number if not provided
CREATE OR REPLACE FUNCTION set_request_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.request_number IS NULL OR NEW.request_number = '' THEN
    NEW.request_number := generate_request_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate request number
DROP TRIGGER IF EXISTS set_request_number_trigger ON public.lab_production_requests;
CREATE TRIGGER set_request_number_trigger
  BEFORE INSERT ON public.lab_production_requests
  FOR EACH ROW
  EXECUTE FUNCTION set_request_number();

-- Enable Row Level Security
ALTER TABLE public.lab_production_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_production_procedures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_production_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_production_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_request_activity_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for lab_production_requests
DROP POLICY IF EXISTS "Laboratories can view their own requests" ON public.lab_production_requests;
CREATE POLICY "Laboratories can view their own requests"
  ON public.lab_production_requests FOR SELECT
  USING (
    auth.uid() = laboratory_id
    OR auth.uid() = patient_id
    OR auth.uid() = requester_id
  );

DROP POLICY IF EXISTS "Laboratories can insert requests" ON public.lab_production_requests;
CREATE POLICY "Laboratories can insert requests"
  ON public.lab_production_requests FOR INSERT
  WITH CHECK (auth.uid() = laboratory_id);

DROP POLICY IF EXISTS "Laboratories can update their own requests" ON public.lab_production_requests;
CREATE POLICY "Laboratories can update their own requests"
  ON public.lab_production_requests FOR UPDATE
  USING (auth.uid() = laboratory_id);

-- RLS Policies for lab_production_procedures
DROP POLICY IF EXISTS "Users can view procedures from their requests" ON public.lab_production_procedures;
CREATE POLICY "Users can view procedures from their requests"
  ON public.lab_production_procedures FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.lab_production_requests
      WHERE lab_production_requests.id = lab_production_procedures.request_id
      AND (
        lab_production_requests.laboratory_id = auth.uid()
        OR lab_production_requests.patient_id = auth.uid()
        OR lab_production_requests.requester_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Laboratories can insert procedures" ON public.lab_production_procedures;
CREATE POLICY "Laboratories can insert procedures"
  ON public.lab_production_procedures FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.lab_production_requests
      WHERE lab_production_requests.id = lab_production_procedures.request_id
      AND lab_production_requests.laboratory_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Laboratories can update procedures" ON public.lab_production_procedures;
CREATE POLICY "Laboratories can update procedures"
  ON public.lab_production_procedures FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.lab_production_requests
      WHERE lab_production_requests.id = lab_production_procedures.request_id
      AND lab_production_requests.laboratory_id = auth.uid()
    )
  );

-- RLS Policies for lab_production_results (similar pattern)
DROP POLICY IF EXISTS "Users can view results from their requests" ON public.lab_production_results;
CREATE POLICY "Users can view results from their requests"
  ON public.lab_production_results FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.lab_production_requests
      WHERE lab_production_requests.id = lab_production_results.request_id
      AND (
        lab_production_requests.laboratory_id = auth.uid()
        OR lab_production_requests.patient_id = auth.uid()
        OR lab_production_requests.requester_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Laboratories can manage results" ON public.lab_production_results;
CREATE POLICY "Laboratories can manage results"
  ON public.lab_production_results FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.lab_production_requests
      WHERE lab_production_requests.id = lab_production_results.request_id
      AND lab_production_requests.laboratory_id = auth.uid()
    )
  );

-- RLS Policies for lab_production_labels
DROP POLICY IF EXISTS "Users can view labels from their procedures" ON public.lab_production_labels;
CREATE POLICY "Users can view labels from their procedures"
  ON public.lab_production_labels FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.lab_production_procedures
      JOIN public.lab_production_requests ON lab_production_requests.id = lab_production_procedures.request_id
      WHERE lab_production_procedures.id = lab_production_labels.procedure_id
      AND (
        lab_production_requests.laboratory_id = auth.uid()
        OR lab_production_requests.patient_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Laboratories can manage labels" ON public.lab_production_labels;
CREATE POLICY "Laboratories can manage labels"
  ON public.lab_production_labels FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.lab_production_procedures
      JOIN public.lab_production_requests ON lab_production_requests.id = lab_production_procedures.request_id
      WHERE lab_production_procedures.id = lab_production_labels.procedure_id
      AND lab_production_requests.laboratory_id = auth.uid()
    )
  );

-- RLS Policies for lab_request_activity_logs
DROP POLICY IF EXISTS "Users can view activity logs from their requests" ON public.lab_request_activity_logs;
CREATE POLICY "Users can view activity logs from their requests"
  ON public.lab_request_activity_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.lab_production_requests
      WHERE lab_production_requests.id = lab_request_activity_logs.request_id
      AND (
        lab_production_requests.laboratory_id = auth.uid()
        OR lab_production_requests.patient_id = auth.uid()
        OR lab_production_requests.requester_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Laboratories can create activity logs" ON public.lab_request_activity_logs;
CREATE POLICY "Laboratories can create activity logs"
  ON public.lab_request_activity_logs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.lab_production_requests
      WHERE lab_production_requests.id = lab_request_activity_logs.request_id
      AND lab_production_requests.laboratory_id = auth.uid()
    )
  );

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON public.lab_production_requests TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.lab_production_procedures TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lab_production_results TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.lab_production_labels TO authenticated;
GRANT SELECT, INSERT ON public.lab_request_activity_logs TO authenticated;
