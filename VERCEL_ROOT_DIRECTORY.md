# Vercel: Set Root Directory to `next-app` (required)

**You must set Root Directory to `next-app`** so Vercel uses the Next.js app and its `package.json` (which has `next`, Prisma, etc.). The repo root has no Next.js dependency.

If your Vercel build fails with:

- **`Could not identify Next.js version`** / **`No Next.js version detected`**
- **`prisma: command not found`** (exit 127)
- **`No Output Directory named "public" found`**

**Cause:** Vercel is using the **repo root** as the project root. The root `package.json` has no `next`; the real app and its dependencies are in `next-app/`.

**Fix (recommended):**

1. Open your project on [vercel.com](https://vercel.com).
2. Go to **Settings** → **General**.
3. Under **Root Directory**, click **Edit**.
4. Set to **`next-app`** and save.
5. **Redeploy** (Deployments → ⋯ → Redeploy).

After this, Vercel will run `npm install` and `npm run build` **inside** `next-app`, so Prisma is installed and the build succeeds.

---

**Root Directory must be `next-app`.** The root `vercel.json` (framework/install/build) does not change which `package.json` Vercel reads; Vercel needs to run from `next-app` so it sees `next` and the rest of the app.
