import type { Movie, Person, MoviePage } from "~/shared/types/catalog";
import type {
  TmdbMovie,
  TmdbPerson,
  TmdbPage,
  TmdbMovieDetails,
  TmdbPersonDetails,
  TmdbGenre,
} from "./tmdb-types";
import { tmdbGet, tmdbImage } from "./tmdb";

const PAGE_SIZE = 12;
const MAX_RESULTS = 10000; // TMDB allows access to the first 500 pages of 20 results.
export async function getGenres() {
  return (await tmdbGet<{ genres: TmdbGenre[] }>("genre/movie/list")).genres;
}
export function mapMovie(raw: TmdbMovie, genres: TmdbGenre[]): Movie {
  const names =
    raw.genres || genres.filter((genre) => raw.genre_ids?.includes(genre.id));
  return {
    id: String(raw.id),
    title: raw.title,
    originalTitle: raw.original_title || raw.title,
    year: Number(raw.release_date?.slice(0, 4)) || 0,
    genres: names.map((genre) => genre.name),
    rating: Math.round((raw.vote_average || 0) * 10) / 10,
    duration: raw.runtime || 0,
    country:
      raw.production_countries
        ?.map(
          (country) =>
            new Intl.DisplayNames(["ru"], { type: "region" }).of(
              country.iso_3166_1,
            ) || country.name,
        )
        .join(", ") || "",
    age: "",
    poster: tmdbImage(raw.poster_path) || "/images/poster-placeholder.svg",
    backdrop: tmdbImage(raw.backdrop_path, "w1280"),
    description: raw.overview || "Описание фильма пока недоступно.",
    director: "",
    cast: [],
  };
}
const roles: Record<string, string> = {
  Acting: "Актёр / актриса",
  Directing: "Режиссёр",
  Writing: "Сценарист",
  Production: "Продюсер",
  Camera: "Оператор",
  Sound: "Звук",
  Editing: "Монтаж",
};
export function mapPerson(raw: TmdbPerson): Person {
  return {
    id: String(raw.id),
    name: raw.name,
    originalName: raw.original_name || raw.name,
    role: roles[raw.known_for_department || ""] || "Кинематографист",
    birth: raw.birthday
      ? new Intl.DateTimeFormat("ru-RU", {
          day: "numeric",
          month: "long",
          year: "numeric",
          timeZone: "UTC",
        }).format(new Date(raw.birthday + "T00:00:00Z"))
      : "Не указана",
    birthplace: raw.place_of_birth || "Не указано",
    bio: raw.biography || "Биография пока недоступна.",
    color: "#687e80",
    initials: raw.name
      .split(/\s+/)
      .slice(0, 2)
      .map((word) => word[0])
      .join(""),
    photo: tmdbImage(raw.profile_path, "w342"),
  };
}
export interface CatalogFilters {
  page: number;
  genre: string;
  year: string;
  q: string;
  sort: string;
}
export async function getCatalog(filters: CatalogFilters): Promise<MoviePage> {
  const knownGenres = filters.genre ? await getGenres() : null;
  const genre = knownGenres?.find(
    (genre) =>
      genre.name.toLocaleLowerCase("ru") ===
        filters.genre.toLocaleLowerCase("ru") ||
      String(genre.id) === filters.genre,
  );
  if (filters.genre && !genre)
    throw createError({ statusCode: 400, statusMessage: "Unknown genre" });
  if (filters.q && (filters.genre || filters.sort !== "popular"))
    throw createError({
      statusCode: 400,
      statusMessage: "Incompatible search filters",
      message:
        "Search supports title and year; genre and sorting are available in the catalog",
    });
  const query: Record<string, string | number> = { include_adult: "false" };
  const endpoint = filters.q ? "search/movie" : "discover/movie";
  if (filters.q) {
    query.query = filters.q;
    if (filters.year) query.primary_release_year = filters.year;
  } else {
    query.include_video = "false";
    query.sort_by =
      filters.sort === "rating"
        ? "vote_average.desc"
        : filters.sort === "newest"
          ? "primary_release_date.desc"
          : "popularity.desc";
    if (genre) query.with_genres = genre.id;
    if (filters.year) query.primary_release_year = filters.year;
    if (filters.sort === "rating") query["vote_count.gte"] = 300;
    if (filters.sort === "newest") {
      query["primary_release_date.lte"] = new Date().toISOString().slice(0, 10);
      query["vote_count.gte"] = 50;
    }
  }
  const [genres, first] = await Promise.all([
    knownGenres ? Promise.resolve(knownGenres) : getGenres(),
    tmdbGet<TmdbPage<TmdbMovie>>(endpoint, { ...query, page: 1 }),
  ]);
  const total = Math.min(
    first.total_results,
    first.total_pages * 20,
    MAX_RESULTS,
  );
  const start = (filters.page - 1) * PAGE_SIZE;
  let items: Movie[] = [];
  if (start < total) {
    const begin = Math.floor(start / 20) + 1,
      end = Math.min(
        Math.ceil((start + PAGE_SIZE) / 20),
        first.total_pages,
        500,
      );
    const pages = await Promise.all(
      Array.from({ length: end - begin + 1 }, (_, index) => begin + index).map(
        (page) =>
          page === 1
            ? first
            : tmdbGet<TmdbPage<TmdbMovie>>(endpoint, { ...query, page }),
      ),
    );
    items = pages
      .flatMap((page) => page.results)
      .slice(start % 20, (start % 20) + PAGE_SIZE)
      .map((movie) => mapMovie(movie, genres));
  }
  return {
    items,
    total,
    page: filters.page,
    hasMore: start + items.length < total,
    genres: genres.map((genre) => genre.name),
    years: Array.from(
      { length: new Date().getUTCFullYear() - 1898 },
      (_, index) => new Date().getUTCFullYear() + 1 - index,
    ),
  };
}
export async function getMovie(id: string) {
  const [raw, genres] = await Promise.all([
    tmdbGet<TmdbMovieDetails>(`movie/${id}`, {
      append_to_response: "credits,recommendations,release_dates",
    }),
    getGenres(),
  ]);
  const movie = mapMovie(raw, genres);
  const director = raw.credits?.crew.find(
    (person) => person.job === "Director",
  );
  const cast =
    raw.credits?.cast
      .filter((person) => !person.adult)
      .slice(0, 8)
      .map(mapPerson) || [];
  movie.director = director ? String(director.id) : "";
  movie.cast = cast.map((person) => person.id);
  movie.age =
    raw.release_dates?.results
      .find((release) => release.iso_3166_1 === "RU")
      ?.release_dates.find((release) => release.certification)?.certification ||
    "";
  return {
    movie,
    director: director ? mapPerson(director) : null,
    cast,
    related:
      raw.recommendations?.results
        .filter((movie) => !movie.adult && String(movie.id) !== id)
        .slice(0, 6)
        .map((movie) => mapMovie(movie, genres)) || [],
  };
}
export async function getPerson(id: string, page = 1) {
  const [raw, genres] = await Promise.all([
    tmdbGet<TmdbPersonDetails>(`person/${id}`, {
      append_to_response: "movie_credits",
    }),
    getGenres(),
  ]);
  const unique = new Map<number, TmdbMovie>();
  for (const movie of [
    ...(raw.movie_credits?.cast || []),
    ...(raw.movie_credits?.crew || []),
  ])
    if (!movie.adult && !unique.has(movie.id)) unique.set(movie.id, movie);
  const movies = [...unique.values()].sort((a, b) =>
    (b.release_date || "").localeCompare(a.release_date || ""),
  );
  return {
    person: mapPerson(raw),
    movies: movies
      .slice((page - 1) * 24, page * 24)
      .map((movie) => mapMovie(movie, genres)),
    totalMovies: movies.length,
    page,
    hasMore: page * 24 < movies.length,
  };
}
