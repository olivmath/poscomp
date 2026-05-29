interface SparkBarProps {
  pct: number
  invert?: boolean
}

export function SparkBar({ pct, invert }: SparkBarProps) {
  const colorPct = invert ? 100 - pct : pct

  return (
    <div className="spark-bar-bg spark-bar-bg--full">
      <div
        className={`spark-bar-fill ${colorPct < 40 ? 'spark-bar-fill--error' : ''}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}
