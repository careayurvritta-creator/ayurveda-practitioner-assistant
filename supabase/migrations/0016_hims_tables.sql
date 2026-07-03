-- Migration 0016: Create HIMS tables for AyurScribe
-- hims_patients, hims_visits, hims_invoices, hims_medicines, hims_dispensing,
-- hims_appointments, hims_doctor_schedules, user_profiles

-- ============================================
-- user_profiles (role-based access)
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'doctor' CHECK (role IN ('admin','doctor','therapist','nurse','receptionist','pharmacist')),
  full_name TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON public.user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.user_profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "System can insert profiles on signup"
  ON public.user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================
-- hims_patients
-- ============================================
CREATE TABLE IF NOT EXISTS public.hims_patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mrn TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  age INT NOT NULL CHECK (age >= 0 AND age <= 150),
  gender TEXT NOT NULL CHECK (gender IN ('Male','Female','Other')),
  phone TEXT NOT NULL,
  email TEXT,
  address TEXT,
  blood_group TEXT,
  emergency_contact TEXT,
  occupation TEXT,
  referred_by TEXT,
  -- Ayurvedic intake
  prakriti TEXT,
  vikriti TEXT,
  agni TEXT,
  koshta TEXT,
  sara TEXT,
  samhanana TEXT,
  pramana JSONB,
  satmya TEXT,
  sattva TEXT,
  ahara_shakti TEXT,
  vyayama_shakti TEXT,
  vaya TEXT,
  -- Clinical
  allergies TEXT,
  past_history TEXT,
  family_history TEXT,
  -- Metadata
  owner_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.hims_patients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage patients"
  ON public.hims_patients FOR ALL
  USING (auth.role() = 'authenticated');

CREATE INDEX idx_hims_patients_mrn ON public.hims_patients(mrn);
CREATE INDEX idx_hims_patients_phone ON public.hims_patients(phone);
CREATE INDEX idx_hims_patients_name ON public.hims_patients USING gin(name gin_trgm_ops);
CREATE INDEX idx_hims_patients_owner ON public.hims_patients(owner_id);

-- ============================================
-- hims_visits
-- ============================================
CREATE TABLE IF NOT EXISTS public.hims_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uhid TEXT NOT NULL,
  visit_id TEXT UNIQUE NOT NULL,
  patient_id UUID REFERENCES hims_patients(id) ON DELETE CASCADE,
  patient_name TEXT NOT NULL,
  doctor_name TEXT NOT NULL,
  visit_date TIMESTAMPTZ NOT NULL,
  chief_complaint TEXT NOT NULL,
  diagnosis TEXT,
  prescription JSONB DEFAULT '[]',
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting','in-progress','completed','cancelled')),
  consultation_fee NUMERIC DEFAULT 500,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  chamber TEXT,
  appointment_id UUID,
  owner_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.hims_visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage visits"
  ON public.hims_visits FOR ALL
  USING (auth.role() = 'authenticated');

CREATE INDEX idx_hims_visits_patient ON public.hims_visits(patient_id);
CREATE INDEX idx_hims_visits_date ON public.hims_visits(visit_date);
CREATE INDEX idx_hims_visits_doctor ON public.hims_visits(doctor_name);
CREATE INDEX idx_hims_visits_status ON public.hims_visits(status);
CREATE INDEX idx_hims_visits_uhid ON public.hims_visits(uhid);

-- ============================================
-- hims_invoices
-- ============================================
CREATE TABLE IF NOT EXISTS public.hims_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT UNIQUE NOT NULL,
  patient_id UUID REFERENCES hims_patients(id) ON DELETE CASCADE,
  patient_name TEXT NOT NULL,
  visit_id TEXT,
  items JSONB DEFAULT '[]',
  subtotal NUMERIC NOT NULL DEFAULT 0,
  discount NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  payment_method TEXT DEFAULT 'cash' CHECK (payment_method IN ('cash','card','upi','insurance')),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('paid','pending','partial')),
  paid_amount NUMERIC NOT NULL DEFAULT 0,
  payment_reference TEXT,
  owner_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.hims_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage invoices"
  ON public.hims_invoices FOR ALL
  USING (auth.role() = 'authenticated');

CREATE INDEX idx_hims_invoices_patient ON public.hims_invoices(patient_id);
CREATE INDEX idx_hims_invoices_status ON public.hims_invoices(payment_status);
CREATE INDEX idx_hims_invoices_date ON public.hims_invoices(created_at);

-- ============================================
-- hims_medicines
-- ============================================
CREATE TABLE IF NOT EXISTS public.hims_medicines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Ayurvedic','Allopathic','Siddha')),
  manufacturer TEXT,
  batch_number TEXT,
  expiry_date DATE,
  quantity INT NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'tablets',
  price NUMERIC NOT NULL DEFAULT 0,
  cost_price NUMERIC,
  reorder_level INT NOT NULL DEFAULT 10,
  owner_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.hims_medicines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage medicines"
  ON public.hims_medicines FOR ALL
  USING (auth.role() = 'authenticated');

CREATE INDEX idx_hims_medicines_name ON public.hims_medicines(name);
CREATE INDEX idx_hims_medicines_category ON public.hims_medicines(category);
CREATE INDEX idx_hims_medicines_stock ON public.hims_medicines(quantity, reorder_level);

-- ============================================
-- hims_dispensing
-- ============================================
CREATE TABLE IF NOT EXISTS public.hims_dispensing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES hims_patients(id) ON DELETE CASCADE,
  patient_name TEXT NOT NULL,
  visit_id TEXT NOT NULL,
  medicine_id UUID REFERENCES hims_medicines(id),
  medicine_name TEXT NOT NULL,
  quantity_dispensed INT NOT NULL,
  unit TEXT NOT NULL,
  dispensed_by TEXT,
  dispensed_at TIMESTAMPTZ DEFAULT now(),
  owner_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.hims_dispensing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage dispensing"
  ON public.hims_dispensing FOR ALL
  USING (auth.role() = 'authenticated');

CREATE INDEX idx_hims_dispensing_patient ON public.hims_dispensing(patient_id);
CREATE INDEX idx_hims_dispensing_visit ON public.hims_dispensing(visit_id);

-- ============================================
-- hims_appointments
-- ============================================
CREATE TABLE IF NOT EXISTS public.hims_appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES hims_patients(id) ON DELETE CASCADE,
  patient_name TEXT NOT NULL,
  uhid TEXT NOT NULL,
  doctor_name TEXT NOT NULL DEFAULT 'Dr. Jinendradutt Sharma',
  appointment_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  duration INT NOT NULL DEFAULT 30,
  type TEXT NOT NULL CHECK (type IN ('consultation','follow-up','therapy','panchakarma','emergency','walk-in')),
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','confirmed','checked-in','completed','cancelled','no-show')),
  reason TEXT,
  notes TEXT,
  chamber TEXT,
  visit_id UUID,
  owner_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.hims_appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage appointments"
  ON public.hims_appointments FOR ALL
  USING (auth.role() = 'authenticated');

CREATE INDEX idx_hims_appointments_date ON public.hims_appointments(appointment_date);
CREATE INDEX idx_hims_appointments_doctor ON public.hims_appointments(doctor_name, appointment_date);
CREATE INDEX idx_hims_appointments_patient ON public.hims_appointments(patient_id);
CREATE INDEX idx_hims_appointments_status ON public.hims_appointments(status);
CREATE INDEX idx_hims_appointments_uhid ON public.hims_appointments(uhid);

-- ============================================
-- hims_doctor_schedules
-- ============================================
CREATE TABLE IF NOT EXISTS public.hims_doctor_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_name TEXT NOT NULL,
  day_of_week INT NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  slot_duration INT NOT NULL DEFAULT 30,
  max_patients INT NOT NULL DEFAULT 18,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.hims_doctor_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view schedules"
  ON public.hims_doctor_schedules FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admin can manage schedules"
  ON public.hims_doctor_schedules FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE INDEX idx_hims_doctor_schedules_doctor ON public.hims_doctor_schedules(doctor_name, day_of_week);

-- ============================================
-- Insert default doctor schedule for Dr. Jinendradutt Sharma
-- Monday-Saturday, 10:00 AM - 7:00 PM, 30-min slots
-- ============================================
INSERT INTO public.hims_doctor_schedules (doctor_name, day_of_week, start_time, end_time, slot_duration, max_patients, is_active)
VALUES
  ('Dr. Jinendradutt Sharma', 1, '10:00', '19:00', 30, 18, true),
  ('Dr. Jinendradutt Sharma', 2, '10:00', '19:00', 30, 18, true),
  ('Dr. Jinendradutt Sharma', 3, '10:00', '19:00', 30, 18, true),
  ('Dr. Jinendradutt Sharma', 4, '10:00', '19:00', 30, 18, true),
  ('Dr. Jinendradutt Sharma', 5, '10:00', '19:00', 30, 18, true),
  ('Dr. Jinendradutt Sharma', 6, '10:00', '19:00', 30, 18, true),
  ('Dr. Jinendradutt Sharma', 0, '10:00', '19:00', 30, 18, true)
ON CONFLICT DO NOTHING;

-- ============================================
-- Grant permissions for authenticated users
-- ============================================
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
