import { Request, Response } from 'express';
import {
  Route,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Path,
  Query,
  Response as TsoaResponse,
  Security,
  Tags,
} from 'tsoa';

import { CreateTripDto } from '../../data/dtos/trip/createTripDto';
import { TripSchedule } from '../../domain/entities/tripSchedule';
import { TripScheduleConverter } from '../../data/converters/tripScheduleConverter';

import { TripScheduleService } from '../../domain/services/tripScheduleService';
import {
  CreateTripRequest,
  UpdateTripRequest,
  TripScheduleResponse,
} from '../models/tripScheduleModels';
import { sendSuccess, sendError } from '../../utils/responseHelper';
import {
  ApiResponse,
  ErrorResponse,
  CursorPaginatedResponse,
  CursorPaginationMeta,
} from '../models/apiResponse';

@Route('trips')
@Tags('TripSchedule')
@Security('jwt')
export class TripScheduleController {
  constructor(private readonly tripScheduleService: TripScheduleService) {}
  /**
   * 여행 일정 생성
   */
  @Post('/')
  @TsoaResponse<ApiResponse<TripScheduleResponse>>(
    201,
    '여행 일정이 성공적으로 생성되었습니다',
  )
  @TsoaResponse<ErrorResponse>(400, '잘못된 요청')
  @TsoaResponse<ErrorResponse>(500, '서버 오류')
  public async createTrip(
    @Body() body: CreateTripRequest,
  ): Promise<ApiResponse<TripScheduleResponse>> {
    try {
      if (!body.title || !body.startDate || !body.endDate || !body.createdBy) {
        throw {
          status: 400,
          message: 'Missing required fields',
        };
      }

      // members가 undefined일 때 빈 배열로 처리
      const members = Array.isArray(body.members) ? body.members : [];

      const createTripDto: CreateTripDto = {
        ...body,
        members: [...new Set(members)], // 중복 제거
      };

      const tripData = TripScheduleConverter.fromCreateTripDto(createTripDto);
      const createdTrip =
        await this.tripScheduleService.createTripSchedule(tripData);
      const result = TripScheduleConverter.toResDto(
        await this.tripScheduleService.getTripScheduleWithmembers(
          createdTrip.id,
        ),
      );
      return {
        isSuccess: true,
        code: '201',
        message: '여행 일정이 성공적으로 생성되었습니다',
        result,
      };
    } catch (error: any) {
      console.error('TripScheduleController create error:', error);
      throw {
        status: error.status || 500,
        message: error.message || 'Failed to create trip schedule',
      };
    }
  }

  /**
   * 유저가 속한 여행 일정 목록 조회
   */
  @Get('/user/:userId')
  @TsoaResponse<ApiResponse<TripScheduleResponse[]>>(
    200,
    '여행 일정 목록 조회 성공',
  )
  @TsoaResponse<ErrorResponse>(400, '잘못된 요청')
  @TsoaResponse<ErrorResponse>(404, '여행 일정을 찾을 수 없습니다')
  @TsoaResponse<ErrorResponse>(500, '서버 오류')
  public async getTripsByUserId(
    @Path() userId: string,
  ): Promise<ApiResponse<TripScheduleResponse[]>> {
    try {
      if (!userId) {
        throw {
          status: 400,
          message: 'User ID is required',
        };
      }

      const trips: TripSchedule[] =
        await this.tripScheduleService.getTripSchedulesByUserId(userId);

      if (trips.length === 0) {
        throw {
          status: 404,
          message: 'No trips for this user',
        };
      }

      const responseDtos = await Promise.all(
        trips.map(async (trip) => {
          const tripWithMembers =
            await this.tripScheduleService.getTripScheduleWithmembers(trip.id);
          return TripScheduleConverter.toResDto(tripWithMembers);
        }),
      );

      return {
        isSuccess: true,
        code: '200',
        message: '여행 일정 목록 조회 성공',
        result: responseDtos,
      };
    } catch (error: any) {
      console.error('TripScheduleController getTripsByUserId error:', error);
      throw {
        status: error.status || 500,
        message: error.message || 'Failed to get trip schedules for user',
      };
    }
  }

  /**
   * 지나간 여행 일정 목록 조회
   */
  @Get('/user/:userId/past')
  @TsoaResponse<ApiResponse<TripScheduleResponse[]>>(
    200,
    '지나간 여행 일정 목록 조회 성공',
  )
  @TsoaResponse<ErrorResponse>(400, '잘못된 요청')
  @TsoaResponse<ErrorResponse>(404, '여행 일정을 찾을 수 없습니다')
  @TsoaResponse<ErrorResponse>(500, '서버 오류')
  public async getPastTripsByUserId(
    @Path() userId: string,
  ): Promise<ApiResponse<TripScheduleResponse[]>> {
    try {
      if (!userId) {
        throw {
          status: 400,
          message: 'User ID is required',
        };
      }

      const trips: TripSchedule[] =
        await this.tripScheduleService.getPastTripsByUserId(userId);

      const responseDtos = await Promise.all(
        trips.map(async (trip) => {
          const tripWithMembers =
            await this.tripScheduleService.getTripScheduleWithmembers(trip.id);
          return TripScheduleConverter.toResDto(tripWithMembers);
        }),
      );

      return {
        isSuccess: true,
        code: '200',
        message: '지나간 여행 일정 목록 조회 성공',
        result: responseDtos,
      };
    } catch (error: any) {
      console.error(
        'TripScheduleController getPastTripsByUserId error:',
        error,
      );
      throw {
        status: error.status || 500,
        message: error.message || 'Failed to get past trip schedules for user',
      };
    }
  }

  /**
   * 지나간 여행 일정 목록 조회 (커서 기반 무한 스크롤)
   */
  @Get('/user/:userId/past/cursor')
  @TsoaResponse<ApiResponse<CursorPaginatedResponse<TripScheduleResponse>>>(
    200,
    '지나간 여행 일정 목록 조회 성공 (커서 기반)',
  )
  @TsoaResponse<ErrorResponse>(400, '잘못된 요청')
  @TsoaResponse<ErrorResponse>(404, '여행 일정을 찾을 수 없습니다')
  @TsoaResponse<ErrorResponse>(500, '서버 오류')
  public async getPastTripsByUserIdWithCursor(
    @Path() userId: string,
    @Query() cursor: number | undefined,
    @Query() limit: number = 10,
  ): Promise<ApiResponse<CursorPaginatedResponse<TripScheduleResponse>>> {
    try {
      if (!userId) {
        throw {
          status: 400,
          message: 'User ID is required',
        };
      }

      if (limit < 1 || limit > 100) {
        throw {
          status: 400,
          message: 'Limit must be between 1 and 100',
        };
      }

      const cursorValue = cursor !== undefined ? cursor : null;
      const { trips, hasNext } =
        await this.tripScheduleService.getPastTripsByUserIdWithCursor(
          userId,
          cursorValue,
          limit,
        );

      const responseDtos = await Promise.all(
        trips.map(async (trip) => {
          const tripWithMembers =
            await this.tripScheduleService.getTripScheduleWithmembers(trip.id);
          return TripScheduleConverter.toResDto(tripWithMembers);
        }),
      );

      // 마지막 항목의 ID를 nextCursor로 사용
      const nextCursor =
        hasNext && responseDtos.length > 0
          ? responseDtos[responseDtos.length - 1].id
          : null;

      const pagination: CursorPaginationMeta = {
        hasNext,
        nextCursor,
        limit,
      };

      return {
        isSuccess: true,
        code: '200',
        message: '지나간 여행 일정 목록 조회 성공 (커서 기반)',
        result: {
          items: responseDtos,
          pagination,
        },
      };
    } catch (error: any) {
      console.error(
        'TripScheduleController getPastTripsByUserIdWithCursor error:',
        error,
      );
      throw {
        status: error.status || 500,
        message: error.message || 'Failed to get past trip schedules for user',
      };
    }
  }

  /**
   * 진행중인 여행 일정 조회 (단일 객체)
   */
  @Get('/user/:userId/current')
  @TsoaResponse<ApiResponse<TripScheduleResponse>>(
    200,
    '진행중인 여행 일정 조회 성공',
  )
  @TsoaResponse<ErrorResponse>(400, '잘못된 요청')
  @TsoaResponse<ErrorResponse>(404, '여행 일정을 찾을 수 없습니다')
  @TsoaResponse<ErrorResponse>(500, '서버 오류')
  public async getCurrentTripsByUserId(
    @Path() userId: string,
  ): Promise<ApiResponse<TripScheduleResponse | null>> {
    try {
      if (!userId) {
        throw {
          status: 400,
          message: 'User ID is required',
        };
      }

      const trip: TripSchedule | null =
        await this.tripScheduleService.getCurrentTripsByUserId(userId);

      if (!trip) {
        return {
          isSuccess: true,
          code: '200',
          message: '진행중인 여행 일정 조회 성공',
          result: null,
        };
      }

      const tripWithMembers =
        await this.tripScheduleService.getTripScheduleWithmembers(trip.id);
      const result = TripScheduleConverter.toResDto(tripWithMembers);

      return {
        isSuccess: true,
        code: '200',
        message: '진행중인 여행 일정 조회 성공',
        result,
      };
    } catch (error: any) {
      console.error(
        'TripScheduleController getCurrentTripsByUserId error:',
        error,
      );
      throw {
        status: error.status || 500,
        message:
          error.message || 'Failed to get current trip schedules for user',
      };
    }
  }

  /**
   * 다가올 여행 일정 목록 조회
   */
  @Get('/user/:userId/upcoming')
  @TsoaResponse<ApiResponse<TripScheduleResponse[]>>(
    200,
    '다가올 여행 일정 목록 조회 성공',
  )
  @TsoaResponse<ErrorResponse>(400, '잘못된 요청')
  @TsoaResponse<ErrorResponse>(404, '여행 일정을 찾을 수 없습니다')
  @TsoaResponse<ErrorResponse>(500, '서버 오류')
  public async getUpcomingTripsByUserId(
    @Path() userId: string,
  ): Promise<ApiResponse<TripScheduleResponse[]>> {
    try {
      if (!userId) {
        throw {
          status: 400,
          message: 'User ID is required',
        };
      }

      const trips: TripSchedule[] =
        await this.tripScheduleService.getUpcomingTripsByUserId(userId);

      const responseDtos = await Promise.all(
        trips.map(async (trip) => {
          const tripWithMembers =
            await this.tripScheduleService.getTripScheduleWithmembers(trip.id);
          return TripScheduleConverter.toResDto(tripWithMembers);
        }),
      );

      return {
        isSuccess: true,
        code: '200',
        message: '다가올 여행 일정 목록 조회 성공',
        result: responseDtos,
      };
    } catch (error: any) {
      console.error(
        'TripScheduleController getUpcomingTripsByUserId error:',
        error,
      );
      throw {
        status: error.status || 500,
        message:
          error.message || 'Failed to get upcoming trip schedules for user',
      };
    }
  }

  /**
   * 다가올 여행 일정 목록 조회 (커서 기반 무한 스크롤)
   */
  @Get('/user/:userId/upcoming/cursor')
  @TsoaResponse<ApiResponse<CursorPaginatedResponse<TripScheduleResponse>>>(
    200,
    '다가올 여행 일정 목록 조회 성공 (커서 기반)',
  )
  @TsoaResponse<ErrorResponse>(400, '잘못된 요청')
  @TsoaResponse<ErrorResponse>(404, '여행 일정을 찾을 수 없습니다')
  @TsoaResponse<ErrorResponse>(500, '서버 오류')
  public async getUpcomingTripsByUserIdWithCursor(
    @Path() userId: string,
    @Query() cursor: number | undefined,
    @Query() limit: number = 10,
  ): Promise<ApiResponse<CursorPaginatedResponse<TripScheduleResponse>>> {
    try {
      if (!userId) {
        throw {
          status: 400,
          message: 'User ID is required',
        };
      }

      if (limit < 1 || limit > 100) {
        throw {
          status: 400,
          message: 'Limit must be between 1 and 100',
        };
      }

      const cursorValue = cursor !== undefined ? cursor : null;
      const { trips, hasNext } =
        await this.tripScheduleService.getUpcomingTripsByUserIdWithCursor(
          userId,
          cursorValue,
          limit,
        );

      const responseDtos = await Promise.all(
        trips.map(async (trip) => {
          const tripWithMembers =
            await this.tripScheduleService.getTripScheduleWithmembers(trip.id);
          return TripScheduleConverter.toResDto(tripWithMembers);
        }),
      );

      // 마지막 항목의 ID를 nextCursor로 사용
      const nextCursor =
        hasNext && responseDtos.length > 0
          ? responseDtos[responseDtos.length - 1].id
          : null;

      const pagination: CursorPaginationMeta = {
        hasNext,
        nextCursor,
        limit,
      };

      return {
        isSuccess: true,
        code: '200',
        message: '다가올 여행 일정 목록 조회 성공 (커서 기반)',
        result: {
          items: responseDtos,
          pagination,
        },
      };
    } catch (error: any) {
      console.error(
        'TripScheduleController getUpcomingTripsByUserIdWithCursor error:',
        error,
      );
      throw {
        status: error.status || 500,
        message:
          error.message || 'Failed to get upcoming trip schedules for user',
      };
    }
  }

  /**
   * 단일 여행 데이터 조회
   */
  @Get('/:tripId')
  @TsoaResponse<ApiResponse<TripScheduleResponse>>(200, '여행 일정 조회 성공')
  @TsoaResponse<ErrorResponse>(400, '잘못된 요청')
  @TsoaResponse<ErrorResponse>(500, '서버 오류')
  public async getTripById(
    @Path() tripId: number,
  ): Promise<ApiResponse<TripScheduleResponse>> {
    try {
      if (isNaN(tripId)) {
        throw {
          status: 400,
          message: 'Invalid trip ID',
        };
      }

      const tripWithMembers =
        await this.tripScheduleService.getTripScheduleWithmembers(tripId);
      const result = TripScheduleConverter.toResDto(tripWithMembers);
      return {
        isSuccess: true,
        code: '200',
        message: '여행 일정 조회 성공',
        result,
      };
    } catch (error: any) {
      console.error('TripScheduleController getTripById error:', error);
      throw {
        status: error.status || 500,
        message: error.message || 'Failed to get trip schedule',
      };
    }
  }

  /**
   * 여행 일정 업데이트
   */
  @Patch('/:tripId')
  @TsoaResponse<ApiResponse<{ message: string }>>(
    200,
    '여행 일정이 성공적으로 업데이트되었습니다',
  )
  @TsoaResponse<ErrorResponse>(400, '잘못된 요청')
  @TsoaResponse<ErrorResponse>(500, '서버 오류')
  public async updateTripSchedule(
    @Path() tripId: number,
    @Body() body: UpdateTripRequest,
  ): Promise<ApiResponse<{ message: string }>> {
    try {
      if (isNaN(tripId)) {
        throw {
          status: 400,
          message: 'Invalid trip ID',
        };
      }

      const {
        title,
        destination,
        destinationType,
        startDate,
        endDate,
        members,
      } = body;

      if (
        !title ||
        !destination ||
        !destinationType ||
        !startDate ||
        !endDate ||
        !members
      ) {
        throw {
          status: 400,
          message: 'Missing required fields',
        };
      }

      const updateTripBody = TripScheduleConverter.fromUpdateTripDto(body);

      const updateTripData: Omit<TripSchedule, 'id'> & {
        id: number;
        members: string[];
      } = {
        ...updateTripBody,
        id: tripId,
        created_by: body.createdBy,
      };

      await this.tripScheduleService.updateTripSchedule(updateTripData);

      return {
        isSuccess: true,
        code: '200',
        message: '여행 일정이 성공적으로 업데이트되었습니다',
        result: { message: 'Trip schedule updated successfully' },
      };
    } catch (error: any) {
      console.error('TripScheduleController update error:', error);
      throw {
        status: error.status || 500,
        message: error.message || 'Failed to update trip schedule',
      };
    }
  }

  /**
   * 여행 일정 삭제
   */
  @Delete('/:tripId')
  @TsoaResponse<ApiResponse<{}>>(200, '여행 일정이 성공적으로 삭제되었습니다')
  @TsoaResponse<ErrorResponse>(400, '잘못된 요청')
  @TsoaResponse<ErrorResponse>(500, '서버 오류')
  public async deleteTrip(@Path() tripId: number): Promise<ApiResponse<{}>> {
    try {
      if (isNaN(tripId)) {
        throw {
          status: 400,
          message: 'Invalid trip ID',
        };
      }

      await this.tripScheduleService.deleteTripById(tripId);
      return {
        isSuccess: true,
        code: '200',
        message: '여행 일정이 성공적으로 삭제되었습니다',
        result: {},
      };
    } catch (error: any) {
      console.error('TripScheduleController delete error:', error);
      throw {
        status: error.status || 500,
        message: error.message || 'Failed to delete trip schedule',
      };
    }
  }

  /**
   * 여러 여행 일정 삭제
   */
  @Delete('/')
  @TsoaResponse<ApiResponse<{}>>(200, '여행 일정들이 성공적으로 삭제되었습니다')
  @TsoaResponse<ErrorResponse>(400, '잘못된 요청')
  @TsoaResponse<ErrorResponse>(500, '서버 오류')
  public async deleteTrips(
    @Body() body: { ids: number[] },
  ): Promise<ApiResponse<{}>> {
    try {
      const tripIds: number[] = body.ids;

      if (
        !Array.isArray(tripIds) ||
        tripIds.length === 0 ||
        tripIds.some((id) => isNaN(Number(id)))
      ) {
        throw {
          status: 400,
          message: 'Invalid trip ID',
        };
      }

      await this.tripScheduleService.deleteTripsByIds(tripIds);
      return {
        isSuccess: true,
        code: '200',
        message: '여행 일정들이 성공적으로 삭제되었습니다',
        result: {},
      };
    } catch (error: any) {
      console.error('TripScheduleController delete error:', error);
      throw {
        status: error.status || 500,
        message: error.message || 'Failed to delete trip schedule',
      };
    }
  }

  // Express 라우터와의 호환성을 위한 래퍼 메서드들
  createTripHandler = async (req: Request, res: Response) => {
    try {
      // 요청이 { trip: {...} } 형태로 올 수도 있고, 직접 올 수도 있음
      const requestBody = (req.body as any).trip || req.body;
      const apiResponse = await this.createTrip(requestBody);
      res.status(201).json(apiResponse);
    } catch (error: any) {
      sendError(
        res,
        error.status || 500,
        error.message || '여행 일정 생성에 실패했습니다',
      );
    }
  };

  getTripsByUserIdHandler = async (req: Request, res: Response) => {
    try {
      const userId = req.params.userId;
      const apiResponse = await this.getTripsByUserId(userId);
      res.status(200).json(apiResponse);
    } catch (error: any) {
      sendError(
        res,
        error.status || 500,
        error.message || '여행 일정 목록 조회에 실패했습니다',
      );
    }
  };

  getPastTripsByUserIdHandler = async (req: Request, res: Response) => {
    try {
      const userId = req.params.userId;
      const apiResponse = await this.getPastTripsByUserId(userId);
      res.status(200).json(apiResponse);
    } catch (error: any) {
      sendError(
        res,
        error.status || 500,
        error.message || '지나간 여행 일정 목록 조회에 실패했습니다',
      );
    }
  };

  getPastTripsByUserIdWithCursorHandler = async (
    req: Request,
    res: Response,
  ) => {
    try {
      const userId = req.params.userId;
      const cursor =
        req.query.cursor !== undefined
          ? parseInt(req.query.cursor as string)
          : undefined;
      const limit = parseInt(req.query.limit as string) || 10;
      const apiResponse = await this.getPastTripsByUserIdWithCursor(
        userId,
        cursor,
        limit,
      );
      res.status(200).json(apiResponse);
    } catch (error: any) {
      sendError(
        res,
        error.status || 500,
        error.message || '지나간 여행 일정 목록 조회에 실패했습니다',
      );
    }
  };

  getCurrentTripsByUserIdHandler = async (req: Request, res: Response) => {
    try {
      const userId = req.params.userId;
      const apiResponse = await this.getCurrentTripsByUserId(userId);
      res.status(200).json(apiResponse);
    } catch (error: any) {
      sendError(
        res,
        error.status || 500,
        error.message || '진행중인 여행 일정 목록 조회에 실패했습니다',
      );
    }
  };

  getUpcomingTripsByUserIdHandler = async (req: Request, res: Response) => {
    try {
      const userId = req.params.userId;
      const apiResponse = await this.getUpcomingTripsByUserId(userId);
      res.status(200).json(apiResponse);
    } catch (error: any) {
      sendError(
        res,
        error.status || 500,
        error.message || '다가올 여행 일정 목록 조회에 실패했습니다',
      );
    }
  };

  getUpcomingTripsByUserIdWithCursorHandler = async (
    req: Request,
    res: Response,
  ) => {
    try {
      const userId = req.params.userId;
      const cursor =
        req.query.cursor !== undefined
          ? parseInt(req.query.cursor as string)
          : undefined;
      const limit = parseInt(req.query.limit as string) || 10;
      const apiResponse = await this.getUpcomingTripsByUserIdWithCursor(
        userId,
        cursor,
        limit,
      );
      res.status(200).json(apiResponse);
    } catch (error: any) {
      sendError(
        res,
        error.status || 500,
        error.message || '다가올 여행 일정 목록 조회에 실패했습니다',
      );
    }
  };

  getTripByIdHandler = async (req: Request, res: Response) => {
    try {
      const tripId = Number(req.params.tripId);
      const apiResponse = await this.getTripById(tripId);
      res.status(200).json(apiResponse);
    } catch (error: any) {
      sendError(
        res,
        error.status || 500,
        error.message || '여행 일정 조회에 실패했습니다',
      );
    }
  };

  updateTripScheduleHandler = async (req: Request, res: Response) => {
    try {
      const tripId = Number(req.params.tripId);
      const apiResponse = await this.updateTripSchedule(tripId, req.body);
      res.status(200).json(apiResponse);
    } catch (error: any) {
      sendError(
        res,
        error.status || 500,
        error.message || '여행 일정 업데이트에 실패했습니다',
      );
    }
  };

  deleteTripHandler = async (req: Request, res: Response) => {
    try {
      const tripId = Number(req.params.tripId);
      const apiResponse = await this.deleteTrip(tripId);
      res.status(200).json(apiResponse);
    } catch (error: any) {
      sendError(
        res,
        error.status || 500,
        error.message || '여행 일정 삭제에 실패했습니다',
      );
    }
  };

  deleteTripsHandler = async (req: Request, res: Response) => {
    try {
      const apiResponse = await this.deleteTrips(req.body);
      res.status(200).json(apiResponse);
    } catch (error: any) {
      sendError(
        res,
        error.status || 500,
        error.message || '여행 일정 삭제에 실패했습니다',
      );
    }
  };
}
