# Pickleball Booking System

A full-stack booking system for managing pickleball court reservations with payment verification.

## Tech Stack

- **Frontend & Backend**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Styling**: Tailwind CSS

## Features

### Customer Booking Flow (No Login Required)
1. View calendar with available time slots
2. Select date, time, and court
3. Fill booking form (name, email, phone)
4. View QR code for payment (GCash/Maya)
5. Enter payment reference code
6. Get booking confirmation with booking number

### Admin Panel (Login Required)
- View all bookings
- Verify/reject payments manually
- Manage courts (add/edit/disable)
- Generate reports (daily/weekly/monthly)
- Monitor schedules and availability

## Database Schema

- **admin_users**: Admin accounts for panel access
- **courts**: Pickleball courts available for booking
- **bookings**: Reservation records with customer info and time slots (auto-generated booking number)
- **payments**: Payment verification tracking (reference codes, e-wallet type)
- **settings**: App configuration (rates, operating hours, etc.)

## Setup Instructions

### Prerequisites
- Node.js 18+ installed
- Supabase account (free tier available)

### Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up Supabase**
   - Go to [supabase.com](https://supabase.com) and create a new project
   - Note your project URL and anon key from Project Settings > API
   - Go to SQL Editor in Supabase dashboard
   - Copy and paste the contents of `supabase-schema.sql`
   - Run the SQL to create all tables

3. **Create your first admin user**
   - In Supabase Dashboard, go to Authentication > Users
   - Click "Add User" (top right)
   - Enter email and password
   - Click "Create User"
   - Copy the user's UUID (you'll see it in the users table)
   - Go back to SQL Editor and run:
     ```sql
     INSERT INTO admin_users (user_id, name)
     VALUES ('paste-uuid-here', 'Your Admin Name');
     ```

4. **Set up environment variables**
   ```bash
   copy .env.example .env
   ```

   Edit `.env` and configure:
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon/public key
   - `NEXT_PUBLIC_SITE_URL`: Your site URL (http://localhost:3000 for dev)
   - E-wallet QR codes (optional for now)

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open the app**
   Navigate to [http://localhost:3000](http://localhost:3000)

7. **Login to Admin Panel**
   - Go to [http://localhost:3000/admin/login](http://localhost:3000/admin/login)
   - Use the email and password you created in Supabase Auth

## Authentication

**Admin Panel:**
- Uses Supabase Auth for secure authentication
- Email/password login
- Protected routes with middleware
- Only users in the `admin_users` table can access admin panel

**Customer Booking:**
- No authentication required
- Guest checkout flow
- Customer information stored with each booking

## Customer Booking Flow

No login required for customers:
1. Visit the booking page
2. Select date and view available time slots
3. Choose a time slot and court
4. Fill in contact information
5. View payment QR code (GCash or Maya)
6. Submit payment reference code
7. Receive booking confirmation with unique booking number (e.g., PB-2024-0001)

## Project Structure

```
├── app/
│   ├── api/
│   │   └── auth/         # Auth API routes
│   ├── admin/            # Admin panel pages (protected)
│   │   ├── login/        # Admin login
│   │   └── page.tsx      # Admin dashboard
│   ├── book/             # Customer booking pages (no auth)
│   │   ├── confirmation/ # Booking confirmation
│   │   └── page.tsx      # Booking form
│   ├── globals.css       # Global styles
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Home page
├── components/           # Reusable React components
├── lib/
│   ├── supabase/         # Supabase client utilities
│   │   ├── client.ts     # Browser client
│   │   ├── server.ts     # Server client
│   │   └── middleware.ts # Auth middleware
│   ├── supabase.ts       # Re-exports
│   └── types.ts          # TypeScript types
├── middleware.ts         # Next.js middleware for auth
├── supabase-schema.sql   # Database schema (run in Supabase SQL Editor)
├── .env.example          # Environment variables template
├── package.json
└── tsconfig.json
```

## Next Steps

1. Set up authentication with NextAuth.js
2. Create booking UI with calendar/time slot picker
3. Build admin dashboard for payment verification
4. Add payment QR code display
5. Implement reports module
6. Deploy to Vercel

## Database Management

All database changes should be done through Supabase Dashboard:
- Go to Table Editor to view/edit data
- Use SQL Editor to modify schema
- Check Logs for debugging

## Deployment

Deploy to Vercel:
1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables (Supabase URL, keys, etc.)
4. Deploy

## License

Private - All Rights Reserved
