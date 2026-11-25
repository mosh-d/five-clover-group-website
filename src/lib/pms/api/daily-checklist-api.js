// Daily checklists (backend phase-102): the front desk's and the porters'.
import { http } from "../http";

// { today, kind, title, shifts, tasks: [{ n, task, responsible, notApplicable }], checklists: [...] }
// - the last 30 business days of one kind, newest first.
export const fetchChecklists = async (kind) => (await http.get(`/api/daily-checklists`, { params: { kind } })).data;

export const createChecklist = async (body) => (await http.post(`/api/daily-checklists`, body)).data;

export const updateChecklist = async (id, items) => (await http.put(`/api/daily-checklists/${id}`, { items })).data;

