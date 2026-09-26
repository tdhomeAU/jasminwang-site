import { handleLeadCapture } from "../../scripts/kit-lead-capture.mjs";

export async function onRequest({ request, env }) {
  return handleLeadCapture(request, env);
}
