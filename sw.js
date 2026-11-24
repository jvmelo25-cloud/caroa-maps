/* Caroá Maps 1.1 — guarda o app no aparelho (gerado pelo montar_site.py).
   A página: da rede quando há sinal (espera no máximo 3 s), senão a guardada.
   O resto (ícones, manifesto): o guardado. Os mapas e as marcas ficam no
   IndexedDB do app, não aqui. */
var CACHE = 'caroa-maps-1.1';
var ARQUIVOS = ['./', './index.html', './manifest.webmanifest', './icone-180.png', './icone-192.png',
  './icone-512.png', './icone-mascara-512.png'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) {
    return c.addAll(ARQUIVOS.map(function (a) { return new Request(a, { cache: 'reload' }); }));
  }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (nomes) {
    return Promise.all(nomes.filter(function (n) { return n.indexOf('caroa-maps-') === 0 && n !== CACHE; })
      .map(function (n) { return caches.delete(n); }));
  }).then(function () { return self.clients.claim(); }));
});

function guardada() {
  return caches.match('./index.html').then(function (r) { return r || caches.match('./'); });
}

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  if (req.mode === 'navigate') {
    e.respondWith(new Promise(function (responder) {
      var feito = false;
      function uma(r) { if (!feito && r) { feito = true; responder(r); } }
      var tempo = setTimeout(function () { guardada().then(uma); }, 3000);
      fetch(req, { cache: 'no-cache' }).then(function (r) {
        clearTimeout(tempo);
        if (r && r.ok) {
          var copia = r.clone();
          caches.open(CACHE).then(function (c) { c.put('./index.html', copia); });
          uma(r);
        } else {
          guardada().then(function (g) { uma(g || r); });
        }
      }).catch(function () {
        clearTimeout(tempo);
        guardada().then(function (g) { uma(g || Response.error()); });
      });
    }));
    return;
  }
  e.respondWith(caches.match(req).then(function (r) { return r || fetch(req); }));
});
