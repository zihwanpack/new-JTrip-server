import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../../utils/jwt';
import { sendError } from '../../utils/responseHelper';

export const authenticateJwt = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const token = req.cookies?.access_token;

  if (!token) {
    sendError(res, 401, 'No token provided');
    return;
  }

  const payload = verifyToken(token);

  if (!payload) {
    sendError(res, 401, 'Invalid or expired token');
    return;
  }

  (req as any).jwtPayload = payload;
  next();
};
