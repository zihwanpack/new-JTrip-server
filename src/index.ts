import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import passport from 'passport';
import path from 'path';
import cookieParser from 'cookie-parser';

import initPassport from './data/integrations/passport/initPassport';
import { rootRouter } from './presentation/routers';
import { di } from './di';
import { setupSwagger } from './config/swagger';

const app = express();
app.set('trust proxy', 1);

di(app);

//적용 env 체크함
const env = process.env.NODE_ENV || 'local';
dotenv.config({
  path: `.env.${env}`,
});
const redirectUrlBase = process.env.REDIRECT_URL_BASE;
console.log('DATABASE_URL:', process.env.DATABASE_URL);
app.use(
  cors({
    origin: (origin, callback) => {
      const allowedOrigins = [
        'http://localhost:5173',
        'https://trip-j.store',
        'https://new-j-trip.vercel.app',
      ];
      if (!origin || allowedOrigins.includes(origin)) {
        // 동적으로 출처 확인.
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  }),
);

app.set('port', process.env.PORT);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/assets', express.static(path.join(__dirname, 'public/assets')));
app.use(cookieParser());

initPassport();
app.use(passport.initialize());

// Swagger UI 설
setupSwagger(app);

app.use('/', rootRouter);

// 에러 핸들러 미들웨어 (라우터 이후에 위치)
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ): void => {
    console.error('Error:', err);

    // OAuth 콜백 에러인 경우 - 에러 코드만 전달
    if (req.path.includes('/callback')) {
      const redirectUrlBase =
        process.env.REDIRECT_URL_BASE || 'http://localhost:5173';

      if (err.existingProvider) {
        // 다른 플랫폼으로 가입된 이메일
        res.redirect(`${redirectUrlBase}/login?error=PROVIDER_MISMATCH`);
        return;
      }

      // 기타 OAuth 에러
      res.redirect(`${redirectUrlBase}/login?error=AUTH_FAILED`);
      return;
    }

    // 일반 API 에러
    const status = err.status || err.statusCode || 500;
    const message = err.message || '서버 오류가 발생했습니다.';

    res.status(status).json({
      isSuccess: false,
      code: status.toString(),
      message,
      ...(err.existingProvider && {
        existingProvider: err.existingProvider,
        email: err.email,
      }),
    });
  },
);

app.get('/test', (req, res) => {
  res.json({
    protocol: req.protocol,
    secure: req.secure,
    forwardedProto: req.headers['x-forwarded-proto'],
  });
});

app.listen(app.get('port'), async () => {
  console.log(`Redirect URL Base: ${redirectUrlBase}`);
  console.log(
    'PRISMA_DISABLE_PREPARED_STATEMENTS =',
    process.env.PRISMA_DISABLE_PREPARED_STATEMENTS,
  );
});
