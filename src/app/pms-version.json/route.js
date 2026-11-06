// The version of the PMS that is live (owner, 2026-11-06: an Update button).
// Written once per build into the exported files as /pms-version.json; a PMS
// open since an older build sees a different version here and offers Update
// (components/pms/UpdateButton.jsx). Never cached (public/_headers).
export const dynamic = "force-static";

export function GET() {
  return Response.json({ version: process.env.NEXT_PUBLIC_APP_VERSION || "" });
}
