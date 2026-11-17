export function movieCount(count: number) {
  const lastTwo = count % 100,
    last = count % 10;
  const word =
    lastTwo >= 11 && lastTwo <= 14
      ? "фильмов"
      : last === 1
        ? "фильм"
        : last >= 2 && last <= 4
          ? "фильма"
          : "фильмов";
  return `${count} ${word}`;
}
