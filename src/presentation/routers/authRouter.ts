import { Router } from 'express';

import googleRouter from './auth/googleRouter';
import naverRouter from './auth/naverRouter';
import kakaoRouter from './auth/kakaoRouter';
import userRouter from './auth/userRouter';
import { issueAccessToken } from '../controllers/accessTokenController';
import { getAuthUser } from '../controllers/userController';
import { authenticateJwt } from '../middlewares/authenticateJwt';

const authRouter = Router();

authRouter.use('/google', googleRouter);
authRouter.use('/naver', naverRouter);
authRouter.use('/kakao', kakaoRouter);
authRouter.use('/users', userRouter);
authRouter.post('/token', issueAccessToken);
authRouter.get('/user', authenticateJwt, getAuthUser);

export default authRouter;
