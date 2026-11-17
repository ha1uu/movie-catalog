import { movies, people } from "../../data/catalog";
export default defineEventHandler((event) => {
  const movie = movies.find((m) => m.id === getRouterParam(event, "id"));
  if (!movie)
    throw createError({ statusCode: 404, statusMessage: "Фильм не найден" });
  return {
    movie,
    director: people.find((p) => p.id === movie.director),
    cast: people.filter((p) => movie.cast.includes(p.id)),
    related: movies
      .filter(
        (m) =>
          m.id !== movie.id && m.genres.some((g) => movie.genres.includes(g)),
      )
      .slice(0, 6),
  };
});
