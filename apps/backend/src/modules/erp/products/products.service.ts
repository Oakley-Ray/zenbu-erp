import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './product.entity';
import { Category } from './category.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
  ) {}

  // ── Products ──

  async createProduct(tenantId: string, dto: CreateProductDto): Promise<Product> {
    const exists = await this.productRepo.findOne({
      where: { tenantId, sku: dto.sku },
    });
    if (exists) throw new ConflictException(`SKU ${dto.sku} 已存在`);

    const product = this.productRepo.create({ ...dto, tenantId });
    return this.productRepo.save(product);
  }

  async findAllProducts(
    tenantId: string,
    opts?: { page?: number; limit?: number; categoryId?: string; status?: string },
  ) {
    const page = opts?.page ?? 1;
    const limit = opts?.limit ?? 20;

    const qb = this.productRepo
      .createQueryBuilder('p')
      .where('p.tenantId = :tenantId', { tenantId })
      .leftJoinAndSelect('p.category', 'cat')
      .orderBy('p.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (opts?.categoryId) {
      qb.andWhere('p.categoryId = :categoryId', { categoryId: opts.categoryId });
    }
    if (opts?.status) {
      qb.andWhere('p.status = :status', { status: opts.status });
    }

    const [data, total] = await qb.getManyAndCount();
    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findProductById(tenantId: string, id: string): Promise<Product> {
    const product = await this.productRepo.findOne({
      where: { id, tenantId },
      relations: ['category'],
    });
    if (!product) throw new NotFoundException('產品不存在');
    return product;
  }

  async updateProduct(tenantId: string, id: string, dto: UpdateProductDto): Promise<Product> {
    const product = await this.findProductById(tenantId, id);

    // 如果改 SKU，檢查是否衝突
    if (dto.sku && dto.sku !== product.sku) {
      const conflict = await this.productRepo.findOne({
        where: { tenantId, sku: dto.sku },
      });
      if (conflict) throw new ConflictException(`SKU ${dto.sku} 已存在`);
    }

    Object.assign(product, dto);
    return this.productRepo.save(product);
  }

  async deleteProduct(tenantId: string, id: string): Promise<void> {
    const product = await this.findProductById(tenantId, id);
    await this.productRepo.remove(product);
  }

  // ── Categories ──

  async createCategory(
    tenantId: string,
    dto: { name: string; slug: string; description?: string; parentId?: string; sortOrder?: number },
  ): Promise<Category> {
    const exists = await this.categoryRepo.findOne({
      where: { tenantId, slug: dto.slug },
    });
    if (exists) throw new ConflictException(`分類 slug ${dto.slug} 已存在`);

    const category = this.categoryRepo.create({ ...dto, tenantId });
    return this.categoryRepo.save(category);
  }

  async findAllCategories(tenantId: string): Promise<Category[]> {
    return this.categoryRepo.find({
      where: { tenantId, isActive: true },
      order: { sortOrder: 'ASC', name: 'ASC' },
      relations: ['children'],
    });
  }

  async updateCategory(tenantId: string, id: string, dto: Partial<Category>): Promise<Category> {
    const category = await this.categoryRepo.findOne({ where: { id, tenantId } });
    if (!category) throw new NotFoundException('分類不存在');
    Object.assign(category, dto);
    return this.categoryRepo.save(category);
  }

  async deleteCategory(tenantId: string, id: string): Promise<void> {
    const category = await this.categoryRepo.findOne({ where: { id, tenantId } });
    if (!category) throw new NotFoundException('分類不存在');
    category.isActive = false;
    await this.categoryRepo.save(category);
  }
}
