export interface Promotion {
  _id: string;
  name: string;
  description: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  products: {
    productId: string;
    minimumQuantity: number;
  }[];
  conditions: {
    minimumPurchase: number;
    maxUses?: number;
    usedCount: number;
  };
}