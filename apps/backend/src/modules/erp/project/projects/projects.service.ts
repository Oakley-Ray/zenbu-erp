import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from './entities/project.entity';
import { CreateProjectDto, UpdateProjectDto } from './dto/create-project.dto';
import { ProjectStatus } from '@layerframe/shared-types';

const PROJECT_STATE_TRANSITIONS: Record<ProjectStatus, ProjectStatus[]> = {
  [ProjectStatus.PLANNING]: [ProjectStatus.ACTIVE, ProjectStatus.CANCELLED],
  [ProjectStatus.ACTIVE]: [ProjectStatus.ON_HOLD, ProjectStatus.COMPLETED, ProjectStatus.CANCELLED],
  [ProjectStatus.ON_HOLD]: [ProjectStatus.ACTIVE, ProjectStatus.CANCELLED],
  [ProjectStatus.COMPLETED]: [],
  [ProjectStatus.CANCELLED]: [],
};

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepo: Repository<Project>,
  ) {}

  async create(tenantId: string, dto: CreateProjectDto, createdBy?: string): Promise<Project> {
    const project = this.projectRepo.create({
      tenantId,
      projectCode: await this.generateProjectCode(tenantId),
      name: dto.name,
      description: dto.description,
      startDate: new Date(dto.startDate),
      endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      budget: dto.budget ?? 0,
      managerId: dto.managerId,
      createdBy,
    });
    return this.projectRepo.save(project);
  }

  async findAll(tenantId: string, opts?: {
    page?: number;
    limit?: number;
    status?: ProjectStatus;
  }) {
    const page = opts?.page ?? 1;
    const limit = opts?.limit ?? 20;

    const qb = this.projectRepo
      .createQueryBuilder('p')
      .where('p.tenantId = :tenantId', { tenantId })
      .orderBy('p.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (opts?.status) {
      qb.andWhere('p.status = :status', { status: opts.status });
    }

    const [data, total] = await qb.getManyAndCount();
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findById(tenantId: string, id: string): Promise<Project> {
    const project = await this.projectRepo.findOne({
      where: { id, tenantId },
      relations: ['tasks', 'milestones'],
    });
    if (!project) throw new NotFoundException('專案不存在');
    return project;
  }

  async update(tenantId: string, id: string, dto: UpdateProjectDto): Promise<Project> {
    const project = await this.findById(tenantId, id);
    if (dto.name !== undefined) project.name = dto.name;
    if (dto.description !== undefined) project.description = dto.description;
    if (dto.startDate) project.startDate = new Date(dto.startDate);
    if (dto.endDate) project.endDate = new Date(dto.endDate);
    if (dto.budget !== undefined) project.budget = dto.budget;
    if (dto.managerId !== undefined) project.managerId = dto.managerId;
    return this.projectRepo.save(project);
  }

  async updateStatus(tenantId: string, id: string, newStatus: ProjectStatus): Promise<Project> {
    const project = await this.findById(tenantId, id);
    const allowed = PROJECT_STATE_TRANSITIONS[project.status];
    if (!allowed?.includes(newStatus)) {
      throw new BadRequestException(
        `無法從 ${project.status} 轉換到 ${newStatus}。合法的下一步：${allowed?.join(', ') || '無'}`,
      );
    }
    project.status = newStatus;
    return this.projectRepo.save(project);
  }

  async updateProgress(tenantId: string, id: string, progress: number): Promise<void> {
    await this.projectRepo.update({ id, tenantId }, { progress });
  }

  async updateActualCost(tenantId: string, id: string, actualCost: number): Promise<void> {
    await this.projectRepo.update({ id, tenantId }, { actualCost });
  }

  async delete(tenantId: string, id: string): Promise<void> {
    const project = await this.findById(tenantId, id);
    if (project.status === ProjectStatus.ACTIVE) {
      throw new BadRequestException('無法刪除進行中的專案，請先取消或完成');
    }
    await this.projectRepo.remove(project);
  }

  private async generateProjectCode(tenantId: string): Promise<string> {
    const now = new Date();
    const ym = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const prefix = `PRJ-${ym}`;
    const count = await this.projectRepo
      .createQueryBuilder('p')
      .where('p.tenantId = :tenantId', { tenantId })
      .andWhere('p.projectCode LIKE :prefix', { prefix: `${prefix}%` })
      .getCount();
    return `${prefix}-${String(count + 1).padStart(3, '0')}`;
  }
}
