import { lazy, Suspense, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { CardConfig } from "./card/cardConfig";
import { seedConfigs } from "./card/cardConfig";
import { Card } from "./card/Card";
import { crossfade } from "./lib/motionConfig";
import { usePrefersReducedMotion } from "./lib/reducedMotion";
import { useHashRoute } from "./playground/useHashRoute";
import { Customize } from "./steps/Customize";
import { Welcome } from "./steps/Welcome";
import { Button } from "./ui/Button";
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
  const [activeId, setActiveId] = useState<string>(ids[2]);

  const patchConfig = (id: string, patch: Partial<CardConfig>) => {
    setConfigs((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  };

  return (
    <div className="column">
      <header className="app-header">
        <StepIndicator current={step} />
      </header>
      <ThemeToggle />
      <AnimatePresence mode="wait" initial={false}>
        {step === "welcome" && (
          <StepShell key="welcome">
            <Welcome onStart={() => setStep("customize")} />
          </StepShell>
        )}
        {step === "customize" && (
          <StepShell key="customize">
            <Customize
              configs={configs}
              ids={ids}
              activeId={activeId}
              onActiveChange={setActiveId}
              onPatch={patchConfig}
              onOrder={() => setStep("confirm")}
            />
          </StepShell>
        )}
        {step === "confirm" && (
          <StepShell key="confirm">
            <div className="confirm-placeholder">
              <Card config={configs[activeId]} />
              <p>
                Confirm step (paper fold, envelope, mailbox) arrives in Phase E.
              </p>
              <Button variant="secondary" onClick={() => setStep("customize")}>
                Back to designing
              </Button>
            </div>
          </StepShell>
        )}
      </AnimatePresence>
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
