// The store's inventory (backend docs/INVENTORY-PLAN.md).
import { http } from "../http";

// Every item with its stock, plus the suppliers, departments, categories and drinks.
export const fetchInventory = async () => (await http.get(`/api/inventory/items`)).data;

export const fetchItemHistory = async (itemId) => (await http.get(`/api/inventory/items/${itemId}/movements`)).data;

export const createInventoryItem = async (fields) => (await http.post(`/api/inventory/items`, fields)).data;

export const updateInventoryItem = async (itemId, fields) => (await http.patch(`/api/inventory/items/${itemId}`, fields)).data;

// movement_type: received / issued / returned / written_off / counted.
export const recordInventoryMovement = async (itemId, movement) => (await http.post(`/api/inventory/items/${itemId}/movements`, movement)).data;

export const createSupplier = async (fields) => (await http.post(`/api/inventory/suppliers`, fields)).data;

export const updateSupplier = async (supplierId, fields) => (await http.patch(`/api/inventory/suppliers/${supplierId}`, fields)).data;

// Step 3: the report over a range of business days, and the sidebar badge's counts.
export const fetchInventoryReport = async (from, to) => (await http.get(`/api/inventory/report`, { params: { from, to } })).data;

export const fetchInventoryCounts = async () => (await http.get(`/api/inventory/counts`)).data;

// Step 4: requests from departments. The store keeper's list...
export const fetchStoreRequests = async () => (await http.get(`/api/inventory/requests`)).data;

export const issueStoreRequest = async (requestId, fields) => (await http.post(`/api/inventory/requests/${requestId}/issue`, fields)).data;

export const declineStoreRequest = async (requestId, reason) => (await http.post(`/api/inventory/requests/${requestId}/decline`, { reason })).data;

// ...and the Store Requests page of those who ask.
export const fetchRequestable = async () => (await http.get(`/api/inventory/requestable`)).data;

export const createStoreRequest = async (fields) => (await http.post(`/api/inventory/requests`, fields)).data;

// Several items for one department at once: { department, items: [{ item_id, quantity, note }] }.
export const createStoreRequests = async (fields) => (await http.post(`/api/inventory/requests/batch`, fields)).data;

export const withdrawStoreRequest = async (requestId) => (await http.post(`/api/inventory/requests/${requestId}/withdraw`)).data;
