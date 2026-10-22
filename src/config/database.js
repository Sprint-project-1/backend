export const DATABASE_NAMES = Object.freeze({
  movie: "cinefund",
  funding: "funding",
});

export function getFundingDatabaseUrl(
  movieDatabaseUrl = process.env.DATABASE_URL,
  fundingDatabaseUrl = process.env.FUNDING_DATABASE_URL,
) {
  if (fundingDatabaseUrl) return fundingDatabaseUrl;
  if (!movieDatabaseUrl) return undefined;

  const url = new URL(movieDatabaseUrl);
  url.pathname = `/${DATABASE_NAMES.funding}`;
  return url.toString();
}
