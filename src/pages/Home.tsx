import '@material/web/button/filled-button.js'
import '@material/web/button/outlined-button.js'

import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useResults } from '../hooks/useResults'
import { useSimulado } from '../hooks/useSimulado'
import { useImmersiveMode } from '../contexts/ImmersiveModeContext'
import { WeekHeader } from '../components/home/WeekHeader'
import { AnalysisCarousel } from '../components/home/AnalysisCarousel'
import { RelatorioFinal } from '../components/RelatorioFinal'
import { ConfigScreen } from '../components/simulado/ConfigScreen'
import { RunningScreen } from '../components/simulado/RunningScreen'

export function Home() {
  const navigate = useNavigate()
  const { analytics, loading: analyticsLoading } = useResults()
  const { setImmersive } = useImmersiveMode()
  const {
    state,
    questions,
    currentIndex,
    selectedOption,
    secondsLeft,
    loading,
    error,
    result,
    config,
    questionStatuses,
    goToConfig,
    start,
    select,
    next,
    skip,
    goToQuestion,
    retry,
  } = useSimulado()

  const activeDays = analytics?.activeDaysThisWeek ?? []
  const streak = analytics?.streak ?? 0

  useEffect(() => {
    setImmersive(state === 'running')
    return () => setImmersive(false)
  }, [state, setImmersive])

  if (state === 'config') {
    return (
      <ConfigScreen
        initialConfig={config}
        onStart={start}
        onBack={retry}
        loading={loading}
      />
    )
  }

  if (state === 'running' && questions.length > 0) {
    return (
      <RunningScreen
        question={questions[currentIndex]}
        questionNumber={currentIndex + 1}
        totalQuestions={questions.length}
        selectedOption={selectedOption}
        secondsLeft={secondsLeft}
        timerMode={config.timerMode}
        questionStatuses={questionStatuses}
        currentIndex={currentIndex}
        onSelect={select}
        onNext={next}
        onSkip={skip}
        onGoToQuestion={goToQuestion}
        onQuit={retry}
      />
    )
  }

  if (state === 'finished' && result) {
    return (
      <RelatorioFinal
        result={result}
        onRetry={retry}
        onHistory={() => navigate('/historico')}
      />
    )
  }

  // idle — dashboard
  return (
    <main className="home-page">
      <section className="home-page__hero">
        <WeekHeader activeDays={activeDays} streak={streak} />
      </section>

      <section className="home-page__content">
        <AnalysisCarousel analytics={analytics} loading={analyticsLoading} />
      </section>

      {error && <p className="simulado-error" role="alert">{error}</p>}

      <footer className="home-page__cta">
        <md-filled-button onClick={() => start(config)} disabled={loading || undefined}>
          {loading ? 'Carregando...' : 'Começar Simulado'}
        </md-filled-button>
        <md-outlined-button onClick={goToConfig} disabled={loading || undefined}>
          Simulado customizado
        </md-outlined-button>
      </footer>
    </main>
  )
}

