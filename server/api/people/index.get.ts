import type { TmdbPage, TmdbPerson } from "../../utils/tmdb-types";
import { tmdbGet, tmdbPage } from "../../utils/tmdb";
import { mapPerson } from "../../utils/catalog";
export default defineEventHandler(async (event) => {
  const page = tmdbPage(getQuery(event).page);
  const result = await tmdbGet<TmdbPage<TmdbPerson>>("person/popular", {
    page,
  });
  return {
    items: result.results.filter((person) => !person.adult).map(mapPerson),
    page,
    total: result.total_results,
    hasMore: page < Math.min(result.total_pages, 500),
  };
});
