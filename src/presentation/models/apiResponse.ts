import { Route } from 'tsoa';

/**
 * 통일된 API 응답 형식
 */
export interface ApiResponse<T = any> {
  isSuccess: boolean;
  code: string;
  message: string;
  result: T | null;
}

/**
 * 성공 응답 예시
 */
export interface SuccessResponse<T> extends ApiResponse<T> {
  isSuccess: true;
  code: string;
  message: string;
  result: T;
}

/**
 * 에러 응답 예시
 */
export interface ErrorResponse extends ApiResponse<null> {
  isSuccess: false;
  code: string;
  message: string;
  result: null;
}

/**
 * 커서 기반 페이지네이션 메타데이터
 */
export interface CursorPaginationMeta {
  hasNext: boolean;
  nextCursor: number | null;
  limit: number;
}

/**
 * 커서 기반 페이지네이션 응답
 */
export interface CursorPaginatedResponse<T> {
  items: T[];
  pagination: CursorPaginationMeta;
}
