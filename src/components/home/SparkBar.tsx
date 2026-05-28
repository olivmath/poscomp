interface SparkBarProps {
  pct: number
  invert?: boolean
}

export function SparkBar({ pct, invert }: SparkBarProps) {
  const colorPct = invert ? 100 - pct : pct
  const cls = colorPct >= 80 ? 'spark-bar-fill--high'
            : colorPct >= 60 ? 'spark-bar-fill--mid'
            : 'spark-bar-fill--low'

  return (
    <div className="spark-bar-bg spark-bar-bg--full">
      <div className={`spark-bar-fill ${cls}`} style={{ width: `${pct}%` }} />
    </div>
  )
}
