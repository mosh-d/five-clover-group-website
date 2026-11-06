// Maintenance (backend phase-94): rooms set out of order, as jobs.
import { http } from "../http";

// { open: [...], done: [...] } - every open job, then the last 30 days' finished ones.
export const fetchMaintenance = async () => (await http.get(`/api/maintenance`)).data;

// The sidebar badge: { open }.
export const fetchMaintenanceCounts = async () => (await http.get(`/api/maintenance/counts`)).data;

// Fixed: the room goes back in service. note - what was done (optional).
export const markMaintenanceFixed = async (jobId, note) => (await http.post(`/api/maintenance/jobs/${jobId}/fixed`, { note })).data;
