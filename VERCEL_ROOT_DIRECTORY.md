# Vercel: Set Root Directory to avoid "prisma: command not found"

If your Vercel build fails with:

```text
prisma: command not found
Error: Command "npm run build" exited with 127
```

**Cause:** Vercel is building from the **repo root**, so `npm install` runs there and never installs Prisma (which lives in `next-app`).

**Fix (recommended):**

1. Open your project on [vercel.com](https://vercel.com).
2. Go to **Settings** → **General**.
3. Under **Root Directory**, click **Edit**.
4. Set to **`next-app`** and save.
5. **Redeploy** (Deployments → ⋯ → Redeploy).

After this, Vercel will run `npm install` and `npm run build` **inside** `next-app`, so Prisma is installed and the build succeeds.

---

**If you keep Root Directory blank:**  
The repo has a root `vercel.json` that sets `installCommand` and `buildCommand` to run in `next-app`. If the build still fails, your Vercel project may have **Override** for Install/Build Command in Settings → General. Remove any overrides so the root `vercel.json` is used, or set Install Command to `cd next-app && npm install` and Build Command to `cd next-app && npm run build` manually.
