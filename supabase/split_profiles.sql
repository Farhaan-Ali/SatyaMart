-- Create supplier_profiles table
create table if not exists supplier_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) unique not null,
  full_name text,
  business_name text,
  business_type text,
  business_address text,
  contact_number text,
  fssai_license text,
  other_certifications text[],
  avatar_url text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create vendor_profiles table
create table if not exists vendor_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) unique not null,
  full_name text,
  company_name text,
  contact_number text,
  avatar_url text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
); 