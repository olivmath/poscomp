import { useRef, useState, useEffect } from 'react'
import type { Analytics } from '../../hooks/useResults'
import { SlideGeral } from './slides/SlideGeral'
import { SlideDesempenho } from './slides/SlideDesempenho'
import { SlideCalibration } from './slides/SlideCalibration'
import { SlideAnalises } from './slides/SlideAnalises'
import { SlideProgresso } from './slides/SlideProgresso'

const SLIDES = ['Geral', 'Desempenho', 'Calibração', 'Análises', 'Progresso'] as const

interface AnalysisCarouselProps {
  analytics: Analytics | null
  loading: boolean
}

export function AnalysisCarousel({ analytics, loading }: AnalysisCarouselProps) {
  const carouselRef = useRef<HTMLDivElement>(null)
  const [activeSlide, setActiveSlide] = useState(0)

  useEffect(() => {
    const el = carouselRef.current
    if (!el) return
    const onScroll = () => {
      const idx = Math.round(el.scrollLeft / el.clientWidth)
      setActiveSlide(idx)
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [analytics])

  const goToSlide = (idx: number) => {
    const el = carouselRef.current
    if (!el) return
    el.scrollTo({ left: idx * el.clientWidth, behavior: 'smooth' })
    setActiveSlide(idx)
  }

  return (
    <section className="analytics-panel">
      <div className="analytics-panel__tabs" role="tablist" aria-label="Slides de análise">
        {SLIDES.map((label, i) => (
          <button
            key={i}
            role="tab"
            aria-selected={activeSlide === i}
            className={`analytics-tab ${activeSlide === i ? 'analytics-tab--active' : ''}`}
            onClick={() => goToSlide(i)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="analytics-panel__body">
        <div className="analytics-carousel" ref={carouselRef} aria-live="polite">
          {!analytics ? (
            <div className="analises-slide analises-slide--empty">
              <span className="material-symbols-outlined analytics-empty__icon" aria-hidden="true">
                {loading ? 'hourglass_empty' : 'bar_chart'}
              </span>
              <p className="analytics-empty__text">
                {loading
                  ? 'Carregando análises…'
                  : 'Faça seu primeiro simulado para ver suas análises aqui!'
                }
              </p>
            </div>
          ) : (
            <>
              <SlideGeral analytics={analytics} />
              <SlideDesempenho analytics={analytics} />
              <SlideCalibration analytics={analytics} />
              <SlideAnalises analytics={analytics} />
              <SlideProgresso analytics={analytics} />
            </>
          )}
        </div>
      </div>
    </section>
  )
}
