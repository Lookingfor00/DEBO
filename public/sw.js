/* TB-023 Web Push service worker */
self.addEventListener("push", (event) => {
  let data = { title: "Nouvelle offre", url: "/alerts", item_id: null };
  try {
    if (event.data) {
      data = { ...data, ...event.data.json() };
    }
  } catch {
    // keep defaults
  }
  const title =
    typeof data.title === "string" && data.title.trim()
      ? data.title
      : "Nouvelle offre";
  const url =
    typeof data.url === "string" && data.url.trim() ? data.url : "/alerts";

  event.waitUntil(
    self.registration.showNotification(title, {
      body: "Une offre correspond à vos mots-clés.",
      data: { url },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url =
    event.notification.data && typeof event.notification.data.url === "string"
      ? event.notification.data.url
      : "/alerts";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if ("focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
      return undefined;
    }),
  );
});
