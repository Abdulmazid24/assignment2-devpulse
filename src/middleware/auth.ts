import type { NextFunction, Request, Response } from 'express';
import jwt, { type JwtPayload } from 'jsonwebtoken';
import config from '../config/env.js';
import { pool } from '../db/index.js';

export const auth = (...roles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = req.headers.authorization;
      
      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
          errors: 'Missing authentication token',
        });
      }

      const decoded = jwt.verify(token, config.secret) as JwtPayload;

      const userData = await pool.query(`SELECT * FROM users WHERE id = $1`, [decoded.id]);
      const user = userData.rows[0];

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
          errors: 'User associated with this token does not exist',
        });
      }

      if (roles.length && !roles.includes(user.role)) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden',
          errors: 'You do not have the required role to access this resource',
        });
      }

      (req as any).user = decoded;
      next();
    } catch (error: any) {
      next(error);
    }
  };
};
