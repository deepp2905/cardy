import {
  lazy,
  Suspense,
  useCallback,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AnimatePresence, motion, useMotionValue } from "motion/react";
import { HeroCard, type HeroPhase } from "./card/HeroCard";
import type { CardConfig } from "./card/cardConfig";
import { seedConfigs } from "./card/cardConfig";
import { crossfade } from "./lib/motionConfig";
import { parsePerson } from "./lib/personalization";
import { usePrefersReducedMotion } from "./lib/reducedMotion";
import { DevNav } from "./playground/DevNav";
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
    // DevNav + corner controls are mounted HERE, above the Explore/Playground
    // split, so they persist across the swap between /explore and /play/*.
    // That keeps the header Segmented's layout pill animating even when the
    // route menu crosses that boundary (previously each page mounted its own
    // DevNav, so the pill reset instead of gliding). Only the page body is
    // lazy — DevNav is dev-only and tiny.
    return (
      <div className="dev-shell">
        <div className="corner-controls">
          <ThemeToggle />
        </div>
        <DevNav />
        <Suspense fallback={<RouteFallback />}>
          {isExplore ? <Explore /> : <Playground />}
        </Suspense>
      </div>
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
  // Start on the third card; the strip's padding lets the first and
  // last cards both reach dead centre, so the deck reads start-to-end.
  const [activeId, setActiveId] = useState<string>(ids[2] ?? ids[0]);
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

  // --- Persistent hero card ------------------------------------------------
  // One card node lives here, above the step AnimatePresence, and never
  // unmounts. The steps only report WHERE it should sit (via HeroSlot spacers)
  // and, within a step, how visible it is. This is what kills the pop: there is
  // no second card and no layout hand-off, so nothing is ever measured or
  // remounted across a step change.
  const [heroTarget, setHeroTarget] = useState<{ x: number; y: number } | null>(
    null,
  );
  // deckOpacity: carousel drives it (1 mid-drag, 0 settled) so the hero yields
  // to the live deck card while dragging. restOpacity: the wrap sequence drives
  // it so the hero hands off to the in-sheet card. Both are MotionValues so the
  // per-frame writes never render React.
  // deckOpacity starts at 1: the deck is settled on arrival, so the hero owns
  // the centre slot until the first drag drops it.
  const deckOpacity = useMotionValue(1);
  const restOpacity = useMotionValue(1);
  // Stable callback: HeroSlot depends on it in an effect, so a fresh identity
  // each render would re-run the measurement effect every render. Only accept a
  // report from the slot that owns the CURRENT hero phase — a slot that is
  // mid-unmount during a step swap (mode="wait" exits the old step as the new
  // one enters) must not overwrite the incoming step's target. heroPhaseRef
  // holds the live phase so this callback stays identity-stable.
  const heroPhaseRef = useRef<HeroPhase>("hidden");
  const onHeroSlot = useCallback(
    (owner: "deck" | "rest", p: { x: number; y: number }) => {
      if (owner === heroPhaseRef.current) setHeroTarget(p);
    },
    [],
  );

  const restart = () => {
    setWrapStarted(false);
    setAtEpilogue(false);
    setWalletAdded(false);
    setStep("welcome");
  };
  // `/first-last` read once — the app never mutates the URL, so this holds
  // for the whole journey (PLAN.md Phase P).
  const person = useMemo(() => parsePerson(), []);

  // Which position/visibility the hero holds. Welcome hides it; customize is the
  // deck slot; confirm is the rest slot. On the epilogue the card is gone (it's
  // been posted), so hide it there too.
  const heroPhase: HeroPhase =
    step === "customize"
      ? "deck"
      : step === "confirm" && !atEpilogue
        ? "rest"
        : "hidden";
  // Mirror the live phase for onHeroSlot's owner check (see above). Written
  // during render so it's current before any child effect fires this commit.
  heroPhaseRef.current = heroPhase;

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
        {/* mode="sync", not "wait": the entering step mounts immediately, so its
            HeroSlot measures the new target on the SAME beat the outgoing step's
            content starts fading. That makes the hero glide to centre WHILE the
            surrounding cards fade, rather than waiting for the old step to finish
            leaving first (which read as fade-then-move). The card itself is a
            persistent sibling, so overlapping panels never fight over it. */}
        <AnimatePresence mode="sync" initial={false}>
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
                deckOpacity={deckOpacity}
                onActiveChange={setActiveId}
                onNoteChange={setNote}
                onPatch={patchConfig}
                onHeroSlot={onHeroSlot}
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
                restOpacity={restOpacity}
                onEpilogueChange={setAtEpilogue}
                onHeroSlot={onHeroSlot}
              />
            </StepShell>
          )}
        </AnimatePresence>

        {/* One card, all three steps. Positioned by the active step's slot,
            visibility by the step + the two hand-off MotionValues. */}
        <HeroCard
          config={{ ...configs[activeId], note }}
          name={person.cardName}
          phase={heroPhase}
          target={heroTarget}
          deckOpacity={deckOpacity}
          restOpacity={restOpacity}
        />
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
