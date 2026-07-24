import { lazy, Suspense, useMemo, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { CardConfig } from "./card/cardConfig";
import { seedConfigs } from "./card/cardConfig";
import { Card } from "./card/Card";
import { crossfade } from "./lib/motionConfig";
import { parsePerson } from "./lib/personalization";
import { usePrefersReducedMotion } from "./lib/reducedMotion";
import { useHashRoute } from "./playground/useHashRoute";
import { Customize } from "./steps/Customize";
import { Welcome } from "./steps/Welcome";
import { ActionBar } from "./ui/ActionBar";
import { StepIndicator, type Step } from "./ui/StepIndicator";
import { ThemeToggle } from "./ui/ThemeToggle";

// Playground is dev tooling — lazy so dialkit + its pages stay out of the
// main app chunk.
const Playground = lazy(() => import("./playground/Playground"));

const ids = Object.keys(seedConfigs());

export default function App() {
  const route = useHashRoute();
  if (route.startsWith("/play")) {
    return (
      <Suspense fallback={null}>
        <Playground />
      </Suspense>
    );
  }
  return <MainFlow />;
}

function MainFlow() {
  const [step, setStep] = useState<Step>("welcome");
  const [configs, setConfigs] = useState<Record<string, CardConfig>>(
    seedConfigs,
  );
  // Start on the first card (cobalt); the strip's padding lets the first and
  // last cards both reach dead centre, so the deck reads start-to-end.
  const [activeId, setActiveId] = useState<string>(ids[0]);
  // The engraving is a property of the order, not of a colourway — it stays
  // put as you browse. Only the slider values are per-card.
  const [note, setNote] = useState("");
  // `/first-last` read once — the app never mutates the URL, so this holds
  // for the whole journey (PLAN.md Phase P).
  const person = useMemo(() => parsePerson(), []);

  const patchConfig = (id: string, patch: Partial<CardConfig>) => {
    setConfigs((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  };

  // Navigation is constant chrome — the action bar lives outside the step
  // transitions so the CTAs stay fixed across the journey.
  const nav = {
    welcome: {
      next: () => setStep("customize"),
      nextLabel: "Start designing",
    },
    customize: {
      back: () => setStep("welcome"),
      next: () => setStep("confirm"),
      nextLabel: "Order this card",
    },
    confirm: {
      back: () => setStep("customize"),
      next: () => setStep("welcome"),
      nextLabel: "Start over",
    },
  }[step] as { back?: () => void; next: () => void; nextLabel: string };

  return (
    <div className="column">
      <header className="app-header">
        <StepIndicator current={step} />
      </header>
      <ThemeToggle />
      <main className="step-stage">
        <AnimatePresence mode="wait" initial={false}>
          {step === "welcome" && (
            <StepShell key="welcome">
              <Welcome firstName={person.first} />
            </StepShell>
          )}
          {step === "customize" && (
            <StepShell key="customize">
              <Customize
                configs={configs}
                ids={ids}
                activeId={activeId}
                cardName={person.cardName}
                note={note}
                onActiveChange={setActiveId}
                onNoteChange={setNote}
                onPatch={patchConfig}
              />
            </StepShell>
          )}
          {step === "confirm" && (
            <StepShell key="confirm">
              <div className="step-body confirm">
                <Card
                  config={{ ...configs[activeId], note }}
                  name={person.cardName}
                />
                <p className="confirm-note">
                  Confirm step (paper fold, envelope, mailbox) arrives in
                  Phase E.
                </p>
              </div>
            </StepShell>
          )}
        </AnimatePresence>
      </main>
      <div className="action-bar-fixed">
        <ActionBar
          onBack={nav.back}
          onNext={nav.next}
          nextLabel={nav.nextLabel}
        />
      </div>
    </div>
  );
}

// Shared step chrome: soft rise on enter, softer drop on exit.
function StepShell({ children }: { children: ReactNode }) {
  const reduce = usePrefersReducedMotion();
  return (
    <motion.div
      className="step-shell"
      initial={{ opacity: 0, y: reduce ? 0 : 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: reduce ? 0 : -6 }}
      transition={crossfade}
    >
      {children}
    </motion.div>
  );
}
