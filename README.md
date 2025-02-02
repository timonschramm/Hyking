# Team 8 - NextJS + FastAPI Project

This project combines a NextJS frontend with a FastAPI backend, using Prisma as the ORM and Supabase as the database provider.

## 🚀 Getting Started


### Prerequisites

- Node.js (v16 or higher)
- Python 3.12 (works best)
- npm 
- A Supabase account and project

### Environment Setup

1. Create a `.env.local` file in the root directory with the following required environment variables:

```bash
# Spotify API Configuration
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
SPOTIFY_REDIRECT_URI=http://localhost:3000/callback

# Database Configuration
DATABASE_URL=your_supabase_database_url
DIRECT_URL=your_supabase_direct_url

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Site Configuration
NEXT_PUBLIC_SITE_URL=http://localhost:3000    # For development
NEXT_PUBLIC_FASTAPI_URL=http://127.0.0.1:8000

# Redis Configuration
REDIS_URL=your_redis_url
REDIS_TOKEN=your_redis_token

# API Keys
OPTIMIZE_API_KEY=your_optimize_api_key
OPENAI_API_KEY=your_openai_api_key
OPENWEATHERMAP_API_KEY=your_openweathermap_api_key
RESEND_API_KEY=your_resend_api_key (not required yet)
```

2. Install dependencies:
```bash
# Install frontend dependencies
cd nextjs-fastapi

npm install

# Install backend dependencies
pip install -r requirements.txt
```

## 🛠️ Development

### Running the Application

Start both the frontend and backend servers with a single command:

```bash
npm run dev
```

This will start:
- NextJS frontend at [http://localhost:3000](http://localhost:3000)
- FastAPI backend at [http://127.0.0.1:8000](http://127.0.0.1:8000)

### Database Management with Prisma

Prisma is used for database migrations and schema management. Here are the key commands:

```bash
# Check migration status
dotenv -f .env.local run -- npx prisma migrate status

# Generate Prisma Client
dotenv -f .env.local run -- npx prisma generate

# Create a new migration
dotenv -f .env.local run -- npx prisma migrate dev --name <migration_name>

# Deploy migrations
dotenv -f .env.local run -- npx prisma migrate deploy

# Push schema changes directly to database (development only)
dotenv -f .env.local run -- npx prisma db push
```

### Data Seeding

To populate the database with initial data:

```bash
dotenv -f .env.local run -- npx tsx lib/importdata.ts
```

## 📁 Project Structure

```
.
├── app/                   # NextJS application
│   ├── components/        # React components
│   ├── dashboard/         # Dashboard pages
│   └── apinextjs/         # API routes
├── api/                   # FastAPI backend
├── prisma/                # Prisma schema and migrations
├── lib/                   # Shared utilities
└── requirements.txt       # Python dependencies
```

## 🔑 Key Features
- Group Matching to go on hikes together
- HykingAI to find great hikes with natural language
- Recomennder System, matching great users together.
- Real-time chat functionality
- User matching system
- Profile management


## 👥 Team

### Team Members and Contributions

#### Timon Schramm (@timonschramm)
- Architecture and Infrastructure Setup
  - Supabase integration
  - Vercel deployment
  - Next.js frontend framework
  - Prisma ORM setup
  - Google and Spotify authentication
- Frontend Development
  - Next.js architecture and implementation
- Real-time Chat System
  - Implementation of live messaging features
  - Chat interface development

#### Lorenz Rasbach (@lorenz-r)
- Backend Development
  - FastAPI backend architecture and setup
- Algorithm Development
  - Group matching algorithm implementation
  - User matching system
- Recommender System
  - Design and implementation of user recommendation engine

#### Nicolas Pfitzinger (@Nicolas-P-dev)
- AI Integration
  - HykingAI functionality development
  - AI chat system implementation
- User Experience
  - UI/UX design for AI chat interface
  - Integration of HykingAI with regular chat system


