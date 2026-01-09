import { TripEvent } from '../../domain/entities/tripEvent.js';
import { TripEventDto } from '../dtos/event/tripEventDto.js';
import { TripEventResponseDto } from '../dtos/event/tripEventResponseDto.js';

export class TripEventConverter {
  // 엔티티로 들어가는 것
  static fromRequestDto(dto: TripEventDto): TripEvent {
    return {
      event_id: dto.eventId,
      trip_id: dto.tripId,
      event_name: dto.eventName,
      location: dto.location,
      start_date: new Date(dto.startDate), // ISO 문자열을 Date 객체로 변환
      end_date: new Date(dto.endDate), // ISO 문자열을 Date 객체로 변환
      cost: Array.isArray(dto.cost)
        ? dto.cost.map((costItem) => ({
            category: costItem.category,
            value: costItem.value,
          }))
        : [],
    };
  }

  // 클라이언트에게 나가는 것
  static toResponseDto(tripEvent: TripEvent): TripEventResponseDto {
    return {
      tripId: tripEvent.trip_id,
      eventId: tripEvent.event_id,
      eventName: tripEvent.event_name,
      location: tripEvent.location,
      startDate: tripEvent.start_date.toISOString(),
      endDate: tripEvent.end_date.toISOString(),
      cost: Array.isArray(tripEvent.cost)
        ? tripEvent.cost.map((costItem) => ({
            category: costItem.category,
            value: Number(costItem.value),
          }))
        : [],
    };
  }
}
