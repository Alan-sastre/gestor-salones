const squares = Array.from({ length: 30 }, (_, index) => ({
  x: ((index * 7) % 25) * 40,
  y: ((index * 13) % 18) * 40,
  delay: `${(index % 10) * 0.35}s`,
}));

export default function AnimatedGridPattern() {
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 -top-[30%] -z-10 h-[200%] w-full skew-y-12 text-sky-500/20"
      viewBox="0 0 1000 720"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
    >
      <defs>
        <pattern id="agenda-grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" stroke="currentColor" strokeWidth="0.7" />
        </pattern>
        <radialGradient id="agenda-grid-mask">
          <stop offset="0%" stopColor="white" stopOpacity="1" />
          <stop offset="72%" stopColor="white" stopOpacity="0.8" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </radialGradient>
        <mask id="agenda-grid-fade">
          <rect width="100%" height="100%" fill="url(#agenda-grid-mask)" />
        </mask>
      </defs>
      <rect width="100%" height="100%" fill="url(#agenda-grid)" mask="url(#agenda-grid-fade)" />
      <g mask="url(#agenda-grid-fade)" fill="currentColor">
        {squares.map((square, index) => (
          <rect
            key={index}
            x={square.x}
            y={square.y}
            width="40"
            height="40"
            rx="4"
            className="grid-square"
            style={{ animationDelay: square.delay }}
          />
        ))}
      </g>
    </svg>
  );
}
