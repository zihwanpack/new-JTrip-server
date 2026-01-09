import { Request, Response } from 'express';
import { sendSuccess } from '../../utils/responseHelper';

export function pingController(req: Request, res: Response) {
  sendSuccess(res, 200, 'Pong', 'pong');
}
