# Design Document: Fix Deployment Build Issues

## Overview

The deployment issue stems from a mismatch between the build configuration and the runtime expectations. The Vite build is configured to output to `dist/public`, but the build process on Render may not be executing correctly or the path resolution at runtime is incorrect. This design addresses the root causes and provides a robust solution.

## Root Cause Analysis

1. **Build Command Mismatch**: The `render.yaml` specifies `npm run build:client` but `package.json` has a `build` script that runs both client and server builds
2. **Path Resolution**: The server uses `process.cwd()` to resolve the dist path, which should work but may have issues in the Render environment
3. **Build Verification**: No verification step confirms the build output exists before deployment completes
4. **Error Handling**: The fallback behavior masks the real issue instead of failing fast

## Architecture

### Build Pipeline Flow

```
Render Deploy Trigger
    ↓
npm ci (install dependencies)
    ↓
npm run setup-models (download ML models)
    ↓
npm run build
    ├── build:client (Vite build → dist/public)
    └── build:server (esbuild → dist/index.js)
    ↓
Verify Build Output
    ↓
npm start (production server)
```

### Directory Structure

```
project-root/
├── client/
│   ├── src/
│   └── index.html
├── server/
│   ├── index.ts
│   ├── routes.ts
│   ├── storage.ts
│   └── vite.ts
├── dist/
│   ├── index.js          (server bundle)
│   └── public/           (client assets)
│       ├── index.html
│       └── assets/
└── package.json
```

## Components and Interfaces

### 1. Build Script Enhancement

**Purpose**: Ensure the build process is reliable and verifiable

**Changes**:
- Update `render.yaml` to use the correct build command
- Add a post-build verification script
- Ensure proper error handling and logging

**Interface**:
```typescript
// New script: verify-build.js
function verifyBuild(): {
  success: boolean;
  missingPaths: string[];
  message: string;
}
```

### 2. Server Static File Serving

**Purpose**: Improve error handling and path resolution in production

**Changes**:
- Use absolute path resolution consistently
- Fail fast if dist/public doesn't exist in production
- Add detailed logging for debugging

**Modified Function**:
```typescript
// server/vite.ts
export function serveStatic(app: Express): void {
  // Resolve path using multiple strategies
  // Log the resolved path for debugging
  // Exit with error code if path doesn't exist
  // Serve static files with proper fallback to index.html
}
```

### 3. Render Configuration

**Purpose**: Ensure the deployment configuration is correct and complete

**Changes**:
- Update `render.yaml` with correct build command
- Add build verification step
- Add logging to confirm build output

**Configuration**:
```yaml
buildCommand: npm ci && npm run setup-models && npm run build && node verify-build.js
```

## Data Models

No new data models required. This is purely a build and deployment configuration fix.

## Error Handling

### Build-Time Errors

1. **Missing Dependencies**: 
   - Fail fast during `npm ci`
   - Log clear error message
   - Exit with non-zero code

2. **Build Failure**:
   - Vite or esbuild errors are logged
   - Build process exits with error code
   - Render deployment fails (desired behavior)

3. **Verification Failure**:
   - Post-build script checks for required files
   - Lists missing files/directories
   - Exits with error code to prevent deployment

### Runtime Errors

1. **Missing dist/public**:
   - Log error with full path attempted
   - Exit process with code 1
   - Prevent server from starting in broken state

2. **File Not Found**:
   - Serve 404 for missing assets
   - Fall back to index.html for SPA routes
   - Log warnings for debugging

## Implementation Strategy

### Phase 1: Build Verification Script
- Create `verify-build.js` to check for required files
- Test locally to ensure it works correctly
- Add to build pipeline

### Phase 2: Update Render Configuration
- Modify `render.yaml` to use correct build command
- Add verification step to build command
- Test deployment

### Phase 3: Improve Server Error Handling
- Update `server/vite.ts` to fail fast in production
- Add detailed logging for path resolution
- Remove fallback behavior that masks issues

### Phase 4: Testing
- Test full build locally with `NODE_ENV=production`
- Deploy to Render and verify logs
- Confirm application serves correctly

## Testing Strategy

### Local Testing

1. **Clean Build Test**:
   ```bash
   rm -rf dist node_modules
   npm ci
   npm run build
   node verify-build.js
   ```

2. **Production Server Test**:
   ```bash
   NODE_ENV=production npm start
   # Verify server starts and serves from dist/public
   ```

3. **Path Resolution Test**:
   - Add logging to show resolved paths
   - Verify paths are correct in different environments

### Deployment Testing

1. **Render Build Logs**:
   - Check that all build steps complete
   - Verify dist/public is created
   - Confirm verification script passes

2. **Runtime Verification**:
   - Check server startup logs
   - Verify no "Build directory not found" warning
   - Test application functionality

3. **Rollback Plan**:
   - Keep previous working deployment
   - Document rollback procedure
   - Test rollback if needed

## Design Decisions and Rationales

### Decision 1: Fail Fast Instead of Fallback
**Rationale**: The current fallback behavior masks the real issue. It's better to fail the deployment so the problem is immediately visible and can be fixed.

### Decision 2: Post-Build Verification Script
**Rationale**: Adding a verification step ensures the build output is correct before the deployment completes. This catches issues early in the pipeline.

### Decision 3: Consistent Path Resolution
**Rationale**: Using `process.cwd()` should work, but adding explicit logging and verification ensures we can debug path issues if they occur.

### Decision 4: Update render.yaml Instead of Package Scripts
**Rationale**: The render.yaml is the source of truth for Render deployments. Fixing it there ensures the correct commands are always used.

## Success Criteria

1. ✅ Build completes successfully on Render
2. ✅ `dist/public` directory exists with all required files
3. ✅ Server starts without "Build directory not found" warning
4. ✅ Application serves correctly from `dist/public`
5. ✅ No fallback behavior is triggered
6. ✅ Logs clearly show the build and serve paths
