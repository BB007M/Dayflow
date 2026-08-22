import { createFileRoute, ClientOnly } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

const DayflowApp = lazy(() => import("../DayflowApp"));

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dayflow — HR Workspace for Modern Teams" },
      {
        name: "description",
        content:
          "Dayflow is an HR workspace for attendance, leaves, payroll and people analytics, with a clean light theme and a pitch-black dark theme.",
      },
      { property: "og:title", content: "Dayflow — HR Workspace for Modern Teams" },
      {
        property: "og:description",
        content:
          "Track attendance, approve leaves, run payroll and read people analytics in one focused workspace.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Shell() {
  return <div className="min-h-screen bg-background" />;
}

function Index() {
  return (
    <ClientOnly fallback={<Shell />}>
      <Suspense fallback={<Shell />}>
        <DayflowApp />
      </Suspense>
    </ClientOnly>
  );
}
