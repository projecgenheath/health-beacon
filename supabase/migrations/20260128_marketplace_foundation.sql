-- ============================================================================
-- Health Beacon Marketplace Foundation Migration
-- ============================================================================
-- This migration transforms Health Beacon into a two-sided marketplace
-- connecting patients and laboratories.
--
-- Changes:
-- 1. Add user_type to profiles (patient/laboratory)
-- 2. Add geolocation fields for distance calculations
-- 3. Add laboratory-specific fields to profiles
-- 4. Create exam_requests table
-- 5. Create quotations table
-- 6. Create collection_appointments table
-- 7. Set up RLS policies for marketplace features
-- ============================================================================

-- ============================================================================
-- 1. Extend profiles table for marketplace
-- ============================================================================

-- Add user type enum
DO $$ BEGIN
  CREATE TYPE user_type AS ENUM ('patient', 'laboratory');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add new columns to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS user_type user_type DEFAULT 'patient',
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8),
-- Laboratory-specific fields
ADD COLUMN IF NOT EXISTS laboratory_name TEXT,
ADD COLUMN IF NOT EXISTS cnpj TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS operating_hours JSONB,
ADD COLUMN IF NOT EXISTS services_offered TEXT[],
ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_reviews INTEGER DEFAULT 0;

-- Create index for geolocation queries
CREATE INDEX IF NOT EXISTS idx_profiles_location ON public.profiles(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_profiles_user_type ON public.profiles(user_type);
CREATE INDEX IF NOT EXISTS idx_profiles_cnpj ON public.profiles(cnpj) WHERE cnpj IS NOT NULL;

-- Update existing users to be patients
UPDATE public.profiles SET user_type = 'patient' WHERE user_type IS NULL;

-- ============================================================================
-- 2. Create exam_requests table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.exam_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  exam_types TEXT[] NOT NULL,
  description TEXT,
  urgency_level TEXT CHECK (urgency_level IN ('normal', 'urgent', 'emergency')) DEFAULT 'normal',
  preferred_date DATE,
  status TEXT CHECK (status IN ('pending', 'quoted', 'accepted', 'cancelled')) DEFAULT 'pending',
  selected_quotation_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for exam_requests
CREATE INDEX IF NOT EXISTS idx_exam_requests_patient ON public.exam_requests(patient_id);
CREATE INDEX IF NOT EXISTS idx_exam_requests_status ON public.exam_requests(status);
CREATE INDEX IF NOT EXISTS idx_exam_requests_created ON public.exam_requests(created_at DESC);

-- ============================================================================
-- 3. Create quotations table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.quotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_request_id UUID NOT NULL REFERENCES public.exam_requests(id) ON DELETE CASCADE,
  laboratory_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  total_price DECIMAL(10, 2) NOT NULL,
  items JSONB NOT NULL, -- Array of {exam_name: string, price: number, preparation_required: string}
  estimated_delivery_days INTEGER,
  notes TEXT,
  valid_until DATE NOT NULL,
  status TEXT CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')) DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for quotations
CREATE INDEX IF NOT EXISTS idx_quotations_request ON public.quotations(exam_request_id);
CREATE INDEX IF NOT EXISTS idx_quotations_laboratory ON public.quotations(laboratory_id);
CREATE INDEX IF NOT EXISTS idx_quotations_status ON public.quotations(status);
CREATE INDEX IF NOT EXISTS idx_quotations_valid_until ON public.quotations(valid_until);

-- ============================================================================
-- 4. Create collection_appointments table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.collection_appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id UUID NOT NULL REFERENCES public.quotations(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  laboratory_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  scheduled_date DATE NOT NULL,
  scheduled_time TIME NOT NULL,
  collection_type TEXT CHECK (collection_type IN ('in_lab', 'home')) DEFAULT 'in_lab',
  home_address TEXT,
  status TEXT CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled')) DEFAULT 'scheduled',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for collection_appointments
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON public.collection_appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_laboratory ON public.collection_appointments(laboratory_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON public.collection_appointments(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.collection_appointments(status);

-- ============================================================================
-- 5. Enable Row Level Security
-- ============================================================================

ALTER TABLE public.exam_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_appointments ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 6. RLS Policies - Exam Requests
-- ============================================================================

-- Patients can view their own exam requests
CREATE POLICY "Patients can view own exam requests" ON public.exam_requests
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM public.profiles WHERE id = exam_requests.patient_id
    )
  );

-- Patients can create their own exam requests
CREATE POLICY "Patients can create exam requests" ON public.exam_requests
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM public.profiles WHERE id = exam_requests.patient_id AND user_type = 'patient'
    )
  );

-- Patients can update their own exam requests
CREATE POLICY "Patients can update own exam requests" ON public.exam_requests
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT user_id FROM public.profiles WHERE id = exam_requests.patient_id
    )
  );

-- Laboratories can view pending exam requests (for quoting purposes)
CREATE POLICY "Laboratories can view pending exam requests" ON public.exam_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() 
      AND user_type = 'laboratory'
    )
  );

-- ============================================================================
-- 7. RLS Policies - Quotations
-- ============================================================================

-- Patients can view quotations for their exam requests
CREATE POLICY "Patients can view quotations for their requests" ON public.quotations
  FOR SELECT USING (
    exam_request_id IN (
      SELECT id FROM public.exam_requests WHERE patient_id IN (
        SELECT id FROM public.profiles WHERE user_id = auth.uid()
      )
    )
  );

-- Laboratories can create quotations
CREATE POLICY "Laboratories can create quotations" ON public.quotations
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM public.profiles WHERE id = quotations.laboratory_id AND user_type = 'laboratory'
    )
  );

-- Laboratories can view their own quotations
CREATE POLICY "Laboratories can view own quotations" ON public.quotations
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM public.profiles WHERE id = quotations.laboratory_id
    )
  );

-- Laboratories can update their own quotations
CREATE POLICY "Laboratories can update own quotations" ON public.quotations
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT user_id FROM public.profiles WHERE id = quotations.laboratory_id
    )
  );

-- ============================================================================
-- 8. RLS Policies - Collection Appointments
-- ============================================================================

-- Patients can view their own appointments
CREATE POLICY "Patients can view own appointments" ON public.collection_appointments
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM public.profiles WHERE id = collection_appointments.patient_id
    )
  );

-- Patients can create appointments
CREATE POLICY "Patients can create appointments" ON public.collection_appointments
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM public.profiles WHERE id = collection_appointments.patient_id
    )
  );

-- Patients can update their own appointments
CREATE POLICY "Patients can update own appointments" ON public.collection_appointments
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT user_id FROM public.profiles WHERE id = collection_appointments.patient_id
    )
  );

-- Laboratories can view their appointments
CREATE POLICY "Laboratories can view appointments" ON public.collection_appointments
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM public.profiles WHERE id = collection_appointments.laboratory_id
    )
  );

-- Laboratories can update appointment status
CREATE POLICY "Laboratories can update appointments" ON public.collection_appointments
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT user_id FROM public.profiles WHERE id = collection_appointments.laboratory_id
    )
  );

-- ============================================================================
-- 9. Triggers for updated_at
-- ============================================================================

CREATE TRIGGER update_exam_requests_updated_at
  BEFORE UPDATE ON public.exam_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_quotations_updated_at
  BEFORE UPDATE ON public.quotations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON public.collection_appointments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- 10. Helper function to calculate distance (Haversine formula)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.calculate_distance(
  lat1 DECIMAL,
  lon1 DECIMAL,
  lat2 DECIMAL,
  lon2 DECIMAL
)
RETURNS DECIMAL
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  earth_radius CONSTANT DECIMAL := 6371; -- km
  dlat DECIMAL;
  dlon DECIMAL;
  a DECIMAL;
  c DECIMAL;
BEGIN
  -- Haversine formula
  dlat := radians(lat2 - lat1);
  dlon := radians(lon2 - lon1);
  
  a := sin(dlat/2) * sin(dlat/2) + 
       cos(radians(lat1)) * cos(radians(lat2)) * 
       sin(dlon/2) * sin(dlon/2);
  
  c := 2 * atan2(sqrt(a), sqrt(1-a));
  
  RETURN earth_radius * c;
END;
$$;

-- ============================================================================
-- 11. Function to get nearby laboratories
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_nearby_laboratories(
  patient_lat DECIMAL,
  patient_lon DECIMAL,
  max_distance_km DECIMAL DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  laboratory_name TEXT,
  distance_km DECIMAL,
  average_rating DECIMAL,
  total_reviews INTEGER,
  services_offered TEXT[]
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.laboratory_name,
    public.calculate_distance(patient_lat, patient_lon, p.latitude, p.longitude) as distance_km,
    p.average_rating,
    p.total_reviews,
    p.services_offered
  FROM public.profiles p
  WHERE 
    p.user_type = 'laboratory'
    AND p.latitude IS NOT NULL
    AND p.longitude IS NOT NULL
    AND public.calculate_distance(patient_lat, patient_lon, p.latitude, p.longitude) <= max_distance_km
  ORDER BY distance_km ASC;
END;
$$;

-- ============================================================================
-- 12. Create notifications table (if not exists)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON public.notifications(created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

-- Users can update their own notifications
CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================================
-- End of migration
-- ============================================================================
