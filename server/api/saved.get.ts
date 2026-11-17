import { movies } from "../data/catalog";
export default defineEventHandler((event) => {
  const ids = String(getQuery(event).ids || "").split(",");
  return movies.filter((m) => ids.includes(m.id));
});
