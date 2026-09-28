// The signed-in person's own account - the branch PMS's changePassword (its
// utils/auth.js). Only ever the caller's own password: the reset-someone-
// else path belonged to the retired shared branch logins.
import { http } from "../http";

export const changePassword = async ({ current_password, new_password }) => {
  const response = await http.patch(`/api/users/change-password`, { current_password, new_password });
  return response.data;
};
