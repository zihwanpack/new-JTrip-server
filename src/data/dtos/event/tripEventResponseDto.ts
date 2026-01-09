import { Cost } from '../../../domain/entities/tripEvent.js';

export interface TripEventResponseDto {
  tripId: number;
  eventId: number;
  eventName: string;
  location: string;
  startDate: string;
  endDate: string;
  cost: Cost[];
}
