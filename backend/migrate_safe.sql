-- Create extension if it doesn't exist
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create new tables if they don't exist
CREATE TABLE IF NOT EXISTS conditions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  severity VARCHAR(100) DEFAULT '',
  notes TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS allergies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  severity VARCHAR(100) DEFAULT '',
  notes TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS medications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  dosage VARCHAR(255) DEFAULT '',
  frequency VARCHAR(255) DEFAULT '',
  purpose TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  relationship VARCHAR(255) DEFAULT '',
  phone VARCHAR(100) DEFAULT ''
);

CREATE TABLE IF NOT EXISTS documents (
  id VARCHAR(255) PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  date VARCHAR(100) DEFAULT '',
  size VARCHAR(100) DEFAULT '',
  category VARCHAR(100) DEFAULT '',
  url TEXT DEFAULT ''
);

-- 2. Non-destructively add new columns to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS name VARCHAR(255) DEFAULT '';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS age VARCHAR(10) DEFAULT '';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gender VARCHAR(50) DEFAULT '';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS blood_group VARCHAR(50) DEFAULT '';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS height VARCHAR(50) DEFAULT '';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS weight VARCHAR(50) DEFAULT '';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS photo TEXT DEFAULT '';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS date_of_birth VARCHAR(100) DEFAULT '';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS mobile_number VARCHAR(100) DEFAULT '';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS qr_id VARCHAR(255) UNIQUE DEFAULT NULL;

-- 3. Copy existing data from patient_record JSONB to columns
UPDATE profiles
SET 
  name = COALESCE(patient_record->>'name', name, ''),
  age = COALESCE(patient_record->>'age', age, ''),
  gender = COALESCE(patient_record->>'gender', gender, ''),
  blood_group = COALESCE(patient_record->>'bloodGroup', blood_group, ''),
  height = COALESCE(patient_record->>'height', height, ''),
  weight = COALESCE(patient_record->>'weight', weight, ''),
  photo = COALESCE(patient_record->>'photo', photo, ''),
  date_of_birth = COALESCE(patient_record->>'dateOfBirth', date_of_birth, ''),
  mobile_number = COALESCE(patient_record->>'mobileNumber', mobile_number, ''),
  qr_id = COALESCE(patient_record->>'qrId', qr_id, 'mqr-' || SUBSTRING(user_id::text FROM 1 FOR 8));

-- 4. Extract and migrate conditions from patient_record JSONB
INSERT INTO conditions (user_id, name, severity, notes)
SELECT 
  user_id, 
  elem->>'name', 
  COALESCE(elem->>'severity', ''), 
  COALESCE(elem->>'notes', '')
FROM profiles, jsonb_array_elements(patient_record->'conditions') AS elem
WHERE jsonb_typeof(patient_record) = 'object' AND patient_record ? 'conditions' AND jsonb_typeof(patient_record->'conditions') = 'array'
ON CONFLICT DO NOTHING;

-- 5. Extract and migrate allergies from patient_record JSONB
INSERT INTO allergies (user_id, name, severity, notes)
SELECT 
  user_id, 
  elem->>'name', 
  COALESCE(elem->>'severity', ''), 
  COALESCE(elem->>'notes', '')
FROM profiles, jsonb_array_elements(patient_record->'allergies') AS elem
WHERE jsonb_typeof(patient_record) = 'object' AND patient_record ? 'allergies' AND jsonb_typeof(patient_record->'allergies') = 'array'
ON CONFLICT DO NOTHING;

-- 6. Extract and migrate medications from patient_record JSONB
INSERT INTO medications (user_id, name, dosage, frequency, purpose)
SELECT 
  user_id, 
  elem->>'name', 
  COALESCE(elem->>'dosage', ''), 
  COALESCE(elem->>'frequency', ''), 
  COALESCE(elem->>'purpose', '')
FROM profiles, jsonb_array_elements(patient_record->'medications') AS elem
WHERE jsonb_typeof(patient_record) = 'object' AND patient_record ? 'medications' AND jsonb_typeof(patient_record->'medications') = 'array'
ON CONFLICT DO NOTHING;

-- 7. Extract and migrate contacts from patient_record JSONB
INSERT INTO contacts (user_id, name, relationship, phone)
SELECT 
  user_id, 
  elem->>'name', 
  COALESCE(elem->>'relationship', ''), 
  COALESCE(elem->>'phone', '')
FROM profiles, jsonb_array_elements(patient_record->'contacts') AS elem
WHERE jsonb_typeof(patient_record) = 'object' AND patient_record ? 'contacts' AND jsonb_typeof(patient_record->'contacts') = 'array'
ON CONFLICT DO NOTHING;

-- 8. Extract and migrate documents from patient_record JSONB
INSERT INTO documents (id, user_id, name, date, size, category, url)
SELECT 
  elem->>'id',
  user_id, 
  elem->>'name', 
  COALESCE(elem->>'date', ''), 
  COALESCE(elem->>'size', ''), 
  COALESCE(elem->>'category', ''), 
  COALESCE(elem->>'url', '')
FROM profiles, jsonb_array_elements(patient_record->'documents') AS elem
WHERE jsonb_typeof(patient_record) = 'object' AND patient_record ? 'documents' AND jsonb_typeof(patient_record->'documents') = 'array'
ON CONFLICT DO NOTHING;
