import { movies, genres } from "../../data/catalog";
export default defineEventHandler((event) => {
  const query = getQuery(event);
  const search = String(query.q || "")
    .trim()
    .toLocaleLowerCase("ru");
  const year = String(query.year || "");
  const genre = String(query.genre || "");
  const page = Math.max(1, Math.floor(Number(query.page) || 1));
  const limit = 6;
  let items = movies.filter(
    (m) =>
      (!genre || m.genres.includes(genre)) &&
      (!year || String(m.year) === year) &&
      (!search ||
        `${m.title} ${m.originalTitle}`
          .toLocaleLowerCase("ru")
          .includes(search)),
  );
  if (query.sort === "rating")
    items = [...items].sort((a, b) => b.rating - a.rating);
  if (query.sort === "newest")
    items = [...items].sort((a, b) => b.year - a.year);
  return {
    items: items.slice((page - 1) * limit, page * limit),
    total: items.length,
    page,
    hasMore: page * limit < items.length,
    genres,
    years: [...new Set(movies.map((m) => m.year))].sort((a, b) => b - a),
  };
});
