import { cx } from "./ui";

// El anillo segmentado del logotipo WeNow 360°, convertido en elemento gráfico del sistema:
// cuatro arcos exteriores (carbón y magenta), dos arcos finos interiores y dos nodos.
// 0° = arriba, en el sentido de las manecillas del reloj.
const C = 200;
const point = (r: number, deg: number) => {
  const a = ((deg - 90) * Math.PI) / 180;
  return [C + r * Math.cos(a), C + r * Math.sin(a)] as const;
};
const arc = (r: number, from: number, to: number) => {
  const [x1, y1] = point(r, from);
  const [x2, y2] = point(r, to);
  return `M${x1.toFixed(2)} ${y1.toFixed(2)}A${r} ${r} 0 ${to - from > 180 ? 1 : 0} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;
};

const OUTER: [number, number, "navy" | "blue"][] = [[2, 103, "navy"], [117, 178, "blue"], [182, 283, "navy"], [297, 358, "blue"]];
const INNER: [number, number][] = [[14, 96], [194, 276]];
const NODES = [117, 297];

export function Ring360({ className, animate = true }: { className?: string; animate?: boolean }) {
  return (
    <svg viewBox="0 0 400 400" fill="none" aria-hidden className={cx("block", className)}>
      <g className={cx(animate && "motion-safe:animate-[orbit_120s_linear_infinite]")} style={{ transformOrigin: "200px 200px" }}>
        {OUTER.map(([a, b, c]) => (
          <path key={a} d={arc(176, a, b)} stroke={c === "navy" ? "var(--navy)" : "var(--blue)"} strokeWidth={16} />
        ))}
        {NODES.map((d) => {
          const [x, y] = point(176, d);
          return (
            <g key={d}>
              <circle cx={x} cy={y} r={13} fill="var(--blue)" />
              <circle cx={x} cy={y} r={5} fill="var(--bg)" />
            </g>
          );
        })}
      </g>
      <g className={cx(animate && "motion-safe:animate-[orbit_90s_linear_infinite_reverse]")} style={{ transformOrigin: "200px 200px" }}>
        {INNER.map(([a, b]) => (
          <path key={a} d={arc(144, a, b)} stroke="var(--navy)" strokeWidth={4} strokeLinecap="round" />
        ))}
      </g>
    </svg>
  );
}
