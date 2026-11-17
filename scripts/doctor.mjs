import { loadEnvFile } from "node:process";
import { EnvHttpProxyAgent, fetch } from "undici";

async function diagnose() {
  try {
    loadEnvFile(".env");
  } catch (error) {
    if (error.code !== "ENOENT") {
      console.error(
        "Не удалось прочитать .env. Проверьте права доступа и формат файла.",
      );
      return 1;
    }
  }
  const token = (process.env.NUXT_TMDB_READ_TOKEN || "").trim();
  if (!token) {
    console.error("Не задан NUXT_TMDB_READ_TOKEN.");
    console.error(
      "Создайте .env рядом с package.json и заполните NUXT_TMDB_READ_TOKEN своим API Read Access Token из https://www.themoviedb.org/settings/api.",
    );
    console.error(
      "Сохраните файл и перезапустите приложение. Не добавляйте .env в Git.",
    );
    return 1;
  }
  if (/^Bearer\s/i.test(token)) {
    console.error(
      "В NUXT_TMDB_READ_TOKEN нужен только токен, без префикса Bearer.",
    );
    return 1;
  }
  let url;
  try {
    url = new URL(
      (
        process.env.NUXT_TMDB_API_BASE || "https://api.themoviedb.org/3"
      ).replace(/\/$/, "") + "/discover/movie",
    );
    if (!["https:", "http:"].includes(url.protocol)) throw new Error();
  } catch {
    console.error(
      "NUXT_TMDB_API_BASE содержит неверный адрес. По умолчанию используется https://api.themoviedb.org/3.",
    );
    return 1;
  }
  url.searchParams.set("language", "ru-RU");
  url.searchParams.set("include_adult", "false");
  url.searchParams.set("page", "1");
  const dispatcher = new EnvHttpProxyAgent();
  try {
    let response;
    try {
      response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        dispatcher,
        signal: AbortSignal.timeout(8000),
        redirect: "error",
      });
    } catch {
      console.error(
        "Не удалось соединиться с TMDB: сеть, DNS, прокси, TLS или таймаут.",
      );
      console.error(
        "Проверьте доступ к api.themoviedb.org из вашей сети и настройки HTTP_PROXY / HTTPS_PROXY, если используете прокси.",
      );
      return 1;
    }
    if (!response.ok) {
      await response.body?.cancel();
      if (response.status === 401) {
        console.error(
          "TMDB вернул HTTP 401: токен не принят. Нужен API Read Access Token, а не API Key (v3), без префикса Bearer.",
        );
      } else if (response.status === 403) {
        console.error(
          "TMDB или сетевой прокси вернул HTTP 403: доступ запрещён. Проверьте доступность TMDB в вашей сети и разрешения токена.",
        );
      } else if (response.status === 429) {
        console.error(
          "TMDB вернул HTTP 429: превышен лимит запросов. Повторите проверку позже.",
        );
      } else {
        console.error(
          `API вернул HTTP ${response.status}. Проверьте доступность TMDB и значение NUXT_TMDB_API_BASE, если меняли его.`,
        );
      }
      return 1;
    }
    let body;
    try {
      body = await response.json();
    } catch {
      console.error("API вернул некорректный JSON вместо каталога.");
      return 1;
    }
    if (!Array.isArray(body.results)) {
      console.error("API вернул неожиданный ответ вместо каталога фильмов.");
      return 1;
    }
    console.log("Токен принят. Сервер TMDB доступен, каталог получен.");
    console.log(
      "Если приложение было запущено до изменения .env, остановите и запустите его снова. Для постеров также нужен доступ к image.tmdb.org.",
    );
    return 0;
  } finally {
    await dispatcher.close();
  }
}
process.exitCode = await diagnose();
