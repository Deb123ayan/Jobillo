import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config";
import { nanoid } from "nanoid";

const viteLogger = createLogger();

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  // When running the compiled server (dist/index.js), we need to resolve relative to the server location
  // The compiled server is at dist/index.js, and public assets are at dist/public/
  const distPath = path.resolve(import.meta.dirname, "public");

  log(`Attempting to serve static files from: ${distPath}`);

  // Check if the dist/public directory exists
  if (!fs.existsSync(distPath)) {
    console.error(`❌ FATAL ERROR: Build directory not found at ${distPath}`);
    console.error("The application cannot start without the built frontend assets.");
    console.error('This usually means the build process did not complete successfully.');
    console.error('Please check the build logs and ensure "npm run build" completes without errors.');
    console.error('\nDebug info:');
    console.error(`  - import.meta.dirname: ${import.meta.dirname}`);
    console.error(`  - Resolved distPath: ${distPath}`);
    process.exit(1);
  }

  // Verify index.html exists
  const indexPath = path.resolve(distPath, "index.html");
  if (!fs.existsSync(indexPath)) {
    console.error(`❌ FATAL ERROR: index.html not found at ${indexPath}`);
    console.error("The build directory exists but is missing critical files.");
    console.error('Please run "npm run build" to rebuild the application.');
    process.exit(1);
  }

  log(
    `✅ Successfully located build directory with ${
      fs.readdirSync(distPath).length
    } items`
  );

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist (SPA fallback)
  app.use("*", (_req, res) => {
    res.sendFile(indexPath);
  });
}
