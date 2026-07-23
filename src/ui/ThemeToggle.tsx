import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { iconPop, snappy } from "../lib/motionConfig";
import "./ui.css";

type Theme = "light" | "dark";

function initialTheme(): Theme {
  const t = document.documentElement.dataset.theme;
  return t === "dark" ? "dark" : "light"; // stamped pre-paint in index.html
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(initialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("cardy-theme", theme);
  }, [theme]);

  const next: Theme = theme === "light" ? "dark" : "light";

  return (
    <motion.button
      className="theme-toggle"
      aria-label={`Switch to ${next} mode`}
      onClick={() => setTheme(next)}
      whileTap={{ scale: 0.96 }}
      transition={snappy}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={theme}
          className="theme-toggle-icon"
          initial={{ opacity: 0, scale: 0.25, filter: "blur(4px)" }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          exit={{ opacity: 0, scale: 0.25, filter: "blur(4px)" }}
          transition={iconPop}
        >
          {theme === "light" ? <SunIcon /> : <MoonIcon />}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  );
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      >
        <circle cx="12" cy="12" r="4.2" />
        <path d="M12 2.8v2.2M12 19v2.2M2.8 12h2.2M19 12h2.2M5.5 5.5l1.6 1.6M16.9 16.9l1.6 1.6M18.5 5.5l-1.6 1.6M7.1 16.9l-1.6 1.6" />
      </g>
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M20.2 14.2A8.2 8.2 0 0 1 9.8 3.8a8.2 8.2 0 1 0 10.4 10.4Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}
