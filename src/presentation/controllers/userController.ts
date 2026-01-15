import { Request, Response } from 'express';
import {
  Route,
  Get,
  Post,
  Delete,
  Body,
  Path,
  Query,
  Response as TsoaResponse,
  Security,
  Tags,
} from 'tsoa';
import { UserService } from '../../domain/services/userService';
import { User } from '../../domain/models/user';
import { JwtPayload } from '../../utils/jwt';
import { UserResponse } from '../models/userModels';

import dotenv from 'dotenv';
dotenv.config();

import { sendSuccess, sendError } from '../../utils/responseHelper';
import { ApiResponse, ErrorResponse } from '../models/apiResponse';
import { clearTokenCookies } from '../../utils/cookieHelper';

const mapUserToResponse = (user: {
  id: string;
  email: string;
  nickname: string;
  provider: string;
  user_image?: string;
}): UserResponse => ({
  id: user.id,
  email: user.email,
  nickname: user.nickname,
  provider: user.provider,
  profileImage: user.user_image,
});

// TSoA 클래스 컨트롤러 추가
@Route('users')
@Tags('User')
@Security('jwt')
export class UserController {
  constructor(private readonly userService: ReturnType<typeof UserService>) {}

  /**
   * ID로 유저 조회
   */
  @Get('/:id')
  @TsoaResponse<ApiResponse<UserResponse>>(200, '유저 조회 성공')
  @TsoaResponse<ErrorResponse>(404, '유저를 찾을 수 없습니다')
  @TsoaResponse<ErrorResponse>(500, '서버 오류')
  public async getUserById(
    @Path() id: string,
  ): Promise<ApiResponse<UserResponse>> {
    try {
      const user = await this.userService.findUserById(id);
      if (!user) {
        throw {
          status: 404,
          message: '유저를 찾을 수 없습니다.',
        };
      }
      const result = {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
        provider: user.provider,
        profileImage: user.user_image,
      };
      return {
        isSuccess: true,
        code: '200',
        message: '유저 조회 성공',
        result,
      };
    } catch (error: any) {
      throw {
        status: error.status || 500,
        message:
          error.message || '유저 정보를 가져오는 중 오류가 발생했습니다.',
      };
    }
  }

  /**
   * 이메일로 유저 조회
   */
  @Get('/email/:email')
  @TsoaResponse<ApiResponse<UserResponse>>(200, '유저 조회 성공')
  @TsoaResponse<ErrorResponse>(404, '유저를 찾을 수 없습니다')
  @TsoaResponse<ErrorResponse>(500, '서버 오류')
  public async findUserByEmail(
    @Path() email: string,
  ): Promise<ApiResponse<UserResponse>> {
    try {
      const user = await this.userService.findUserByEmail(email);
      if (!user) {
        throw {
          status: 404,
          message: '해당 이메일로 유저를 찾을 수 없습니다.',
        };
      }
      const result = {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
        provider: user.provider,
        profileImage: user.user_image,
      };
      return {
        isSuccess: true,
        code: '200',
        message: '유저 조회 성공',
        result,
      };
    } catch (error: any) {
      throw {
        status: error.status || 500,
        message:
          error.message || '이메일로 유저를 찾는 중 오류가 발생했습니다.',
      };
    }
  }

  /**
   * 이메일 배열로 유저 정보 조회
   */
  @Post('/emails')
  @TsoaResponse<ApiResponse<UserResponse[]>>(200, '유저 목록 조회 성공')
  @TsoaResponse<ErrorResponse>(400, '잘못된 요청')
  @TsoaResponse<ErrorResponse>(500, '서버 오류')
  public async findUsersByEmails(
    @Body() body: { emails: string[] },
  ): Promise<ApiResponse<UserResponse[]>> {
    try {
      const { emails } = body;

      if (!Array.isArray(emails) || emails.length === 0) {
        throw {
          status: 400,
          message: 'emails must be an array.',
        };
      }

      const users = await this.userService.findUsersByEmails(emails);
      const result = users.map((user: User) => ({
        id: user.id,
        email: user.email,
        nickname: user.nickname,
        provider: user.provider,
        profileImage: user.user_image,
      }));
      return {
        isSuccess: true,
        code: '200',
        message: '유저 목록 조회 성공',
        result,
      };
    } catch (error: any) {
      throw {
        status: error.status || 500,
        message: error.message || '유저 정보 조회 중 오류 발생',
      };
    }
  }

  /**
   * 이메일로 유저 검색
   */
  @Get('/search')
  @TsoaResponse<ApiResponse<UserResponse[]>>(200, '유저 검색 성공')
  @TsoaResponse<ErrorResponse>(400, '잘못된 요청')
  @TsoaResponse<ErrorResponse>(500, '서버 오류')
  public async getUserSearch(
    @Query() query: string,
  ): Promise<ApiResponse<UserResponse[]>> {
    try {
      if (!query || query.trim() === '') {
        throw {
          status: 400,
          message: 'Query is required',
        };
      }

      const users = await this.userService.searchUsersByEmail(query);
      const result = users.map((user: User) => ({
        id: user.id,
        email: user.email,
        nickname: user.nickname,
        provider: user.provider,
        profileImage: user.user_image,
      }));
      return {
        isSuccess: true,
        code: '200',
        message: '유저 검색 성공',
        result,
      };
    } catch (error: any) {
      throw {
        status: error.status || 500,
        message: error.message || 'Internal server error',
      };
    }
  }

  /**
   * 유저 삭제
   */
  @Delete('/:id')
  @TsoaResponse<void>(204, '유저가 성공적으로 삭제되었습니다')
  @TsoaResponse<ErrorResponse>(404, '유저를 찾을 수 없습니다')
  @TsoaResponse<ErrorResponse>(500, '서버 오류')
  public async deleteUser(@Path() id: string): Promise<void> {
    try {
      const user = await this.userService.findUserById(id);
      if (!user) {
        throw {
          status: 404,
          message: '유저를 찾을 수 없습니다.',
        };
      }

      const isDeleted = await this.userService.deleteUser(id);
      if (!isDeleted) {
        throw {
          status: 500,
          message: '유저 삭제에 실패했습니다.',
        };
      }
    } catch (error: any) {
      throw {
        status: error.status || 500,
        message: error.message || '유저 삭제 중 오류가 발생했습니다.',
      };
    }
  }

  /**
   * 로그아웃
   */
  @Post('/logout')
  @TsoaResponse<void>(204, '로그아웃 성공')
  public logout(): void {
    // 204 No Content - 응답 본문 없음
  }
}

// 기존 함수들 (호환성을 위해 유지)
export const getUserById = async (
  req: Request<{ id: string }>,
  res: Response,
) => {
  const userService = req.app.get('userService') as ReturnType<
    typeof UserService
  >;
  const { id } = req.params;

  try {
    const user = await userService.findUserById(id);
    if (user) {
      const result = mapUserToResponse(user);
      sendSuccess(res, 200, '유저 조회 성공', result);
    } else {
      sendError(res, 404, '유저를 찾을 수 없습니다.');
    }
  } catch (error) {
    sendError(res, 500, '유저 정보를 가져오는 중 오류가 발생했습니다.');
  }
};

export const findUserByEmail = async (
  req: Request<{ email: string }>,
  res: Response,
) => {
  const userService = req.app.get('userService') as ReturnType<
    typeof UserService
  >;
  const { email } = req.params;
  try {
    const user = await userService.findUserByEmail(email);
    if (user) {
      const result = mapUserToResponse(user);
      sendSuccess(res, 200, '유저 조회 성공', result);
    } else {
      sendError(res, 404, '해당 이메일로 유저를 찾을 수 없습니다.');
    }
  } catch (error) {
    sendError(res, 500, '이메일로 유저를 찾는 중 오류가 발생했습니다.');
  }
};

export const findUsersByEmail = async (
  req: Request<{ email: string }>,
  res: Response,
) => {
  const userService = req.app.get('userService') as ReturnType<
    typeof UserService
  >;
  const { email } = req.params;
  try {
    const users = await userService.findUsersByEmail(email);
    if (users) {
      const result = users.map(mapUserToResponse);
      sendSuccess(res, 200, '유저 목록 조회 성공', result);
    } else {
      sendError(res, 404, '해당 이메일로 유저를 찾을 수 없습니다.');
    }
  } catch (error) {
    sendError(res, 500, '이메일로 유저를 찾는 중 오류가 발생했습니다.');
  }
};

export const findUsersByEmails = async (req: Request, res: Response) => {
  const userService = req.app.get('userService') as ReturnType<
    typeof UserService
  >;

  const { emails } = req.body;

  if (!Array.isArray(emails) || emails.length === 0) {
    sendError(res, 400, 'emails must be an array.');
    return;
  }

  try {
    const users = await userService.findUsersByEmails(emails);
    const result = users.map(mapUserToResponse);
    sendSuccess(res, 200, '유저 목록 조회 성공', result);
  } catch (error) {
    console.error('Error fetching users by emails:', error);
    sendError(res, 500, '유저 정보 조회 중 오류 발생');
  }
};

export const findUserByEmailAndProvider = async (
  req: Request,
  res: Response,
) => {
  const userService = req.app.get('userService') as ReturnType<
    typeof UserService
  >;
  const { email, provider } = req.body;
  try {
    const user = await userService.findUserByEmailAndProvider(email, provider);
    if (user) {
      const result = mapUserToResponse(user);
      sendSuccess(res, 200, '유저 조회 성공', result);
    } else {
      sendError(res, 404, '해당 이메일과 provider로 유저를 찾을 수 없습니다.');
    }
  } catch (error) {
    sendError(
      res,
      500,
      '이메일과 provider로 유저를 찾는 중 오류가 발생했습니다.',
    );
  }
};

export const getUserSearchHandler = async (req: Request, res: Response) => {
  const userService = req.app.get('userService') as ReturnType<
    typeof UserService
  >;

  const query = req.query.query as string;

  if (!query || query.trim() === '') {
    sendError(res, 400, 'Query is required');
    return;
  }

  try {
    const users = await userService.searchUsersByEmail(query);
    const result = users.map(mapUserToResponse);
    sendSuccess(res, 200, '유저 검색 성공', result);
  } catch (error) {
    console.error('Error searching users:', error);
    sendError(res, 500, 'Internal server error');
  }
};

export const logout = (_req: Request, res: Response) => {
  clearTokenCookies(res);

  res.status(204).end();
};

export const deleteUser = async (req: Request, res: Response) => {
  const userService = req.app.get('userService') as ReturnType<
    typeof UserService
  >;
  const { id } = req.params;

  try {
    const user = await userService.findUserById(id);
    if (!user) {
      sendError(res, 404, '유저를 찾을 수 없습니다.');
      return;
    }

    const isDeleted = await userService.deleteUser(id);
    if (!isDeleted) {
      sendError(res, 500, '유저 삭제에 실패했습니다.');
      return;
    }

    res.status(204).end();
  } catch (error) {
    console.error('유저 삭제 오류:', error);
    sendError(res, 500, '유저 삭제 중 오류가 발생했습니다.');
  }
};

export const getAuthUser = async (req: Request, res: Response) => {
  // req.jwtPayload는 authenticateJwt 미들웨어에서 설정됨
  const jwtPayload = (req as any).jwtPayload as JwtPayload | undefined;
  if (!jwtPayload) {
    sendError(res, 401, 'Not authenticated');
    return;
  }

  try {
    const userService = req.app.get('userService') as ReturnType<
      typeof UserService
    >;

    const userId = jwtPayload.userId;
    const freshUser = await userService.findUserById(userId);

    if (!freshUser) {
      sendError(res, 404, 'User not found in DB');
      return;
    }

    const result = mapUserToResponse(freshUser);

    sendSuccess(res, 200, 'Authenticated', result);
  } catch (error) {
    console.error('getAuthUser error:', error);
    sendError(res, 500, 'Internal server error');
  }
};
