import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Product } from '../types/Product';
import React from 'react';
import { format } from 'date-fns';
import { getProductTypes } from '../services/productService';
import { ubicacionesAPI } from '../../../lib/api';

interface EditProductModalProps {
  product: Product;
  onClose: () => void;
  onSubmit: (productId: string, productData: any) => void;
}

interface Ubicacion {
  _id: string;
  nombre: string;
  direccion: string;
  telefono: string;
}

export default function EditProductModal({ product, onClose, onSubmit }: EditProductModalProps) {
  const [availableTypes, setAvailableTypes] = useState<string[]>([]);
  const [types, setTypes] = useState<string[]>(product.types || []);
  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([]);
  const [purchasePrices, setPurchasePrices] = useState({
    unit: product.purchasePrices?.unit?.toString() || '',
    blister: product.purchasePrices?.blister?.toString() || '',
    box: product.purchasePrices?.box?.toString() || ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [types, ubicacionesData] = await Promise.all([
          getProductTypes(),
          ubicacionesAPI.getUbicaciones()
        ]);
        setAvailableTypes(types);
        setUbicaciones(ubicacionesData);
      } catch (error) {
        console.error('Error al cargar datos:', error);
      }
    };
    fetchData();
  }, []);

  const handleTypeSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value && !types.includes(value)) {
      setTypes([...types, value]);
    }
    e.target.selectedIndex = 0;
  };

  const handleRemoveType = (type: string) => {
    setTypes(types.filter(t => t !== type));
  };

  const [formData, setFormData] = useState({
    barcode: product.barcode,
    name: product.name,
    expirationDate: format(new Date(product.expirationDate), 'yyyy-MM-dd'),
    pharmaceuticalCompany: product.pharmaceuticalCompany as string,
    paymentType: product.paymentType as unknown as string,
    location: product.location?._id || '',
    prices: {
      unit: product.prices.unit?.toString() || '',
      blister: product.prices.blister?.toString() || '',
      box: product.prices.box?.toString() || ''
    },
    stock: {
      units: product.stock.units.toString(),
      blisters: product.stock.blisters.toString(),
      boxes: product.stock.boxes.toString()
    },
    packaging: {
      unitsPerBlister: product.packaging.unitsPerBlister.toString(),
      blistersPerBox: product.packaging.blistersPerBox.toString()
    },
    sellOptions: {
      unit: product.sellOptions.unit,
      blister: product.sellOptions.blister,
      box: product.sellOptions.box
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Convertir strings a números donde corresponda
    const processedData = {
      ...formData,
      types,
      prices: {
        unit: formData.prices.unit ? Number(formData.prices.unit) : undefined,
        blister: formData.prices.blister ? Number(formData.prices.blister) : undefined,
        box: formData.prices.box ? Number(formData.prices.box) : undefined
      },
      purchasePrices: {
        unit: purchasePrices.unit ? Number(purchasePrices.unit) : undefined,
        blister: purchasePrices.blister ? Number(purchasePrices.blister) : undefined,
        box: purchasePrices.box ? Number(purchasePrices.box) : undefined
      },
      stock: {
        units: Number(formData.stock.units) || 0,
        blisters: Number(formData.stock.blisters) || 0,
        boxes: Number(formData.stock.boxes) || 0
      },
      packaging: {
        unitsPerBlister: Number(formData.packaging.unitsPerBlister) || 0,
        blistersPerBox: Number(formData.packaging.blistersPerBox) || 0
      }
    };

    onSubmit(product._id, processedData);
  };

  const handleStockChange = (type: 'boxes' | 'blisters' | 'units', value: string) => {
    const numValue = Number(value) || 0;
    const unitsPerBlister = Number(formData.packaging.unitsPerBlister) || 0;
    const blistersPerBox = Number(formData.packaging.blistersPerBox) || 0;

    let newStock = { ...formData.stock };

    switch (type) {
      case 'boxes':
        if (formData.sellOptions.blister) {
          // Si tiene opción de blister, calcular todo normalmente
          newStock = {
            boxes: value,
            blisters: (numValue * blistersPerBox).toString(),
            units: (numValue * blistersPerBox * unitsPerBlister).toString()
          };
        } else {
          // Si no tiene blister, calcular directamente las unidades por caja
          newStock = {
            boxes: value,
            blisters: '0',
            units: (numValue * blistersPerBox).toString()
          };
        }
        break;

      case 'blisters':
        if (formData.sellOptions.box && formData.sellOptions.blister) {
          newStock = {
            boxes: Math.floor(numValue / blistersPerBox).toString(),
            blisters: value,
            units: (numValue * unitsPerBlister).toString()
          };
        }
        break;

      case 'units':
        if (formData.sellOptions.box && !formData.sellOptions.blister) {
          // Si solo tiene cajas y unidades
          newStock = {
            boxes: Math.floor(numValue / blistersPerBox).toString(),
            blisters: '0',
            units: value
          };
        } else if (formData.sellOptions.blister) {
          // Si tiene blisters
          newStock = {
            boxes: Math.floor(numValue / (unitsPerBlister * blistersPerBox)).toString(),
            blisters: Math.floor(numValue / unitsPerBlister).toString(),
            units: value
          };
        } else {
          // Si solo tiene unidades
          newStock = {
            boxes: '0',
            blisters: '0',
            units: value
          };
        }
        break;
    }

    setFormData({
      ...formData,
      stock: newStock
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Editar Producto</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información básica */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Código de Barras</label>
              <input
                type="text"
                value={formData.barcode}
                onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Nombre del Producto</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          {/* Tipos de producto */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tipos de Producto</label>
            <select
              value=""
              onChange={handleTypeSelect}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="" disabled>Selecciona un tipo...</option>
              {availableTypes
                .filter(type => !types.includes(type))
                .map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
            </select>
            <div className="flex flex-wrap gap-2 mt-2">
              {types.map(type => (
                <span
                  key={type}
                  className="inline-flex items-center px-2 py-1 rounded bg-blue-100 text-blue-700 text-xs font-medium"
                >
                  {type}
                  <button
                    type="button"
                    onClick={() => handleRemoveType(type)}
                    className="ml-1 text-blue-500 hover:text-red-500 font-bold"
                    title="Quitar"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <span className="text-xs text-gray-500">Puedes seleccionar uno o varios tipos</span>
          </div>

          {/* Opciones de venta */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Opciones de Venta</label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.sellOptions.unit}
                  onChange={(e) => setFormData({
                    ...formData,
                    sellOptions: { ...formData.sellOptions, unit: e.target.checked }
                  })}
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                <span className="ml-2">Unidad</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.sellOptions.blister}
                  onChange={(e) => setFormData({
                    ...formData,
                    sellOptions: { ...formData.sellOptions, blister: e.target.checked }
                  })}
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                <span className="ml-2">Blister</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.sellOptions.box}
                  onChange={(e) => setFormData({
                    ...formData,
                    sellOptions: { ...formData.sellOptions, box: e.target.checked }
                  })}
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                <span className="ml-2">Caja</span>
              </label>
            </div>
          </div>

          {/* Precios */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Precios</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {formData.sellOptions.unit && (
                <div>
                  <label className="block text-sm text-gray-600">Precio por Unidad</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.prices.unit}
                    onChange={(e) => setFormData({
                      ...formData,
                      prices: { ...formData.prices, unit: e.target.value }
                    })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              )}
              {formData.sellOptions.blister && (
                <div>
                  <label className="block text-sm text-gray-600">Precio por Blister</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.prices.blister}
                    onChange={(e) => setFormData({
                      ...formData,
                      prices: { ...formData.prices, blister: e.target.value }
                    })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              )}
              {formData.sellOptions.box && (
                <div>
                  <label className="block text-sm text-gray-600">Precio por Caja</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.prices.box}
                    onChange={(e) => setFormData({
                      ...formData,
                      prices: { ...formData.prices, box: e.target.value }
                    })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Precios de compra */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Precios de Compra</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-gray-600">Compra por Unidad</label>
                <input
                  type="number"
                  step="0.01"
                  value={purchasePrices.unit}
                  onChange={(e) => setPurchasePrices({
                    ...purchasePrices,
                    unit: e.target.value
                  })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600">Compra por Blister</label>
                <input
                  type="number"
                  step="0.01"
                  value={purchasePrices.blister}
                  onChange={(e) => setPurchasePrices({
                    ...purchasePrices,
                    blister: e.target.value
                  })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600">Compra por Caja</label>
                <input
                  type="number"
                  step="0.01"
                  value={purchasePrices.box}
                  onChange={(e) => setPurchasePrices({
                    ...purchasePrices,
                    box: e.target.value
                  })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Stock */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Stock</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {formData.sellOptions.unit && (
                <div>
                  <label className="block text-sm text-gray-600">Unidades</label>
                  <input
                    type="number"
                    value={formData.stock.units}
                    onChange={(e) => handleStockChange('units', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              )}
              {formData.sellOptions.blister && (
                <div>
                  <label className="block text-sm text-gray-600">Blisters</label>
                  <input
                    type="number"
                    value={formData.stock.blisters}
                    onChange={(e) => handleStockChange('blisters', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              )}
              {formData.sellOptions.box && (
                <div>
                  <label className="block text-sm text-gray-600">Cajas</label>
                  <input
                    type="number"
                    value={formData.stock.boxes}
                    onChange={(e) => handleStockChange('boxes', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Empaquetado */}
          {(formData.sellOptions.blister || formData.sellOptions.box) && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Empaquetado</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {formData.sellOptions.blister && (
                  <div>
                    <label className="block text-sm text-gray-600">Unidades por Blister</label>
                    <input
                      type="number"
                      value={formData.packaging.unitsPerBlister}
                      onChange={(e) => setFormData({
                        ...formData,
                        packaging: { ...formData.packaging, unitsPerBlister: e.target.value }
                      })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                )}
                {formData.sellOptions.box && (
                  <div>
                    <label className="block text-sm text-gray-600">Blisters por Caja</label>
                    <input
                      type="number"
                      value={formData.packaging.blistersPerBox}
                      onChange={(e) => setFormData({
                        ...formData,
                        packaging: { ...formData.packaging, blistersPerBox: e.target.value }
                      })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Fecha de Vencimiento
            </label>
            <input
              type="date"
              name="expirationDate"
              value={formData.expirationDate}
              onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Casa Farmacéutica
            </label>
            <input
              type="text"
              name="pharmaceuticalCompany"
              value={formData.pharmaceuticalCompany}
              onChange={(e) => setFormData({ ...formData, pharmaceuticalCompany: e.target.value })}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Tipo de Pago
            </label>
            <select
              name="paymentType"
              value={formData.paymentType}
              onChange={(e) => setFormData({ ...formData, paymentType: e.target.value })}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            >
              <option value="excento">Excento</option>
              <option value="gravado">Gravado</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Ubicación
            </label>
            <select
              name="location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">Selecciona una ubicación...</option>
              {ubicaciones.map((ubicacion) => (
                <option key={ubicacion._id} value={ubicacion._id}>
                  {ubicacion.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Guardar Cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
