// The front desk's log book (backend phase-99): notes for the next shift.
import { http } from "../http";

// { today, entries: [{ id, business_date, note, created_at, written_by, written_by_name, written_by_role, read_at, read_by, read_by_name }] }
// - the last 30 business days, newest first.
export const fetchLogBook = async () => (await http.get(`/api/log-book`)).data;

// The sidebar badge: { unread } - notes someone else left that no one has read.
export const fetchLogBookCounts = async () => (await http.get(`/api/log-book/counts`)).data;

export const writeLogBookNote = async (note) => (await http.post(`/api/log-book`, { note })).data;

export const markLogBookNoteRead = async (id) => (await http.post(`/api/log-book/${id}/read`, {})).data;
