import '@material/web/button/filled-button.js'

import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useResults } from '../hooks/useResults'
import { useSimulado } from '../hooks/useSimulado'
import { useAnnouncements } from '../hooks/useAnnouncements'
import { useImmersiveMode } from '../contexts/ImmersiveModeContext'
import { WeekHeader } from '../components/home/WeekHeader'
import { AnalysisCarousel } from '../components/home/AnalysisCarousel'
import { AnnouncementBanner } from '../components/AnnouncementBanner'
import { RelatorioFinal } from '../components/RelatorioFinal'
import { ConfigScreen } from '../components/simulado/ConfigScreen'
import { RunningScreen } from '../components/simulado/RunningScreen'

export function Home() {
  const navigate = useNavigate()
  const location = useLocation()
  const { analytics, loading: analyticsLoading } = useResults()
  const { setImmersive } = useImmersiveMode()
  const announcements = useAnnouncements()
  const {
    state,
    questions,
    currentIndex,
    selectedOption,
    secondsLeft,
    loading,
    loadingFinish,
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
    if (location.state?.action === 'openSimuladoConfig') {
      goToConfig()
      // Limpa o state para não reabrir se atualizar a página
      navigate('/', { replace: true, state: {} })
    }
  }, [location.state, goToConfig, navigate])

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
        loadingFinish={loadingFinish}
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
        onReview={() => navigate('/revisao')}
        onHistory={retry}
      />
    )
  }

  // idle — dashboard
  return (
    <main className="page-shell">
      <section className="section-stack">
        <AnnouncementBanner announcements={announcements} />
        <WeekHeader activeDays={activeDays} streak={streak} />
        <AnalysisCarousel analytics={analytics} loading={analyticsLoading} />
      </section>

      {error && <p className="simulado-error" role="alert">{error}</p>}

      <footer className="home-page__cta">
        <md-filled-button onClick={goToConfig} disabled={loading || undefined} className="btn-tonal">
          Simulado customizado
        </md-filled-button>
        <md-filled-button onClick={() => start(config)} disabled={loading || undefined}>
          {loading ? 'Carregando...' : 'Começar Simulado'}
        </md-filled-button>
      </footer>
    </main>
  )
}

