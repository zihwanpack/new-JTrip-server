import dotenv from 'dotenv';
import { Router } from 'express';
import passport from 'passport';
import { User } from '../../../domain/models/user';
import { generateAccessToken, generateRefreshToken } from '../../../utils/jwt';

const env = process.env.NODE_ENV || 'local';

dotenv.config({
  path: `.env.${env}`,
});

const googleRouter = Router();

googleRouter.get(
  '/',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
  }),
);

googleRouter.get(
  '/callback',
  passport.authenticate('google', { failureRedirect: '/', session: false }),
  async (req, res) => {
    try {
      const user = req.user as User;
      const userService = req.app.get('userService');

      // DB에 유저 저장/업데이트
      const savedUser = await userService.upsertOAuthUser(user);

      const redirectUrlBase =
        process.env.REDIRECT_URL_BASE || 'http://localhost:5173';

      // 자체 JWT 발급
      const jwtPayload = {
        userId: savedUser.id,
        email: savedUser.email,
        provider: savedUser.provider,
      };
      const accessToken = generateAccessToken(jwtPayload);
      const refreshToken = generateRefreshToken(jwtPayload);

      // 토큰을 쿠키로 저장
      res.cookie('access_token', accessToken, {
        httpOnly: true,
        sameSite: 'none',
        secure: true,
        maxAge: 1000 * 60 * 5, // 15분
      });
      res.cookie('refresh_token', refreshToken, {
        httpOnly: true,
        sameSite: 'none',
        secure: true,
        maxAge: 1000 * 60 * 60 * 24 * 30, // 30일
      });

      res.redirect(`${redirectUrlBase}/login`);
    } catch (err) {
      console.error('Google callback error:', err);
      res.redirect('/');
    }
  },
);

export default googleRouter;
