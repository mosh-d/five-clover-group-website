"use client";

import { createContext, useContext } from "react";

// Who is signed in, where, and as which brand - read from storage once by
// PmsShell and handed to every page, which never reads storage itself:
// { user, branch, branches, role, realRole, roleOverride, brand,
//   switchBranch(id), setRoleOverride(role), signOut() }.
export const PmsSessionContext = createContext(null);

export const usePmsSession = () => useContext(PmsSessionContext);
