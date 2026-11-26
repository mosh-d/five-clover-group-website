// Report sign-off (backend phase-104): the branch accountant's review and
// sign-off, and Head Office's auditor's list.
import { http } from "../http";

// { draft, signed: [...] } for one report and period.
export const fetchReportSignoffs = async (reportKey, from, to) =>
  (await http.get(`/api/report-signoffs`, { params: { report_key: reportKey, from, to } })).data;

// Starts a review from the report as shown (or carries on the one in progress).
export const startReportReview = async (body) => (await http.post(`/api/report-signoffs/draft`, body)).data;

export const addReportCorrection = async (id, correction) => (await http.post(`/api/report-signoffs/${id}/corrections`, correction)).data;

export const removeReportCorrection = async (id, correctionId) => (await http.delete(`/api/report-signoffs/${id}/corrections/${correctionId}`)).data;

export const discardReportReview = async (id) => (await http.delete(`/api/report-signoffs/${id}`)).data;

export const signOffReport = async (id) => (await http.post(`/api/report-signoffs/${id}/sign`, {})).data;

// Head Office's auditor.
export const fetchSignedReports = async (params) => (await http.get(`/api/hq/report-signoffs`, { params })).data;
export const fetchSignedReport = async (id) => (await http.get(`/api/hq/report-signoffs/${id}`)).data;
