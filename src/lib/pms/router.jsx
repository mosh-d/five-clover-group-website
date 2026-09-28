"use client";

import { useCallback, useMemo } from "react";
import NextLink from "next/link";
import { usePathname, useRouter, useSearchParams as useNextSearchParams } from "next/navigation";

// The react-router pieces the branch PMS's pages use - useNavigate,
// useSearchParams, Link - onto Next's router, so a page moved over keeps its
// navigation as written. A branch path ("/admin/folios") is this PMS's
// ("/pms/folios").
const toPms = (to) => String(to || "").replace(/^\/admin(?=\/|\?|$)/, "/pms");

// navigate(to, { replace }). React Router's `state` has no Next equivalent;
// a page that needs to hand something over puts it in the query instead.
export function useNavigate() {
  const router = useRouter();
  return useCallback(
    (to, options = {}) => {
      if (typeof to === "number") return router.back();
      const path = toPms(to);
      return options.replace ? router.replace(path) : router.push(path);
    },
    [router],
  );
}

// [searchParams, setSearchParams] as React Router gives them. Setting takes
// an object (or URLSearchParams) and { replace }.
export function useSearchParams() {
  const params = useNextSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const setParams = useCallback(
    (next, options = {}) => {
      const query = new URLSearchParams(next || {}).toString();
      const path = query ? `${pathname}?${query}` : pathname;
      return options.replace ? router.replace(path, { scroll: false }) : router.push(path, { scroll: false });
    },
    [pathname, router],
  );
  return useMemo(() => [params, setParams], [params, setParams]);
}

export function Link({ to, ...props }) {
  return <NextLink href={toPms(to)} {...props} />;
}
