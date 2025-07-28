import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface JWTPayload {
  id: number;
  email: string;
  username: string;
  iat: number;
  exp: number;
}

/**
 * JWT verification middleware for mobile app authentication
 * Extracts Bearer token from Authorization header and verifies it
 * Attaches decoded user payload to req.user if valid
 */
export function verifyToken(req: Request, res: Response, next: NextFunction): void {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Authorization header with Bearer token required' });
      return;
    }

    // Extract token from "Bearer <token>"
    const token = authHeader.substring(7);
    
    if (!token) {
      res.status(401).json({ error: 'Token not provided' });
      return;
    }

    // Verify token using SESSION_SECRET
    const SESSION_SECRET = process.env.SESSION_SECRET || 'default-session-secret';
    
    const decoded = jwt.verify(token, SESSION_SECRET) as JWTPayload;
    
    // Attach user payload to request object (using Express.User interface)
    req.user = {
      id: decoded.id,
      email: decoded.email,
      username: decoded.username,
      password: '', // Not needed for JWT auth
      fullName: null,
      profileImage: null,
      location: null,
      interests: null,
      currentMoods: null,
      profession: null,
      age: null,
      gender: null,
      nextLocation: null,
      createdAt: null
    };

    console.log("JWT verification successful for user:", req.user?.username);
    next();
    
  } catch (error) {
    console.error("JWT verification failed:", error);
    
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: 'Token expired' });
      return;
    }
    
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }
    
    res.status(500).json({ error: 'Token verification failed' });
  }
}

/**
 * Optional JWT verification middleware that doesn't fail if no token is provided
 * Useful for routes that can work with or without authentication
 */
export function verifyTokenOptional(req: Request, res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;
    
    // If no auth header, continue without setting req.user
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      next();
      return;
    }

    const token = authHeader.substring(7);
    
    if (!token) {
      next();
      return;
    }

    const SESSION_SECRET = process.env.SESSION_SECRET || 'default-session-secret';
    const decoded = jwt.verify(token, SESSION_SECRET) as JWTPayload;
    
    req.user = {
      id: decoded.id,
      email: decoded.email,
      username: decoded.username,
      password: '', // Not needed for JWT auth
      fullName: null,
      profileImage: null,
      location: null,
      interests: null,
      currentMoods: null,
      profession: null,
      age: null,
      gender: null,
      nextLocation: null,
      createdAt: null
    };

    console.log("Optional JWT verification successful for user:", req.user?.username);
    next();
    
  } catch (error) {
    console.error("Optional JWT verification failed, continuing without auth:", error);
    // Continue without authentication for optional middleware
    next();
  }
}