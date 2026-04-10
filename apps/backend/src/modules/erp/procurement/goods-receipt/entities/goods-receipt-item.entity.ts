import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { InspectionType, InspectionResult, DispositionType } from '@layerframe/shared-types';
import { GoodsReceipt } from './goods-receipt.entity';

/** 收貨單明細 */
@Entity('goods_receipt_items')
export class GoodsReceiptItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  goodsReceiptId!: string;

  @ManyToOne(() => GoodsReceipt, (gr) => gr.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'goodsReceiptId' })
  goodsReceipt?: GoodsReceipt;

  /** PO 明細 ID */
  @Column('uuid')
  poItemId!: string;

  @Column('uuid', { nullable: true })
  productId?: string;

  @Column()
  productName!: string;

  @Column({ nullable: true })
  sku?: string;

  /** PO 訂購數量（快照） */
  @Column({ type: 'int' })
  orderedQty!: number;

  /** 實收數量 */
  @Column({ type: 'int' })
  receivedQty!: number;

  /** 合格數量 */
  @Column({ type: 'int', default: 0 })
  acceptedQty!: number;

  /** 不合格數量 */
  @Column({ type: 'int', default: 0 })
  rejectedQty!: number;

  // ─── 品質檢驗 ───

  /** 檢驗類型 */
  @Column({ type: 'varchar', default: InspectionType.SAMPLING })
  inspectionType!: InspectionType;

  /** 檢驗結果 */
  @Column({ type: 'varchar', nullable: true })
  inspectionResult?: InspectionResult;

  /** 檢驗項目與紀錄 */
  @Column({ type: 'jsonb', nullable: true })
  inspectionDetails?: {
    items: Array<{
      name: string;
      standard: string;
      actual: string;
      pass: boolean;
    }>;
  };

  /** 不合格處置方式 */
  @Column({ type: 'varchar', nullable: true })
  disposition?: DispositionType;

  /** 特採審核人（disposition 為 special_accept 時需要） */
  @Column('uuid', { nullable: true })
  specialAcceptApprovedBy?: string;

  @Column({ type: 'text', nullable: true })
  note?: string;
}
