// Client -> Server
// Create Trip input data
export interface CreateTripDto {
  title: string;
  destination: string;
  destinationType: string;
  startDate: string;
  endDate: string;
  members: string[];
  createdBy: string;
}
