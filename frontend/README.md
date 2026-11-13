# Research & Project Collaboration Network

CSE471 System Analysis and Design — Group 10

## Structure

    project471/
      backend/    Express + TypeScript + Prisma  (MVC)
      frontend/   Next.js + TypeScript + Tailwind + shadcn/ui

## Running locally

Start the backend first — the frontend needs it.

### Backend

    cd backend
    cp .env.example .env          # then fill in DATABASE_URL and JWT_SECRET
    npm install
    npx prisma migrate dev --name init_module1
    npx prisma db seed
    npm run dev                   # http://localhost:5000

### Frontend

    cd frontend
    cp .env.local.example .env.local
    npm install
    npm run dev                   # http://localhost:3000

## Auth endpoints

| Method | Route                | Auth | Purpose             |
|--------|----------------------|------|---------------------|
| POST   | /api/auth/register   | No   | Create an account   |
| POST   | /api/auth/login      | No   | Sign in, get token  |
| GET    | /api/auth/me         | Yes  | Current user        |
