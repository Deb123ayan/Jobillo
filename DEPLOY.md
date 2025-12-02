# Deploying Jobillo to Render

## Prerequisites
- GitHub repository with your Jobillo code
- Render account (free tier available)

## Deployment Steps

### 1. Push to GitHub
```bash
git add .
git commit -m "Prepare for Render deployment"
git push origin main
```

### 2. Create Render Service
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Select the Jobillo repository

### 3. Configure Service
- **Name**: `jobillo` (or your preferred name)
- **Environment**: `Node`
- **Build Command**: `npm ci && npm run setup-models && npm run build && node verify-build.js`
- **Start Command**: `npm start`
- **Instance Type**: Free (or paid for better performance)

**Note**: The build command includes a verification step that ensures all required files are built correctly before deployment.

### 4. Environment Variables
Set the following in Render dashboard:
- `NODE_ENV`: `production`

### 5. Deploy
Click "Create Web Service" - Render will automatically deploy your app.

## Important Notes

- **Face Detection Models**: The build process automatically downloads required ML models
- **Static Files**: Client build is served from `/dist/public`
- **WebSocket Support**: Render supports WebSocket connections for real-time chat
- **Port Configuration**: Render automatically sets the PORT environment variable
- **Build Time**: Initial deployment may take 5-10 minutes due to model downloads

## Post-Deployment

1. **Test the Application**:
   - Create a room and verify video/chat functionality
   - Test face analysis features
   - Verify WebSocket connections work

2. **Custom Domain** (Optional):
   - Add your custom domain in Render dashboard
   - Update DNS settings as instructed

3. **Monitoring**:
   - Check logs in Render dashboard for any issues
   - Monitor performance and resource usage

## Troubleshooting

### Build Failures
- Check if all dependencies are in `package.json`
- Verify Node.js version compatibility
- Check build logs for specific errors

### Build Verification Failures
If you see "Build verification failed" in the logs:
- Check that both `npm run build:client` and `npm run build:server` completed successfully
- Verify that `dist/public/index.html` exists after the build
- Ensure the `dist/public/assets` directory was created
- Look for any Vite or esbuild errors earlier in the build logs

The verification script checks for:
- `dist/public/` directory exists
- `dist/public/index.html` file exists
- `dist/public/assets/` directory exists
- `dist/index.js` server bundle exists

### Runtime Issues
- Check application logs in Render dashboard
- Verify environment variables are set correctly
- Test locally with `NODE_ENV=production npm start`
- If you see "Build directory not found" error, the build process did not complete successfully

### Performance Issues
- Consider upgrading to a paid Render plan
- Optimize client bundle size
- Enable compression for static assets

## File Structure After Build
```
dist/
├── index.js          # Server bundle
└── public/           # Client static files
    ├── index.html
    ├── assets/       # JS/CSS bundles
    └── models/       # Face detection models
```