import { pmsRequest } from "./client";
import { playSound } from "./sounds";

// The PMS's calls to the backend, in the shape the branch PMS writes them
// (axios): get(url, { params }), post(url, body), ... each resolving to
// { data }. It lets the API modules under lib/pms/api carry over from the
// branch PMS function for function, while every call still goes through
// pmsRequest - the session's token, renewal while someone is working, the
// "session has ended" prompt, and errors carrying err.response.data.
//
// URLs are paths ("/api/folios"); the server address is pmsRequest's.
//
// Sounds (lib/pms/sounds.js): a request that changes something is a change
// someone made, so its outcome is heard - success when it goes through,
// failure when it doesn't. Reading is silent, and so are the few reads the
// server takes as a POST (READS below).
const READS = ["/api/rooms/details", "/api/branches/contact", "/api/branches/maintenance-mode", "/api/reservations/availability"];
const isChange = (method, url) => method !== "GET" && !READS.includes(url);

const call = (method, url, body, config = {}) => {
  const heard = isChange(method, url) && !config.silent;
  return pmsRequest(url, { method, body, query: config.params }).then(
    (data) => {
      if (heard) playSound("success");
      return { data };
    },
    (err) => {
      if (heard) playSound("failure");
      throw err;
    },
  );
};

export const http = {
  get: (url, config) => call("GET", url, undefined, config),
  post: (url, body, config) => call("POST", url, body === undefined ? {} : body, config),
  put: (url, body, config) => call("PUT", url, body === undefined ? {} : body, config),
  patch: (url, body, config) => call("PATCH", url, body === undefined ? {} : body, config),
  delete: (url, config) => call("DELETE", url, config?.data, config),
};
