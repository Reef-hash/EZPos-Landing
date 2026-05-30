# EZPos Web Platform

Marketing website + license management for EZPos and CrossxPos products.

## Structure

```
EZPos-Web/
  frontend/    Next.js 14 (App Router) + Tailwind CSS + Font Awesome
  backend/     Node.js + Express REST API
```

## Stack

| Layer     | Technology                          |
|-----------|-------------------------------------|
| Frontend  | Next.js 14, TypeScript, Tailwind CSS, Font Awesome |
| Backend   | Node.js, Express, TypeScript        |
| Database  | Supabase (PostgreSQL)               |
| Payments  | Stripe (Card, FPX, QR)              |
| Deploy    | Vercel (frontend) + Railway/Render (backend) |

## Features

- Product landing pages for EZPos Desktop and CrossxPos
- Side-by-side comparison page
- Pricing page (dynamic, from DB)
- Stripe Checkout (card, FPX, QR)
- Auto license key generation after payment
- License verify page
- Admin portal: dashboard, license management, pricing management, sales history

## Planning Docs

- Implementation roadmap and checklist: `docs/IMPLEMENTATION-TODO.md`

## Setup

### 1. Backend

```bash
cd backend
cp .env.example .env
# Fill in .env values
npm install
npm run dev
```

### 2. Frontend

```bash
cd frontend
cp .env.local.example .env.local
# Fill in .env.local values
npm install
npm run dev
```

### 3. Supabase

Run `backend/supabase-schema.sql` in your Supabase SQL Editor.

### 4. Admin password hash

Generate bcrypt hash for your admin password:

```bash
node -e "const b=require('bcryptjs'); b.hash('yourpassword',10).then(console.log)"
```

Put the hash in `ADMIN_PASSWORD_HASH` in backend `.env`.
