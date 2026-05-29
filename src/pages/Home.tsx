import '@material/web/button/filled-button.js'
import { useNavigate } from 'react-router-dom'
import { useResults } from '../hooks/useResults'
import { WeekHeader } from '../components/home/WeekHeader'
import { AnalysisCarousel } from '../components/home/AnalysisCarousel'

export function Home() {
  const navigate = useNavigate()
  const { analytics, loading: analyticsLoading } = useResults()

  const activeDays = analytics?.activeDaysThisWeek ?? []
  const streak = analytics?.streak ?? 0

  return (
    <main className="home-page">
      <section className="home-page__hero">
        <WeekHeader activeDays={activeDays} streak={streak} />
      </section>

      <section className="home-page__content">
        <AnalysisCarousel analytics={analytics} loading={analyticsLoading} />
      </section>

      <footer className="home-page__cta">
        <md-filled-button onClick={() => navigate('/simulado')}>
          Iniciar Simulado
        </md-filled-button>
      </footer>
    </main>
  )
}
