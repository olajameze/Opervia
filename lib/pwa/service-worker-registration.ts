const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000;
const UPDATE_CHECK_THROTTLE_MS = 60 * 1000;

type ServiceWorkerCleanup = () => void;

function shouldRegisterServiceWorker() {
  return typeof window !== "undefined" && "serviceWorker" in navigator && process.env.NODE_ENV === "production";
}

function createUpdateChecker(registration: ServiceWorkerRegistration) {
  let lastCheckAt = 0;

  return () => {
    const now = Date.now();
    if (now - lastCheckAt < UPDATE_CHECK_THROTTLE_MS) return;
    lastCheckAt = now;
    void registration.update().catch(() => {
      // Update checks are best-effort.
    });
  };
}

function listenForWaitingWorker(registration: ServiceWorkerRegistration) {
  const notifyWaitingWorker = (worker: ServiceWorker | null) => {
    if (!worker || !navigator.serviceWorker.controller) return;

    worker.addEventListener("statechange", () => {
      if (worker.state === "installed" && navigator.serviceWorker.controller) {
        worker.postMessage({ type: "SKIP_WAITING" });
      }
    });
  };

  notifyWaitingWorker(registration.waiting);

  registration.addEventListener("updatefound", () => {
    notifyWaitingWorker(registration.installing);
  });
}

export function registerServiceWorker(): ServiceWorkerCleanup | undefined {
  if (!shouldRegisterServiceWorker()) return undefined;

  let hadController = Boolean(navigator.serviceWorker.controller);
  let refreshing = false;
  let intervalId: number | undefined;

  const handleControllerChange = () => {
    if (!hadController) {
      hadController = true;
      return;
    }
    if (refreshing) return;
    refreshing = true;
    window.location.reload();
  };

  const handleVisibilityChange = () => {
    if (document.visibilityState === "visible") {
      checkForUpdates();
    }
  };

  let checkForUpdates = () => {};

  const handleFocus = () => {
    checkForUpdates();
  };

  void navigator.serviceWorker
    .register("/sw.js", {
      scope: "/",
      updateViaCache: "none",
    })
    .then((registration) => {
      checkForUpdates = createUpdateChecker(registration);
      listenForWaitingWorker(registration);
      checkForUpdates();

      intervalId = window.setInterval(checkForUpdates, UPDATE_CHECK_INTERVAL_MS);
    })
    .catch(() => {
      // Service worker registration is best-effort.
    });

  navigator.serviceWorker.addEventListener("controllerchange", handleControllerChange);
  document.addEventListener("visibilitychange", handleVisibilityChange);
  window.addEventListener("focus", handleFocus);

  return () => {
    navigator.serviceWorker.removeEventListener("controllerchange", handleControllerChange);
    document.removeEventListener("visibilitychange", handleVisibilityChange);
    window.removeEventListener("focus", handleFocus);
    if (intervalId !== undefined) {
      window.clearInterval(intervalId);
    }
  };
}
