import { useEffect, useState } from "react";

// Minimal hash router. Keeps the playground out of the main flow and out
// of the shipped bundle (Playground is lazy-loaded on these routes only).
const read = () => window.location.hash.replace(/^#/, "") || "/";

export function useHashRoute(): string {
  const [route, setRoute] = useState(read);
  useEffect(() => {
    const on = () => setRoute(read());
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  return route;
}
