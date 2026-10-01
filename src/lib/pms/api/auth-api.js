// The signed-in person's own account - the branch PMS's changePassword (its
// utils/auth.js). Only ever the caller's own password: the reset-someone-
// else path belonged to the retired shared branch logins.
import { http } from "../http";
import { currentBranchId } from "../session";

// A Head Office session has no branch, which change-password's branch check
// refuses; hq-change-password is the same change for it.
export const changePassword = async ({ current_password, new_password }) => {
  const path = currentBranchId() ? "/api/users/change-password" : "/api/users/hq-change-password";
  const response = await http.patch(path, { current_password, new_password });
  return response.data;
};
