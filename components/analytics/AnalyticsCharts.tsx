"use client";

type BarChartItem = {
  label: string;
  value: number;
};

type BarChartProps = {
  data: BarChartItem[];
  valueFormatter?: (value: number) => string;
  progressClassName?: string;
  maxValue?: number;
};

export function BarChart({
  data,
  valueFormatter = (value) => String(value),
  progressClassName = "analytics-progress",
  maxValue,
}: BarChartProps) {
  const peak = maxValue ?? Math.max(...data.map((item) => item.value), 1);

  return (
    <div className="space-y-4">
      {data.map((item) => (
        <div key={item.label}>
          <div className="mb-1.5 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{item.label}</span>
            <span className="font-medium tabular-nums">{valueFormatter(item.value)}</span>
          </div>
          <progress
            className={progressClassName}
            value={item.value}
            max={peak}
            aria-label={`${item.label}: ${valueFormatter(item.value)}`}
          />
        </div>
      ))}
    </div>
  );
}

type JobCompletionChartProps = {
  data: { label: string; completed: number; total: number; rate: number }[];
};

export function JobCompletionChart({ data }: JobCompletionChartProps) {
  return (
    <div className="space-y-4">
      {data.map((item) => (
        <div key={item.label}>
          <div className="mb-1.5 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{item.label}</span>
            <span className="font-medium tabular-nums">
              {item.rate}% ({item.completed}/{item.total || 0})
            </span>
          </div>
          <progress
            className="analytics-progress analytics-progress-success"
            value={item.rate}
            max={100}
            aria-label={`${item.label}: ${item.rate}% completion`}
          />
        </div>
      ))}
    </div>
  );
}

type CompletionDonutProps = {
  rate: number;
  completed: number;
  total: number;
};

const DONUT_RADIUS = 40;
const DONUT_CIRCUMFERENCE = 2 * Math.PI * DONUT_RADIUS;

export function CompletionDonut({ rate, completed, total }: CompletionDonutProps) {
  const clampedRate = Math.max(0, Math.min(rate, 100));
  const strokeDashoffset =
    DONUT_CIRCUMFERENCE - (clampedRate / 100) * DONUT_CIRCUMFERENCE;

  return (
    <div className="flex items-center gap-6">
      <div className="relative h-28 w-28 shrink-0" role="img" aria-label={`${rate}% job completion rate`}>
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
          <circle
            cx="50"
            cy="50"
            r={DONUT_RADIUS}
            fill="none"
            className="stroke-muted"
            strokeWidth="8"
          />
          <circle
            cx="50"
            cy="50"
            r={DONUT_RADIUS}
            fill="none"
            className="stroke-success"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={DONUT_CIRCUMFERENCE}
            strokeDashoffset={strokeDashoffset}
          />
        </svg>
        <div className="absolute inset-3 flex items-center justify-center rounded-full bg-card text-center">
          <div>
            <p className="text-2xl font-bold tabular-nums">{rate}%</p>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Complete</p>
          </div>
        </div>
      </div>
      <div className="space-y-2 text-sm">
        <p>
          <span className="text-muted-foreground">Completed jobs:</span>{" "}
          <span className="font-medium">{completed}</span>
        </p>
        <p>
          <span className="text-muted-foreground">Total jobs:</span>{" "}
          <span className="font-medium">{total}</span>
        </p>
      </div>
    </div>
  );
}
