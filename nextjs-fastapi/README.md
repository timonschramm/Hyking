# Tools 
Run the project 
- npm run dev
[0]   - Local:        http://localhost:3000
[1] INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)



- Prisma
  - run to sync with supabase, if you uodate the database
  - 1. dotenv -f .env.local run -- npx prisma migrate dev --name init 
  - 2. dotenv -f .env.local run -- npx prisma generate
  - 3. dotenv -f .env.local run -- npx prisma db push
  - 4. dotenv -f .env.local run -- npx prisma studio
  - https://supabase.com/partners/integrations/prisma
  - Mass create new with
    - dotenv -f .env.local run -- npx tsx lib/importdata.ts

- Supabase

- FastAPI
  

  TODO: after onboarding to dashboard