// Server -> Client
export interface TripScheduleResponseDto {
  id: number;
  title: string;
  destination: string;
  destinationType: string;
  startDate: string;
  endDate: string;
  members: string[];
  createdBy: string;
}
