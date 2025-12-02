# Deploying Jobillo to Railway

## Quick Deploy

Railway is simpler than Render and handles the build process automatically.

### Option 1: Deploy from GitHub (Recommended)

1. **Go to [Railway](https://railway.app/)**
2. **Sign in** with your GitHub account
3. **Click "New Project"**
4. **Select "Deploy from GitHub repo"**
5. **Choose your Jobillo repository**
6. **Railway will automatically:**
   - Detect it's a Node.js project
   - Run `npm ci` to install dependencies
   - Run `npm run setup-models` to download ML models
   - Run `npm run build` to build the app
   - Start the server with `npm start`

### Option 2: Deploy from CLI

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login to Railway
railway login

# Initialize project
railway init

# Deploy
railway up
```

## Environment Variables

Railway automatically sets:
- `PORT` - The port your app should listen on
- `NODE_ENV` - Set to "production" automatically

No additional environment variables are required for basic deployment.

## Configuration Files

The project includes:
- `railway.toml` - Railway-specific configuration
- `nixpacks.toml` - Build configuration for Railway's Nixpacks builder
- `package.json` - Build and start scripts

## Build Process

Railway will execute:
1. `npm ci` - Install dependencies
2. `npm run setup-models` - Download face detection models
3. `npm run build` - Build client and server
   - `npm run build:client` - Vite builds to `dist/public/`
   - `npm run build:server` - esbuild bundles server to `dist/index.js`
   - `npm run verify` - Verifies build output
4. `npm start` - Runs `node dist/index.js`

## Expected Build Output

```
dist/
├── index.js              # Server bundle
└── public/               # Client assets
    ├── index.html
    ├── assets/
    │   ├── index-[hash].js
    │   └── index-[hash].css
    └── models/           # Face detection models
```

## After Deployment

1. **Get your URL**: Railway will provide a URL like `https://jobillo-production.up.railway.app`
2. **Check logs**: Click on your deployment to see real-time logs
3. **Test the app**: Visit your URL and create a room

## Health Check

The app includes a health check endpoint at `/api/health` that Railway uses to verify the app is running.

Test it:
```bash
curl https://your-app.railway.app/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-12-02T...",
  "env": "production"
}
```

## Troubleshooting

### Build Fails

Check the build logs in Railway dashboard. Common issues:
- Missing dependencies: Ensure all packages are in `package.json`
- Build timeout: Railway has generous build timeouts, but very large builds may need optimization

### App Crashes on Start

Check the deployment logs. The app includes detailed startup logging:
```
🔧 Starting server initialization...
✅ Routes registered successfully
🔧 Setting up static file serving...
✅ Successfully located build directory with 3 items
🚀 Server running on 0.0.0.0:PORT
```

If you see "Build directory not found", the build process didn't complete successfully.

### Port Issues

Railway automatically sets the `PORT` environment variable. The app is configured to use this:
```javascript
const port = parseInt(process.env.PORT || '5000', 10);
```

## Advantages of Railway over Render

- ✅ Faster builds (parallel processing)
- ✅ Better free tier (500 hours/month)
- ✅ Automatic HTTPS
- ✅ Better logging interface
- ✅ Easier environment variable management
- ✅ Built-in metrics and monitoring
- ✅ Simpler configuration

## Custom Domain (Optional)

1. Go to your project settings in Railway
2. Click "Domains"
3. Add your custom domain
4. Update your DNS records as instructed

## Monitoring

Railway provides:
- Real-time logs
- CPU and memory usage graphs
- Request metrics
- Deployment history

Access these from your project dashboard.

## Cost

- **Free tier**: 500 hours/month, $5 credit
- **Pro plan**: $5/month for more resources
- **Pay as you go**: After free tier

For a small interview app, the free tier should be sufficient for development and testing.
