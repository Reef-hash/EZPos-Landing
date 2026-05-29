# Deploy Guide: Frontend on Vercel + Backend on Render

This guide deploys:
- Frontend: Next.js app in `src/ezpos-web-next` to Vercel
- Backend: ASP.NET Core app in `src/EZPos.Web.Ui` to Render

## 1. Pre-deploy checklist

1. Push latest branch to GitHub.
2. Rotate all secrets currently stored in appsettings files before production.
3. Prepare production credentials:
   - Stripe secret key
   - Stripe publishable key
   - Stripe webhook secret
   - Admin username/password
   - CrossxPos HMAC secret

## 2. Deploy backend to Render

Option A (recommended): use Blueprint file `render.yaml` in repo root.

1. In Render dashboard: New -> Blueprint.
2. Select this repository.
3. Confirm detected file `render.yaml`.
4. Fill all env vars marked as secret.
5. Deploy.

Expected backend URL example:
- https://ezpos-web-backend.onrender.com

Health check:
- https://ezpos-web-backend.onrender.com/healthz

Important:
- This setup mounts a persistent disk at `/var/data` for SQLite.
- Database path is controlled by `ConnectionStrings__DefaultConnection`.

## 3. Deploy frontend to Vercel

1. In Vercel dashboard: Add New Project.
2. Import the same repository.
3. Set Root Directory to:
   - `src/ezpos-web-next`
4. Framework should auto-detect as Next.js.
5. Deploy.

Expected frontend URL example:
- https://ezpos-web.vercel.app

## 4. Domain and Stripe setup

1. Put custom domain on Vercel and Render if needed.
2. In Stripe dashboard:
   - add production webhook endpoint:
     - `https://<your-render-domain>/Payment/Webhook`
   - copy webhook signing secret and set as `Stripe__WebhookSecret` in Render.

## 5. Security hardening (must-do)

1. Remove hardcoded secrets from source files and keep only env vars in production.
2. Use long random admin password.
3. Restrict admin URL access if possible (IP allowlist or private network).
4. Keep HTTPS enabled only.

## 6. Smoke test after deploy

1. Open frontend home and pricing pages.
2. Open backend health endpoint.
3. Test checkout flow in Stripe test mode.
4. Verify success page generates key.
5. Verify admin dashboard can:
   - create manual EZPos key
   - create manual CrossxPos key
   - deactivate/activate key
   - reset device binding

## 7. Optional recommended split

For long-term architecture, keep:
- Vercel: marketing frontend (`src/ezpos-web-next`)
- Render: licensing/payment backend (`src/EZPos.Web.Ui`)

If you later want strict API separation, move API endpoints from `EZPos.Web.Ui` into `EZPos.Web.Api` and point frontend to API domain.
