import { Response } from 'express';

export interface ApiResponse<T = any> {
  isSuccess: boolean;
  code: string;
  message: string;
  result: T | null;
}

export const sendSuccess = <T>(
  res: Response,
  statusCode: number,
  message: string,
  result: T,
): void => {
  res.status(statusCode).json({
    isSuccess: true,
    code: statusCode.toString(),
    message,
    result,
  });
};

export const sendError = (
  res: Response,
  statusCode: number,
  message: string,
): void => {
  res.status(statusCode).json({
    isSuccess: false,
    code: statusCode.toString(),
    message,
    result: null,
  });
};
