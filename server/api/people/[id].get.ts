import { getPerson } from "../../utils/catalog";
import { tmdbId, tmdbPage } from "../../utils/tmdb";
export default defineEventHandler((event) =>
  getPerson(
    tmdbId(getRouterParam(event, "id")),
    tmdbPage(getQuery(event).page),
  ),
);
