import React from 'react';
import TypeFilter from './TypeFilter';

interface ProductTableFiltersProps {
  onSortChange: (value: string) => void;
  onPharmaceuticalCompanyChange: (value: string) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
  availableTypes: string[];
  selectedTypes: string[];
  onTypesChange: (types: string[]) => void;
  onTypeFilter: () => void;
  sortOption?: string;
}

export default function ProductTableFilters({
  onSortChange,
  onPharmaceuticalCompanyChange,
  onClearFilters,
  hasActiveFilters,
  availableTypes,
  selectedTypes,
  onTypesChange,
  onTypeFilter,
  sortOption = "",
}: ProductTableFiltersProps) {
  return (
    <div className="flex flex-col gap-4 mb-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <select
          onChange={(e) => onSortChange(e.target.value)}
          className="px-3 py-2 border rounded-md text-gray-700 w-full"
          value={sortOption}
        >
          <option value="">Todos los productos</option>
          <option value="name-asc">Nombre (A-Z)</option>
          <option value="name-desc">Nombre (Z-A)</option>
          <option value="expired">Productos Vencidos</option>
          <option value="near-expiry">Próximos a Vencer (6 meses)</option>
          <option value="low-stock">Poco Stock (≤10 unidades)</option>
        </select>

        <TypeFilter
          types={availableTypes}
          selectedTypes={selectedTypes}
          onTypeChange={onTypesChange}
          onFilter={() => {
            onTypeFilter();
          }}
        />

        <div className="relative w-full">
          <input
            type="text"
            placeholder="Buscar por casa farmacéutica..."
            onChange={(e) => onPharmaceuticalCompanyChange(e.target.value)}
            className="px-3 py-2 border rounded-md text-gray-700 w-full"
          />
        </div>
      </div>

      {hasActiveFilters && (
        <div className="flex justify-end">
          <button
            onClick={onClearFilters}
            className="px-3 py-2 text-red-600 hover:text-red-700 font-medium"
          >
            Limpiar filtros
          </button>
        </div>
      )}
    </div>
  );
}