const cacheName = "trpg-assistant-cache-v41";
const filesToCache = ["./", "index.html", "styles.css", "app.js", "sync-fix.js", "ui-layout-fix.js", "interaction-fix.js", "view-mode-fix.js", "ui-polish-v40.js", "player-assets-v41.js", "manifest.webmanifest", "assets/icon.svg", "assets/scene-gate.svg"];
const polishScript = '<script src="ui-polish-v40.js?v=40" defer></script>';
const playerAssetsScript = '<script src="player-assets-v41.js?v=41" defer></script>';

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(cacheName).then((cache) => cache.addAll(filesToCache)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(Promise.all([
    self.clients.claim(),
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== cacheName).map((key) => caches.delete(key)))),
  ]));
});

function withInjectedScripts(html) {
  let nextHtml = html;
  if (!nextHtml.includes("ui-polish-v40.js")) {
    nextHtml = nextHtml.replace("</body>", `${polishScript}\n  </body>`);
  }
  if (!nextHtml.includes("player-assets-v41.js")) {
    nextHtml = nextHtml.replace("</body>", `${playerAssetsScript}\n  </body>`);
  }
  return nextHtml;
}

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  const wantsHtml = event.request.headers.get("accept")?.includes("text/html");
  const isAppShell = wantsHtml || url.pathname.endsWith("/") || url.pathname.endsWith("/index.html");

  if (isAppShell) {
    event.respondWith(
      fetch(event.request)
        .catch(() => caches.match("index.html"))
        .then((response) => response.text().then((html) => new Response(withInjectedScripts(html), {
          headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-cache" },
        }))),
    );
    return;
  }

  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => {
    const copy = response.clone();
    caches.open(cacheName).then((cache) => cache.put(event.request, copy));
    return response;
  })));
});
