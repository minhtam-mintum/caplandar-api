import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Label, LabelDocument } from './schemas/label.schema';
import { CreateLabelDto } from './dto/create-label.dto';
import { UpdateLabelDto } from './dto/update-label.dto';

@Injectable()
export class LabelsService {
  constructor(
    @InjectModel(Label.name) private labelModel: Model<LabelDocument>,
  ) {}

  findAll(userId: string) {
    return this.labelModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 });
  }

  async findOne(id: string, userId: string) {
    const label = await this.labelModel.findById(id);
    if (!label) throw new NotFoundException('Label not found');
    if (String(label.userId) !== userId) throw new ForbiddenException();
    return label;
  }

  create(userId: string, dto: CreateLabelDto) {
    return this.labelModel.create({
      userId: new Types.ObjectId(userId),
      ...dto,
    });
  }

  async update(id: string, userId: string, dto: UpdateLabelDto) {
    const label = await this.findOne(id, userId);
    Object.assign(label, dto);
    return label.save();
  }

  async remove(id: string, userId: string) {
    const label = await this.findOne(id, userId);
    await label.deleteOne();
  }
}
