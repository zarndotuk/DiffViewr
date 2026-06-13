"use client";

type AnalyticsProperties = Record<string, string | number | boolean | null | undefined>;
type PostHogClient = typeof import("posthog-js").default;

let clientPromise: Promise<PostHogClient | null> | null = null;
let initializationScheduled = false;
let pendingPageView: string | null = null;

function loadClient(): Promise<PostHogClient | null> {
  if (clientPromise) return clientPromise;

  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return Promise.resolve(null);

  clientPromise = import("posthog-js")
    .then(({ default: posthog }) => {
      posthog.init(key, {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
        person_profiles: "identified_only",
        capture_pageview: false
      });
      if (pendingPageView) {
        posthog.capture("$pageview", { $current_url: pendingPageView });
        pendingPageView = null;
      }
      return posthog;
    })
    .catch(() => null);

  return clientPromise;
}

export function initializeAnalytics() {
  if (initializationScheduled || !process.env.NEXT_PUBLIC_POSTHOG_KEY) return;
  initializationScheduled = true;

  const start = () => {
    void loadClient();
  };

  const browserWindow = window as Window & {
    requestIdleCallback?: (
      callback: IdleRequestCallback,
      options?: IdleRequestOptions
    ) => number;
  };
  if (typeof browserWindow.requestIdleCallback === "function") {
    browserWindow.requestIdleCallback(start, { timeout: 3000 });
  } else {
    globalThis.setTimeout(start, 1500);
  }
}

export function capturePageView(url: string) {
  pendingPageView = url;
  initializeAnalytics();
  if (!clientPromise) return;
  void clientPromise.then((posthog) => {
    if (!posthog || !pendingPageView) return;
    posthog.capture("$pageview", { $current_url: pendingPageView });
    pendingPageView = null;
  });
}

export function captureEvent(name: string, properties?: AnalyticsProperties) {
  void loadClient().then((posthog) => {
    posthog?.capture(name, properties);
  });
}
