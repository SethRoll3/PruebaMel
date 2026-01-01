import { reportsAPI } from '../../../lib/api';
import { Report, Sale } from '../types/Report';

export const getCurrentReport = async (ubicacion?: string): Promise<Report> => {
  console.log(ubicacion);
  return reportsAPI.getCurrentReport(ubicacion);
};

export const addSaleToReport = async (sale: Sale): Promise<void> => {
  return reportsAPI.addSaleToReport(sale);
};

export const generatePDF = async (report: Report | null, startDate?: string, endDate?: string): Promise<void> => {
  try {
    const blob = await reportsAPI.generatePDF(report, startDate, endDate);
    const url = window.URL.createObjectURL(new Blob([blob]));
    const link = document.createElement('a');
    link.href = url;
    link.download = report 
      ? `reporte-${new Date().toISOString().split('T')[0]}.pdf`
      : `reporte-${startDate}-${endDate}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error generando PDF:', error);
    throw new Error('Error al generar el PDF');
  }
};

export const generateDetailedPDF = async (report: Report): Promise<void> => {
  try {
    const blob = await reportsAPI.generateDetailedPDF(report);
    const url = window.URL.createObjectURL(new Blob([blob]));
    const link = document.createElement('a');
    link.href = url;
    link.download = `reporte-detallado-${new Date().toISOString().split('T')[0]}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error generando PDF detallado:', error);
    throw new Error('Error al generar el PDF detallado');
  }
};

export const getReportByDate = async (date: string): Promise<Report> => {
  return reportsAPI.getReportByDate(date);
};

export const generateExcel = async (reportId: string | null, startDate?: string, endDate?: string): Promise<void> => {
  try {
    const response = await reportsAPI.generateExcel(reportId, startDate, endDate);
    const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = reportId ? `reporte-${reportId}.xlsx` : `reporte-${startDate}-${endDate}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Error generando Excel:', error);
    throw new Error('Error al generar el Excel');
  }
};

export const getReportsByRange = async (startDate: string, endDate: string): Promise<Report[]> => {
  try {
    const response = await reportsAPI.getReportByRange(startDate, endDate);
    console.log(response);
    return response;
  }catch(error){
    console.error('Error al obtener reportes por rango:', error);
    throw new Error('Error al obtener reportes por rango de fechas');
  }
  
};
