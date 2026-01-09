import { Router } from 'express';

import {
  getNumber,
  minusOne,
  plusOne,
} from '../controllers/calculationController';
import { authenticateJwt } from '../middlewares/authenticateJwt';

const calculationRouter = Router();

// 모든 라우트에 JWT 인증 미들웨어 적용
calculationRouter.use(authenticateJwt);

calculationRouter.get('/', getNumber);
calculationRouter.post('/', plusOne);
calculationRouter.delete('/', minusOne);

export { calculationRouter };
