import { useResults } from '../hooks/useResults'
import { WeekHeader } from '../components/home/WeekHeader'
import { AnalysisCarousel } from '../components/home/AnalysisCarousel'

export function Home() {
  const { analytics, loading: analyticsLoading } = useResults()

  const activeDays = analytics?.activeDaysThisWeek ?? []
  const streak = analytics?.streak ?? 0

  return (
    <div className="home-container home-container--dashboard">
      <WeekHeader activeDays={activeDays} streak={streak} />
      <AnalysisCarousel analytics={analytics} loading={analyticsLoading} />
    </div>
  )
}
