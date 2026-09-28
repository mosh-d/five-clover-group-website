import { pmsRequest } from "./client";

// The PMS's calls to the backend, in the shape the branch PMS writes them
// (axios): get(url, { params }), post(url, body), ... each resolving to
// { data }. It lets the API modules under lib/pms/api carry over from the
// branch PMS function for function, while every call still goes through
// pmsRequest - the session's token, renewal while someone is working, the
// "session has ended" prompt, and errors carrying err.response.data.
//
// URLs are paths ("/api/folios"); the server address is pmsRequest's.
const call = (method, url, body, config = {}) => pmsRequest(url, { method, body, query: config.params }).then((data) => ({ data }));

export const http = {
  get: (url, config) => call("GET", url, undefined, config),
  post: (url, body, config) => call("POST", url, body === undefined ? {} : body, config),
  put: (url, body, config) => call("PUT", url, body === undefined ? {} : body, config),
  patch: (url, body, config) => call("PATCH", url, body === undefined ? {} : body, config),
  delete: (url, config) => call("DELETE", url, config?.data, config),
};
