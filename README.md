# Trade Stream - B2B E-commerce Platform

A comprehensive B2B e-commerce platform built with React, TypeScript, and Supabase. The platform supports three user roles: suppliers, vendors, and superadmins.

## Features

### 🔐 Authentication & User Management
- Role-based authentication (supplier, vendor, superadmin)
- User profile management
- Approval workflow for suppliers

### 📦 Product Management
- Add, edit, and delete products (suppliers)
- Product catalog browsing (vendors)
- Stock management with low stock alerts
- Product status management

### 🛒 Order Management
- Place orders (vendors)
- Order status tracking
- Order confirmation and shipping (suppliers)
- Order history and details

### 👥 User Management (Superadmin)
- View all platform users
- Manage supplier approvals
- User role management
- Platform statistics

### 📊 Dashboards
- Role-specific dashboards
- Real-time statistics
- Recent activity feeds
- Performance metrics

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **UI Components**: Shadcn/ui, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **State Management**: React Query
- **Routing**: React Router DOM

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd trade-stream
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   - Create a new Supabase project
   - Get your project URL and anon key
   - Update `src/integrations/supabase/client.ts` with your credentials

4. **Set up the database**
   - Run the SQL commands from `supabase/create_tables.sql` in your Supabase SQL editor
   - This will create all necessary tables and set up Row Level Security (RLS)

5. **Start the development server**
   ```bash
   npm run dev
   ```

### Database Setup

The application requires the following database tables:

1. **supplier_profiles** - Supplier user profiles
2. **vendor_profiles** - Vendor user profiles  
3. **suppliers** - Supplier business information
4. **products** - Product catalog
5. **orders** - Order management
6. **user_roles** - User role and approval status

Run the SQL commands in `supabase/create_tables.sql` to set up the complete database schema with proper relationships and security policies.

### Environment Variables

Create a `.env.local` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## User Roles

### Supplier
- Register and get approved by superadmin
- Add and manage products
- View and process orders
- Track inventory and sales

### Vendor  
- Browse product catalog
- Place orders
- Track order status
- View order history

### Superadmin
- Approve supplier registrations
- Manage all users
- View platform statistics
- Monitor system activity

## Project Structure

```
src/
├── components/
│   ├── ui/           # Shadcn/ui components
│   ├── layout/       # Layout components
│   └── dashboards/   # Dashboard components
├── hooks/            # Custom React hooks
├── integrations/     # External service integrations
├── pages/           # Page components
└── types/           # TypeScript type definitions
```

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Code Style

The project uses:
- TypeScript for type safety
- ESLint for code linting
- Prettier for code formatting
- Tailwind CSS for styling

## Deployment

1. Build the project: `npm run build`
2. Deploy the `dist` folder to your hosting provider
3. Ensure environment variables are set in production

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License.
