import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type EventDocument = HydratedDocument<Event>;

@Schema({ timestamps: true })
export class Event {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ default: null })
  description: string;

  @Prop({ type: Types.ObjectId, ref: 'Label', default: null })
  labelId: Types.ObjectId;

  @Prop({ required: true })
  startDate: Date;

  @Prop({ default: null })
  endDate: Date;

  @Prop({ default: false })
  allDay: boolean;

  @Prop({ default: null })
  color: string;
}

export const EventSchema = SchemaFactory.createForClass(Event);
EventSchema.index({ userId: 1, startDate: 1 });
