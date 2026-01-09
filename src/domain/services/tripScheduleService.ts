import {
  TripSchedule,
  TripScheduleWithMembers,
} from '../entities/tripSchedule';
import { TripScheduleRepository } from '../repositories/tripScheduleRepository';

export class TripScheduleService {
  constructor(private tripScheduleRepository: TripScheduleRepository) {}

  async createTripSchedule(
    tripScheduleData: Omit<TripScheduleWithMembers, 'id'>,
  ): Promise<TripSchedule> {
    try {
      return await this.tripScheduleRepository.create(tripScheduleData);
    } catch (error) {
      console.error('TripScheduleService create error:', error);
      throw new Error(
        `Failed to create trip schedule: ${(error as Error).message}`,
      );
    }
  }

  // 유저가 속한 여행 일정 조회
  async getTripSchedulesByUserId(userId: string): Promise<TripSchedule[]> {
    try {
      return await this.tripScheduleRepository.findTripsByUserId(userId);
    } catch (error) {
      console.error(
        'TripScheduleService getTripSchedulesByUserId error',
        error,
      );
      throw new Error('Failed to fetch trip schedules for user');
    }
  }

  // 지나간 여행 일정 조회 (end_date < 현재 날짜)
  async getPastTripsByUserId(userId: string): Promise<TripSchedule[]> {
    try {
      const now = new Date();
      // 오늘 00:00:00으로 설정
      now.setHours(0, 0, 0, 0);
      // end_date <= now로 조회한 후, end_date < now인 것만 필터링
      const trips =
        await this.tripScheduleRepository.findTripsByUserIdAndDateRange(
          userId,
          undefined,
          now,
        );
      return trips.filter((trip) => trip.end_date < now);
    } catch (error) {
      console.error('TripScheduleService getPastTripsByUserId error', error);
      throw new Error('Failed to fetch past trip schedules for user');
    }
  }

  // 진행중인 여행 일정 조회 (start_date <= 현재 날짜 <= end_date) - 단일 객체 반환
  async getCurrentTripsByUserId(userId: string): Promise<TripSchedule | null> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const endOfToday = new Date(today);
      endOfToday.setHours(23, 59, 59, 999);

      // 날짜만 비교하기 위해 시간 정보 제거
      const getDateOnly = (date: Date): Date => {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        return d;
      };

      // Repository에서 직접 필터링하는 것이 더 효율적이지만,
      // 현재 구조상 모든 여행을 가져온 후 필터링
      const allTrips =
        await this.tripScheduleRepository.findTripsByUserId(userId);

      const currentTrips = allTrips.filter((trip) => {
        const tripStartDate = getDateOnly(trip.start_date);
        const tripEndDate = getDateOnly(trip.end_date);
        const todayDate = getDateOnly(today);

        // start_date의 날짜 <= 오늘의 날짜 <= end_date의 날짜
        return tripStartDate <= todayDate && tripEndDate >= todayDate;
      });

      // 첫 번째 진행중인 여행만 반환 (없으면 null)
      return currentTrips.length > 0 ? currentTrips[0] : null;
    } catch (error) {
      console.error('TripScheduleService getCurrentTripsByUserId error', error);
      throw new Error('Failed to fetch current trip schedules for user');
    }
  }

  // 다가올 여행 일정 조회 (start_date > 현재 날짜)
  async getUpcomingTripsByUserId(userId: string): Promise<TripSchedule[]> {
    try {
      const now = new Date();
      // 오늘 23:59:59로 설정
      now.setHours(23, 59, 59, 999);
      // start_date >= now로 조회한 후, start_date > now인 것만 필터링
      const trips =
        await this.tripScheduleRepository.findTripsByUserIdAndDateRange(
          userId,
          now,
          undefined,
        );
      return trips.filter((trip) => trip.start_date > now);
    } catch (error) {
      console.error(
        'TripScheduleService getUpcomingTripsByUserId error',
        error,
      );
      throw new Error('Failed to fetch upcoming trip schedules for user');
    }
  }

  // 지나간 여행 일정 조회 (커서 기반)
  async getPastTripsByUserIdWithCursor(
    userId: string,
    cursor: number | null,
    limit: number,
  ): Promise<{ trips: TripSchedule[]; hasNext: boolean }> {
    try {
      return await this.tripScheduleRepository.findPastTripsByUserIdWithCursor(
        userId,
        cursor,
        limit,
      );
    } catch (error) {
      console.error(
        'TripScheduleService getPastTripsByUserIdWithCursor error',
        error,
      );
      throw new Error('Failed to fetch past trip schedules for user');
    }
  }

  // 다가올 여행 일정 조회 (커서 기반)
  async getUpcomingTripsByUserIdWithCursor(
    userId: string,
    cursor: number | null,
    limit: number,
  ): Promise<{ trips: TripSchedule[]; hasNext: boolean }> {
    try {
      return await this.tripScheduleRepository.findUpcomingTripsByUserIdWithCursor(
        userId,
        cursor,
        limit,
      );
    } catch (error) {
      console.error(
        'TripScheduleService getUpcomingTripsByUserIdWithCursor error',
        error,
      );
      throw new Error('Failed to fetch upcoming trip schedules for user');
    }
  }

  // 멤버를 포함한 여행 일정 조회
  async getTripScheduleWithmembers(
    tripId: number,
  ): Promise<TripSchedule & { members: string[] }> {
    const trip = await this.tripScheduleRepository.findTripById(tripId);

    if (!trip) {
      throw new Error('Trip not found');
    }

    const members = await this.tripScheduleRepository.getMembersEmail(tripId);

    return { ...trip, members };
  }

  // update
  async updateTripSchedule(trip: TripScheduleWithMembers): Promise<void> {
    await this.tripScheduleRepository.update(trip);
  }

  // delete - 단일
  async deleteTripById(id: number): Promise<void> {
    try {
      const success = await this.tripScheduleRepository.deleteTripById(id);

      if (!success) {
        throw new Error('Trip deleted failed');
      }
    } catch (error) {
      console.error('TripScheduleService delete error:', error);
      throw new Error(`Failed to delete trip whit ID: ${id}`);
    }
  }

  // delete - 복수 (프론트 체크박스 미구현)
  async deleteTripsByIds(ids: number[]): Promise<void> {
    try {
      const success = await this.tripScheduleRepository.deleteTripsByIds(ids);
      if (!success) {
        throw new Error('Trip deleted failed');
      }
    } catch (error) {
      console.error('TripScheduleService deleteTripsByIds error:', error);
      throw new Error(`Failed to delete trips with IDs: ${ids.join(', ')}`);
    }
  }
}
