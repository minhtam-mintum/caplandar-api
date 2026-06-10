import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Event, EventDocument } from './schemas/event.schema';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';

export interface EventFilter {
  from?: string;
  to?: string;
  labelId?: string;
}

@Injectable()
export class EventsService {
  constructor(
    @InjectModel(Event.name) private eventModel: Model<EventDocument>,
  ) {}

  findAll(userId: string, { from, to, labelId }: EventFilter) {
    const filter: Record<string, any> = { userId: new Types.ObjectId(userId) };

    if (from || to) {
      const dateFilter: { $gte?: Date; $lte?: Date } = {};
      if (from) dateFilter.$gte = new Date(from);
      if (to) dateFilter.$lte = new Date(to);
      filter.startDate = dateFilter;
    }

    if (labelId) filter.labelId = new Types.ObjectId(labelId);

    return this.eventModel
      .find(filter)
      .sort({ startDate: 1 })
      .populate('labelId', 'name color');
  }

  async findOne(id: string, userId: string) {
    const event = await this.eventModel
      .findById(id)
      .populate('labelId', 'name color');
    if (!event) throw new NotFoundException('Event not found');
    if (String(event.userId) !== userId) throw new ForbiddenException();
    return event;
  }

  create(userId: string, dto: CreateEventDto) {
    return this.eventModel.create({
      userId: new Types.ObjectId(userId),
      ...dto,
      startDate: new Date(dto.startDate),
      endDate: dto.endDate ? new Date(dto.endDate) : undefined,
    });
  }

  async update(id: string, userId: string, dto: UpdateEventDto) {
    const event = await this.findOne(id, userId);

    const update: Record<string, any> = { ...dto };
    if (dto.startDate) update.startDate = new Date(dto.startDate);
    if (dto.endDate) update.endDate = new Date(dto.endDate);
    Object.assign(event, update);
    return event.save();
  }

  async remove(id: string, userId: string) {
    const event = await this.findOne(id, userId);
    await event.deleteOne();
  }
}
