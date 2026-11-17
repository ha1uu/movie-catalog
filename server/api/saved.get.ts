import { getMovie } from "../utils/catalog";
export default defineEventHandler(async (event) => {
  const raw = String(getQuery(event).ids || "");
  if (!raw) return [];
  const ids = [...new Set(raw.split(","))];
  if (ids.length > 100 || ids.some((id) => !/^[1-9]\d{0,9}$/.test(id)))
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid saved movie IDs",
    });
  // A removed movie can disappear from a collection; outages must remain visible.
  const movies = [];
  for (let offset = 0; offset < ids.length; offset += 5) {
    const batch = await Promise.all(
      ids.slice(offset, offset + 5).map(async (id) => {
        try {
          return (await getMovie(id)).movie;
        } catch (error) {
          if ((error as { statusCode?: number }).statusCode === 404)
            return null;
          throw error;
        }
      }),
    );
    movies.push(...batch.filter((movie) => movie !== null));
  }
  return movies;
});
