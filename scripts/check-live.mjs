// Smoke test against the running application and its real configured provider.
const base = process.env.TEST_BASE_URL || "http://127.0.0.1:3000";
async function read(path) {
  const response = await fetch(base + path);
  if (!response.ok)
    throw new Error(
      `${path}: HTTP ${response.status}. Configure the server-only TMDB token and allow its domains, then restart the application.`,
    );
  return response.json();
}
const catalog = await read("/api/movies");
if (
  !catalog.items?.length ||
  !catalog.total ||
  !/^\d+$/.test(catalog.items[0].id)
)
  throw new Error("Provider returned an empty or invalid catalog");
const movie = await read(`/api/movies/${catalog.items[0].id}`);
if (movie.movie.id !== catalog.items[0].id || !movie.movie.title)
  throw new Error("Movie detail request failed");
const people = await read("/api/people");
if (!people.items?.length) throw new Error("Person directory is empty");
const person = await read(`/api/people/${people.items[0].id}`);
if (!person.person.name || !Array.isArray(person.movies))
  throw new Error("Person detail request failed");
console.log(
  JSON.stringify(
    {
      status: "passed",
      movies: catalog.total,
      firstMovie: movie.movie.title,
      firstPerson: person.person.name,
    },
    null,
    2,
  ),
);
