-- Drop existing tables if they exist
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS contacts CASCADE;
DROP TABLE IF EXISTS medications CASCADE;
DROP TABLE IF EXISTS allergies CASCADE;
DROP TABLE IF EXISTS conditions CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users Table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  is_verified BOOLEAN DEFAULT FALSE,
  otp_code VARCHAR(6) DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Profiles Table (Basic Info)
CREATE TABLE profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  email VARCHAR(255) DEFAULT '',
  phone VARCHAR(50) DEFAULT '',
  name VARCHAR(255) DEFAULT '',
  age VARCHAR(10) DEFAULT '',
  gender VARCHAR(50) DEFAULT '',
  blood_group VARCHAR(50) DEFAULT '',
  height VARCHAR(50) DEFAULT '',
  weight VARCHAR(50) DEFAULT '',
  photo TEXT DEFAULT '',
  date_of_birth VARCHAR(100) DEFAULT '',
  mobile_number VARCHAR(100) DEFAULT '',
  qr_id VARCHAR(255) UNIQUE DEFAULT NULL,
  privacy_settings JSONB DEFAULT '{"showVitals": true, "showConditions": true, "showAllergies": true, "showMedications": true, "showContacts": true}'::jsonb,
  notifications JSONB DEFAULT '[]'::jsonb,
  onboarding_complete BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Conditions Table
CREATE TABLE conditions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  email VARCHAR(255) DEFAULT '',
  name VARCHAR(255) NOT NULL,
  severity VARCHAR(100) DEFAULT '',
  notes TEXT DEFAULT ''
);

-- Allergies Table
CREATE TABLE allergies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  email VARCHAR(255) DEFAULT '',
  name VARCHAR(255) NOT NULL,
  severity VARCHAR(100) DEFAULT '',
  notes TEXT DEFAULT ''
);

-- Medications Table
CREATE TABLE medications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  email VARCHAR(255) DEFAULT '',
  name VARCHAR(255) NOT NULL,
  dosage VARCHAR(255) DEFAULT '',
  frequency VARCHAR(255) DEFAULT '',
  purpose TEXT DEFAULT ''
);

-- Emergency Contacts Table
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  email VARCHAR(255) DEFAULT '',
  name VARCHAR(255) NOT NULL,
  relationship VARCHAR(255) DEFAULT '',
  phone VARCHAR(100) DEFAULT ''
);

-- Medical Documents Table
CREATE TABLE documents (
  id VARCHAR(255) PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  email VARCHAR(255) DEFAULT '',
  name VARCHAR(255) NOT NULL,
  date VARCHAR(100) DEFAULT '',
  size VARCHAR(100) DEFAULT '',
  category VARCHAR(100) DEFAULT '',
  url TEXT DEFAULT ''
);
