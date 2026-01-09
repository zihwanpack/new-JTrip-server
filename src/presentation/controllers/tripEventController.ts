import { Request, Response } from 'express';
import {
  Route,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Path,
  Response as TsoaResponse,
  Security,
  Tags,
} from 'tsoa';
import { TripEventService } from '../../domain/services/tripEventService';

import { TripEventDto } from '../../data/dtos/event/tripEventDto';
import { TripEventConverter } from '../../data/converters/tripEventConverter';
import {
  CreateTripEventRequest,
  TripEventRequest,
  TripEventResponse,
} from '../models/tripEventModels';
import { sendSuccess, sendError } from '../../utils/responseHelper';
import { ApiResponse, ErrorResponse } from '../models/apiResponse';

@Route('event')
@Tags('TripEvent')
@Security('jwt')
export class TripEventController {
  constructor(private readonly tripEventService: TripEventService) {}

  /**
   * 이벤트 생성
   */
  @Post('/')
  @TsoaResponse<ApiResponse<TripEventResponse>>(
    201,
    '이벤트가 성공적으로 생성되었습니다',
  )
  @TsoaResponse<ErrorResponse>(400, '잘못된 요청')
  @TsoaResponse<ErrorResponse>(500, '서버 오류')
  public async createTripEvent(
    @Body() body: CreateTripEventRequest,
  ): Promise<ApiResponse<TripEventResponse>> {
    try {
      // CreateTripEventRequest를 TripEventDto로 변환 (생성 시에는 eventId를 받지 않음)
      const tripEventDto: TripEventDto = {
        ...body,
        eventId: 0, // 생성 시에는 항상 0으로 설정 (DB에서 자동 생성)
        cost: Array.isArray(body.cost) ? body.cost : [], // cost가 없으면 빈 배열
      };
      const tripEvent = TripEventConverter.fromRequestDto(tripEventDto);
      const createdTripEvent =
        await this.tripEventService.createTripEvent(tripEvent);
      const result = TripEventConverter.toResponseDto(createdTripEvent);
      return {
        isSuccess: true,
        code: '201',
        message: '이벤트가 성공적으로 생성되었습니다',
        result,
      };
    } catch (error: any) {
      throw {
        status: 400,
        message: error.message,
      };
    }
  }

  /**
   * 이벤트 업데이트
   */
  @Patch('/:event_id')
  @TsoaResponse<ApiResponse<TripEventResponse>>(
    200,
    '이벤트가 성공적으로 업데이트되었습니다',
  )
  @TsoaResponse<ErrorResponse>(400, '잘못된 요청')
  @TsoaResponse<ErrorResponse>(500, '서버 오류')
  public async updateTripEvent(
    @Path() event_id: number,
    @Body() body: TripEventRequest,
  ): Promise<ApiResponse<TripEventResponse>> {
    try {
      // TripEventRequest를 TripEventDto로 변환
      const tripEventDto: TripEventDto = {
        ...body,
        eventId: event_id,
        cost: Array.isArray(body.cost) ? body.cost : [], // cost가 없으면 빈 배열
      };
      const tripEvent = TripEventConverter.fromRequestDto(tripEventDto);
      const updatedTripEvent =
        await this.tripEventService.updateTripEvent(tripEvent);
      const result = TripEventConverter.toResponseDto(updatedTripEvent);
      return {
        isSuccess: true,
        code: '200',
        message: '이벤트가 성공적으로 업데이트되었습니다',
        result,
      };
    } catch (error: any) {
      throw {
        status: 400,
        message: error.message,
      };
    }
  }

  /**
   * event_id로 event 단일 조회
   */
  @Get('/:event_id')
  @TsoaResponse<ApiResponse<TripEventResponse>>(200, '이벤트 조회 성공')
  @TsoaResponse<ErrorResponse>(404, '이벤트를 찾을 수 없습니다')
  @TsoaResponse<ErrorResponse>(500, '서버 오류')
  public async getTripEventById(
    @Path() event_id: number,
  ): Promise<ApiResponse<TripEventResponse>> {
    try {
      const tripEvent = await this.tripEventService.getTripEventById(event_id);
      const result = TripEventConverter.toResponseDto(tripEvent);
      return {
        isSuccess: true,
        code: '200',
        message: '이벤트 조회 성공',
        result,
      };
    } catch (error: any) {
      throw {
        status: 404,
        message: error.message,
      };
    }
  }

  /**
   * event_id로 event 단일 삭제
   */
  @Delete('/:event_id')
  @TsoaResponse<ApiResponse<{}>>(200, '이벤트가 성공적으로 삭제되었습니다')
  @TsoaResponse<ErrorResponse>(404, '이벤트를 찾을 수 없습니다')
  @TsoaResponse<ErrorResponse>(500, '서버 오류')
  public async deleteTripEventById(
    @Path() event_id: number,
  ): Promise<ApiResponse<{}>> {
    try {
      await this.tripEventService.deleteTripEventById(event_id);
      return {
        isSuccess: true,
        code: '200',
        message: '이벤트가 성공적으로 삭제되었습니다',
        result: {},
      };
    } catch (error: any) {
      throw {
        status: 404,
        message: error.message,
      };
    }
  }

  /**
   * trip_id로 event 모두 조회
   */
  @Get('/all/:trip_id')
  @TsoaResponse<ApiResponse<TripEventResponse[]>>(200, '이벤트 목록 조회 성공')
  @TsoaResponse<ErrorResponse>(404, '이벤트를 찾을 수 없습니다')
  @TsoaResponse<ErrorResponse>(500, '서버 오류')
  public async getTripEventsByTripId(
    @Path() trip_id: number,
  ): Promise<ApiResponse<TripEventResponse[]>> {
    try {
      const tripEvents =
        await this.tripEventService.getTripEventsByTripId(trip_id);
      const result = tripEvents?.map(TripEventConverter.toResponseDto) || [];
      return {
        isSuccess: true,
        code: '200',
        message: '이벤트 목록 조회 성공',
        result,
      };
    } catch (error: any) {
      throw {
        status: 404,
        message: error.message,
      };
    }
  }

  // Express 라우터와의 호환성을 위한 래퍼 메서드들
  createTripEventHandler = async (req: Request, res: Response) => {
    try {
      const apiResponse = await this.createTripEvent(req.body);
      res.status(201).json(apiResponse);
    } catch (error: any) {
      sendError(
        res,
        error.status || 400,
        error.message || '이벤트 생성에 실패했습니다',
      );
    }
  };

  updateTripEventHandler = async (req: Request, res: Response) => {
    try {
      const event_id = parseInt(req.params.event_id);
      const apiResponse = await this.updateTripEvent(event_id, req.body);
      res.status(200).json(apiResponse);
    } catch (error: any) {
      sendError(
        res,
        error.status || 400,
        error.message || '이벤트 업데이트에 실패했습니다',
      );
    }
  };

  getTripEventByIdHandler = async (req: Request, res: Response) => {
    try {
      const event_id = parseInt(req.params.event_id);
      const apiResponse = await this.getTripEventById(event_id);
      res.status(200).json(apiResponse);
    } catch (error: any) {
      sendError(
        res,
        error.status || 404,
        error.message || '이벤트를 찾을 수 없습니다',
      );
    }
  };

  deleteTripEventByIdHandler = async (req: Request, res: Response) => {
    try {
      const event_id = parseInt(req.params.event_id);

      if (isNaN(event_id)) {
        sendError(res, 400, '유효하지 않은 event_id입니다');
        return;
      }

      const apiResponse = await this.deleteTripEventById(event_id);
      res.status(200).json(apiResponse);
    } catch (error: any) {
      sendError(
        res,
        error.status || 404,
        error.message || '이벤트 삭제에 실패했습니다',
      );
    }
  };

  getTripEventsByTripIdHandler = async (req: Request, res: Response) => {
    try {
      const trip_id = parseInt(req.params.trip_id);
      const apiResponse = await this.getTripEventsByTripId(trip_id);
      res.status(200).json(apiResponse);
    } catch (error: any) {
      sendError(
        res,
        error.status || 404,
        error.message || '이벤트 목록을 찾을 수 없습니다',
      );
    }
  };
}
