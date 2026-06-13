"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { useReportWebVitals } from "next/web-vitals";
import {
  captureEvent,
  capturePageView,
  initializeAnalytics
} from "@/lib/analytics";

function AnalyticsEvents() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    initializeAnalytics();
  }, []);

  useEffect(() => {
    if (!pathname) return;
    const query = searchParams.toString();
    capturePageView(`${window.location.origin}${pathname}${query ? `?${query}` : ""}`);
  }, [pathname, searchParams]);

  useReportWebVitals((metric) => {
    captureEvent("web_vital", {
      id: metric.id,
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      navigation_type: metric.navigationType
    });
  });

  return null;
}

export function Analytics() {
  return (
    <Suspense fallback={null}>
      <AnalyticsEvents />
    </Suspense>
  );
}
