import { Router } from 'express';
import { eventRouter } from './tripEventRouter';
import authRouter from './authRouter';
import userRouter from './auth/userRouter';
import tripScheduleRouter from './tripScheduleRouter';

const rootRouter = Router();

rootRouter.use('/auth', authRouter);
rootRouter.use('/users', userRouter);
rootRouter.use('/trips', tripScheduleRouter);
rootRouter.use('/event', eventRouter);

export { rootRouter };
