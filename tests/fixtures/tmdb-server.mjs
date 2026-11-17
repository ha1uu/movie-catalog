// Deterministic TMDB-shaped upstream for integration tests only.
// This file is never imported into the Nuxt application or production output.
import http from "node:http";
const genres = [
  { id: 878, name: "Фантастика" },
  { id: 35, name: "Комедия" },
  { id: 28, name: "Боевик" },
  { id: 80, name: "Детектив" },
  { id: 18, name: "Драма" },
  { id: 12, name: "Приключения" },
  { id: 53, name: "Триллер" },
];
const rows = [
  [550988, "Главный герой", "Free Guy", 2021, [878, 35, 28], 7.4],
  [414906, "Бэтмен", "The Batman", 2022, [28, 80, 18], 7.8],
  [639933, "Варяг", "The Northman", 2022, [18, 12, 28], 7],
  [
    453395,
    "Доктор Стрэндж: В мультивселенной безумия",
    "Doctor Strange in the Multiverse of Madness",
    2022,
    [878, 12],
    6.9,
  ],
  [696806, "Проект «Адам»", "The Adam Project", 2022, [878, 35, 12], 6.7],
  [335787, "Анчартед: На картах не значится", "Uncharted", 2022, [12, 28], 6.3],
  [675353, "Соник 2 в кино", "Sonic the Hedgehog 2", 2022, [35, 12, 878], 6.5],
  [505026, "Смерть на Ниле", "Death on the Nile", 2022, [80, 18], 6.3],
  [
    648579,
    "Невыносимая тяжесть огромного таланта",
    "The Unbearable Weight of Massive Talent",
    2022,
    [35, 28],
    7,
  ],
  [476669, "King’s Man: Начало", "The King’s Man", 2021, [28, 12], 6.3],
  [818397, "Флешбэк", "Memory", 2022, [53, 28], 5.7],
  [526896, "Морбиус", "Morbius", 2022, [878, 53], 5.2],
  ...Array.from({ length: 19 }, (_, i) => [
    800000 + i,
    `Тестовый фильм ${i + 13}`,
    `Test Movie ${i + 13}`,
    2022,
    [35],
    6,
  ]),
];
const movies = rows.map(
  ([id, title, original_title, year, genre_ids, vote_average]) => ({
    id,
    title,
    original_title,
    release_date: `${year}-04-01`,
    genre_ids,
    vote_average,
    vote_count: 600,
    overview:
      id === 550988
        ? "Сотрудник банка узнаёт, что он — персонаж видеоигры."
        : "Описание, полученное от тестового внешнего API.",
    poster_path: null,
    backdrop_path: null,
    adult: false,
  }),
);
const people = [
  {
    id: 10859,
    name: "Райан Рейнольдс",
    known_for_department: "Acting",
    birthday: "1976-10-23",
    place_of_birth: "Ванкувер, Канада",
  },
  { id: 17825, name: "Шон Леви", known_for_department: "Directing" },
  { id: 124530, name: "Джоди Комер", known_for_department: "Acting" },
].map((person) => ({
  ...person,
  profile_path: null,
  biography: "Биография из ответа тестового API.",
  adult: false,
}));
people.push({ ...people[0], id: 900001, name: "Тестовая персона" });
const requests = [];
function page(items, n) {
  return {
    results: items.slice((n - 1) * 20, n * 20),
    page: n,
    total_pages: Math.ceil(items.length / 20),
    total_results: items.length,
  };
}
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://127.0.0.1:4010");
  const send = (status, body) => {
    res.writeHead(status, { "content-type": "application/json" });
    res.end(JSON.stringify(body));
  };
  if (url.pathname === "/__health") return send(200, { ok: true });
  if (url.pathname === "/__requests") return send(200, requests);
  if (req.headers.authorization !== "Bearer tmdb-fixture-only")
    return send(401, { status_message: "Invalid test authorization" });
  requests.push({
    path: url.pathname,
    query: Object.fromEntries(url.searchParams),
  });
  if (url.pathname === "/3/genre/movie/list") return send(200, { genres });
  if (url.pathname === "/3/person/popular")
    return send(200, page(people, Number(url.searchParams.get("page") || 1)));
  const movieMatch = url.pathname.match(/^\/3\/movie\/(\d+)$/);
  if (movieMatch) {
    const id = Number(movieMatch[1]);
    if (id === 990401)
      return send(401, { status_message: "Invalid authentication" });
    if (id === 990429) return send(429, { status_message: "Rate limit" });
    if (id === 990500) return send(500, { status_message: "Provider failure" });
    const movie = movies.find((movie) => movie.id === id);
    if (!movie) return send(404, { status_message: "Not found" });
    return send(200, {
      ...movie,
      runtime: 115,
      genres: genres.filter((genre) => movie.genre_ids.includes(genre.id)),
      production_countries: [
        { iso_3166_1: "US", name: "United States of America" },
      ],
      credits: {
        cast: [people[0], people[2]],
        crew: [{ ...people[1], job: "Director" }],
      },
      recommendations: page(
        movies.filter((m) => m.id !== id),
        1,
      ),
      release_dates: {
        results: [
          { iso_3166_1: "RU", release_dates: [{ certification: "12+" }] },
        ],
      },
    });
  }
  const personMatch = url.pathname.match(/^\/3\/person\/(\d+)$/);
  if (personMatch) {
    const person = people.find(
      (person) => person.id === Number(personMatch[1]),
    );
    if (!person) return send(404, { status_message: "Not found" });
    return send(200, {
      ...person,
      movie_credits: {
        cast: movies.filter(
          (m) => person.id === 900001 || m.id === 550988 || m.id === 696806,
        ),
        crew: [{ ...movies[0], job: "Producer" }],
      },
    });
  }
  if (
    url.pathname === "/3/discover/movie" ||
    url.pathname === "/3/search/movie"
  ) {
    let result = [...movies];
    const year = url.searchParams.get("primary_release_year"),
      genre = url.searchParams.get("with_genres"),
      q = (url.searchParams.get("query") || "").toLocaleLowerCase("ru");
    if (year) result = result.filter((m) => m.release_date.startsWith(year));
    if (genre)
      result = result.filter((m) => m.genre_ids.includes(Number(genre)));
    if (q)
      result = result.filter((m) =>
        `${m.title} ${m.original_title}`.toLocaleLowerCase("ru").includes(q),
      );
    if (url.searchParams.get("sort_by") === "vote_average.desc")
      result.sort((a, b) => b.vote_average - a.vote_average);
    if (url.searchParams.get("sort_by") === "primary_release_date.desc")
      result.sort((a, b) => b.release_date.localeCompare(a.release_date));
    return send(200, page(result, Number(url.searchParams.get("page") || 1)));
  }
  send(404, { status_message: "Unsupported test endpoint" });
});
server.listen(4010, "127.0.0.1", () =>
  console.log("TMDB integration fixture listening on 4010"),
);
