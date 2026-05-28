/// <reference lib="webworker" />
import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { NetworkFirst, NetworkOnly, Serwist, StaleWhileRevalidate } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const appRoutes = [
  "/dashboard",
  "/scheduling",
  "/rentals",
  "/workforce",
  "/logistics",
  "/invoicing",
  "/billing",
  "/analytics",
  "/automations",
  "/settings",
  "/offline",
];

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    ...defaultCache,
    {
      matcher: ({ request, url }) =>
        request.mode === "navigate" && appRoutes.some((route) => url.pathname.startsWith(route)),
      handler: new NetworkFirst({
        cacheName: "opervia-app-pages",
        networkTimeoutSeconds: 5,
        plugins: [
          {
            handlerDidError: async () => {
              return (await caches.match("/offline")) ?? Response.error();
            },
          },
        ],
      }),
    },
    {
      matcher: ({ url }) => url.pathname.startsWith("/api/auth") || url.pathname.startsWith("/api/stripe"),
      handler: new NetworkOnly(),
    },
    {
      matcher: ({ url }) => url.pathname.startsWith("/api/sync"),
      handler: new NetworkOnly(),
    },
    {
      matcher: ({ request }) => request.destination === "image" || request.destination === "font",
      handler: new StaleWhileRevalidate({ cacheName: "opervia-static-assets" }),
    },
  ],
  fallbacks: {
    entries: [
      {
        url: "/offline",
        matcher({ request }) {
          return request.destination === "document";
        },
      },
    ],
  },
});

serwist.addEventListeners();
