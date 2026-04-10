import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  ParseUUIDPipe,
  Request,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Roles } from '@/common/decorators/roles.decorator';
import { TenantRole, JwtPayload } from '@layerframe/shared-types';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // ── Products ──

  @Post()
  @Roles(TenantRole.SUPER_ADMIN, TenantRole.ADMIN, TenantRole.SALES)
  create(
    @Body() dto: CreateProductDto,
    @Request() req: { user: JwtPayload },
  ) {
    return this.productsService.createProduct(req.user.tenantId, dto);
  }

  @Get()
  findAll(
    @Request() req: { user: JwtPayload },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('categoryId') categoryId?: string,
    @Query('status') status?: string,
  ) {
    return this.productsService.findAllProducts(req.user.tenantId, {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      categoryId,
      status,
    });
  }

  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: { user: JwtPayload },
  ) {
    return this.productsService.findProductById(req.user.tenantId, id);
  }

  @Patch(':id')
  @Roles(TenantRole.SUPER_ADMIN, TenantRole.ADMIN, TenantRole.SALES)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProductDto,
    @Request() req: { user: JwtPayload },
  ) {
    return this.productsService.updateProduct(req.user.tenantId, id, dto);
  }

  @Delete(':id')
  @Roles(TenantRole.SUPER_ADMIN, TenantRole.ADMIN)
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: { user: JwtPayload },
  ) {
    return this.productsService.deleteProduct(req.user.tenantId, id);
  }

  // ── Categories ──

  @Post('categories')
  @Roles(TenantRole.SUPER_ADMIN, TenantRole.ADMIN)
  createCategory(
    @Body() dto: { name: string; slug: string; description?: string; parentId?: string; sortOrder?: number },
    @Request() req: { user: JwtPayload },
  ) {
    return this.productsService.createCategory(req.user.tenantId, dto);
  }

  @Get('categories')
  findAllCategories(@Request() req: { user: JwtPayload }) {
    return this.productsService.findAllCategories(req.user.tenantId);
  }

  @Patch('categories/:id')
  @Roles(TenantRole.SUPER_ADMIN, TenantRole.ADMIN)
  updateCategory(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: { name?: string; slug?: string; description?: string; sortOrder?: number },
    @Request() req: { user: JwtPayload },
  ) {
    return this.productsService.updateCategory(req.user.tenantId, id, dto);
  }

  @Delete('categories/:id')
  @Roles(TenantRole.SUPER_ADMIN, TenantRole.ADMIN)
  removeCategory(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: { user: JwtPayload },
  ) {
    return this.productsService.deleteCategory(req.user.tenantId, id);
  }
}
