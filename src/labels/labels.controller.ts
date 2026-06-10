import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { LabelsService } from './labels.service';
import { CreateLabelDto } from './dto/create-label.dto';
import { UpdateLabelDto } from './dto/update-label.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('labels')
@UseGuards(JwtAuthGuard)
export class LabelsController {
  constructor(private labelsService: LabelsService) {}

  @Get()
  findAll(@CurrentUser() user: { userId: string }) {
    return this.labelsService.findAll(user.userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: { userId: string }) {
    return this.labelsService.findOne(id, user.userId);
  }

  @Post()
  create(@CurrentUser() user: { userId: string }, @Body() dto: CreateLabelDto) {
    return this.labelsService.create(user.userId, dto);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @CurrentUser() user: { userId: string },
    @Body() dto: UpdateLabelDto,
  ) {
    return this.labelsService.update(id, user.userId, dto);
  }

  @Delete(':id')
  @HttpCode(200)
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: { userId: string },
  ) {
    await this.labelsService.remove(id, user.userId);
    return { message: 'Label deleted' };
  }
}
