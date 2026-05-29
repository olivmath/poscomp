function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function ImmersiveBar({
  questionNumber,
  totalQuestions,
  secondsLeft,
  timerMode,
  onExit,
  onMap,
}: {
  questionNumber: number
  totalQuestions: number
  secondsLeft: number
  timerMode: 'none' | 'per-question'
  onExit: () => void
  onMap: () => void
}) {
  const isRed = secondsLeft < 60 && timerMode === 'per-question'

  return (
    <div className="immersive-bar" data-testid="immersive-bar">
      <button className="immersive-bar-exit" onClick={onExit} aria-label="Sair do simulado" data-testid="exit-btn">
        <span className="material-symbols-outlined immersive-bar-exit-icon">close</span>
        <span className="immersive-bar-exit-label">Sair</span>
      </button>

      <span className="immersive-bar-progress" data-testid="question-progress">
        Q. {questionNumber}/{totalQuestions}
      </span>

      {timerMode === 'per-question' && (
        <span className={`immersive-bar-timer ${isRed ? 'immersive-bar-timer--red' : ''}`} data-testid="timer">
          <span className="material-symbols-outlined immersive-bar-timer-icon">timer</span>
          {formatTime(secondsLeft)}
        </span>
      )}

      <button className="immersive-bar-map" onClick={onMap} aria-label="Mapa de questões" data-testid="map-btn">
        <span className="material-symbols-outlined">grid_view</span>
        <span className="immersive-bar-map-label">Mapa</span>
      </button>
    </div>
  )
}
