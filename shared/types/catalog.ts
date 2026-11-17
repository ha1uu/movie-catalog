export interface Movie {
  id: string;
  title: string;
  originalTitle: string;
  year: number;
  genres: string[];
  rating: number;
  duration: number;
  country: string;
  age: string;
  poster: string;
  description: string;
  director: string;
  cast: string[];
}
export interface Person {
  id: string;
  name: string;
  originalName: string;
  role: string;
  birth: string;
  birthplace: string;
  bio: string;
  color: string;
  initials: string;
}
export interface MoviePage {
  items: Movie[];
  total: number;
  page: number;
  hasMore: boolean;
}
