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
