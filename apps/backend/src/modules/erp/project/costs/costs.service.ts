import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CostEntry } from './entities/cost-entry.entity';
import { CreateCostDto } from './dto/create-cost.dto';
import { ProjectsService } from '../projects/projects.service';

@Injectable()
export class CostsService {
  constructor(
    @InjectRepository(CostEntry)
    private readonly costRepo: Repository<CostEntry>,
    private readonly projectsService: ProjectsService,
  ) {}

  async create(tenantId: string, dto: CreateCostDto, createdBy?: string): Promise<CostEntry> {
    await this.projectsService.findById(tenantId, dto.projectId);

    const entry = this.costRepo.create({
      tenantId,
      projectId: dto.projectId,
      taskId: dto.taskId,
      category: dto.category,
      description: dto.description,
      amount: dto.amount,
      date: new Date(dto.date),
      createdBy,
    });

    const saved = await this.costRepo.save(entry);
    await this.recalcProjectCost(tenantId, dto.projectId);
    return saved;
  }

  async findByProject(tenantId: string, projectId: string): Promise<CostEntry[]> {
    return this.costRepo.find({
      where: { tenantId, projectId },
      order: { date: 'DESC' },
    });
  }

  async getSummary(tenantId: string, projectId: string) {
    const project = await this.projectsService.findById(tenantId, projectId);

    const byCategory = await this.costRepo
      .createQueryBuilder('c')
      .select('c.category', 'category')
      .addSelect('SUM(c.amount)', 'total')
      .where('c.tenantId = :tenantId', { tenantId })
      .andWhere('c.projectId = :projectId', { projectId })
      .groupBy('c.category')
      .getRawMany();

    return {
      budget: project.budget,
      actualCost: project.actualCost,
      remaining: Number(project.budget) - Number(project.actualCost),
      usagePercent: Number(project.budget) > 0
        ? Math.round((Number(project.actualCost) / Number(project.budget)) * 100)
        : 0,
      byCategory,
    };
  }

  async delete(tenantId: string, id: string): Promise<void> {
    const entry = await this.costRepo.findOne({ where: { id, tenantId } });
    if (!entry) throw new NotFoundException('成本記錄不存在');
    const projectId = entry.projectId;
    await this.costRepo.remove(entry);
    await this.recalcProjectCost(tenantId, projectId);
  }

  private async recalcProjectCost(tenantId: string, projectId: string): Promise<void> {
    const result = await this.costRepo
      .createQueryBuilder('c')
      .select('SUM(c.amount)', 'total')
      .where('c.tenantId = :tenantId', { tenantId })
      .andWhere('c.projectId = :projectId', { projectId })
      .getRawOne();

    const totalCost = Number(result?.total ?? 0);
    await this.projectsService.updateActualCost(tenantId, projectId, totalCost);
  }
}
