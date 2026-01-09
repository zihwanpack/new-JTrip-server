import express, { Request } from 'express';
import { TripScheduleController } from '../controllers/tripScheduleController';
import { authenticateJwt } from '../middlewares/authenticateJwt';
import { TripScheduleService } from '../../domain/services/tripScheduleService';

const router = express.Router();

// 컨트롤러는 미들웨어에서 생성 (서비스 주입을 위해)
const getTripScheduleController = (req: Request): TripScheduleController => {
  const tripScheduleService = req.app.get(
    'tripScheduleService',
  ) as TripScheduleService;
  return new TripScheduleController(tripScheduleService);
};

// 모든 라우트에 JWT 인증 미들웨어 적용
router.use(authenticateJwt);

// Create Trip
router.post('/', async (req, res) => {
  console.log('Received request to create trip:', req.body);
  await getTripScheduleController(req).createTripHandler(req, res);
});

// Get Trips by Status (구체적인 경로가 일반 경로보다 먼저 와야 함)
// 커서 기반 무한 스크롤 API (더 구체적인 경로가 먼저 와야 함)
router.get('/user/:userId/past/cursor', async (req, res) => {
  await getTripScheduleController(req).getPastTripsByUserIdWithCursorHandler(
    req,
    res,
  );
});

router.get('/user/:userId/upcoming/cursor', async (req, res) => {
  await getTripScheduleController(
    req,
  ).getUpcomingTripsByUserIdWithCursorHandler(req, res);
});

// 기존 API (배열 반환)
router.get('/user/:userId/past', async (req, res) => {
  await getTripScheduleController(req).getPastTripsByUserIdHandler(req, res);
});

router.get('/user/:userId/current', async (req, res) => {
  await getTripScheduleController(req).getCurrentTripsByUserIdHandler(req, res);
});

router.get('/user/:userId/upcoming', async (req, res) => {
  await getTripScheduleController(req).getUpcomingTripsByUserIdHandler(
    req,
    res,
  );
});

// Get Trips (모든 여행)
router.get('/user/:userId', async (req, res) => {
  await getTripScheduleController(req).getTripsByUserIdHandler(req, res);
});

// Get Trip
router.get('/:tripId', async (req, res) => {
  await getTripScheduleController(req).getTripByIdHandler(req, res);
});

// Update Trip
router.patch('/:tripId', async (req, res) => {
  await getTripScheduleController(req).updateTripScheduleHandler(req, res);
});

// Delete Trip
router.delete('/:tripId', async (req, res) => {
  await getTripScheduleController(req).deleteTripHandler(req, res);
});

// Delete Trips
router.delete('/', async (req, res) => {
  await getTripScheduleController(req).deleteTripsHandler(req, res);
});

export default router;
