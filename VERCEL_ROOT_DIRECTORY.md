# Vercel: Set Root Directory to avoid "prisma: command not found"

If your Vercel build fails with:

- **`prisma: command not found`** (exit 127), or  
- **`No Output Directory named "public" found`**

**Cause:** Vercel is using the **repo root** as the project root. Prisma lives in `next-app`, and without Next.js detected Vercel looks for a `public` output directory.

**Fix (recommended):**

1. Open your project on [vercel.com](https://vercel.com).
2. Go to **Settings** → **General**.
3. Under **Root Directory**, click **Edit**.
4. Set to **`next-app`** and save.
5. **Redeploy** (Deployments → ⋯ → Redeploy).

After this, Vercel will run `npm install` and `npm run build` **inside** `next-app`, so Prisma is installed and the build succeeds.

---

**If you keep Root Directory blank:**  
The repo has a root `vercel.json` that sets `framework` to `nextjs`, `outputDirectory` to `next-app/.next`, and install/build to run in `next-app`. That may fix the "public" error. If the deployment still fails or the app doesn’t run correctly, set **Root Directory** to **`next-app`** (recommended).
