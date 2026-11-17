import { getCatalog } from "../utils/catalog";
export default defineEventHandler(async () => {
  const page = await getCatalog({
    page: 1,
    genre: "",
    year: "",
    q: "",
    sort: "popular",
  });
  return page.items.find((movie) => movie.backdrop) || page.items[0] || null;
});
