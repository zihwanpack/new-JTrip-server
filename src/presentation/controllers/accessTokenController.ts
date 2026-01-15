import { RequestHandler } from 'express';
import {
  verifyToken,
  generateAccessToken,
  generateRefreshToken,
} from '../../utils/jwt';
import { sendSuccess, sendError } from '../../utils/responseHelper';
import {
  setTokenCookies,
  clearRefreshTokenCookie,
} from '../../utils/cookieHelper';

export const issueAccessToken: RequestHandler = async (req, res) => {
  try {
    // 1. 쿠키에서 refresh_token 가져오기
    const refreshToken = req.cookies?.refresh_token;
    if (!refreshToken) {
      sendError(res, 401, 'No refresh token');
      return;
    }

    // 2. JWT 검증
    const payload = verifyToken(refreshToken);
    if (!payload) {
      clearRefreshTokenCookie(res);
      sendError(res, 401, 'Invalid or expired refresh token');
      return;
    }

    // 3. 새 토큰 발급
    const jwtPayload = {
      userId: payload.userId,
      email: payload.email,
      provider: payload.provider,
    };
    const newAccessToken = generateAccessToken(jwtPayload);
    const newRefreshToken = generateRefreshToken(jwtPayload);

    // 4. 쿠키 갱신
    setTokenCookies(res, newAccessToken, newRefreshToken);

    sendSuccess(res, 200, 'Access token issued', {
      message: 'Access token issued',
    });
    return;
  } catch (err) {
    console.error('issueAccessToken error:', err);
    sendError(res, 500, 'Failed to issue access token');
  }
};
