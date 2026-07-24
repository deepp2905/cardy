import { lazy, Suspense, useMemo, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { CardConfig } from "./card/cardConfig";
import { seedConfigs } from "./card/cardConfig";
import { crossfade } from "./lib/motionConfig";
import { parsePerson } from "./lib/personalization";
import { usePrefersReducedMotion } from "./lib/reducedMotion";
import { useHashRoute } from "./playground/useHashRoute";
import { Confirm } from "./steps/Confirm";
import { Customize } from "./steps/Customize";
import { Welcome } from "./steps/Welcome";
import { ActionBar } from "./ui/ActionBar";
import { StepIndicator, type Step } from "./ui/StepIndicator";
import { PlaygroundLink } from "./ui/PlaygroundLink";
import { ThemeToggle } from "./ui/ThemeToggle";

// Playground is dev tooling — lazy so dialkit + its pages stay out of the
// main app chunk.
const Playground = lazy(() => import("./playground/Playground"));
const Explore = lazy(() => import("./explore/Explore"));

const ids = Object.keys(seedConfigs());

export default function App() {
  const route = useHashRoute();
  const isExplore = route.startsWith("/explore");
  const isPlay = route.startsWith("/play");

  if (isExplore || isPlay) {
    // One Suspense boundary for both dev routes, with a real fallback —
    // `null` left the page blank while the chunk loaded, which looked like
    // a broken route when navigating between them.
    return (
      <Suspense fallback={<RouteFallback />}>
        {isExplore ? <Explore /> : <Playground />}
      </Suspense>
    );
  }
  return <MainFlow />;
}

// Holds the viewport open so a route swap doesn't flash an empty document.
function RouteFallback() {
  return <div className="route-fallback" aria-busy="true" />;
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
  // Step 3's wrap sequence is armed by the forward arrow, not by arriving on
  // the step — the finished card gets a beat to itself first (PRD-CONFIRM.md).
  const [wrapStarted, setWrapStarted] = useState(false);
  // The epilogue (post-drop) reuses the persistent ActionBar rather than its
  // own buttons: the primary becomes "Start over" (same slot that carried
  // every step's CTA, so it reads as the same button returning to step 1) and
  // the wallet offer stacks below as a secondary. App owns both bits of state
  // so it can drive that swap from here.
  const [atEpilogue, setAtEpilogue] = useState(false);
  const [walletAdded, setWalletAdded] = useState(false);

  const restart = () => {
    setWrapStarted(false);
    setAtEpilogue(false);
    setWalletAdded(false);
    setStep("welcome");
  };
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
    confirm: atEpilogue
      ? {
          // Post-drop: the primary is now the return to step 1, and the wallet
          // offer stacks beneath it. No back button — the sequence is done.
          next: restart,
          nextLabel: "Start over",
          showArrow: false,
          secondary: walletAdded
            ? undefined
            : { label: "Add the digital card", onClick: () => setWalletAdded(true) },
        }
      : {
          back: () => {
            setWrapStarted(false);
            setStep("customize");
          },
          next: () => setWrapStarted(true),
          nextLabel: "Wrap and post it",
        },
  }[step] as {
    back?: () => void;
    next: () => void;
    nextLabel: string;
    showArrow?: boolean;
    secondary?: { label: string; onClick: () => void };
  };

  return (
    <div className="column">
      <header className="app-header">
        <StepIndicator current={step} />
      </header>
      <div className="corner-controls">
        <PlaygroundLink />
        <ThemeToggle />
      </div>
      <main className="step-stage">
        {/* popLayout, not "wait": the wrap step's hero card shares a layoutId
            with the customize deck's active card, so both must be mounted
            across the swap for Motion to glide the one element between them
            instead of crossfading two. popLayout takes the exiting step out of
            flow so it doesn't shove the entering one while they overlap. */}
        <AnimatePresence mode="popLayout" initial={false}>
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
            <StepShell key="confirm" solid>
              <Confirm
                config={{ ...configs[activeId], note }}
                name={person.cardName}
                firstName={person.first}
                started={wrapStarted}
                walletAdded={walletAdded}
                onEpilogueChange={setAtEpilogue}
              />
            </StepShell>
          )}
        </AnimatePresence>
      </main>
      <div className="action-bar-fixed">
        <ActionBar
          onBack={nav.back}
          onNext={nav.next}
          nextLabel={nav.nextLabel}
          showArrow={nav.showArrow}
          secondary={nav.secondary}
        />
      </div>
    </div>
  );
}

// Shared step chrome: soft rise on enter, softer drop on exit.
//
// `solid` skips the enter opacity/translate: the confirm step's only visible
// content on entry is the hero card, which is a shared-layout element gliding
// in from the customize deck. A wrapper fade/translate would drag that card
// with it and undercut the continuous flight, so confirm enters static and
// lets the layout animation be the whole motion. Exit still animates.
function StepShell({
  children,
  solid = false,
}: {
  children: ReactNode;
  solid?: boolean;
}) {
  const reduce = usePrefersReducedMotion();
  return (
    <motion.div
      className="step-shell"
      initial={solid ? false : { opacity: 0, y: reduce ? 0 : 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: reduce ? 0 : -6 }}
      transition={crossfade}
    >
      {children}
    </motion.div>
  );
}
