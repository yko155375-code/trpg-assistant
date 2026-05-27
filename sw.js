const cacheName = "trpg-assistant-cache-v51";
const filesToCache = ["./", "index.html", "styles.css", "app.js", "sync-fix.js", "ui-layout-fix.js", "interaction-fix.js", "view-mode-fix.js", "ui-polish-v40.js", "player-assets-v41.js", "shop-v43.js", "shop-permissions-v49.js", "player-noise-shop-v50.js", "player-interface-fix-v51.js", "character-attributes-v44.js", "theme-v45.js", "public-player-audio-v46.js", "manifest.webmanifest", "assets/icon.svg", "assets/scene-gate.svg"];
const polishScript = '<script src="ui-polish-v40.js?v=40" defer></script>';
const playerAssetsScript = '<script src="player-assets-v41.js?v=41" defer></script>';
const shopScript = '<script src="shop-v43.js?v=48" defer></script>';
const shopPermissionsScript = '<script src="shop-permissions-v49.js?v=49" defer></script>';
const playerNoiseShopScript = '<script src="player-noise-shop-v50.js?v=50" defer></script>';
const playerInterfaceFixScript = '<script src="player-interface-fix-v51.js?v=51" defer></script>';
const attributesScript = '<script src="character-attributes-v44.js?v=44" defer></script>';
const themeScript = '<script src="theme-v45.js?v=45" defer></script>';
const publicPlayerAudioScript = '<script src="public-player-audio-v46.js?v=47" defer></script>';

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
  nextHtml = nextHtml.replace(/shop-v43\.js\?v=\d+/g, "shop-v43.js?v=48");
  if (!nextHtml.includes("ui-polish-v40.js")) {
    nextHtml = nextHtml.replace("</body>", `${polishScript}\n  </body>`);
  }
  if (!nextHtml.includes("player-assets-v41.js")) {
    nextHtml = nextHtml.replace("</body>", `${playerAssetsScript}\n  </body>`);
  }
  if (!nextHtml.includes("shop-v43.js")) {
    nextHtml = nextHtml.replace("</body>", `${shopScript}\n  </body>`);
  }
  if (!nextHtml.includes("shop-permissions-v49.js")) {
    nextHtml = nextHtml.replace("</body>", `${shopPermissionsScript}\n  </body>`);
  }
  if (!nextHtml.includes("player-noise-shop-v50.js")) {
    nextHtml = nextHtml.replace("</body>", `${playerNoiseShopScript}\n  </body>`);
  }
  if (!nextHtml.includes("player-interface-fix-v51.js")) {
    nextHtml = nextHtml.replace("</body>", `${playerInterfaceFixScript}\n  </body>`);
  }
  if (!nextHtml.includes("character-attributes-v44.js")) {
    nextHtml = nextHtml.replace("</body>", `${attributesScript}\n  </body>`);
  }
  if (!nextHtml.includes("theme-v45.js")) {
    nextHtml = nextHtml.replace("</body>", `${themeScript}\n  </body>`);
  }
  if (!nextHtml.includes("public-player-audio-v46.js")) {
    nextHtml = nextHtml.replace("</body>", `${publicPlayerAudioScript}\n  </body>`);
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