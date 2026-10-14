import { type ReactNode, useState, useEffect } from "react";
import { ArrowUpRight, Info, X, ArrowRight, FlaskConical } from "lucide-react";
import { useLab } from "./context";
export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: string;
}) {
  return <span className={`badge ${tone}`}>{children}</span>;
}
export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <section className={`card ${className}`}>{children}</section>;
}
export function SectionTitle({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="section-title">
      <div>
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
export function Metric({
  label,
  value,
  unit,
  detail,
  accent = false,
}: {
  label: string;
  value: ReactNode;
  unit?: string;
  detail?: ReactNode;
  accent?: boolean;
}) {
  return (
    <Card className={"metric " + (accent ? "accent" : "")}>
      <div className="metric-label">
        {label}
        <ArrowUpRight size={15} />
      </div>
      <div className="metric-value">
        {value}
        <span>{unit}</span>
      </div>
      <div className="metric-detail">{detail || "Recorded observations"}</div>
    </Card>
  );
}
export function Empty({
  title = "No observations yet",
  text = "Log a workout to begin measuring your performance.",
  action = true,
}: {
  title?: string;
  text?: string;
  action?: boolean;
}) {
  const { navigate } = useLab();
  return (
    <div className="empty">
      <FlaskConical size={28} />
      <h3>{title}</h3>
      <p>{text}</p>
      {action && (
        <button className="button small" onClick={() => navigate("log")}>
          Log a workout <ArrowRight size={15} />
        </button>
      )}
    </div>
  );
}
export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}
export function Help({ topic = "density" }: { topic?: string }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const before = document.activeElement as HTMLElement | null;
    const dialog = document.querySelector('[role="dialog"]') as HTMLElement;
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
      if (event.key === "Tab") {
        const elements = Array.from(
          dialog.querySelectorAll<HTMLElement>(
            'button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex="0"]',
          ),
        );
        const first = elements[0],
          last = elements.at(-1);
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("keydown", key);
      before?.focus();
    };
  }, [open]);
  return (
    <>
      <button className="button ghost small" onClick={() => setOpen(true)}>
        <Info size={15} /> Methodology
      </button>
      {open && (
        <div className="modal-backdrop" onClick={() => setOpen(false)}>
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-label="Scientific methodology"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="section-title">
              <h2>Behind the numbers</h2>
              <button
                autoFocus
                className="icon-button"
                aria-label="Close methodology"
                onClick={() => setOpen(false)}
              >
                <X />
              </button>
            </div>
            <Methodology topic={topic} />
            <button className="button" onClick={() => setOpen(false)}>
              Done
            </button>
          </section>
        </div>
      )}
    </>
  );
}
const methodology: Record<
  string,
  {
    formula: string;
    inputs: string;
    unit: string;
    assumption: string;
    meaning: string;
    limitations: string;
    source?: ReactNode;
  }
> = {
  density: {
    formula:
      "Volume = load × repetitions; volume density = volume ÷ elapsed minutes; repetition density = repetitions ÷ elapsed minutes.",
    inputs:
      "Constant external mass and total reps, or a load-by-repetition breakdown; actual elapsed window including rest.",
    unit: "kg·rep (or lb·rep), kg·rep/min, reps/min.",
    assumption:
      "The same variation, loading convention, repetition standard and time window are used for direct comparisons.",
    meaning: "Recorded task-specific capacity under the declared protocol.",
    limitations:
      "Not mechanical work, hypertrophy, or direct proof of a higher 1RM. Set-level pacing requires timestamps.",
  },
  strength: {
    formula: "Epley: L(1 + r/30). Brzycki: 36L/(37 − r).",
    inputs:
      "One completed qualifying set of 2–10 reps; RIR ≤1 or RPE ≥9; compatible external load.",
    unit: "kg or lb, estimated.",
    assumption:
      "The set is close to maximal effort and the chosen prediction equation is appropriate.",
    meaning: "A model-based estimate, separate from a declared tested maximum.",
    limitations:
      "Exercise, athlete, effort and repetition count affect accuracy. Density totals never qualify. No fabricated confidence interval.",
    source: (
      <>
        <a
          href="https://doi.org/10.1080/07303084.1993.10606684"
          target="_blank"
          rel="noreferrer"
        >
          Brzycki (1993)
        </a>{" "}
        ·{" "}
        <a
          href="https://doi.org/10.1519/00124278-199711000-00001"
          target="_blank"
          rel="noreferrer"
        >
          LeSuer et al. (1997)
        </a>
        . Bibliographic metadata verified; full-text appraisal pending. Primary
        Epley source verification pending.
      </>
    ),
  },
  biomechanics: {
    formula:
      "Fg = mg; W = mgΔh; P = W/t; v = Δs/Δt; a = Δv/Δt; Fapplied = m(g + a).",
    inputs:
      "External mass; measured or explicitly assumed vertical displacement; matching movement time; velocity endpoints for acceleration.",
    unit: "N, J, W, m/s, m/s².",
    assumption:
      "A simplified vertical single-object model with g = 9.80665 m/s².",
    meaning:
      "External gravitational force and model-based positive work/mean power.",
    limitations:
      "Not muscle force, internal work, metabolic energy, peak power, or instantaneous velocity. Machine/cable/horizontal calculations are omitted without a suitable model.",
  },
  research: {
    formula:
      "OLS uses elapsed days; rolling mean uses 5 observations; sample SD uses n−1; CV = SD/mean ×100; Pearson uses paired observations.",
    inputs:
      "Matched recorded observations with dates; paired same-date wellness inputs for correlation.",
    unit: "Outcome units, outcome units/week, dimensionless correlation.",
    assumption:
      "Descriptive exploratory analysis. n≥4 and ≥14 days for displayed trend interpretations; n≥8 for correlation.",
    meaning: "Observed variation and relationships, with sample size and span.",
    limitations:
      "Repeated training observations are dependent; confidence intervals disabled. Correlation cannot establish causation. Thresholds are product policies.",
  },
  recovery: {
    formula: "Session-RPE load = session RPE × elapsed minutes.",
    inputs: "Session-level RPE on a 0–10 scale and elapsed duration.",
    unit: "Arbitrary units (AU).",
    assumption:
      "Self-reported effort provides a subjective training-load descriptor.",
    meaning: "Descriptive workload and subjective wellness trends.",
    limitations:
      "Not a recovery diagnosis, overtraining diagnosis or injury-prediction score.",
    source: (
      <>
        <a
          href="https://doi.org/10.1519/00124278-200102000-00019"
          target="_blank"
          rel="noreferrer"
        >
          Foster et al. (2001)
        </a>
        . Bibliographic metadata verified; full-text appraisal pending.
      </>
    ),
  },
  conditioning: {
    formula:
      "Speed = distance/time; pace = time/distance; work/rest = work time/rest time.",
    inputs:
      "Activity, distance, elapsed or moving duration, optional interval and HR observations.",
    unit: "m/s, km/h, min/km, seconds, bpm.",
    assumption:
      "Compare the same activity, distance/protocol and timing convention.",
    meaning: "Activity-specific recorded performance.",
    limitations:
      "Terrain, equipment and conditions affect comparability. No universal workload score across activities.",
  },
};
export function Methodology({ topic }: { topic: string }) {
  const m = methodology[topic] || methodology.density;
  return (
    <div className="methodology">
      <Badge tone="blue">Calculation version 1</Badge>
      {Object.entries({
        Definition: m.meaning,
        Formula: m.formula,
        "Required inputs": m.inputs,
        Units: m.unit,
        Assumptions: m.assumption,
        Limitations: m.limitations,
      }).map(([k, v]) => (
        <div key={k}>
          <h3>{k}</h3>
          <p>{v}</p>
        </div>
      ))}
      {m.source && (
        <div>
          <h3>Supporting sources</h3>
          <p>{m.source}</p>
        </div>
      )}
      <p className="muted">
        Recorded observations, model-based estimates, and possible explanations
        are labeled separately. Unknown values remain missing.
      </p>
    </div>
  );
}
