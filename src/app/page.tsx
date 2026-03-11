import Dashboard from "@/components/Dashboard";

/**
 * app/page.tsx  — Server Component
 *
 * Renders at / and delegates all interactivity to the <Dashboard> client component.
 * Could optionally pre-fetch the apps list here via fetch() with Next.js caching,
 * but we keep it simple and let the client hooks handle data fetching.
 */
export default function Home() {
  return <Dashboard />;
}