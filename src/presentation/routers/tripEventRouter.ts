// src/presentation/routes/tripEventRoutes.ts
import { Router, Request } from 'express';
import { TripEventController } from '../controllers/tripEventController';
import { authenticateJwt } from '../middlewares/authenticateJwt';
import { TripEventService } from '../../domain/services/tripEventService';

// 라우터 생성
const eventRouter = Router();

// 컨트롤러는 미들웨어에서 생성 (서비스 주입을 위해)
const getTripEventController = (req: Request): TripEventController => {
  const tripEventService = req.app.get('tripEventService') as TripEventService;
  return new TripEventController(tripEventService);
};

// 모든 라우트에 JWT 인증 미들웨어 적용
eventRouter.use(authenticateJwt);

// 이벤트 생성
eventRouter.post('/', (req, res) => {
  getTripEventController(req).createTripEventHandler(req, res);
});

// 이벤트 업데이트
eventRouter.patch('/:event_id', (req, res) => {
  getTripEventController(req).updateTripEventHandler(req, res);
});

// event_id로 event 단일 조회
eventRouter.get('/:event_id', (req, res) => {
  getTripEventController(req).getTripEventByIdHandler(req, res);
});

// event_id로 event 단일 삭제
eventRouter.delete('/:event_id', (req, res) => {
  getTripEventController(req).deleteTripEventByIdHandler(req, res);
});

// trip_id로 event 모두 조회
eventRouter.get('/all/:trip_id', (req, res) => {
  getTripEventController(req).getTripEventsByTripIdHandler(req, res);
});

export { eventRouter };
