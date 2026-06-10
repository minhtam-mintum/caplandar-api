import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type LabelDocument = HydratedDocument<Label>;

@Schema({ timestamps: true })
export class Label {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, default: '#6366f1' })
  color: string;
}

export const LabelSchema = SchemaFactory.createForClass(Label);
