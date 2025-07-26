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

-- Create suppliers table (for backward compatibility and supplier management)
create table if not exists suppliers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) unique not null,
  name text not null,
  contact_email text,
  contact_phone text,
  address text,
  logo_url text,
  website text,
  status text default 'active',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create products table
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  unit_price decimal(10,2),
  stock_quantity integer default 0,
  min_stock_level integer default 10,
  sku text,
  image_url text,
  status text default 'active',
  supplier_id uuid references suppliers(id) not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create orders table
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  product_id uuid references products(id) not null,
  supplier_id uuid references suppliers(id) not null,
  quantity integer not null,
  unit_price decimal(10,2) not null,
  total_amount decimal(10,2) not null,
  status text default 'pending',
  order_date timestamp with time zone default now(),
  expected_delivery timestamp with time zone,
  notes text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create user_roles table (if not exists)
create table if not exists user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) unique not null,
  role text not null check (role in ('supplier', 'vendor', 'superadmin')),
  approval_status text default 'pending' check (approval_status in ('pending', 'approved', 'rejected')),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create indexes for better performance
create index if not exists idx_supplier_profiles_user_id on supplier_profiles(user_id);
create index if not exists idx_vendor_profiles_user_id on vendor_profiles(user_id);
create index if not exists idx_suppliers_user_id on suppliers(user_id);
create index if not exists idx_products_supplier_id on products(supplier_id);
create index if not exists idx_orders_user_id on orders(user_id);
create index if not exists idx_orders_supplier_id on orders(supplier_id);
create index if not exists idx_orders_product_id on orders(product_id);
create index if not exists idx_user_roles_user_id on user_roles(user_id);
create index if not exists idx_user_roles_role on user_roles(role);
create index if not exists idx_user_roles_approval_status on user_roles(approval_status);

-- Enable Row Level Security (RLS)
alter table supplier_profiles enable row level security;
alter table vendor_profiles enable row level security;
alter table suppliers enable row level security;
alter table products enable row level security;
alter table orders enable row level security;
alter table user_roles enable row level security;

-- Create RLS policies for supplier_profiles
create policy "Users can view their own supplier profile" on supplier_profiles
  for select using (auth.uid() = user_id);

create policy "Users can insert their own supplier profile" on supplier_profiles
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own supplier profile" on supplier_profiles
  for update using (auth.uid() = user_id);

-- Create RLS policies for vendor_profiles
create policy "Users can view their own vendor profile" on vendor_profiles
  for select using (auth.uid() = user_id);

create policy "Users can insert their own vendor profile" on vendor_profiles
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own vendor profile" on vendor_profiles
  for update using (auth.uid() = user_id);

-- Create RLS policies for suppliers
create policy "Anyone can view suppliers" on suppliers
  for select using (true);

create policy "Users can insert their own supplier record" on suppliers
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own supplier record" on suppliers
  for update using (auth.uid() = user_id);

-- Create RLS policies for products
create policy "Anyone can view products" on products
  for select using (true);

create policy "Suppliers can insert their own products" on products
  for insert with check (
    exists (
      select 1 from suppliers s
      where s.id = supplier_id and s.user_id = auth.uid()
    )
  );

create policy "Suppliers can update their own products" on products
  for update using (
    exists (
      select 1 from suppliers s
      where s.id = supplier_id and s.user_id = auth.uid()
    )
  );

create policy "Suppliers can delete their own products" on products
  for delete using (
    exists (
      select 1 from suppliers s
      where s.id = supplier_id and s.user_id = auth.uid()
    )
  );

-- Create RLS policies for orders
create policy "Users can view their own orders" on orders
  for select using (auth.uid() = user_id);

create policy "Suppliers can view orders for their products" on orders
  for select using (
    exists (
      select 1 from suppliers s
      where s.id = supplier_id and s.user_id = auth.uid()
    )
  );

create policy "Users can insert their own orders" on orders
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own orders" on orders
  for update using (auth.uid() = user_id);

create policy "Suppliers can update orders for their products" on orders
  for update using (
    exists (
      select 1 from suppliers s
      where s.id = supplier_id and s.user_id = auth.uid()
    )
  );

-- Create RLS policies for user_roles
create policy "Users can view their own role" on user_roles
  for select using (auth.uid() = user_id);

create policy "Users can insert their own role" on user_roles
  for insert with check (auth.uid() = user_id);

create policy "Superadmins can view all roles" on user_roles
  for select using (
    exists (
      select 1 from user_roles ur
      where ur.user_id = auth.uid() and ur.role = 'superadmin'
    )
  );

create policy "Superadmins can update all roles" on user_roles
  for update using (
    exists (
      select 1 from user_roles ur
      where ur.user_id = auth.uid() and ur.role = 'superadmin'
    )
  );

-- Create functions for automatic supplier creation
create or replace function create_supplier_for_user()
returns trigger as $$
begin
  insert into suppliers (user_id, name, contact_email)
  values (new.user_id, 
          (select business_name from supplier_profiles where user_id = new.user_id),
          (select contact_number from supplier_profiles where user_id = new.user_id));
  return new;
end;
$$ language plpgsql;

-- Create trigger to automatically create supplier record when supplier profile is created
create trigger create_supplier_trigger
  after insert on supplier_profiles
  for each row
  execute function create_supplier_for_user(); 