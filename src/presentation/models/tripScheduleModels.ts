import { Route } from 'tsoa';

export interface CreateTripRequest {
  title: string;
  destination: string;
  destinationType: string;
  startDate: string;
  endDate: string;
  members: string[];
  createdBy: string;
}

export interface UpdateTripRequest {
  title: string;
  destination: string;
  destinationType: string;
  startDate: string;
  endDate: string;
  members: string[];
  createdBy: string;
}

export interface TripScheduleResponse {
  id: number;
  title: string;
  destination: string;
  destinationType: string;
  startDate: string;
  endDate: string;
  createdBy: string;
  members: string[];
}
