export const formatCurrency = (amount) => {
  return `Q${amount.toFixed(2)}`;
};

export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-GT', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const formatSaleType = (type) => {
  switch (type) {
    case 'unit': return 'Unidad';
    case 'blister': return 'Blister';
    case 'box': return 'Caja';
    default: return type;
  }
};