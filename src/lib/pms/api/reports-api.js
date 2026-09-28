// Carried over from the branch PMS's utils/reports-api.js (2026-09-28) - same
// functions, same arguments - onto lib/pms/http, which sends each call through
// the PMS session (see http.js).
import { http } from "../http";
import { pmsDownload as downloadFile } from "../client";
export const fetchReportsDashboard = async (from, to) => {
  const response = await http.get(`/api/reports/dashboard`, {
    params: { from, to },
  });
  return response.data;
};

// Shared with every other export - see utils/download.js.
const downloadXlsx = downloadFile;

export const downloadReportsExport = (from, to) =>
  downloadXlsx("/api/reports/export", { from, to }, `report_${from}_to_${to}.xlsx`);

export const downloadManifestExport = (date) =>
  // Route key stays "manifest"; the file is named for what staff call this
  // report — the arrivals/departures sheet is the Accommodation report.
  downloadXlsx("/api/reports/manifest/export", { date }, `accommodation_report_${date}.xlsx`);

export const downloadAnalysisExport = (from, to) =>
  downloadXlsx("/api/reports/analysis/export", { from, to }, `analysis_${from}_to_${to}.xlsx`);

export const downloadPmsReportExport = (date, variant) =>
  downloadXlsx("/api/reports/pms/export", { date, variant }, `pms_report_${variant}_${date}.xlsx`);

export const downloadAccommodationReportExport = (date, shift) =>
  downloadXlsx("/api/reports/accommodation/export", { date, shift }, `manifest_${date}.xlsx`);

// Parked with the Email Report button (2026-09-17) — the backend endpoint
// is commented out alongside it in reports.controller.ts.
// export const emailReportsDashboard = async (from, to, email) => {
//   const response = await http.post(
//     `/api/reports/email`,
//     { from, to, email },
//   );
//   return response.data;
// };

export const fetchManifest = async (date) => {
  const response = await http.get(`/api/reports/manifest`, {
    params: { date },
  });
  return response.data;
};

export const fetchPaymentsAnalysis = async (from, to) => {
  const response = await http.get(`/api/reports/analysis`, {
    params: { from, to },
  });
  return response.data;
};

export const fetchPmsReport = async (date, variant) => {
  const response = await http.get(`/api/reports/pms`, {
    params: { date, variant },
  });
  return response.data;
};

export const fetchAccommodationReport = async (date) => {
  const response = await http.get(`/api/reports/accommodation`, {
    params: { date },
  });
  return response.data;
};

export const fetchFoodSalesReport = async (date) => {
  const response = await http.get(`/api/reports/food-sales`, {
    params: { date },
  });
  return response.data;
};

export const downloadFoodSalesReportExport = (date, shift) =>
  downloadXlsx("/api/reports/food-sales/export", { date, shift }, `food_sales_report_${date}.xlsx`);

export const fetchDrinkSalesReport = async (date) => {
  const response = await http.get(`/api/reports/drink-sales`, {
    params: { date },
  });
  return response.data;
};

export const downloadDrinkSalesReportExport = (date, shift) =>
  downloadXlsx("/api/reports/drink-sales/export", { date, shift }, `drink_sales_report_${date}.xlsx`);

export const fetchBarStockReport = async (date) => {
  const response = await http.get(`/api/reports/bar-stock`, {
    params: { date },
  });
  return response.data;
};

export const downloadBarStockReportExport = (date, shift) =>
  downloadXlsx("/api/reports/bar-stock/export", { date, shift }, `bar_stock_report_${date}.xlsx`);
