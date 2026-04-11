import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Milestone } from './entities/milestone.entity';
import { CreateMilestoneDto, UpdateMilestoneDto } from './dto/create-milestone.dto';
import { MilestoneStatus } from '@layerframe/shared-types';

@Injectable()
export class MilestonesService {
  constructor(
    @InjectRepository(Milestone)
    private readonly milestoneRepo: Repository<Milestone>,
  ) {}

  async create(tenantId: string, dto: CreateMilestoneDto): Promise<Milestone> {
    const milestone = this.milestoneRepo.create({
      tenantId,
      projectId: dto.projectId,
      name: dto.name,
      description: dto.description,
      dueDate: new Date(dto.dueDate),
      deliverables: dto.deliverables?.map((d) => ({
        name: d.name,
        description: d.description,
        completed: d.completed ?? false,
      })) ?? [],
    });
    return this.milestoneRepo.save(milestone);
  }

  async findByProject(tenantId: string, projectId: string): Promise<Milestone[]> {
    return this.milestoneRepo.find({
      where: { tenantId, projectId },
      order: { dueDate: 'ASC' },
    });
  }

  async findById(tenantId: string, id: string): Promise<Milestone> {
    const milestone = await this.milestoneRepo.findOne({
      where: { id, tenantId },
    });
    if (!milestone) throw new NotFoundException('里程碑不存在');
    return milestone;
  }

  async update(tenantId: string, id: string, dto: UpdateMilestoneDto): Promise<Milestone> {
    const milestone = await this.findById(tenantId, id);
    if (dto.name !== undefined) milestone.name = dto.name;
    if (dto.description !== undefined) milestone.description = dto.description;
    if (dto.dueDate) milestone.dueDate = new Date(dto.dueDate);
    if (dto.deliverables !== undefined) {
      milestone.deliverables = dto.deliverables.map((d) => ({
        name: d.name,
        description: d.description,
        completed: d.completed ?? false,
      }));
    }
    return this.milestoneRepo.save(milestone);
  }

  async achieve(tenantId: string, id: string): Promise<Milestone> {
    const milestone = await this.findById(tenantId, id);
    milestone.status = MilestoneStatus.ACHIEVED;
    milestone.achievedDate = new Date();
    return this.milestoneRepo.save(milestone);
  }

  async delete(tenantId: string, id: string): Promise<void> {
    const milestone = await this.findById(tenantId, id);
    await this.milestoneRepo.remove(milestone);
  }
}
