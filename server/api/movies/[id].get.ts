import { getMovie } from "../../utils/catalog";
import { tmdbId } from "../../utils/tmdb";
export default defineEventHandler((event) =>
  getMovie(tmdbId(getRouterParam(event, "id"))),
);
