import { createClient } from "next-sanity";

import { apiVersion, dataset, projectId } from "../env";

export const backendClient = createClient({
  projectId,
  dataset,
  apiVersion,
  // Backend client does authenticated reads/writes and should bypass CDN.
  useCdn: false,
  token: process.env.SANITY_API_TOKEN,
});
