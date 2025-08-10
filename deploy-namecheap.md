# Nginx reverse proxy (example)

Use Nginx (or Caddy/Traefik) to terminate HTTPS and proxy traffic:

```
server {
  listen 80;
  server_name yourdomain.com;
  return 301 https://$host$request_uri;
}

server {
  listen 443 ssl http2;
  server_name yourdomain.com;

  # ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
  # ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

  # Hardened security headers
  add_header X-Frame-Options DENY;
  add_header X-Content-Type-Options nosniff;
  add_header Referrer-Policy no-referrer-when-downgrade;
  add_header X-XSS-Protection "1; mode=block";
  add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

  # Frontend (Next.js) on port 3000
  location / {
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_pass http://127.0.0.1:3000;
  }

  # Backend API on port 4001
  location /api/ {
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_pass http://127.0.0.1:4001;
  }
}
```

Set environment variables (do not hardcode secrets):

```
export SUPABASE_URL=https://your-project.supabase.co
export SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
export NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL
export NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
export NEXT_PUBLIC_BACKEND_URL=https://yourdomain.com
export BACKEND_PORT=4001
```

Ensure your firewall allows 80/443 only; keep 3000/4001 bound to localhost.
# Namecheap Hosting Deployment Guide for Quantex

## Step 1: Prepare Your Files

Your application has been built successfully. The production files are in the `.next` folder.

## Step 2: Upload to Namecheap

### Option A: Using cPanel File Manager
1. Log into your Namecheap cPanel
2. Go to "File Manager"
3. Navigate to `public_html` folder
4. Upload these files:
   - `.next` folder (entire folder)
   - `package.json`
   - `next.config.js`
   - `public` folder
   - `styles` folder
   - `lib` folder
   - `contexts` folder
   - `component` folder
   - `pages` folder

### Option B: Using FTP
1. Use an FTP client (FileZilla, WinSCP)
2. Connect to your Namecheap hosting
3. Upload all files to `public_html`

## Step 3: Install Dependencies
1. In cPanel, go to "Terminal" or "SSH Access"
2. Navigate to your domain directory
3. Run: `npm install --production`

## Step 4: Set Environment Variables
In cPanel, go to "Environment Variables" and add:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `COINMARKETCAP_API_KEY`

## Step 5: Start the Application
Run: `npm start` or set up a Node.js app in cPanel

## Alternative: Static Export (Recommended for Namecheap)

Since Namecheap shared hosting might not support Node.js well, let's create a static export: 