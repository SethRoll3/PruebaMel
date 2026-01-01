import axios from 'axios';
import { HistoricoProducto } from '../types/HistoricoProducto';

const API_URL = 'http://localhost:3000/api/products';
//const API_URL = 'https://melbobackend.onrender.com/api/products'

export const getHistoricoProductos = async (
  startDate?: string,
  endDate?: string,
  name?: string,
  type?: string
) => {
  const params = new URLSearchParams();
  const token = localStorage.getItem('token');
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);
  if (name) params.append('name', name);
  if (type) params.append('type', type);

  const response = await axios.get<HistoricoProducto[]>(`${API_URL}/historico`, { params });
  return response.data;
};

export const downloadHistoricoExcel = async () => {
  const response = await axios.get(`${API_URL}/historico/excel`, {
    responseType: 'blob'
  });
  
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'historico-productos.xlsx');
  document.body.appendChild(link);
  link.click();
  link.remove();
};