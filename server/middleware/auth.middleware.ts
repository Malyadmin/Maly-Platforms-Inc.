import { Request, Response, NextFunction } from "express";
import { db } from "@db";
import { users } from "@db/schema";
import { eq } from "drizzle-orm";

/**
 * Helper function to extract the user ID from a request object in various ways
 * @param req Express request object
 * @returns User ID if found, null otherwise
 */
export function getUserIdFromRequest(req: Request): number | null {
  // Method 1: From passport session (most secure)
  if (req.isAuthenticated() && req.user && (req.user as any).id) {
    return (req.user as any).id;
  }

  // Method 2: From X-User-ID header
  const headerUserId = req.headers['x-user-id'];
  if (headerUserId && typeof headerUserId === 'string') {
    try {
      return parseInt(headerUserId);
    } catch (e) {
      console.warn("Invalid X-User-ID header format:", headerUserId);
    }
  }

  // Method 3: From session ID - doesn't attempt to look up the session
  // as that would require an async operation
  const headerSessionId = req.headers['x-session-id'] as string;
  const cookieSessionId = req.cookies?.sessionId || req.cookies?.maly_session_id;
  const sessionId = headerSessionId || cookieSessionId || req.sessionID;

  if (sessionId) {
    // Note: This would require an async function to look up the sessionId
    // We'll return null here and handle this specific case separately in endpoints
    return null;
  }

  // Method 4: From query parameter or body (least secure, use cautiously)
  if (req.query.userId) {
    try {
      return parseInt(req.query.userId as string);
    } catch (e) {
      console.warn("Invalid userId query parameter:", req.query.userId);
    }
  }

  if (req.body && req.body.userId) {
    try {
      return parseInt(req.body.userId);
    } catch (e) {
      console.warn("Invalid userId in request body:", req.body.userId);
    }
  }

  return null;
}

/**
 * Middleware to check if a user is authenticated
 * @param req Express request object 
 * @param res Express response object
 * @param next Next function to call if authenticated
 */
export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  // First check standard passport authentication
  if (req.isAuthenticated()) {
    return next();
  }

  // Then check for userId header
  if (getUserIdFromRequest(req)) {
    return next();
  }

  // Check if the request wants HTML (browser) vs API (JSON) response
  const acceptsHtml = req.headers.accept && req.headers.accept.includes('text/html');
  
  // For browser requests, redirect to login page
  if (acceptsHtml) {
    console.log("Redirecting unauthenticated user to login page from isAuthenticated middleware");
    return res.redirect('/login');
  }

  // For API requests, return JSON
  return res.status(401).json({ 
    authenticated: false, 
    message: "You need to be logged in to access this resource" 
  });
}

/**
 * Helper to find a user by their session ID
 * This function is deprecated - use req.isAuthenticated() instead
 * @param sessionId The session ID to look up
 * @returns The user object if found, null otherwise
 */
export async function getUserBySessionId(sessionId: string) {
  // This function is no longer needed since we rely on express-session
  // and passport for session management
  console.warn("getUserBySessionId is deprecated - use req.isAuthenticated() instead");
  return null;
}

/**
 * Check authentication status and return user data
 * @param req Express request object
 * @param res Express response object
 * @param next Optional next function for middleware use
 */
export async function checkAuthentication(req: Request, res: Response, next?: NextFunction) {
  console.log("Checking authentication for:", req.url);

  // Check if user is authenticated through passport session
  if (req.isAuthenticated() && req.user) {
    console.log("Auth check: User is authenticated via passport");
    
    // If this is being used as middleware, call next
    if (next) {
      return next();
    }
    
    // Otherwise return authentication status with user data
    return res.json({ 
      authenticated: true,
      user: req.user
    });
  }

  // Authentication failed
  console.log("Auth check: User not authenticated");
  
  // Check if the request wants HTML (browser) vs API (JSON) response
  const acceptsHtml = req.headers.accept && req.headers.accept.includes('text/html');
  
  // For middleware usage, we return 401 instead of automatically redirecting
  if (next) {
    return res.status(401).json({ 
      authenticated: false,
      message: "Authentication required" 
    });
  }
  
  // For browser requests, redirect to login page
  if (acceptsHtml) {
    console.log("Redirecting unauthenticated user to login page");
    return res.redirect('/auth'); // Changed from /login to /auth to match your app
  }
  
  // For API requests, return JSON
  return res.json({ 
    authenticated: false,
    message: "Not logged in"
  });
}

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  // Check if user is authenticated through passport session
  if (req.isAuthenticated()) {
    return next();
  }
  
  // Authentication failed - return 401
  return res.status(401).json({ error: 'Authentication required' });
};