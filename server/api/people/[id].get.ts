import { movies, people } from "../../data/catalog";
export default defineEventHandler((event) => {
  const person = people.find((p) => p.id === getRouterParam(event, "id"));
  if (!person)
    throw createError({ statusCode: 404, statusMessage: "Персона не найдена" });
  return {
    person,
    movies: movies.filter(
      (m) => m.director === person.id || m.cast.includes(person.id),
    ),
  };
});
