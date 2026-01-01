export interface ProductPricing {
  unit?: number;    // Precio por unidad
  blister?: number; // Precio por blister
  box?: number;     // Precio por caja
}

export interface ProductStock {
  units: number;    // Stock en unidades individuales
  blisters: number; // Stock en blisters
  boxes: number;    // Stock en cajas
}

export interface ProductPackaging {
  unitsPerBlister: number; // Unidades por blister
  blistersPerBox: number;  // Blisters por caja
}

export interface Product {
  types: any;
  expirationDate: string | Date;
  paymentType: any[];
  pharmaceuticalCompany: string;
  _id: string;
  barcode: string;
  name: string;
  prices: ProductPricing;
  stock: ProductStock;
  packaging: ProductPackaging;
  purchasePrices: {
    unit: number;
    blister: number;
    box: number;
  }
  sellOptions: {
    unit: boolean;
    blister: boolean;
    box: boolean;
  };
  location: {
      _id: any,
  }
}