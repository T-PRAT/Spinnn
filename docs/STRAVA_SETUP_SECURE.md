# Strava Integration Setup (Secure Backend Version)

This guide explains how to set up the secure Strava integration for Spinnn using a backend API server.

## Architecture

```
Frontend (PWA) → Backend API Server → Strava API
```

**Security Benefits:**
- ✅ Client Secret stays on the server (never exposed to browser)
- ✅ Tokens stored in server-side sessions (httpOnly cookies)
- ✅ Auto-refresh of expired tokens
- ✅ CSRF protection with state parameter
- ✅ Suitable for public/production deployment

## 1. Create a Strava Application

1. Go to https://www.strava.com/settings/api
2. Click "Create Application"
3. Fill in the application details:
   - **Application Name**: Spinnn
   - **Category**: Cycling
   - **Website**: Your website URL
   - **Application Description**: Indoor cycling workout tracker
   - **Authorization Callback Domain**:
     - Development: `localhost`
     - Production: `your-domain.com`

⚠️ **Important**: Only put the domain (no `http://`, no port, no path)

## 2. Get Your Credentials

From your Strava application page, copy:
- **Client ID** - Your application's public identifier
- **Client Secret** - Your application's secret key (keep this secure!)

## 3. Backend Setup

### Install Dependencies

```bash
cd server
npm install
```

### Configure Environment Variables

Create `server/.env`:

```bash
cp server/.env.example server/.env
```

Edit `server/.env`:

```bash
# Server Configuration
PORT=3001
NODE_ENV=development

# Strava OAuth Configuration
STRAVA_CLIENT_ID=your_actual_client_id_here
STRAVA_CLIENT_SECRET=your_actual_client_secret_here

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173

# Session Secret (generate a random string!)
SESSION_SECRET=generate_a_long_random_string_here
```

**Generate a secure SESSION_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Start the Backend Server

Development mode (auto-reload):
```bash
cd server
npm run dev
```

The server will start on http://localhost:3001

## 4. Frontend Setup

### Configure Environment Variables

Create `.env.local` in the project root:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```bash
# Only Client ID needed in frontend
VITE_STRAVA_CLIENT_ID=your_actual_client_id_here

# Backend API URL
VITE_API_URL=http://localhost:3001
```

### Start the Frontend

```bash
bun dev
```

The app will start on http://localhost:5173

## 5. Test the Integration

1. **Check Backend Health:**
   - Visit http://localhost:3001/health
   - Should return: `{"status":"ok","service":"spinnn-api"}`

2. **Connect to Strava:**
   - Open http://localhost:5173
   - Go to Settings → Integrations → Strava
   - Click "Connect Strava"
   - Authorize on Strava
   - You should be redirected back and see "Connected"

3. **Test Upload:**
   - Complete a workout
   - Go to Summary page
   - Click "Upload to Strava"
   - Check your Strava account for the activity

## Production Deployment

### Backend Deployment

The backend can be deployed to:

#### Option A: Railway (Recommended)

1. Create account on https://railway.app
2. Create new project from GitHub repo
3. Point to `/server` directory
4. Set environment variables in Railway dashboard:
   ```
   PORT=3001
   NODE_ENV=production
   STRAVA_CLIENT_ID=...
   STRAVA_CLIENT_SECRET=...
   SESSION_SECRET=...
   FRONTEND_URL=https://your-frontend-domain.com
   ```
5. Railway will auto-deploy on git push

#### Option B: Render

1. Create account on https://render.com
2. Create new "Web Service"
3. Connect GitHub repo
4. Configure:
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. Add environment variables
6. Deploy

#### Option C: VPS (DigitalOcean, Linode, etc.)

1. SSH into your server
2. Clone the repo
3. Install Node.js 18+
4. Install PM2: `npm install -g pm2`
5. Configure nginx as reverse proxy
6. Start with PM2: `cd server && pm2 start index.js --name spinnn-api`
7. Configure PM2 to start on boot: `pm2 startup && pm2 save`

### Frontend Deployment

Update `.env.production`:

```bash
VITE_STRAVA_CLIENT_ID=your_client_id
VITE_API_URL=https://your-backend-domain.com
```

Deploy to Vercel, Netlify, or GitHub Pages as usual.

### Update Strava Callback Domain

In your Strava app settings:
- **Authorization Callback Domain**: `your-frontend-domain.com`

## Troubleshooting

### "Failed to check Strava status"

- Make sure the backend server is running
- Check CORS configuration in `server/index.js`
- Verify `FRONTEND_URL` matches your frontend URL

### "Not connected to Strava" after connecting

- Check browser console for errors
- Verify cookies are being set (check DevTools → Application → Cookies)
- Make sure `credentials: 'include'` is in all fetch calls
- Check `sameSite` cookie setting if frontend/backend are on different domains

### Upload fails with 401

- Session may have expired
- Try disconnecting and reconnecting
- Check backend logs for errors

### CORS errors

- Verify `FRONTEND_URL` in backend `.env` matches frontend origin exactly
- Check browser console for the specific CORS error
- Make sure `credentials: 'include'` is set in fetch calls

## Security Notes

- ✅ Client Secret stored only on server
- ✅ Tokens stored in httpOnly session cookies (not accessible to JavaScript)
- ✅ CSRF protection with state parameter
- ✅ Automatic token refresh
- ✅ HTTPS required in production
- ⚠️ Use a strong SESSION_SECRET in production
- ⚠️ Keep server/.env out of git (already in .gitignore)
- ⚠️ Rotate SESSION_SECRET periodically

## API Endpoints

See `server/README.md` for full API documentation.

Quick reference:
- `GET /health` - Health check
- `GET /api/strava/status` - Check connection status
- `POST /api/strava/oauth/exchange` - Exchange OAuth code
- `POST /api/strava/deauthorize` - Disconnect
- `POST /api/strava/upload` - Upload FIT file
- `GET /api/strava/upload/:id` - Check upload status

## Additional Resources

- [Strava API Documentation](https://developers.strava.com/docs/)
- [Strava Uploads API](https://developers.strava.com/docs/uploads/)
- [Express Session Documentation](https://github.com/expressjs/session)
