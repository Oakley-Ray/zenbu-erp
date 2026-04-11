import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WbsTask } from './entities/wbs-task.entity';
import { CreateTaskDto, UpdateTaskDto } from './dto/create-task.dto';
import { TaskStatus } from '@layerframe/shared-types';
import { ProjectsService } from '../projects/projects.service';

@Injectable()
export class WbsService {
  constructor(
    @InjectRepository(WbsTask)
    private readonly taskRepo: Repository<WbsTask>,
    private readonly projectsService: ProjectsService,
  ) {}

  async create(tenantId: string, dto: CreateTaskDto): Promise<WbsTask> {
    await this.projectsService.findById(tenantId, dto.projectId);

    let level = 0;
    let parentPath = '';
    if (dto.parentId) {
      const parent = await this.findById(tenantId, dto.parentId);
      level = parent.level + 1;
      parentPath = parent.path;
    }

    const siblingCount = await this.taskRepo.count({
      where: { tenantId, projectId: dto.projectId, parentId: dto.parentId ?? undefined },
    });

    const sortOrder = siblingCount;
    const codeSegment = String(sortOrder + 1);
    const code = parentPath ? `${parentPath}.${codeSegment}` : codeSegment;
    const path = code;

    const task = this.taskRepo.create({
      tenantId,
      projectId: dto.projectId,
      parentId: dto.parentId,
      path,
      level,
      sortOrder,
      code,
      name: dto.name,
      description: dto.description,
      plannedStartDate: dto.plannedStartDate ? new Date(dto.plannedStartDate) : undefined,
      plannedEndDate: dto.plannedEndDate ? new Date(dto.plannedEndDate) : undefined,
      plannedHours: dto.plannedHours ?? 0,
      plannedCost: dto.plannedCost ?? 0,
      assigneeId: dto.assigneeId,
      dependencies: dto.dependencies ?? [],
    });

    const saved = await this.taskRepo.save(task);
    await this.recalcProjectProgress(tenantId, dto.projectId);
    return saved;
  }

  async findByProject(tenantId: string, projectId: string): Promise<WbsTask[]> {
    return this.taskRepo.find({
      where: { tenantId, projectId },
      order: { path: 'ASC', sortOrder: 'ASC' },
      relations: ['resourceAssignments', 'resourceAssignments.resource'],
    });
  }

  async findById(tenantId: string, id: string): Promise<WbsTask> {
    const task = await this.taskRepo.findOne({
      where: { id, tenantId },
      relations: ['resourceAssignments', 'resourceAssignments.resource'],
    });
    if (!task) throw new NotFoundException('任務不存在');
    return task;
  }

  async update(tenantId: string, id: string, dto: UpdateTaskDto): Promise<WbsTask> {
    const task = await this.findById(tenantId, id);

    if (dto.name !== undefined) task.name = dto.name;
    if (dto.description !== undefined) task.description = dto.description;
    if (dto.plannedStartDate) task.plannedStartDate = new Date(dto.plannedStartDate);
    if (dto.plannedEndDate) task.plannedEndDate = new Date(dto.plannedEndDate);
    if (dto.actualStartDate) task.actualStartDate = new Date(dto.actualStartDate);
    if (dto.actualEndDate) task.actualEndDate = new Date(dto.actualEndDate);
    if (dto.plannedHours !== undefined) task.plannedHours = dto.plannedHours;
    if (dto.actualHours !== undefined) task.actualHours = dto.actualHours;
    if (dto.plannedCost !== undefined) task.plannedCost = dto.plannedCost;
    if (dto.actualCost !== undefined) task.actualCost = dto.actualCost;
    if (dto.assigneeId !== undefined) task.assigneeId = dto.assigneeId;
    if (dto.dependencies !== undefined) task.dependencies = dto.dependencies;
    if (dto.sortOrder !== undefined) task.sortOrder = dto.sortOrder;

    if (dto.progress !== undefined) {
      task.progress = dto.progress;
      if (dto.progress === 100 && task.status !== TaskStatus.COMPLETED) {
        task.status = TaskStatus.COMPLETED;
        task.actualEndDate = task.actualEndDate ?? new Date();
      } else if (dto.progress > 0 && task.status === TaskStatus.NOT_STARTED) {
        task.status = TaskStatus.IN_PROGRESS;
        task.actualStartDate = task.actualStartDate ?? new Date();
      }
    }

    const saved = await this.taskRepo.save(task);
    await this.recalcProjectProgress(tenantId, task.projectId);
    return saved;
  }

  async updateStatus(tenantId: string, id: string, status: TaskStatus): Promise<WbsTask> {
    const task = await this.findById(tenantId, id);
    task.status = status;
    if (status === TaskStatus.IN_PROGRESS && !task.actualStartDate) {
      task.actualStartDate = new Date();
    }
    if (status === TaskStatus.COMPLETED) {
      task.progress = 100;
      task.actualEndDate = task.actualEndDate ?? new Date();
    }
    const saved = await this.taskRepo.save(task);
    await this.recalcProjectProgress(tenantId, task.projectId);
    return saved;
  }

  async delete(tenantId: string, id: string): Promise<void> {
    const task = await this.findById(tenantId, id);
    const children = await this.taskRepo.find({
      where: { tenantId, parentId: id },
    });
    if (children.length > 0) {
      throw new BadRequestException('請先刪除子任務');
    }
    const projectId = task.projectId;
    await this.taskRepo.remove(task);
    await this.recalcProjectProgress(tenantId, projectId);
  }

  /**
   * 從葉節點往上計算進度：
   * - 葉節點：0% 或 100%（勾選制）
   * - 父節點：子任務完成數 / 子任務總數 × 100
   * - 專案整體：根任務完成數 / 根任務總數 × 100
   */
  private async recalcProjectProgress(tenantId: string, projectId: string): Promise<void> {
    const tasks = await this.taskRepo.find({
      where: { tenantId, projectId },
    });

    if (tasks.length === 0) {
      await this.projectsService.updateProgress(tenantId, projectId, 0);
      return;
    }

    const taskMap = new Map(tasks.map((t) => [t.id, t]));
    const childrenOf = new Map<string | undefined, typeof tasks>();
    for (const t of tasks) {
      const key = t.parentId ?? '__root__';
      if (!childrenOf.has(key)) childrenOf.set(key, []);
      childrenOf.get(key)!.push(t);
    }

    /** 遞迴計算節點進度 */
    const calcProgress = (id: string): number => {
      const children = childrenOf.get(id);
      if (!children || children.length === 0) {
        // 葉節點：看 progress 是否 100
        return taskMap.get(id)!.progress === 100 ? 100 : 0;
      }
      const completedCount = children.filter((c) => calcProgress(c.id) === 100).length;
      return Math.round((completedCount / children.length) * 100);
    };

    // 計算根任務的整體進度
    const rootTasks = childrenOf.get('__root__') ?? [];
    if (rootTasks.length === 0) {
      await this.projectsService.updateProgress(tenantId, projectId, 0);
      return;
    }

    const completedRoots = rootTasks.filter((t) => calcProgress(t.id) === 100).length;
    const projectProgress = Math.round((completedRoots / rootTasks.length) * 100);
    await this.projectsService.updateProgress(tenantId, projectId, projectProgress);
  }
}
