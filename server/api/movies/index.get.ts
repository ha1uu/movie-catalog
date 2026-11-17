import { getCatalog } from "../../utils/catalog";
import { tmdbPage } from "../../utils/tmdb";
export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const genre = String(query.genre || "").trim(),
    year = String(query.year || ""),
    q = String(query.q || "").trim(),
    sort = String(query.sort || "popular");
  if (
    q.length > 200 ||
    genre.length > 80 ||
    !["popular", "rating", "newest"].includes(sort) ||
    (year &&
      (!/^\d{4}$/.test(year) ||
        Number(year) < 1874 ||
        Number(year) > new Date().getUTCFullYear() + 1))
  )
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid catalog filters",
    });
  return getCatalog({ page: tmdbPage(query.page, 834), genre, year, q, sort });
});
