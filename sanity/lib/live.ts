import { client } from "./client";

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
  const data = await client.fetch<T>(query, params, {
    next: { revalidate },
  });
  return { data };
};

export const SanityLive = () => null;
