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
    <div className="home-container home-container--dashboard">
      <WeekHeader activeDays={activeDays} streak={streak} />
      <AnalysisCarousel analytics={analytics} loading={analyticsLoading} />
      <div className="home-cta">
        <md-filled-button onClick={() => navigate('/simulado')}>
          Iniciar Simulado
        </md-filled-button>
      </div>
    </div>
  )
}
