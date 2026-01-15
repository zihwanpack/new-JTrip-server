import dotenv from 'dotenv';
import { Router, NextFunction } from 'express';
import passport from 'passport';
import { User } from '../../../domain/models/user';
import { generateAccessToken, generateRefreshToken } from '../../../utils/jwt';
import { setTokenCookies } from '../../../utils/cookieHelper';

dotenv.config();
const env = process.env.NODE_ENV || 'local';
dotenv.config({ path: `.env.${env}` });

const kakaoRouter = Router();

kakaoRouter.get(
  '/',
  passport.authenticate('kakao', {
    scope: ['profile_nickname', 'profile_image', 'account_email'],
    session: false,
  }),
);

kakaoRouter.get(
  '/callback',
  (req, res, next) => {
    passport.authenticate('kakao', { session: false }, (err: any, user: any, info: any) => {
      if (err) {
        // 다른 플랫폼으로 가입된 이메일인 경우
        if (err.existingProvider) {
          const error = new Error(err.message) as any;
          error.status = 409; // Conflict
          error.existingProvider = err.existingProvider;
          error.email = err.email;
          return next(error);
        }
        // 기타 에러
        console.error('Kakao authentication error:', err);
        const error = new Error('인증에 실패했습니다.') as any;
        error.status = 401;
        return next(error);
      }
      if (!user) {
        const error = new Error('인증에 실패했습니다.') as any;
        error.status = 401;
        return next(error);
      }
      req.user = user;
      next();
    })(req, res, next);
  },
  async (req, res, next) => {
    try {
      const user = req.user as User;
      const userService = req.app.get('userService');

      const savedUser = await userService.upsertOAuthUser(user);

      const redirectUrlBase =
        process.env.REDIRECT_URL_BASE || 'http://localhost:5173';

      const jwtPayload = {
        userId: savedUser.id,
        email: savedUser.email,
        provider: savedUser.provider,
      };
      const accessToken = generateAccessToken(jwtPayload);
      const refreshToken = generateRefreshToken(jwtPayload);

      setTokenCookies(res, accessToken, refreshToken);

      res.redirect(`${redirectUrlBase}/login`);
    } catch (err: any) {
      console.error('Kakao callback error:', err);
      return next(err);
    }
  },
);

export default kakaoRouter;
