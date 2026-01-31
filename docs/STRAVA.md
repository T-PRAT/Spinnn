# Strava Integration

## Architecture

```
Frontend → Backend API → Strava API
```

The backend handles all OAuth operations and token management, keeping the Client Secret secure.

## 1. Create Strava App

1. Go to https://www.strava.com/settings/api
2. Create an application with:
   - **Application Name**: Spinnn
   - **Category**: Cycling
   - **Website**: Your domain URL
   - **Callback Domain**: `localhost` (dev) or `your-domain.com` (prod)

**Important**: Only enter the domain (no protocol, no port, no path).

## 2. Environment Variables

### Backend (`server/.env`)

```bash
STRAVA_CLIENT_ID=your_client_id
STRAVA_CLIENT_SECRET=your_client_secret
FRONTEND_URL=http://localhost:5173
```

### Frontend (`.env.local`)

```bash
VITE_STRAVA_CLIENT_ID=your_client_id
VITE_API_URL=http://localhost:3001
```

## 3. Development

Start both servers:

```bash
# Terminal 1 - Backend
cd server && bun run dev

# Terminal 2 - Frontend
bun dev
```

## 4. Test Integration

1. Go to Settings → Integrations → Strava
2. Click "Connect Strava"
3. Authorize on Strava
4. Complete a workout → Upload to Strava from Summary

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/strava/status` | Check connection status |
| POST | `/api/strava/oauth/exchange` | Exchange OAuth code |
| POST | `/api/strava/deauthorize` | Disconnect |
| POST | `/api/strava/upload` | Upload FIT file |
| GET | `/api/strava/upload/:id` | Check upload status |

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Redirect URI mismatch | Check Callback Domain matches your current domain (no http://) |
| Failed to check status | Ensure backend is running on correct port |
| CORS errors | Verify `FRONTEND_URL` in backend `.env` |
| Upload fails with 401 | Session expired - reconnect |

## Resources

- [Strava API Docs](https://developers.strava.com/docs/)
- [Strava Uploads API](https://developers.strava.com/docs/uploads/)
