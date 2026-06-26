# Ride Booker Frontend

A web application for booking motorcycle test rides, built with Next.js 15.

## Demo

Application available at: **[FRONTEND_URL]**

Test account credentials available at: **[FRONTEND_URL]/demo**

Admin panel: **[FRONTEND_URL]/admin/login**  
Client panel: **[FRONTEND_URL]/login**

## Tech Stack

- **Next.js 15** (App Router)
- **TypeScript**
- **Tailwind CSS** + **shadcn/ui**
- **TanStack Query** - server state management
- **Zustand** - client state management
- **Axios** - API communication
- **Recharts** - charts and data visualization
- **next-themes** - dark/light mode support

## Requirements

- Node.js 18+
- npm / yarn

## Local Development

### 1. Clone the repository

```bash
git clone [REPO_URL]
cd ride-booker-frontend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Environment variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_API_URL=your-api-url
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 4. Run the development server

```bash
npm run dev
```

Application runs at `http://localhost:3000`.

## Project Structure

app/

├── (auth)/ # Login, registration, password reset pages

├── (admin)/ # Admin panel

├── (user)/ # Client panel

├── demo/ # Demo page with test credentials

└── page.tsx # Landing page
components/

├── admin/ # Admin panel components

├── shared/ # Shared components

└── ui/ # shadcn/ui components
hooks/ # Custom React hooks

store/ # Global state (Zustand)

lib/ # Axios config, utilities

## User Roles

| Role           | Description                 | Panel    |
| -------------- | --------------------------- | -------- |
| `SUPER_ADMIN`  | Full system access          | `/admin` |
| `ORG_ADMIN`    | Manages own organization    | `/admin` |
| `BRANCH_ADMIN` | Manages own branch/location | `/admin` |
| `USER`         | Books test rides            | `/user`  |

## Features

### Client Panel

- Browse motorcycle models with filters (type, power, engine capacity)
- Book test rides (select location and time slot)
- Manage bookings (view status, cancel)
- Favorites list
- Account settings and profile

### Admin Panel

- Dashboard with statistics and charts
- Booking management (confirm, reject, complete)
- Time slot management
- Vehicle inventory management per location
- User and role management
- Email notification template configuration
- Organization and location management
- Dark/light mode support
