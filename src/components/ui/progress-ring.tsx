interface ProgressRingProps {
  value: number; // between 0-100
  label?: string;
  sublabel?: string;
}

export default function ProgressRing({ value, label, sublabel }: ProgressRingProps) {
  const radius = 42;
  const stroke = 8;
  const normalizedRadius = radius - stroke * 0.5;
  const circumference = normalizedRadius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="flex items-center gap-4">
      <div className="relative">
        <svg height={radius * 2} width={radius * 2}>
          <circle
            stroke="#e5e7eb"
            fill="transparent"
            strokeWidth={stroke}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
            transform={`rotate(-90 ${radius} ${radius})`}
          />
          <circle
            stroke="url(#grad)"
            fill="transparent"
            strokeLinecap="round"
            strokeWidth={stroke}
            strokeDasharray={`${circumference} ${circumference}`}
            style={{ strokeDashoffset: offset, transition: "stroke-dashoffset 0.5s ease" }}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
            transform={`rotate(-90 ${radius} ${radius})`}
          />
          <defs>
            <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 grid place-items-center">
          <span className="text-xl font-semibold text-slate-900 dark:text-slate-50">{value}%</span>
        </div>
      </div>
      <div>
        {label && <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{label}</p>}
        {sublabel && <p className="text-xs text-slate-500 dark:text-slate-300">{sublabel}</p>}
      </div>
    </div>
  );
}
