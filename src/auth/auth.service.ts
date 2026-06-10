import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import {
  RefreshToken,
  RefreshTokenDocument,
} from './schemas/refresh-token.schema';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

const REFRESH_TTL_DAYS = 7;

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private config: ConfigService,
    @InjectModel(RefreshToken.name)
    private refreshTokenModel: Model<RefreshTokenDocument>,
  ) {}

  async register(dto: RegisterDto) {
    const user = await this.usersService.create(
      dto.email,
      dto.password,
      dto.name,
    );
    return {
      message: 'User created',
      user: { _id: user._id, email: user.email, name: user.name },
    };
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email, true);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    const tokens = await this.issueTokens(String(user._id));
    return {
      ...tokens,
      user: { _id: user._id, email: user.email, name: user.name },
    };
  }

  async refresh(userId: string, rawRefreshToken: string) {
    const stored = await this.refreshTokenModel.find({
      userId: new Types.ObjectId(userId),
      expiresAt: { $gt: new Date() },
    });

    let matchedDoc: RefreshTokenDocument | null = null;
    for (const doc of stored) {
      if (await bcrypt.compare(rawRefreshToken, doc.tokenHash)) {
        matchedDoc = doc;
        break;
      }
    }

    if (!matchedDoc)
      throw new UnauthorizedException('Refresh token not recognized');

    await matchedDoc.deleteOne();
    return this.issueTokens(userId);
  }

  async logout(userId: string, rawRefreshToken: string) {
    const stored = await this.refreshTokenModel.find({
      userId: new Types.ObjectId(userId),
    });
    for (const doc of stored) {
      if (await bcrypt.compare(rawRefreshToken, doc.tokenHash)) {
        await doc.deleteOne();
        break;
      }
    }
  }

  private async issueTokens(userId: string) {
    const payload = { sub: userId };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.config.get<string>('JWT_ACCESS_SECRET'),

      expiresIn: this.config.get('JWT_ACCESS_EXPIRES_IN'),
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.config.get<string>('JWT_REFRESH_SECRET'),

      expiresIn: this.config.get('JWT_REFRESH_EXPIRES_IN'),
    });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TTL_DAYS);

    const tokenHash = await bcrypt.hash(refreshToken, 8);
    await this.refreshTokenModel.create({
      userId: new Types.ObjectId(userId),
      tokenHash,
      expiresAt,
    });

    return { accessToken, refreshToken };
  }
}
