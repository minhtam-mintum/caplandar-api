import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { User, UserDocument } from './schemas/user.schema';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async findById(id: string): Promise<UserDocument> {
    const user = await this.userModel.findById(id);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findByEmail(
    email: string,
    withPassword = false,
  ): Promise<UserDocument | null> {
    const query = this.userModel.findOne({ email });
    if (withPassword) query.select('+password');
    return query.exec();
  }

  async create(
    email: string,
    password: string,
    name: string,
  ): Promise<UserDocument> {
    const existing = await this.userModel.findOne({ email });
    if (existing) throw new ConflictException('Email already in use');

    const hash = await bcrypt.hash(password, 10);
    return this.userModel.create({ email, password: hash, name });
  }

  async update(id: string, dto: UpdateUserDto): Promise<UserDocument> {
    const update: Partial<User & { password: string }> = {};

    if (dto.name) update.name = dto.name;
    if (dto.email) update.email = dto.email.toLowerCase().trim();

    if (dto.newPassword) {
      if (!dto.currentPassword) {
        throw new UnauthorizedException(
          'currentPassword is required to change password',
        );
      }
      const user = await this.userModel.findById(id).select('+password');
      if (!user) throw new NotFoundException('User not found');

      const valid = await bcrypt.compare(dto.currentPassword, user.password);
      if (!valid)
        throw new UnauthorizedException('Current password is incorrect');

      update.password = await bcrypt.hash(dto.newPassword, 10);
    }

    const updated = await this.userModel.findByIdAndUpdate(id, update, {
      new: true,
    });
    if (!updated) throw new NotFoundException('User not found');
    return updated;
  }

  async delete(id: string): Promise<void> {
    await this.userModel.findByIdAndDelete(id);
  }
}
