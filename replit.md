# CleanStay - Vacation Rental Management Platform

## Overview

CleanStay is a full-stack web application designed to streamline vacation rental management for hosts, cleaners, and administrators. The platform automates scheduling, payments, and notifications for the cleaning workflow between property hosts and cleaning service providers, with a focus on the Texas region and Airbnb integration.

**Tech Stack:**
- **Frontend:** React 18 with TypeScript, Vite, TailwindCSS v4
- **UI Components:** Radix UI primitives with shadcn/ui (New York style)
- **Backend:** Express.js with TypeScript
- **Database:** PostgreSQL with Drizzle ORM
- **Authentication:** JWT-based with bcrypt password hashing
- **State Management:** TanStack Query (React Query)
- **Routing:** Wouter (lightweight React router)

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Application Structure

The application follows a monorepo structure with clear separation between client and server:

```
/client          - React frontend application
  /src
    /pages       - Role-specific dashboard pages
    /components  - Reusable UI components
    /lib         - Utilities and shared logic
    /hooks       - Custom React hooks
/server          - Express backend API
  /routes        - API route handlers by domain
  /services      - Business logic and external integrations
/shared          - Shared types and database schema
```

### Frontend Architecture

**Component Library:** Built on shadcn/ui components with Radix UI primitives, providing accessible, composable UI elements styled with TailwindCSS. The design system uses the "New York" variant with custom font pairings (Outfit for headings, Inter for UI).

**State Management:** TanStack Query handles server state with automatic caching, background refetching, and optimistic updates. Auth state is managed via React Context with localStorage persistence.

**Routing Strategy:** Wouter provides lightweight client-side routing with role-based protected routes. Each user role (host, cleaner, admin) has dedicated dashboard routes with nested navigation.

**Authentication Flow:** JWT tokens stored in localStorage, with automatic header injection for API requests. Auth context provides login/logout methods and user session persistence across page refreshes.

### Backend Architecture

**API Design:** RESTful endpoints organized by domain (auth, host, cleaner, admin) with Express Router. All routes except auth require JWT authentication middleware.

**Authentication & Authorization:**
- JWT tokens signed with configurable secret (7-day expiration)
- Password hashing using bcrypt (10 salt rounds)
- Role-based middleware (`requireRole`) validates user permissions
- Request augmentation pattern adds `user` object to authenticated requests

**Database Layer:** Drizzle ORM provides type-safe database queries with PostgreSQL dialect. Schema definitions in `/shared/schema.ts` ensure consistent types between client and server.

**Storage Abstraction:** `IStorage` interface in `server/storage.ts` decouples business logic from database implementation, enabling easier testing and future migrations.

### Database Schema

**Core Tables:**
- `users` - User accounts with role-based access (host, cleaner, admin, cleaning_company)
- `properties` - Host-owned vacation rental properties with geolocation
- `bookings` - Guest reservations with cleaning status tracking
- `cleanerJobs` - Assigned cleaning tasks with payout tracking
- `payments` - Financial transactions (deposits and payouts)
- `syncLogs` - Airbnb integration synchronization audit trail

**Design Patterns:**
- Enum types for status fields ensure data consistency
- Timestamp tracking on all entities (`createdAt`)
- Foreign key relationships maintain referential integrity
- Geolocation fields (latitude/longitude) support mapping features

**Role-Based Access:**
- Hosts: manage properties and bookings
- Cleaners: view assigned jobs and earnings
- Cleaning Companies: manage company-level jobs (via `companyId`)
- Admins: full system oversight

### Build & Deployment

**Development Mode:**
- Vite dev server on port 5000 with HMR
- Backend runs via `tsx` with hot reload
- Separate processes for client and server development

**Production Build:**
- Custom build script bundles backend with esbuild
- Frontend built via Vite to `dist/public`
- Selected dependencies bundled to reduce syscalls and improve cold start
- Single `dist/index.cjs` entry point serves both API and static files

**Environment Configuration:**
- `DATABASE_URL` required for PostgreSQL connection
- `JWT_SECRET` for token signing (defaults to dev secret)
- `NODE_ENV` controls production/development behavior

## External Dependencies

### Database
- **PostgreSQL:** Primary data store accessed via connection pooling
- **Drizzle ORM:** Type-safe query builder with migration support (`drizzle-kit`)
- **Migration Strategy:** Schema changes tracked in `/migrations` directory

### Third-Party Services (Planned Integration)

**Airbnb Partner API:**
- OAuth-based authentication for host accounts
- Calendar API synchronization for booking data
- Property listing integration
- Current implementation: Stub service with TODO markers for actual integration

**Twilio:**
- SMS notifications for cleaners
- Broadcast alerts from admin dashboard
- Current status: Simulated in frontend

**Resend:**
- Email notifications for booking confirmations
- Payment receipts
- Current status: Simulated in frontend

### UI & Developer Tools

**Component Libraries:**
- Radix UI: Unstyled accessible primitives
- Lucide React: Icon library
- date-fns: Date manipulation and formatting
- class-variance-authority: Type-safe variant styling

**Build Tools:**
- Vite: Frontend build tool with React plugin
- TailwindCSS v4: Utility-first CSS framework
- TypeScript: Type safety across entire stack
- esbuild: Fast backend bundling

**Replit Integration:**
- Custom Vite plugins for Replit deployment environment
- Meta image plugin updates OpenGraph tags dynamically
- Dev banner and error overlay for development
- Cartographer integration for code navigation

### Authentication & Security

- bcrypt: Password hashing (10 rounds)
- jsonwebtoken: JWT token generation and verification
- CORS enabled for frontend-backend communication
- Credentials included in API requests for session handling