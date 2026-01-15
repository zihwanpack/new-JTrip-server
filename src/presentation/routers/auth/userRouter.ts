import { Router } from 'express';
import {
  deleteUser,
  findUserByEmail,
  getUserSearchHandler,
  getUserById,
  logout,
  findUsersByEmails,
} from '../../controllers/userController';
import { authenticateJwt } from '../../middlewares/authenticateJwt';

const userRouter = Router();

// 로그아웃은 인증 없이 접근 가능
userRouter.post('/logout', logout);

userRouter.use(authenticateJwt);

userRouter.get('/email/:email', findUserByEmail);

// 조건 검색 라우트
// userRouter.get('/emails/:email', findUsersByEmail);

// 이메일 배열로 유저 정보 조회
userRouter.post('/emails', findUsersByEmails);

// 조건 검색 라우트 (업데이트)
userRouter.get('/search', getUserSearchHandler);

// 동적 경로는 아래에 위치
userRouter.get('/:id', getUserById);

userRouter.delete('/:id', (req, res) => {
  deleteUser(req, res);
});

export default userRouter;
