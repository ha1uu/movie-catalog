export function useSaved() {
  const saved = useState<string[]>("saved-movies", () => []);
  const ready = useState("saved-ready", () => false);
  const notice = useState("saved-notice", () => "");
  onMounted(() => {
    if (ready.value) return;
    try {
      const parsed: unknown = JSON.parse(
        localStorage.getItem("kadr-saved") || "[]",
      );
      if (Array.isArray(parsed))
        saved.value = parsed.filter(
          (id): id is string => typeof id === "string",
        );
    } catch {
      /* Storage may be unavailable in private browsing. */
    }
    ready.value = true;
  });
  function toggle(id: string) {
    const exists = saved.value.includes(id);
    saved.value = exists
      ? saved.value.filter((i) => i !== id)
      : [...saved.value, id];
    try {
      localStorage.setItem("kadr-saved", JSON.stringify(saved.value));
    } catch {
      /* Keep session state. */
    }
    notice.value = exists
      ? "Фильм удалён из избранного"
      : "Фильм добавлен в избранное";
    setTimeout(() => {
      notice.value = "";
    }, 2400);
  }
  return {
    saved,
    ready,
    notice,
    toggle,
    isSaved: (id: string) => saved.value.includes(id),
  };
}
