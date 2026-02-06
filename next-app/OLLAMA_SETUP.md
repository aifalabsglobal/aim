# Ollama: Make it reachable from the app (and Vercel)

The app talks to Ollama over HTTP. For **local dev** it uses `OLLAMA_BASE_URL` (default `http://45.198.59.91:11434` or `http://localhost:11434`). For **Vercel**, the server runs in the cloud and must reach your Ollama server over the internet.

---

## 1. Set OLLAMA_BASE_URL

- **Local:** In `next-app/.env` or `.env.local`:
  ```env
  OLLAMA_BASE_URL=http://localhost:11434
  ```
  Or your remote server:
  ```env
  OLLAMA_BASE_URL=http://45.198.59.91:11434
  ```

- **Vercel:** In the project → **Settings** → **Environment Variables** add:
  - **Name:** `OLLAMA_BASE_URL`
  - **Value:** `http://YOUR_SERVER_IP_OR_HOST:11434` (e.g. `http://45.198.59.91:11434`)
  - **Environments:** Production, Preview

Redeploy after adding or changing the variable.

---

## 2. Make Ollama reachable from the internet (for Vercel)

If the app is deployed on Vercel, it connects to Ollama from Vercel’s servers. Your Ollama host must be reachable from the public internet.

### On the machine running Ollama

1. **Listen on all interfaces** (not only localhost):
   ```bash
   set OLLAMA_HOST=0.0.0.0
   ollama serve
   ```
   On Linux/macOS you can export and run:
   ```bash
   export OLLAMA_HOST=0.0.0.0
   ollama serve
   ```
   Or configure your service/startup so `OLLAMA_HOST=0.0.0.0` is set when starting Ollama.

2. **Open port 11434** in the firewall so inbound TCP 11434 is allowed (from anywhere or from your Vercel region if you restrict by IP).

3. **Use a public IP or hostname** for the server (no `127.0.0.1`). If the server is behind a router, use port forwarding so `YOUR_PUBLIC_IP:11434` reaches the machine running Ollama.

### Quick check from your machine

```bash
curl http://YOUR_SERVER_IP:11434/api/tags
```

If this returns JSON with a `models` array, Ollama is reachable. Then set that URL as `OLLAMA_BASE_URL` in Vercel and redeploy.

---

## 3. If it still shows "Offline"

- Confirm **OLLAMA_BASE_URL** is set in Vercel (no typo, no trailing slash needed).
- From a machine on the internet (or use an online “check URL” tool), open `http://YOUR_IP:11434/api/tags`. If it fails, the server or firewall is not allowing external access.
- Check the **GPU Offline** tooltip / message in the app; it may show the error (e.g. connection refused, timeout).

Security note: Exposing Ollama to the internet gives anyone who can reach that URL access to run models. Use a firewall, VPN, or reverse proxy with auth if the server is not in a private network.
