/* eslint-disable no-undef */
// 1. Importação das bibliotecas (Versão Compat)
importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js");

// 2. Inicialização (Use as mesmas credenciais do seu front)
firebase.initializeApp({
  apiKey: "AIzaSyDk23G58kVrMGBYIzbSHYvnN_tKcSDA9JY",
  authDomain: "akad-fbe7e.firebaseapp.com",
  databaseURL: "https://akad-fbe7e-default-rtdb.firebaseio.com",
  projectId: "akad-fbe7e",
  storageBucket: "akad-fbe7e.appspot.com",
  messagingSenderId: "1024774175861",
  appId: "1:1024774175861:web:92bea89967818b9d7e4c3c",
});

const messaging = firebase.messaging();

/**
 * 🔥 EVENTO PUSH MANUAL - Intercepta ANTES do FCM processar
 * Isso evita a mensagem genérica "site atualizado em segundo plano"
 */
self.addEventListener("push", (event) => {
  console.log("[SW] Push event received:", event);

  // Previne o comportamento padrão do FCM
  event.stopImmediatePropagation();

  let data = {};

  try {
    if (event.data) {
      const payload = event.data.json();
      console.log("[SW] Push payload:", payload);
      
      // FCM envia os dados no campo 'data' quando usamos data-only messages
      data = payload.data || payload.notification || payload;
    }
  } catch (e) {
    console.error("[SW] Error parsing push data:", e);
  }

  const title = data.title || "AKAD";
  
  // Get the link from the notification data
  const notificationLink = data.link || "/";
  
  const options = {
    body: data.body || "",
    icon: data.icon || "/ic_stat_logo_akad.png",
    badge: "/ic_stat_logo_akad.png",
    tag: "akad-notification-" + Date.now(),
    renotify: true,
    requireInteraction: true,
    data: {
      url: notificationLink,
    },
  };

  console.log("[SW] Showing notification:", title, options);

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// onBackgroundMessage removido - usando apenas o listener 'push' manual
// para evitar notificações duplicadas

/**
 * 👉 EVENTO DE CLIQUE
 * Abre o app ou foca na aba já aberta
 */
self.addEventListener("notificationclick", (event) => {
  console.log("[SW] Notification clicked:", event);
  event.notification.close();

  const targetUrl = event.notification.data?.url || "/";

  const promiseChain = clients
    .matchAll({
      type: "window",
      includeUncontrolled: true,
    })
    .then((windowClients) => {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.includes(targetUrl) && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    });

  event.waitUntil(promiseChain);
});

/**
 * 🔄 ATIVAÇÃO IMEDIATA
 * Garante que o SW assuma controle imediatamente
 */
self.addEventListener("install", (event) => {
  console.log("[SW] Installing...");
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  console.log("[SW] Activating...");
  event.waitUntil(self.clients.claim());
});
