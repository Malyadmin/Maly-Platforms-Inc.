import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { createApp } from "./app";
import path from 'path';

// Set NODE_ENV to production if not already set
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'production';
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Add CORS headers for development
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }
      log(logLine);
    }
  });
  next();
});

(async () => {
  try {
    const PORT = 5000;
    let maxRetries = 3;
    let currentTry = 0;

    const cleanupPort = async () => {
      try {
        log('Checking for processes on port 5000...');
        // In Replit environment, just wait a moment for any existing connections to close
        await new Promise(resolve => setTimeout(resolve, 500));
        log('Port cleanup completed');
      } catch (err) {
        log('Port cleanup failed, but continuing...');
      }
    };

    await cleanupPort();
    const { app: routedApp, httpServer } = await createApp();

    // Setup Vite or static serving
    const isProduction = process.env.NODE_ENV === "production";
    log(`NODE_ENV: ${process.env.NODE_ENV}, isProduction: ${isProduction}`);
    
    if (isProduction) {
      log("Using static file serving for production");
      serveStatic(routedApp);
    } else {
      log("Using Vite dev server for development");
      await setupVite(routedApp, httpServer);
    }

    const startServer = async () => {
      try {
        currentTry++;
        log(`Attempting to start server (attempt ${currentTry}/${maxRetries})`);

        await new Promise<void>((resolve, reject) => {
          httpServer.listen(PORT, "0.0.0.0")
            .once('error', (error: NodeJS.ErrnoException) => {
              if (error.code === 'EADDRINUSE') {
                log(`Port ${PORT} is still in use`);
                reject(error);
              } else {
                log(`Error starting server: ${error.message}`);
                reject(error);
              }
            })
            .once('listening', () => {
              log(`Server started successfully on port ${PORT}`);
              resolve();
            });
        });
      } catch (error) {
        if (currentTry < maxRetries) {
          log('Retrying after cleanup...');
          await cleanupPort();
          await new Promise(resolve => setTimeout(resolve, 1000)); // Reduced delay
          return startServer();
        } else {
          throw new Error(`Failed to start server after ${maxRetries} attempts`);
        }
      }
    };

    await startServer();

    // Graceful shutdown handler
    const cleanup = () => {
      log('Initiating graceful shutdown...');
      httpServer.close(() => {
        log('Server closed');
        process.exit(0);
      });
    };

    process.on('SIGTERM', cleanup);
    process.on('SIGINT', cleanup);

  } catch (error) {
    log(`Fatal error: ${error}`);
    process.exit(1);
  }
})();