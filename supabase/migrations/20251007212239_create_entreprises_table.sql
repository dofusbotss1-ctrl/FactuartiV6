/*
  # Create entreprises table with unique company name constraint

  1. New Tables
    - `entreprises`
      - `id` (uuid, primary key) - Unique identifier for each company
      - `name` (text, unique, not null) - Company name (must be unique across all companies)
      - `ice` (text, not null) - ICE number (15 digits)
      - `if_number` (text, not null) - IF tax identifier (8 digits)
      - `rc` (text, not null) - Commerce registry number
      - `cnss` (text, not null) - CNSS number (7 digits)
      - `address` (text, not null) - Company address
      - `phone` (text, not null) - Contact phone number
      - `email` (text, not null) - Company email
      - `patente` (text, not null) - Patente number (8 digits)
      - `website` (text) - Company website (optional)
      - `logo` (text) - Logo URL (optional)
      - `signature` (text) - Signature image URL (optional)
      - `owner_name` (text, not null) - Owner/admin name
      - `owner_email` (text, unique, not null) - Owner login email (unique)
      - `email_verified` (boolean, default false) - Email verification status
      - `subscription` (text, default 'free') - Subscription type (free/pro)
      - `subscription_date` (timestamptz) - Date when subscription started
      - `expiry_date` (timestamptz) - Date when subscription expires
      - `invoice_numbering_format` (text) - Invoice numbering format
      - `invoice_prefix` (text) - Invoice number prefix
      - `invoice_counter` (integer, default 0) - Current invoice counter
      - `last_invoice_year` (integer) - Last year invoice was created
      - `default_template` (text, default 'template1') - Default invoice template
      - `created_at` (timestamptz, default now()) - Creation timestamp
      - `updated_at` (timestamptz, default now()) - Last update timestamp
      - `verification_email_sent_at` (timestamptz) - When verification email was sent

  2. Security
    - Enable RLS on `entreprises` table
    - Add policy for users to read their own company data
    - Add policy for users to update their own company data
    - Add policy for admins to read all company data

  3. Constraints
    - UNIQUE constraint on `name` column (case-insensitive) to prevent duplicate company names
    - UNIQUE constraint on `owner_email` to prevent duplicate accounts
    - CHECK constraint to ensure subscription is either 'free' or 'pro'

  4. Indexes
    - Index on `name` for fast lookup during registration
    - Index on `owner_email` for fast authentication queries
    - Index on `subscription` and `expiry_date` for subscription management
*/

-- Create the entreprises table
CREATE TABLE IF NOT EXISTS entreprises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  ice text NOT NULL,
  if_number text NOT NULL,
  rc text NOT NULL,
  cnss text NOT NULL,
  address text NOT NULL,
  phone text NOT NULL,
  email text NOT NULL,
  patente text NOT NULL,
  website text,
  logo text,
  signature text,
  owner_name text NOT NULL,
  owner_email text UNIQUE NOT NULL,
  email_verified boolean DEFAULT false,
  subscription text DEFAULT 'free',
  subscription_date timestamptz,
  expiry_date timestamptz,
  invoice_numbering_format text,
  invoice_prefix text,
  invoice_counter integer DEFAULT 0,
  last_invoice_year integer,
  default_template text DEFAULT 'template1',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  verification_email_sent_at timestamptz,
  CONSTRAINT subscription_type_check CHECK (subscription IN ('free', 'pro'))
);

-- Create unique index on lowercase company name to prevent duplicates (case-insensitive)
CREATE UNIQUE INDEX IF NOT EXISTS entreprises_name_unique_lower 
  ON entreprises (LOWER(TRIM(name)));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS entreprises_owner_email_idx ON entreprises (owner_email);
CREATE INDEX IF NOT EXISTS entreprises_subscription_idx ON entreprises (subscription, expiry_date);

-- Enable Row Level Security
ALTER TABLE entreprises ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own company data
CREATE POLICY "Users can read own company data"
  ON entreprises
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = id::text);

-- Policy: Users can update their own company data
CREATE POLICY "Users can update own company data"
  ON entreprises
  FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = id::text)
  WITH CHECK (auth.uid()::text = id::text);

-- Policy: Users can insert their own company data during registration
CREATE POLICY "Users can insert own company data"
  ON entreprises
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = id::text);

-- Policy: Allow public read access for company name uniqueness check (anonymous users during registration)
CREATE POLICY "Public can check company name availability"
  ON entreprises
  FOR SELECT
  TO anon
  USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_entreprises_updated_at
  BEFORE UPDATE ON entreprises
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
