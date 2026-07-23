import { useState } from "react";
import type { CardConfig } from "./card/cardConfig";
import { seedConfigs } from "./card/cardConfig";
import { Card } from "./card/Card";
import { Customize } from "./steps/Customize";
import { Welcome } from "./steps/Welcome";
import { Button } from "./ui/Button";
import { StepIndicator, type Step } from "./ui/StepIndicator";

const ids = Object.keys(seedConfigs());

export default function App() {
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
      {step === "welcome" && <Welcome onStart={() => setStep("customize")} />}
      {step === "customize" && (
        <Customize
          configs={configs}
          ids={ids}
          activeId={activeId}
          onActiveChange={setActiveId}
          onPatch={patchConfig}
          onOrder={() => setStep("confirm")}
        />
      )}
      {step === "confirm" && (
        <div className="confirm-placeholder">
          <Card config={configs[activeId]} />
          <p>Confirm step (paper fold, envelope, mailbox) arrives in Phase E.</p>
          <Button variant="secondary" onClick={() => setStep("customize")}>
            Back to designing
          </Button>
        </div>
      )}
    </div>
  );
}
