"use client";

type BarChartItem = {
  label: string;
  value: number;
};

type BarChartProps = {
  data: BarChartItem[];
  valueFormatter?: (value: number) => string;
  barClassName?: string;
  maxValue?: number;
};

export function BarChart({
  data,
  valueFormatter = (value) => String(value),
  barClassName = "bg-primary",
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
          <div className="h-2.5 overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full rounded-full transition-all ${barClassName}`}
              style={{ width: `${Math.max((item.value / peak) * 100, item.value > 0 ? 4 : 0)}%` }}
            />
          </div>
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
          <div className="h-2.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-success transition-all"
              style={{ width: `${item.rate}%` }}
            />
          </div>
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

export function CompletionDonut({ rate, completed, total }: CompletionDonutProps) {
  return (
    <div className="flex items-center gap-6">
      <div
        className="relative h-28 w-28 shrink-0 rounded-full"
        style={{
          background: `conic-gradient(hsl(var(--success)) ${rate}%, hsl(var(--muted)) 0)`,
        }}
        role="img"
        aria-label={`${rate}% job completion rate`}
      >
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
