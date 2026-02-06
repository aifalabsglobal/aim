# Vercel: Root Directory and "No Next.js version detected"

**Set Root Directory to `next-app`** in Vercel (Settings → General). The root `vercel.json` does not override install/build, so Vercel runs default `npm install` and `npm run build` in the project root (next-app). Do not add `installCommand`/`buildCommand` that use `cd next-app` when Root Directory is already next-app—there is no `next-app` subfolder there.

If your Vercel build fails with:

- **`Could not identify Next.js version`** / **`No Next.js version detected`**
- **`prisma: command not found`** (exit 127)
- **`No Output Directory named "public" found`**

**Cause:** Vercel is using the **repo root** as the project root and didn’t find `next` in that `package.json`, or install/build aren’t running in `next-app`. The real app is in `next-app/`.

**Fix (recommended):**

1. Open your project on [vercel.com](https://vercel.com).
2. Go to **Settings** → **General**.
3. Under **Root Directory**, click **Edit**.
4. Set to **`next-app`** and save.
5. **Redeploy** (Deployments → ⋯ → Redeploy).

After this, Vercel will run `npm install` and `npm run build` **inside** `next-app`, so Prisma is installed and the build succeeds.

---

If you ever build from the repo root (Root Directory blank), the root `package.json` includes `next` and you’d need custom install/build in `vercel.json` that `cd next-app`. With Root Directory set to **`next-app`**, keep the root `vercel.json` minimal (no custom install/build) so Vercel uses defaults in next-app.
