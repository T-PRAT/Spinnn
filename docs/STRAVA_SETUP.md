# Strava Integration Setup

This guide explains how to configure Strava integration for Spinnn.

## 1. Create a Strava Application

1. Go to https://www.strava.com/settings/api
2. Click "Create Application" or use an existing one
3. Fill in the application details:
   - **Application Name**: Spinnn
   - **Category**: Cycling
   - **Website**: Your website URL (https://your-domain.com)
   - **Application Description**: Indoor cycling workout tracker
   - **Callback Domain**: `localhost` (for development) or `your-domain.com` (for production)

   📝 **Note**: You can create two separate applications (one for dev, one for prod) or use one application with the production domain and test locally.

## 2. Configure Redirect URIs

The **Callback Domain** field should contain only the domain (no protocol, no path):

```
Development:  localhost
Production:   your-domain.com
```

Strava will automatically construct the full redirect URI:
```
http://localhost:5173/strava-callback
https://your-domain.com/strava-callback
```

⚠️ **Important**:
- Use **localhost** (not 127.0.0.1) for development
- Don't include `http://` or `https://` in the Callback Domain field
- Don't include the path (`/strava-callback`) in the Callback Domain field

## 3. Get Your Client ID and Client Secret

From your Strava application page, copy both:
- **Client ID** - Your application's public identifier
- **Client Secret** - Your application's secret key

**Security Note**: Even though we use PKCE, Strava still requires the Client Secret for token exchange. The secret will be visible in your browser's JavaScript bundle. This is acceptable for personal apps but not recommended for public applications. For production apps with many users, use a backend server to keep the Client Secret secure.

## 4. Development vs Production

Since Strava only allows one Callback Domain per application, you have two options:

### Option A: Two Applications (Recommended) ✅

Create **two separate Strava applications**:

**Development App:**
- Name: "Spinnn Dev"
- Callback Domain: `localhost`
- Client ID: Use in `.env.local`

**Production App:**
- Name: "Spinnn"
- Callback Domain: `your-domain.com`
- Client ID: Use in production environment

This keeps your development and production data separate and is more secure.

### Option B: Single Application

If you prefer using one application:
- Set Callback Domain to your production domain: `your-domain.com`
- For local development, you'll need to:
  1. Deploy to a test environment, OR
  2. Use a local proxy/domain like `local.your-domain.com`, OR
  3. Test directly in production

## 5. Configure Environment Variables

### Development

1. Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

2. Edit `.env.local` and add your Client ID and Client Secret:
```bash
VITE_STRAVA_CLIENT_ID=your_actual_client_id_here
VITE_STRAVA_CLIENT_SECRET=your_actual_client_secret_here
```

3. Restart the development server:
```bash
bun dev
```

### Production

1. Set the environment variables in your hosting platform:
```bash
VITE_STRAVA_CLIENT_ID=your_actual_client_id_here
VITE_STRAVA_CLIENT_SECRET=your_actual_client_secret_here
```

2. Or create a `.env.production` file (don't commit this):
```bash
VITE_STRAVA_CLIENT_ID=your_actual_client_id_here
VITE_STRAVA_CLIENT_SECRET=your_actual_client_secret_here
```

## 6. Test the Integration

1. Start the app and go to Settings → Integrations → Strava
2. Click "Connect Strava"
3. Authorize the app on Strava
4. Complete a workout
5. Upload to Strava from the Summary page

## Troubleshooting

### "Redirect URI mismatch" error

Make sure:
- The **Callback Domain** in Strava settings matches your current environment:
  - Dev: `localhost` (not 127.0.0.1)
  - Prod: `your-domain.com`
- Don't include `http://` or `https://`
- Don't include the port number or path
- If using two applications, make sure you're using the correct Client ID

### "Invalid OAuth state" error

This shouldn't happen with PKCE, but if it does:
- Clear browser cookies for localhost
- Try again

### Upload not appearing on Strava

- Check browser console for errors
- Verify the Client ID is correct
- Make sure you're using `activity:write` scope
- Wait a few seconds (Strava processes uploads asynchronously)

## OAuth Flow

Spinnn uses **OAuth 2.0 with PKCE** (Proof Key for Code Exchange):

1. User clicks "Connect Strava"
2. App generates code verifier and challenge (PKCE)
3. Redirect to Strava with challenge
4. User authorizes on Strava
5. Strava redirects back with authorization code
6. App exchanges code for access token using code_verifier + client_secret
7. Token stored in localStorage: `spinnn_strava_tokens`

**Note**: Strava requires both PKCE and client_secret for token exchange. While PKCE provides protection against authorization code interception, the client_secret will be visible in the browser bundle. For personal use this is acceptable, but production apps should use a backend server.

## Strava API Permissions

Required scope: `activity:write`

This allows Spinnn to:
- Upload new activities
- Set activity name, description, type
- Mark activities as trainer rides

Spinnn does **not** request permission to:
- Read your activities
- Modify existing activities
- Access your profile data
- Access your social data

## Data Storage

All Strava data is stored locally in your browser:

| Key | Purpose |
|-----|---------|
| `spinnn_strava_tokens` | OAuth tokens & athlete info |
| `spinnn_strava_auto_upload` | Auto-upload preference |
| `spinnn_strava_sport_type` | Selected activity type |
| `spinnn_strava_upload_history` | Last 50 uploads |

No data is sent to any server except Strava's official API.

## Security Notes

- ✅ Uses PKCE for authorization code protection
- ✅ Tokens stored in localStorage (client-side only)
- ✅ HTTPS required in production
- ⚠️ Client Secret visible in browser bundle (acceptable for personal use)
- ⚠️ For production apps with many users, implement a backend OAuth proxy
- ⚠️ Tokens can be revoked anytime from Strava settings

## Additional Resources

- [Strava Uploads API Documentation](https://developers.strava.com/docs/uploads/)
- [Strava OAuth Documentation](https://developers.strava.com/docs/authentication/)
- [Device Mapping Request](https://developers.strava.com/docs/uploads/#device-mapping)
