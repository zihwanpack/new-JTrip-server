import dotenv from 'dotenv';
import { Router } from 'express';
import passport from 'passport';
import { User } from '../../../domain/models/user';
import { generateAccessToken, generateRefreshToken } from '../../../utils/jwt';

const naverRouter = Router();

const env = process.env.NODE_ENV || 'local';

dotenv.config({
  path: `.env.${env}`,
});

naverRouter.get(
  '/',
  passport.authenticate('naver', {
    scope: ['profile', 'email'],
    session: false,
  }),
);

naverRouter.get(
  '/callback',
  passport.authenticate('naver', { failureRedirect: '/', session: false }),
  async (req, res) => {
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

      res.cookie('access_token', accessToken, {
        httpOnly: true,
        sameSite: 'none',
        secure: true,
        maxAge: 1000 * 60 * 5,
      });
      res.cookie('refresh_token', refreshToken, {
        httpOnly: true,
        sameSite: 'none',
        secure: true,
        maxAge: 1000 * 60 * 60 * 24 * 30,
      });

      res.redirect(`${redirectUrlBase}/login`);
    } catch (err) {
      console.error('Naver callback error:', err);
      res.redirect('/');
    }
  },
);

export default naverRouter;
