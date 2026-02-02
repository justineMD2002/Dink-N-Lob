-- Pickleball Booking System Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables and types (if running this again)
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS courts CASCADE;
DROP TABLE IF EXISTS admin_users CASCADE;
DROP TABLE IF EXISTS settings CASCADE;
DROP TYPE IF EXISTS booking_status CASCADE;
DROP TYPE IF EXISTS payment_method CASCADE;
DROP TYPE IF EXISTS payment_status CASCADE;

-- Create ENUM types
CREATE TYPE booking_status AS ENUM ('PENDING_VERIFICATION', 'CONFIRMED', 'CANCELLED', 'COMPLETED');
CREATE TYPE payment_method AS ENUM ('MAYA', 'GCASH');
CREATE TYPE payment_status AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');

-- Admin users table (links to Supabase auth.users)
-- Supabase Auth handles authentication, this table stores additional admin data
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Courts table
CREATE TABLE courts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bookings table (stores customer info directly, no user account needed)
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_number VARCHAR(50) UNIQUE NOT NULL, -- e.g., "PB-2024-0001"

  -- Customer information (no account needed)
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(50) NOT NULL,

  -- Booking details
  court_id UUID NOT NULL REFERENCES courts(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time VARCHAR(5) NOT NULL, -- Format: "HH:mm"
  end_time VARCHAR(5) NOT NULL,   -- Format: "HH:mm"
  duration INTEGER NOT NULL,      -- Duration in minutes
  status booking_status DEFAULT 'PENDING_VERIFICATION',
  total_amount DECIMAL(10, 2) NOT NULL,
  notes TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payments table
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID UNIQUE NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  payment_method payment_method NOT NULL,
  reference_code VARCHAR(255) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  status payment_status DEFAULT 'PENDING',
  verified_at TIMESTAMP WITH TIME ZONE,
  verified_by UUID, -- Admin user ID who verified
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Settings table
CREATE TABLE settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key VARCHAR(255) UNIQUE NOT NULL,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_bookings_date_court ON bookings(date, court_id);
CREATE INDEX idx_bookings_customer_email ON bookings(customer_email);
CREATE INDEX idx_bookings_booking_number ON bookings(booking_number);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_created ON payments(created_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to generate booking number
CREATE OR REPLACE FUNCTION generate_booking_number()
RETURNS TRIGGER AS $$
DECLARE
  year_part VARCHAR(4);
  sequence_num INTEGER;
  new_booking_number VARCHAR(50);
BEGIN
  year_part := TO_CHAR(CURRENT_DATE, 'YYYY');

  -- Get the count of bookings for this year
  SELECT COUNT(*) + 1 INTO sequence_num
  FROM bookings
  WHERE booking_number LIKE 'PB-' || year_part || '-%';

  -- Format: PB-2024-0001
  new_booking_number := 'PB-' || year_part || '-' || LPAD(sequence_num::TEXT, 4, '0');

  NEW.booking_number := new_booking_number;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers to auto-update updated_at
CREATE TRIGGER update_admin_users_updated_at BEFORE UPDATE ON admin_users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_courts_updated_at BEFORE UPDATE ON courts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger to auto-generate booking number
CREATE TRIGGER generate_booking_number_trigger BEFORE INSERT ON bookings
  FOR EACH ROW EXECUTE FUNCTION generate_booking_number();

-- Note: To create an admin user:
-- 1. Go to Supabase Dashboard > Authentication > Users
-- 2. Click "Add User" and create a user with email/password
-- 3. Copy the user's UUID
-- 4. Run: INSERT INTO admin_users (user_id, name) VALUES ('uuid-here', 'Admin Name');

-- Insert sample courts
INSERT INTO courts (name, description, is_active) VALUES
  ('Court 1', 'Main court with professional lighting', TRUE),
  ('Court 2', 'Secondary court, outdoor setup', TRUE);

-- Insert default settings
INSERT INTO settings (key, value, description) VALUES
  ('court_rate_per_hour', '500', 'Default hourly rate for court booking in PHP'),
  ('booking_advance_days', '30', 'Maximum days in advance for booking'),
  ('operating_hours_start', '06:00', 'Daily operating hours start time'),
  ('operating_hours_end', '22:00', 'Daily operating hours end time');
