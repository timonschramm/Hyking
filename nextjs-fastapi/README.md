
Run the project with:
npm run dev

This returns the following, scroll up to see the address
[0]   - Local:        http://localhost:3000
[1] INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)



<!-- - Prisma
  - run to sync with supabase, if you uodate the database
  - 1. dotenv -f .env.local run -- npx prisma migrate dev --name n  # add new change
  - 2. dotenv -f .env.local run -- npx prisma generate         # Generate Prisma Client
  - 3. dotenv -f .env.local run -- npx prisma db push         # Push the schema to the database
  - 4. dotenv -f .env.local run -- npx prisma studio
  - https://supabase.com/partners/integrations/prisma
  - Mass create new with
    - dotenv -f .env.local run -- npx tsx lib/importdata.ts -->


For migrations with prisma

dotenv -f .env.local run -- npx prisma migrate status
dotenv -f .env.local run -- npx prisma generate  
dotenv -f .env.local run -- npx prisma migrate dev --name name
dotenv -f .env.local run -- npx prisma migrate deploy
dotenv -f .env.local run -- npx prisma db push 

Mass create new with
dotenv -f .env.local run -- npx tsx lib/importdata.ts 


Open ToDos 