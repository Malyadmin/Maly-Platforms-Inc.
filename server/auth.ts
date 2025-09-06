import passport from "passport";
import { IVerifyOptions, Strategy as LocalStrategy } from "passport-local";
import { type Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import pgSession from "connect-pg-simple";
import { createHash } from "crypto";
import { users } from "@db/schema";
import { db } from "@db";
import { eq, or, lte } from "drizzle-orm";
import { checkAuthentication } from './middleware/auth.middleware';
import { uploadImage } from './middleware/upload';
import { uploadToCloudinary } from './services/cloudinaryService';
import fs from 'fs';
import path from 'path';
import pgPool from './lib/pg-pool';

// Define the User type to match our schema
type UserType = {
  id: number;
  username: string;
  email: string;
  password: string;
  fullName: string | null;
  profileImage: string | null;
  location: string | null;
  interests: string[] | null;
  currentMoods?: string[] | null;
  profession?: string | null;
  age?: number | null;
  gender?: string | null;
  nextLocation?: string | null;
  createdAt: Date | null;
};

declare global {
  namespace Express {
    // Define the User interface without circular reference
    interface User {
      id: number;
      username: string;
      email: string;
      password: string;
      fullName: string | null;
      profileImage: string | null;
      location: string | null;
      interests: string[] | null;
      currentMoods?: string[] | null;
      profession?: string | null;
      age?: number | null;
      gender?: string | null;
      nextLocation?: string | null;
      createdAt: Date | null;
    }
  }
}

const crypto = {
  hash: async (password: string): Promise<string> => {
    console.log("Hashing new password");
    const hashedPassword = createHash('sha256').update(password).digest('hex');
    console.log("Generated hash length:", hashedPassword.length);
    return hashedPassword;
  },
  compare: async (suppliedPassword: string, storedPassword: string): Promise<boolean> => {
    console.log("Comparing passwords");
    console.log("Stored password hash length:", storedPassword.length);
    const hashedSupplied = createHash('sha256').update(suppliedPassword).digest('hex');
    console.log("Supplied password hash length:", hashedSupplied.length);
    console.log("Hashes match:", hashedSupplied === storedPassword);
    return hashedSupplied === storedPassword;
  }
};

export function setupAuth(app: Express) {
  // Use a stronger session secret combining REPL_ID and a fixed key, or use SESSION_SECRET env var
  const sessionSecret = process.env.SESSION_SECRET || 
    (process.env.REPL_ID 
      ? `${process.env.REPL_ID}-maly-platform-key-${process.env.REPL_OWNER || 'default'}`
      : "maly-platform-local-development-secret-key");
  
  // Initialize PostgreSQL Session store
  const PgSession = pgSession(session);

  const sessionSettings: session.SessionOptions = {
    store: new PgSession({
      pool: pgPool,                // PostgreSQL connection pool
      tableName: "session",        // Default is "session"
      createTableIfMissing: true   // Create the session table if it doesn't exist
    }),
    secret: sessionSecret,
    name: "maly_session",
    resave: false,                // Don't save unchanged sessions
    saveUninitialized: false,     // Don't create empty sessions
    rolling: true,
    cookie: {
      maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      secure: process.env.NODE_ENV === "production"
    }
  };

  // Always trust the proxy in Replit environment
  app.set("trust proxy", 1);

  // Detect Replit environment 
  const isReplit = !!process.env.REPL_ID;
  const isHTTPS = process.env.HTTPS === 'true';

  // Configure cookie security based on environment
  if (isReplit || isHTTPS || app.get("env") === "production") {
    // Use secure cookies in Replit environment or production
    sessionSettings.cookie = { 
      ...sessionSettings.cookie,
      sameSite: 'none', // Required for cross-site cookie access (including webview)
      secure: true // Needed for sameSite: 'none'
    };
  }
  
  // Log session configuration for debugging
  console.log("Using PostgreSQL session store with table:", "session");

  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (usernameOrEmail, password, done) => {
      try {
        console.log("Login attempt for usernameOrEmail:", usernameOrEmail);

        // Check if the input is an email (contains @)
        const isEmail = usernameOrEmail.includes('@');

        // Search by either username or email
        const [user] = await db
          .select()
          .from(users)
          .where(isEmail ? eq(users.email, usernameOrEmail) : eq(users.username, usernameOrEmail))
          .limit(1);

        if (!user) {
          console.log("No user found with", isEmail ? "email" : "username", ":", usernameOrEmail);
          return done(null, false, { message: "Invalid username/email or password." });
        }

        console.log("Found user:", { id: user.id, username: user.username });
        const isMatch = await crypto.compare(password, user.password);

        if (!isMatch) {
          console.log("Password mismatch for user:", usernameOrEmail);
          return done(null, false, { message: "Invalid username/email or password." });
        }

        console.log("Login successful for user:", usernameOrEmail);
        return done(null, user);
      } catch (err) {
        console.error("Login error:", err);
        return done(err);
      }
    })
  );

  passport.serializeUser((user, done) => {
    console.log("Serializing user:", user.id);
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      console.log("Deserializing user:", id);
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, id))
        .limit(1);
      
      if (!user) {
        console.log("User not found during deserialization, clearing session for ID:", id);
        // Return null user which will clear the session
        return done(null, null);
      }
      
      console.log("Deserialized user found:", user.username);
      done(null, user);
    } catch (err) {
      console.error("Deserialization error:", err);
      // Return null to clear invalid session rather than throwing error
      done(null, null);
    }
  });

  app.post("/api/register", uploadImage.single('profileImage'), async (req, res, next) => {
    try {
      console.log("Registration attempt:", req.body);
      const { 
        username, 
        email,
        password, 
        fullName, 
        location, 
        interests,
        profession,
        currentMoods,
        age,
        gender,
        nextLocation
      } = req.body;
      
      // Handle the uploaded profile image
      const profileImage = req.file ? getFileUrl(req.file.filename) : null;

      if (!username || !password || !email) {
        return res.status(400).send("Username, email, and password are required");
      }

      if (username.length < 3) {
        return res.status(400).send("Username must be at least 3 characters long");
      }

      if (password.length < 6) {
        return res.status(400).send("Password must be at least 6 characters long");
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).send("Please enter a valid email address");
      }

      // Check if username already exists
      const [existingUsername] = await db
        .select()
        .from(users)
        .where(eq(users.username, username))
        .limit(1);

      if (existingUsername) {
        return res.status(400).send("Username already exists");
      }

      // Check if email already exists
      const [existingEmail] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (existingEmail) {
        return res.status(400).send("Email address already in use");
      }

      // Hash the password
      const hashedPassword = await crypto.hash(password);
      console.log("Password hashed successfully for new user");

      // Ensure interests and moods are always arrays or null
      const processedInterests = interests && Array.isArray(interests) ? interests : null;
      const processedMoods = currentMoods && Array.isArray(currentMoods) ? currentMoods : null;

      // Create additional user metadata
      const userData = {
        profession: profession || null,
        age: age ? Number(age) : null,
        gender: gender || null,
        nextLocation: nextLocation || null
      };

      // Create user with extended fields
      try {
        const [newUser] = await db
          .insert(users)
          .values({
            username,
            email,
            password: hashedPassword,
            fullName: fullName || null,
            location: location || null,
            interests: processedInterests,
            profileImage: profileImage || null,
            // Add new fields if they're supported in the schema
            ...userData
          })
          .returning();

        console.log("User registered successfully:", username);

        // Generate JWT token for mobile compatibility
        const jwt = require('jsonwebtoken');
        const SESSION_SECRET = process.env.SESSION_SECRET || 'default-session-secret';
        const token = jwt.sign(
          { 
            id: newUser.id,
            email: newUser.email,
            username: newUser.username
          },
          SESSION_SECRET,
          { expiresIn: '30d' }
        );

        req.login(newUser, (err) => {
          if (err) {
            console.error("Login after registration failed:", err);
            return next(err);
          }
          req.session.save((err) => {
            if (err) {
              console.error("Session save error:", err);
              return next(err);
            }
            console.log("Registration successful - created both session and JWT for user:", username);
            return res.json({ 
              user: newUser,
              authenticated: true,
              token: token // Include JWT token for iOS compatibility
            });
          });
        });
      } catch (dbError) {
        console.error("Database error during registration:", dbError);
        return res.status(500).send("Error creating user account");
      }
    } catch (error) {
      console.error("Registration error:", error);
      next(error);
    }
  });

  // Add a direct registration-with-redirect endpoint with file upload support
  app.post("/api/register-redirect", uploadImage.single('profileImage'), async (req, res) => {
    try {
      console.log("Registration+redirect attempt:", req.body);
      console.log("File upload received:", req.file ? "Yes" : "No");
      if (req.file) {
        console.log("File details:", {
          fieldname: req.file.fieldname,
          originalname: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size,
          buffer: req.file.buffer ? "Buffer present" : "No buffer",
          path: req.file.path || "No path"
        });
      }
      
      const { 
        username, 
        email,
        password, 
        fullName, 
        location, 
        interests,
        profession,
        currentMoods,
        age,
        gender,
        nextLocation
      } = req.body;
      
      // Handle the uploaded profile image (with Cloudinary support)
      let profileImage = null;
      
      if (req.file) {
        try {
          const result = await uploadToCloudinary(
            req.file.buffer, 
            req.file.originalname, 
            'image',
            `profiles/${username}`
          );
          profileImage = result.secure_url;
          console.log(`Successfully uploaded profile image to Cloudinary: ${profileImage}`);
        } catch (cloudinaryError) {
          console.error("Error uploading to Cloudinary during registration:", cloudinaryError);
          // Don't use fallback - encourage proper Cloudinary setup
          profileImage = null;
        }
      }

      // Basic validation
      if (!username || !password || !email) {
        return res.redirect('/auth?error=Required+fields+missing');
      }

      if (username.length < 3) {
        return res.redirect('/auth?error=Username+too+short');
      }

      if (password.length < 6) {
        return res.redirect('/auth?error=Password+too+short');
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.redirect('/auth?error=Invalid+email+format');
      }

      // Check if username already exists
      const [existingUsername] = await db
        .select()
        .from(users)
        .where(eq(users.username, username))
        .limit(1);

      if (existingUsername) {
        return res.redirect('/auth?error=Username+already+exists');
      }

      // Check if email already exists
      const [existingEmail] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (existingEmail) {
        return res.redirect('/auth?error=Email+already+in+use');
      }

      // Hash the password
      const hashedPassword = await crypto.hash(password);

      // Process interests - handle string or JSON format
      let processedInterests = null;
      if (interests) {
        if (typeof interests === 'string') {
          // Check if it's a JSON string
          if (interests.startsWith('[') && interests.endsWith(']')) {
            try {
              processedInterests = JSON.parse(interests);
            } catch (e) {
              // If it's not valid JSON, assume it's comma-separated
              processedInterests = interests.split(',').map((i: string) => i.trim());
            }
          } else {
            // Assume comma-separated string
            processedInterests = interests.split(',').map((i: string) => i.trim());
          }
        } else if (Array.isArray(interests)) {
          processedInterests = interests;
        }
      }

      // Create additional user metadata
      const userData = {
        profession: profession || null,
        age: age ? Number(age) : null,
        gender: gender || null,
        nextLocation: nextLocation || null
      };

      try {
        const [newUser] = await db
          .insert(users)
          .values({
            username,
            email,
            password: hashedPassword,
            fullName: fullName || null,
            location: location || null,
            interests: processedInterests,
            profileImage: profileImage || null,
            ...userData
          })
          .returning();

        console.log("User registered successfully for redirect flow:", username);

        req.login(newUser, (err) => {
          if (err) {
            console.error("Login after registration failed in redirect flow:", err);
            return res.redirect('/auth?error=Authentication+failed+after+registration');
          }

          // Save session and redirect
          req.session.save((err) => {
            if (err) {
              console.error("Session save error during redirect flow:", err);
              return res.redirect('/auth?error=Session+error');
            }

            console.log("Registration successful, redirecting to homepage");
            return res.redirect('/');
          });
        });
      } catch (dbError) {
        console.error("Database error during registration redirect flow:", dbError);
        return res.redirect('/auth?error=Failed+to+create+account');
      }
    } catch (error) {
      console.error("Registration error in redirect flow:", error);
      return res.redirect('/auth?error=Registration+failed');
    }
  });

  app.post("/api/login", (req, res, next) => {
    const usernameOrEmail = req.body.username; // We keep the parameter name as 'username' for backward compatibility
    console.log("Login attempt:", { usernameOrEmail });

    if (!usernameOrEmail || !req.body.password) {
      return res.status(400).send("Email/username and password are required");
    }

    passport.authenticate("local", (err: any, user: Express.User, info: IVerifyOptions) => {
      console.log("Passport auth result:", { err, user: !!user, info });

      if (err) {
        return next(err);
      }

      if (!user) {
        return res.status(400).send(info.message ?? "Invalid email/username or password");
      }

      req.logIn(user, (err) => {
        if (err) {
          console.error("Login error:", err);
          return next(err);
        }

        // Save session explicitly to ensure it's stored before responding
        req.session.save(async (err) => {
          if (err) {
            console.error("Session save error:", err);
            return next(err);
          }

          // Session management is now handled by connect-pg-simple
          // Manual session database operations removed to prevent schema conflicts
          console.log("Session managed by connect-pg-simple, sessionID:", req.session.id);

          // Sanitize the user object before sending it (remove password)
          const { password, ...userWithoutPassword } = user as any;

          // Generate JWT token for mobile app support
          const jwt = await import('jsonwebtoken');
          const SESSION_SECRET = process.env.SESSION_SECRET || 'default-session-secret';
          
          const token = jwt.default.sign(
            { 
              id: user.id, 
              email: user.email,
              username: user.username 
            },
            SESSION_SECRET,
            { 
              expiresIn: '30d' // 30 days to match session expiry
            }
          );

          console.log("Login successful, session established");
          return res.json({
            user: userWithoutPassword,
            authenticated: true,
            sessionId: req.session.id, // Include the session ID in the response for web compatibility
            token: token // Include JWT token for mobile app support
          });
        });
      });
    })(req, res, next);
  });

  // Add a direct login-with-redirect endpoint for form submission
  app.post("/api/login-redirect", (req, res, next) => {
    const usernameOrEmail = req.body.username;
    console.log("Login+redirect attempt:", { usernameOrEmail });

    if (!usernameOrEmail || !req.body.password) {
      return res.redirect('/auth?error=Email/username+and+password+are+required');
    }

    passport.authenticate("local", (err: any, user: Express.User, info: IVerifyOptions) => {
      if (err) {
        console.error("Login error during redirect flow:", err);
        return res.redirect('/auth?error=Server+error+occurred');
      }

      if (!user) {
        console.log("Failed login during redirect flow:", info?.message);
        return res.redirect('/auth?error=Invalid+credentials');
      }

      req.logIn(user, async (err) => {
        if (err) {
          console.error("Login error during redirect flow:", err);
          return res.redirect('/auth?error=Authentication+failed');
        }

        // Session management handled by connect-pg-simple
        // Manual session database operations removed to prevent schema conflicts
        const sessionId = req.sessionID;
        console.log("Session managed by connect-pg-simple for redirect flow:", sessionId);

        // Save session and redirect with session cookie and header
        req.session.save((err) => {
          if (err) {
            console.error("Session save error during redirect flow:", err);
            return res.redirect('/auth?error=Session+error');
          }

          console.log("Login successful, redirecting to homepage with session:", req.sessionID);

          // Set cookies with different names to maximize persistence
          // Main session ID cookie
          res.cookie('maly_session_id', sessionId, {
            maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
            httpOnly: true,
            sameSite: 'lax' // Use 'lax' instead of 'none' to improve persistence
          });
          
          // Backup session ID cookie
          res.cookie('sessionId', sessionId, {
            maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
            httpOnly: true,
            sameSite: 'lax'
          });
          
          // Set x-session-id header
          res.setHeader('x-session-id', sessionId);

          // Add a timestamp to break browser caching and include session ID in URL
          const timestamp = Date.now();
          return res.redirect(`/?sessionId=${sessionId}&ts=${timestamp}`);
        });
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res) => {
    const username = req.user?.username;
    console.log("Logout attempt for user:", username);

    req.logout((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).send("Logout failed");
      }

      // Destroy the session completely for a clean logout
      req.session.destroy((err) => {
        if (err) {
          console.error("Session destroy error:", err);
          // Continue anyway as the user is already logged out
        }

        // Clear all the session cookies we've set
        res.clearCookie('maly_session', {
          path: '/',
          httpOnly: true,
          sameSite: 'lax'
        });
        
        res.clearCookie('maly_session_id', {
          path: '/',
          httpOnly: true,
          sameSite: 'lax'
        });
        
        res.clearCookie('sessionId', {
          path: '/',
          httpOnly: true,
          sameSite: 'lax'
        });
        
        // Also clear the default Express session cookie
        res.clearCookie('connect.sid', {
          path: '/',
          httpOnly: true,
          sameSite: 'lax'
        });

        console.log("Logout successful for user:", username);
        res.json({ message: "Logged out successfully" });
      });
    });
  });

  // Create a simple in-memory cache for auth checks to reduce database load
  const authCache = new Map<string, {
    userId: number;
    user: any;
    expires: number;
  }>();

  // Cache session checks for 5 minutes
  const AUTH_CACHE_TTL = 5 * 60 * 1000;

  // Cleanup expired cache entries periodically
  setInterval(() => {
    const now = Date.now();
    // Convert entries to array to avoid iterator issues
    Array.from(authCache.entries()).forEach(([key, value]) => {
      if (value.expires < now) {
        authCache.delete(key);
      }
    });
  }, 60 * 1000); // Run cleanup every minute

  // Helper function to get userId from request in various ways
  // The getUserIdFromRequest and isAuthenticated functions have been moved to server/middleware/auth.middleware.ts

  // Add a dedicated auth check endpoint
  app.get("/api/auth/check", async (req, res) => {
    // Set proper cache headers - allow browser to cache for 5 minutes
    res.set('Cache-Control', 'private, max-age=300');
    
    // Use the centralized checkAuthentication function
    await checkAuthentication(req, res);
  });

  app.get("/api/user", (req, res) => {
    // Log session ID for debugging
    console.log("Session ID in /api/user:", req.sessionID);

    // Check authentication directly rather than trying to reload the session
    if (req.isAuthenticated() && req.user) {
      const user = req.user;
      console.log("Authenticated user request:", user.username);

      // Sanitize user object to remove sensitive info (like password)
      const { password, ...userWithoutPassword } = user as any;

      return res.json(userWithoutPassword);
    }

    console.log("Unauthenticated user request");
    res.status(401).send("Not authenticated");
  });

  // Add endpoint for updating user profiles
  app.post("/api/profile", async (req, res) => {
    try {
      // Check if user is authenticated through Passport
      if (req.isAuthenticated() && req.user) {
        // Use the authenticated user object directly
        const userId = (req.user as any).id;

        if (!userId) {
          return res.status(401).json({ error: "Not authenticated - Invalid user" });
        }

        const updatedFields = req.body;

        // Remove sensitive fields that shouldn't be updated directly
        const { password, id, ...safeFields } = updatedFields;

        // Process arrays
        if (safeFields.interests && Array.isArray(safeFields.interests)) {
          safeFields.interests = safeFields.interests.length > 0 ? safeFields.interests : null;
        }

        if (safeFields.currentMoods && Array.isArray(safeFields.currentMoods)) {
          safeFields.currentMoods = safeFields.currentMoods.length > 0 ? safeFields.currentMoods : null;
        }

        // Update the user
        const [updatedUser] = await db
          .update(users)
          .set(safeFields)
          .where(eq(users.id, userId))
          .returning();

        res.json(updatedUser);
      } else {
        return res.status(401).json({ error: "Not authenticated" });
      }
    } catch (error) {
      console.error("Profile update error:", error);
      res.status(500).send("Failed to update profile");
    }
  });


  // User-by-session endpoint is defined in server/routes.ts to avoid duplication

  // Add endpoint for verifying a cached user exists
  app.post("/api/verify-user", async (req, res) => {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).send("No user ID provided");
    }

    try {
      // Get user from database to verify they exist
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user) {
        return res.status(404).send("User not found");
      }

      console.log("User verified exists:", user.username);
      return res.status(200).send({ valid: true });
    } catch (dbError) {
      console.error("Database error verifying user:", dbError);
      return res.status(500).send("Error verifying user");
    }
  });

  // Add endpoint to check for Replit environment
  app.get("/api/replit-info", (req, res) => {
    // Check if we're running in a Replit environment
    const isReplitEnv = process.env.REPL_ID && process.env.REPL_OWNER;

    if (isReplitEnv) {
      res.json({
        isReplit: true,
        replId: process.env.REPL_ID,
        owner: process.env.REPL_OWNER,
        slug: process.env.REPL_SLUG
      });
    } else {
      res.json({
        isReplit: false
      });
    }
  });
}