export interface TmdbGenre {
  id: number;
  name: string;
}
export interface TmdbMovie {
  id: number;
  title: string;
  original_title?: string;
  overview?: string;
  release_date?: string;
  genre_ids?: number[];
  genres?: TmdbGenre[];
  vote_average?: number;
  vote_count?: number;
  poster_path?: string | null;
  backdrop_path?: string | null;
  runtime?: number | null;
  adult?: boolean;
  production_countries?: { iso_3166_1: string; name: string }[];
}
export interface TmdbPerson {
  id: number;
  name: string;
  original_name?: string;
  known_for_department?: string;
  profile_path?: string | null;
  birthday?: string | null;
  place_of_birth?: string | null;
  biography?: string;
  adult?: boolean;
  job?: string;
}
export interface TmdbPage<T> {
  results: T[];
  page: number;
  total_pages: number;
  total_results: number;
}
export interface TmdbMovieDetails extends TmdbMovie {
  credits?: { cast: TmdbPerson[]; crew: TmdbPerson[] };
  recommendations?: TmdbPage<TmdbMovie>;
  release_dates?: {
    results: {
      iso_3166_1: string;
      release_dates: { certification: string }[];
    }[];
  };
}
export interface TmdbPersonDetails extends TmdbPerson {
  movie_credits?: { cast: TmdbMovie[]; crew: (TmdbMovie & { job?: string })[] };
}
