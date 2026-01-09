import {
  Route,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Path,
  Response,
  Security,
} from 'tsoa';
import { TripEventDto } from '../../data/dtos/event/tripEventDto';
import { TripEventResponseDto } from '../../data/dtos/event/tripEventResponseDto';

export interface Cost {
  category: string;
  value: number;
}

// 이벤트 생성용 요청 모델 (eventId 없음)
export interface CreateTripEventRequest {
  tripId: number;
  eventName: string;
  location: string;
  startDate: string;
  endDate: string;
  cost: Cost[];
}

// 이벤트 업데이트용 요청 모델 (eventId 포함)
export interface TripEventRequest {
  tripId: number;
  eventId?: number;
  eventName: string;
  location: string;
  startDate: string;
  endDate: string;
  cost: Cost[];
}

export interface TripEventResponse {
  tripId: number;
  eventId: number;
  eventName: string;
  location: string;
  startDate: string;
  endDate: string;
  cost: Cost[];
}
