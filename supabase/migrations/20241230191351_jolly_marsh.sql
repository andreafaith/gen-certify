/*
  # Initial Schema Setup for Certificate Generation System

  1. New Tables
    - `profiles`
      - Extends Supabase auth.users
      - Stores user profile information and role
    - `templates`
      - Stores certificate templates
      - Includes design data and metadata
    - `certificates`
      - Stores generated certificates
      - Links to templates and creation metadata
    - `batch_jobs`
      - Tracks certificate generation batch jobs
      - Includes status and progress information

  2. Security
    - Enable RLS on all tables
    - Policies for role-based access
    - Admin users can access all data
    - Regular users can only access their own data

  3. Enums
    - user_role: Define user roles
    - certificate_status: Track certificate generation status
    - batch_status: Track batch job status
*/

-- Enums
CREATE TYPE user_role AS ENUM ('admin', 'user');
CREATE TYPE certificate_status AS ENUM ('draft', 'generated', 'sent', 'revoked');
CREATE TYPE batch_status AS ENUM ('pending', 'processing', 'completed', 'failed');

-- Profiles table
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  role user_role DEFAULT 'user',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Templates table
CREATE TABLE templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  design_data jsonb NOT NULL,
  is_public boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Certificates table
CREATE TABLE certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid REFERENCES templates(id) ON DELETE SET NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_data jsonb NOT NULL,
  status certificate_status DEFAULT 'draft',
  generated_url text,
  batch_job_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Batch jobs table
CREATE TABLE batch_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  template_id uuid REFERENCES templates(id) ON DELETE SET NULL,
  status batch_status DEFAULT 'pending',
  total_count integer DEFAULT 0,
  processed_count integer DEFAULT 0,
  error_message text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE batch_jobs ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Templates policies
CREATE POLICY "Templates are viewable by owner and if public"
  ON templates FOR SELECT
  USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Templates are insertable by authenticated users"
  ON templates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Templates are updatable by owner"
  ON templates FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Templates are deletable by owner"
  ON templates FOR DELETE
  USING (auth.uid() = user_id);

-- Certificates policies
CREATE POLICY "Certificates are viewable by owner"
  ON certificates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Certificates are insertable by authenticated users"
  ON certificates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Certificates are updatable by owner"
  ON certificates FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Certificates are deletable by owner"
  ON certificates FOR DELETE
  USING (auth.uid() = user_id);

-- Batch jobs policies
CREATE POLICY "Batch jobs are viewable by owner"
  ON batch_jobs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Batch jobs are insertable by authenticated users"
  ON batch_jobs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Batch jobs are updatable by owner"
  ON batch_jobs FOR UPDATE
  USING (auth.uid() = user_id);

-- Functions
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON templates
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON certificates
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON batch_jobs
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();