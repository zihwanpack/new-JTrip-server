import { Response } from 'express';

const isProduction = process.env.NODE_ENV === 'production';

/**
 * 환경에 따른 쿠키 옵션을 반환합니다.
 * 로컬 환경: secure=false, sameSite='lax'
 * 프로덕션 환경: secure=true, sameSite='none'
 */
export const getCookieOptions = (maxAge?: number) => {
  const baseOptions: any = {
    httpOnly: true,
  };

  if (maxAge) {
    baseOptions.maxAge = maxAge;
  }

  if (isProduction) {
    baseOptions.secure = true;
    baseOptions.sameSite = 'none';
  } else {
    baseOptions.secure = false;
    baseOptions.sameSite = 'lax';
  }

  return baseOptions;
};

/**
 * Access Token 쿠키 설정 (5분)
 */
export const setAccessTokenCookie = (res: Response, token: string) => {
  res.cookie('access_token', token, getCookieOptions(1000 * 60 * 5));
};

/**
 * Refresh Token 쿠키 설정 (30일)
 */
export const setRefreshTokenCookie = (res: Response, token: string) => {
  res.cookie('refresh_token', token, getCookieOptions(1000 * 60 * 60 * 24 * 30));
};

/**
 * Access Token과 Refresh Token 쿠키를 모두 설정
 */
export const setTokenCookies = (res: Response, accessToken: string, refreshToken: string) => {
  setAccessTokenCookie(res, accessToken);
  setRefreshTokenCookie(res, refreshToken);
};

/**
 * 쿠키 삭제 옵션 반환
 */
export const getClearCookieOptions = () => {
  return getCookieOptions();
};

/**
 * Access Token 쿠키 삭제
 */
export const clearAccessTokenCookie = (res: Response) => {
  res.clearCookie('access_token', getClearCookieOptions());
};

/**
 * Refresh Token 쿠키 삭제
 */
export const clearRefreshTokenCookie = (res: Response) => {
  res.clearCookie('refresh_token', getClearCookieOptions());
};

/**
 * 모든 토큰 쿠키 삭제
 */
export const clearTokenCookies = (res: Response) => {
  clearAccessTokenCookie(res);
  clearRefreshTokenCookie(res);
};
