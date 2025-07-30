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
 * Note: This function is deprecated since we now use Express sessions with connect-pg-simple
 * Express sessions should be accessed through req.session.passport.user
 * @param sessionId The session ID to look up
 * @returns The user object if found, null otherwise
 */
export async function getUserBySessionId(sessionId: string) {
  console.warn("getUserBySessionId is deprecated. Use Express session instead: req.session.passport.user");
  return null;
}

/**
 * Check authentication status and return user data
 * @param req Express request object
 * @param res Express response object
 * @param next Optional next function for middleware use
 */
export async function checkAuthentication(req: Request, res: Response, next?: NextFunction) {
  // Check for session ID in headers (from the X-Session-ID header)
  const headerSessionId = req.headers['x-session-id'] as string;

  // Also check for session ID in cookies as a fallback
  const cookieSessionId = req.cookies?.sessionId || req.cookies?.maly_session_id;

  // Check express session ID
  const expressSessionId = req.sessionID;

  // Use header session ID first, then fall back to cookie, then express session
  const sessionId = headerSessionId || cookieSessionId || expressSessionId;
  console.log("Session ID in auth check:", sessionId);

  // Debug session ID sources
  console.log("Auth check session sources:", {
    fromHeader: headerSessionId || 'not_present',
    fromCookie: cookieSessionId || 'not_present',
    fromExpressSession: expressSessionId || 'not_present',
    finalSessionId: sessionId || 'none_found',
    url: req.url
  });

  // First check if user is authenticated through passport session
  if (req.isAuthenticated() && req.user) {
    console.log("Auth check: User is authenticated via passport");
    
    // Make sure to store the session ID for future use
    if (sessionId) {
      res.setHeader('x-session-id', sessionId);
      // Set a cookie as well for more reliable persistence
      res.cookie('maly_session_id', sessionId, { 
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        httpOnly: true,
        sameSite: 'lax'
      });
    }
    
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

  // Try to get user from Express session data if available
  if (req.session && (req.session as any).passport && (req.session as any).passport.user) {
    try {
      const userId = (req.session as any).passport.user;
      console.log("Auth check: Found user ID in Express session:", userId);
      
      // Find the user by ID
      const userResults = await db
        .select()
        .from(users)
        .where(eq(users.id, userId));
      
      console.log("Auth check: User lookup result count:", userResults.length);
      
      if (userResults.length > 0) {
        const user = userResults[0];
        console.log("Auth check: User authenticated via Express session:", user.username);
        
        // Attach the user to the request object so it's available in routes
        req.user = user as any;
        
        // If this is being used as middleware, call next
        if (next) {
          return next();
        }
        
        // Otherwise return authentication status with user data
        return res.json({
          authenticated: true,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            fullName: user.fullName,
            profileImage: user.profileImage,
            // Add other user fields as needed but exclude sensitive data
            isPremium: user.isPremium,
            isAdmin: user.isAdmin
          }
        });
      }
    } catch (error) {
      console.error("Error authenticating via Express session:", error);
    }
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
  if (req.isAuthenticated()) {
    return next();
  }

  // Try to get user from Express session data
  // Express session should handle session persistence through connect-pg-simple
  if (req.session && (req.session as any).passport && (req.session as any).passport.user) {
    try {
      const userId = (req.session as any).passport.user;
      console.log("Found user ID in Express session:", userId);
      
      // Load the full user from database
      const userQuery = await db
        .select()
        .from(users)
        .where(eq(users.id, userId));
        
      if (userQuery.length > 0) {
        req.user = userQuery[0] as any;
        console.log("User loaded from Express session:", req.user?.username);
        return next();
      }
    } catch (error) {
      console.error("Error loading user from Express session:", error);
    }
  }
  
  return res.status(401).json({ error: 'Authentication required' });
};