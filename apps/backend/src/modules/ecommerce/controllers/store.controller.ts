import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Headers,
  ParseUUIDPipe,
} from '@nestjs/common';
import { Public } from '@/common/decorators/public.decorator';
import { StoreService } from '../store.service';

/**
 * 前台公開 API — 不需要 JWT，用 X-Tenant-ID 識別商店。
 * Storefront 前端會呼叫這些端點。
 */
@Controller('store')
export class StoreController {
  constructor(private readonly storeService: StoreService) {}

  /** 商店設定（主題、Logo、政策） */
  @Public()
  @Get('settings')
  getSettings(@Headers('x-tenant-id') tenantId: string) {
    return this.storeService.getSettings(tenantId);
  }

  /** 公開商品列表 */
  @Public()
  @Get('products')
  getProducts(
    @Headers('x-tenant-id') tenantId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('categoryId') categoryId?: string,
  ) {
    return this.storeService.getPublicProducts(tenantId, {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      categoryId,
    });
  }

  /** 公開單品詳情 */
  @Public()
  @Get('products/:id')
  getProduct(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.storeService.getPublicProduct(tenantId, id);
  }

  /** 公開分類列表 */
  @Public()
  @Get('categories')
  getCategories(@Headers('x-tenant-id') tenantId: string) {
    return this.storeService.getPublicCategories(tenantId);
  }
}
