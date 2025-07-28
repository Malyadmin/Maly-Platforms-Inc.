import { Request, Response, NextFunction } from 'express';
import { db } from '../../db';
import { users } from '../../db/schema';
import { eq } from 'drizzle-orm';

export const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userId = (req.user as any).id;
    
    // Check if user exists and is admin
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: {
        id: true,
        isAdmin: true
      }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (!user.isAdmin) {
      return res.status(403).json({ error: 'Admin privileges required' });
    }
    
    next();
  } catch (error) {
    console.error('Error checking admin privileges:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};