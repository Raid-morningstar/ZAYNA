import { client } from "./client";
import { fetchWithRetry } from "./fetchWithRetry";

type SanityFetchArgs = {
  query: string;
  params?: Record<string, unknown>;
  revalidate?: number;
};

export const sanityFetch = async <T>({
  query,
  params = {},
  revalidate = 120,
}: SanityFetchArgs) => {
  const data = await fetchWithRetry(
    () =>
      client.fetch<T>(query, params, {
        next: { revalidate },
      }),
    { retries: 1, retryDelayMs: 400 }
  );
  return { data };
};

export const SanityLive = () => null;
