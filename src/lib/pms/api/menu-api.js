// Carried over from the branch PMS's utils/menu-api.js (2026-09-28) - same
// functions, same arguments - onto lib/pms/http, which sends each call through
// the PMS session (see http.js).
import { http } from "../http";
// Food and drink menus — two separate endpoints/tables, identical shape
// (name, price, is_active). Read access is open to any authenticated staff
// (a waitron needs to browse it to post a charge); create/update
// are manager-only, enforced server-side regardless of what the frontend
// shows.
export const fetchFoodItems = async (includeInactive = false) => {
  const response = await http.get(`/api/menu/food`, {
    params: includeInactive ? { include_inactive: "true" } : undefined,
  });
  return response.data;
};

export const createFoodItem = async (payload) => {
  const response = await http.post(`/api/menu/food`, payload);
  return response.data;
};

export const updateFoodItem = async (id, payload) => {
  const response = await http.patch(`/api/menu/food/${id}`, payload);
  return response.data;
};

export const fetchDrinkItems = async (includeInactive = false) => {
  const response = await http.get(`/api/menu/drinks`, {
    params: includeInactive ? { include_inactive: "true" } : undefined,
  });
  return response.data;
};

export const createDrinkItem = async (payload) => {
  const response = await http.post(`/api/menu/drinks`, payload);
  return response.data;
};

export const updateDrinkItem = async (id, payload) => {
  const response = await http.patch(`/api/menu/drinks/${id}`, payload);
  return response.data;
};

// Records a restock ('added') or a loss ('damaged': breakage/spillage/
// expiry) against a drink item's stock ledger — feeds the Bar Stock report
// (Reports → Bar Stock). Food isn't tracked this way.
export const recordDrinkStockMovement = async (id, payload) => {
  const response = await http.post(`/api/menu/drinks/${id}/stock`, payload);
  return response.data;
};

// Only succeeds for an item with no order/stock history — the backend
// rejects (409) anything that's ever actually been sold or stocked, since
// deleting one of those would erase real history rather than just
// availability. Use "Set Out of Stock" for a real item going unavailable.
export const deleteFoodItem = async (id) => {
  const response = await http.delete(`/api/menu/food/${id}`);
  return response.data;
};

export const deleteDrinkItem = async (id) => {
  const response = await http.delete(`/api/menu/drinks/${id}`);
  return response.data;
};

// Laundry catalogue — same open-read/pricing-roles-write split as food and
// drinks above, but each item carries TWO prices (wash_and_iron_price,
// ironing_only_price) because the same garment is sold both ways and the
// choice is made per charge.
export const fetchLaundryItems = async (includeInactive = false) => {
  const response = await http.get(`/api/menu/laundry`, {
    params: includeInactive ? { include_inactive: "true" } : undefined,
  });
  return response.data;
};

export const createLaundryItem = async (payload) => {
  const response = await http.post(`/api/menu/laundry`, payload);
  return response.data;
};

export const updateLaundryItem = async (id, payload) => {
  const response = await http.patch(`/api/menu/laundry/${id}`, payload);
  return response.data;
};

export const deleteLaundryItem = async (id) => {
  const response = await http.delete(`/api/menu/laundry/${id}`);
  return response.data;
};
