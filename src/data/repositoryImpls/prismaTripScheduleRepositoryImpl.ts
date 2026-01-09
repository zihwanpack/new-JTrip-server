import prisma from '../../../prisma/client'; // 싱글톤 패턴 적용

import { TripScheduleRepository } from '../../domain/repositories/tripScheduleRepository';
import {
  TripSchedule,
  TripScheduleWithMembers,
} from '../../domain/entities/tripSchedule';

export class PrismaTripScheduleRepositoryImpl
  implements TripScheduleRepository
{
  async create(
    tripSchedule: Omit<TripScheduleWithMembers, 'id'>,
  ): Promise<TripSchedule> {
    try {
      return await prisma.$transaction(async () => {
        // 1. TripSchedule 생성
        const createdTrip = await prisma.tripSchedule.create({
          data: {
            name: tripSchedule.name,
            destination: tripSchedule.destination,
            destination_type: tripSchedule.destination_type,
            start_date: tripSchedule.start_date,
            end_date: tripSchedule.end_date,
            created_by: tripSchedule.created_by,
          } as any,
          select: {
            id: true,
            name: true,
            destination: true,
            destination_type: true,
            start_date: true,
            end_date: true,
            created_by: true,
          } as any,
        });

        // 2. 이메일 배열을 기반으로 유저 ID 조회 (created_by 포함)
        const membersWithCreator = [
          tripSchedule.created_by,
          ...tripSchedule.members.filter(
            (email) => email !== tripSchedule.created_by,
          ),
        ];

        const users = await prisma.user.findMany({
          where: {
            email: {
              in: membersWithCreator, // created_by 포함
            },
          },
          select: {
            id: true,
            email: true,
          },
        });

        const foundEmails = users.map((user) => user.email);
        const missingEmails = membersWithCreator.filter(
          (email) => !foundEmails.includes(email),
        );

        // members에 해당하는 이메일을 가진 유저를 찾을 수 없을 때 로그 남김.
        if (missingEmails.length > 0) {
          console.warn('Some users were not found:', missingEmails);
        }

        // 3. tripScheduleUser 테이블에 저장할 데이터 구성
        const tripScheduleUsers: Array<{
          user_id: string;
          tripSchedule_id: number;
        }> = users.map((user) => ({
          user_id: user.id,
          tripSchedule_id: Number(createdTrip.id),
        }));

        // 4. tripScheduleUser 테이블에 데이터 저장
        if (tripScheduleUsers.length > 0) {
          await prisma.tripScheduleUser.createMany({
            data: tripScheduleUsers as any,
            skipDuplicates: true, // 중복 방지
          });
        }

        return {
          id: createdTrip.id,
          name: createdTrip.name,
          destination: createdTrip.destination,
          destination_type: (createdTrip as any).destination_type || '',
          start_date: createdTrip.start_date,
          end_date: createdTrip.end_date,
          created_by: createdTrip.created_by,
        } as unknown as TripSchedule;
      });
    } catch (error) {
      console.error('PrismaTripScheduleRepositoryImpl create error:', error);
      throw new Error(
        `Failed to create trip schedule: ${(error as Error).message}`,
      );
    }
  }

  async update(
    tripSchedule: TripScheduleWithMembers & { id: number },
  ): Promise<void> {
    try {
      await prisma.$transaction(async () => {
        // 1. 기존 TripSchedule 업데이트
        await prisma.tripSchedule.update({
          where: { id: tripSchedule.id },
          data: {
            name: tripSchedule.name,
            destination: tripSchedule.destination,
            destination_type: tripSchedule.destination_type,
            start_date: tripSchedule.start_date,
            end_date: tripSchedule.end_date,
          } as any,
        });

        // 2. 새로운 멤버 리스트로 갱신
        if (tripSchedule.members) {
          // 2-1 기존 멤버 삭제
          await prisma.tripScheduleUser.deleteMany({
            where: { tripSchedule_id: tripSchedule.id },
          });

          // 이메일로 유저 조회
          const users = await prisma.user.findMany({
            where: {
              email: {
                in: tripSchedule.members,
              },
            },
            select: {
              id: true,
              email: true,
            },
          });

          // 이메일로 조회된 유저 목록 (User[])
          const tripScheduleUsers = users.map((user) => ({
            user_id: user.id,
            tripSchedule_id: tripSchedule.id,
          })) as any;

          if (tripScheduleUsers.length > 0) {
            await prisma.tripScheduleUser.createMany({
              data: tripScheduleUsers,
              skipDuplicates: true,
            });
          }
        }
      });
    } catch (error) {
      console.error('PrismaTripScheduleRepositoryImpl update error:', error);
      throw new Error(
        `Failed to update trip schedule update ${(error as Error).message}`,
      );
    }
  }

  // TripScheduleUser 테이블에서 유저 ID로 유저가 속한 tripSchedule 리스트 조회
  async findTripsByUserId(userId: string): Promise<TripSchedule[]> {
    try {
      const trips = await prisma.tripSchedule.findMany({
        where: {
          members: {
            some: {
              user_id: userId,
            },
          },
        },
        select: {
          id: true,
          name: true,
          destination: true,
          destination_type: true,
          start_date: true,
          end_date: true,
          created_by: true,
        } as any,
      });

      return (trips as unknown as any[]).map((trip: any) => ({
        id: trip.id,
        name: trip.name,
        destination: trip.destination,
        destination_type: trip.destination_type || '',
        start_date: trip.start_date,
        end_date: trip.end_date,
        created_by: trip.created_by,
      })) as TripSchedule[];
    } catch (error) {
      console.error('Error fetching trips by user ID:', error);
      throw new Error('Failed to fetch trips for the user');
    }
  }

  // 유저 ID와 날짜 범위로 여행 일정 조회
  async findTripsByUserIdAndDateRange(
    userId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<TripSchedule[]> {
    try {
      const whereConditions: any = {
        members: {
          some: {
            user_id: userId,
          },
        },
      };

      // 날짜 필터 조건 추가
      if (startDate !== undefined || endDate !== undefined) {
        whereConditions.AND = [];

        if (startDate !== undefined) {
          whereConditions.AND.push({
            start_date: {
              gte: startDate,
            },
          });
        }

        if (endDate !== undefined) {
          whereConditions.AND.push({
            end_date: {
              lte: endDate,
            },
          });
        }
      }

      const trips = await prisma.tripSchedule.findMany({
        where: whereConditions,
        select: {
          id: true,
          name: true,
          destination: true,
          destination_type: true,
          start_date: true,
          end_date: true,
          created_by: true,
        } as any,
      });

      return (trips as unknown as any[]).map((trip: any) => ({
        id: trip.id,
        name: trip.name,
        destination: trip.destination,
        destination_type: trip.destination_type || '',
        start_date: trip.start_date,
        end_date: trip.end_date,
        created_by: trip.created_by,
      })) as TripSchedule[];
    } catch (error) {
      console.error('Error fetching trips by user ID and date range:', error);
      throw new Error('Failed to fetch trips for the user with date range');
    }
  }

  // 지나간 여행 일정 조회 (커서 기반, end_date < 현재 날짜)
  async findPastTripsByUserIdWithCursor(
    userId: string,
    cursor: number | null,
    limit: number,
  ): Promise<{ trips: TripSchedule[]; hasNext: boolean }> {
    try {
      const now = new Date();
      now.setHours(0, 0, 0, 0);

      const whereConditions: any = {
        members: {
          some: {
            user_id: userId,
          },
        },
        end_date: {
          lt: now, // end_date < 현재 날짜
        },
      };

      // 커서가 있으면 커서 이후의 데이터만 조회 (커서보다 작은 ID)
      if (cursor !== null) {
        whereConditions.id = {
          lt: cursor, // id가 커서보다 작은 것 (desc 정렬이므로)
        };
      }

      const take = limit + 1; // hasNext 확인을 위해 1개 더 가져옴

      const trips = await prisma.tripSchedule.findMany({
        where: whereConditions,
        select: {
          id: true,
          name: true,
          destination: true,
          destination_type: true,
          start_date: true,
          end_date: true,
          created_by: true,
        } as any,
        orderBy: [
          {
            end_date: 'desc', // 최신순 (최근에 끝난 여행이 먼저)
          },
          {
            id: 'desc', // 같은 날짜면 ID 내림차순
          },
        ],
        take,
      });

      const hasNext = trips.length > limit;
      const resultTrips = hasNext ? trips.slice(0, limit) : trips;

      return {
        trips: (resultTrips as unknown as any[]).map((trip: any) => ({
          id: trip.id,
          name: trip.name,
          destination: trip.destination,
          destination_type: trip.destination_type || '',
          start_date: trip.start_date,
          end_date: trip.end_date,
          created_by: trip.created_by,
        })) as TripSchedule[],
        hasNext,
      };
    } catch (error) {
      console.error('Error fetching past trips by user ID with cursor:', error);
      throw new Error('Failed to fetch past trips for the user with cursor');
    }
  }

  // 다가올 여행 일정 조회 (커서 기반, start_date > 현재 날짜)
  async findUpcomingTripsByUserIdWithCursor(
    userId: string,
    cursor: number | null,
    limit: number,
  ): Promise<{ trips: TripSchedule[]; hasNext: boolean }> {
    try {
      const now = new Date();
      now.setHours(23, 59, 59, 999);

      const whereConditions: any = {
        members: {
          some: {
            user_id: userId,
          },
        },
        start_date: {
          gt: now, // start_date > 현재 날짜
        },
      };

      // 커서가 있으면 커서 이후의 데이터만 조회 (커서보다 큰 ID)
      if (cursor !== null) {
        whereConditions.id = {
          gt: cursor, // id가 커서보다 큰 것 (asc 정렬이므로)
        };
      }

      const take = limit + 1; // hasNext 확인을 위해 1개 더 가져옴

      const trips = await prisma.tripSchedule.findMany({
        where: whereConditions,
        select: {
          id: true,
          name: true,
          destination: true,
          destination_type: true,
          start_date: true,
          end_date: true,
          created_by: true,
        } as any,
        orderBy: [
          {
            start_date: 'asc', // 오래된 순 (가까운 여행이 먼저)
          },
          {
            id: 'asc', // 같은 날짜면 ID 오름차순
          },
        ],
        take,
      });

      const hasNext = trips.length > limit;
      const resultTrips = hasNext ? trips.slice(0, limit) : trips;

      return {
        trips: (resultTrips as unknown as any[]).map((trip: any) => ({
          id: trip.id,
          name: trip.name,
          destination: trip.destination,
          destination_type: trip.destination_type || '',
          start_date: trip.start_date,
          end_date: trip.end_date,
          created_by: trip.created_by,
        })) as TripSchedule[],
        hasNext,
      };
    } catch (error) {
      console.error(
        'Error fetching upcoming trips by user ID with cursor:',
        error,
      );
      throw new Error(
        'Failed to fetch upcoming trips for the user with cursor',
      );
    }
  }

  // trip_id로 여행 일정 조회
  async findTripById(id: number): Promise<TripSchedule> {
    const trip = await prisma.tripSchedule.findUnique({
      where: { id },
    });

    if (!trip) {
      throw new Error('Trip not found');
    }
    return {
      ...trip,
      destination_type: (trip as any).destination_type || '',
    } as TripSchedule;
  }

  // 여행에 속해 있는 유저 이메일 조회
  async getMembersEmail(tripId: number): Promise<string[]> {
    try {
      // 1. tripScheduleUser 테이블에서 tripId에 해당하는 user_id 조회
      const userIds = await prisma.tripScheduleUser.findMany({
        where: { tripSchedule_id: tripId },
        select: { user_id: true },
      });

      const ids = userIds.map((user) => user.user_id);

      if (ids.length === 0) return [];

      // 2. user_id를 바탕으로 User 테이블에서 이메일 조회
      const users = await prisma.user.findMany({
        where: {
          id: {
            in: ids,
          },
        },
        select: {
          email: true,
        },
      });

      return users.map((user) => user.email);
    } catch (error) {
      console.error('Error in getMembersEmail', error);
      throw new Error('Failed to get members email');
    }
  }

  // 단일 여행 일정 삭제
  async deleteTripById(id: number): Promise<boolean> {
    try {
      await prisma.$transaction([
        prisma.tripScheduleUser.deleteMany({ where: { tripSchedule_id: id } }),
        prisma.tripSchedule.delete({ where: { id } }),
      ]);
      return true;
    } catch (error) {
      console.error('Error deleting trip by ID:', error);
      return false;
    }
  }

  // 복수 여행 일정 삭제
  async deleteTripsByIds(ids: number[]): Promise<boolean> {
    try {
      await prisma.$transaction([
        prisma.tripScheduleUser.deleteMany({
          where: { tripSchedule_id: { in: ids } },
        }),
        prisma.tripSchedule.deleteMany({ where: { id: { in: ids } } }),
      ]);
      return true;
    } catch (error) {
      console.error('Error deleting trips by IDs:', error);
      return false;
    }
  }
}
