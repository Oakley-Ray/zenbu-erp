import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { Resource } from './entities/resource.entity';
import { ResourceAssignment } from './entities/resource-assignment.entity';
import { CreateResourceDto, AssignResourceDto } from './dto/assign-resource.dto';

@Injectable()
export class ResourcesService {
  constructor(
    @InjectRepository(Resource)
    private readonly resourceRepo: Repository<Resource>,
    @InjectRepository(ResourceAssignment)
    private readonly assignmentRepo: Repository<ResourceAssignment>,
  ) {}

  async createResource(tenantId: string, dto: CreateResourceDto): Promise<Resource> {
    const resource = this.resourceRepo.create({
      tenantId,
      name: dto.name,
      type: dto.type,
      unit: dto.unit ?? 'hour',
      unitCost: dto.unitCost ?? 0,
    });
    return this.resourceRepo.save(resource);
  }

  async findAllResources(tenantId: string): Promise<Resource[]> {
    return this.resourceRepo.find({
      where: { tenantId },
      order: { type: 'ASC', name: 'ASC' },
    });
  }

  async assignResource(tenantId: string, dto: AssignResourceDto): Promise<ResourceAssignment> {
    const resource = await this.resourceRepo.findOne({
      where: { id: dto.resourceId, tenantId },
    });
    if (!resource) throw new NotFoundException('資源不存在');

    // 檢查時間衝突（僅限人員和設備）
    if (dto.startDate && dto.endDate && resource.type !== 'material') {
      const conflicts = await this.assignmentRepo
        .createQueryBuilder('ra')
        .where('ra.tenantId = :tenantId', { tenantId })
        .andWhere('ra.resourceId = :resourceId', { resourceId: dto.resourceId })
        .andWhere('ra.startDate <= :endDate', { endDate: dto.endDate })
        .andWhere('ra.endDate >= :startDate', { startDate: dto.startDate })
        .getCount();

      if (conflicts > 0) {
        throw new BadRequestException(
          `資源「${resource.name}」在該時段已有其他分配`,
        );
      }
    }

    const quantity = dto.quantity ?? 1;
    const totalCost = quantity * Number(resource.unitCost);

    const assignment = this.assignmentRepo.create({
      tenantId,
      taskId: dto.taskId,
      resourceId: dto.resourceId,
      quantity,
      startDate: dto.startDate ? new Date(dto.startDate) : undefined,
      endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      totalCost,
    });

    return this.assignmentRepo.save(assignment);
  }

  async findAssignmentsByTask(tenantId: string, taskId: string): Promise<ResourceAssignment[]> {
    return this.assignmentRepo.find({
      where: { tenantId, taskId },
      relations: ['resource'],
    });
  }

  async removeAssignment(tenantId: string, id: string): Promise<void> {
    const assignment = await this.assignmentRepo.findOne({
      where: { id, tenantId },
    });
    if (!assignment) throw new NotFoundException('資源分配不存在');
    await this.assignmentRepo.remove(assignment);
  }

  async deleteResource(tenantId: string, id: string): Promise<void> {
    const resource = await this.resourceRepo.findOne({
      where: { id, tenantId },
    });
    if (!resource) throw new NotFoundException('資源不存在');
    await this.resourceRepo.remove(resource);
  }
}
