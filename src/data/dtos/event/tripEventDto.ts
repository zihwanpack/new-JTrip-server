import { Cost } from '../../../domain/entities/tripEvent.js';

export interface TripEventDto {
  tripId: number;
  eventId: number;
  eventName: string;
  location: string;
  startDate: Date | string;
  endDate: Date | string;
  cost: Cost[];
}
