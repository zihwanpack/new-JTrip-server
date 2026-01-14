import prisma from '../../prisma/client';
import {
  TripEvent as PrismaTripEvent,
  Cost as PrismaCost,
} from '@prisma/client';
import { TripEventRepository } from '../../domain/repositories/tripEventRepository.js';
import { TripEvent } from '../../domain/entities/tripEvent.js';

export class PrismaTripEventRepositoryImpl implements TripEventRepository {
  async createTripEvent(
    tripEventData: Omit<TripEvent, 'event_id'>,
  ): Promise<TripEvent> {
    const costArray = Array.isArray(tripEventData.cost)
      ? tripEventData.cost
      : [];
    const created = await prisma.tripEvent.create({
      data: {
        tripSchedule_id: tripEventData.trip_id,
        event_name: tripEventData.event_name,
        location: tripEventData.location,
        start_date: tripEventData.start_date,
        end_date: tripEventData.end_date,
        costs: {
          create: costArray.map((c) => ({
            category: c.category,
            value: c.value,
          })),
        },
      },
      // costs도 같이 불러오기
      include: {
        costs: true,
      },
    });
    // prisma 데이터를 TripEvent type으로 바꾸기
    return this.toEntity(created);
  }

  async updateTripEvent(tripEventData: TripEvent): Promise<TripEvent> {
    const costArray = Array.isArray(tripEventData.cost)
      ? tripEventData.cost
      : [];
    const updated = await prisma.tripEvent.update({
      where: { id: tripEventData.event_id },
      data: {
        event_name: tripEventData.event_name,
        location: tripEventData.location,
        start_date: tripEventData.start_date,
        end_date: tripEventData.end_date,
        costs: {
          deleteMany: {}, // 기존 cost 모두 삭제하고
          create: costArray.map((c) => ({
            category: c.category,
            value: c.value,
          })), // 새로 등록
        },
      },
      include: {
        costs: true,
      },
    });

    return this.toEntity(updated);
  }

  async deleteTripEventById(event_id: number): Promise<boolean> {
    try {
      // 먼저 이벤트가 존재하는지 확인
      const event = await prisma.tripEvent.findUnique({
        where: { id: event_id },
      });

      if (!event) {
        return false;
      }

      // 관련된 Cost 레코드 먼저 삭제
      await prisma.cost.deleteMany({
        where: { tripEvent_id: event_id },
      });

      // 이벤트 삭제
      await prisma.tripEvent.delete({ where: { id: event_id } });
      return true;
    } catch (error) {
      console.error('Error deleting trip event:', error);
      return false;
    }
  }

  async getTripEventById(event_id: number): Promise<TripEvent | null> {
    const event = await prisma.tripEvent.findUnique({
      where: { id: event_id },
      include: { costs: true },
    });
    return event ? this.toEntity(event) : null;
  }

  async getTripEventsByTripId(trip_id: number): Promise<TripEvent[]> {
    const events = await prisma.tripEvent.findMany({
      where: { tripSchedule_id: trip_id },
      include: { costs: true },
    });

    return events.map(this.toEntity);
  }

  private toEntity(
    prismaEvent: PrismaTripEvent & { costs: PrismaCost[] },
  ): TripEvent {
    return {
      event_id: prismaEvent.id,
      trip_id: prismaEvent.tripSchedule_id,
      event_name: prismaEvent.event_name,
      location: prismaEvent.location,
      start_date: prismaEvent.start_date,
      end_date: prismaEvent.end_date,
      cost: Array.isArray(prismaEvent.costs)
        ? prismaEvent.costs.map((c) => ({
            category: c.category,
            value: c.value,
          }))
        : [],
    };
  }
}
