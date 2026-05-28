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
    <section className="home-analises">
      <div className="home-analises-dots-row" role="tablist" aria-label="Slides de análise">
        {SLIDES.map((label, i) => (
          <button
            key={i}
            role="tab"
            aria-selected={activeSlide === i}
            aria-label={label}
            className={`analises-dot ${activeSlide === i ? 'analises-dot--active' : ''}`}
            onClick={() => goToSlide(i)}
          />
        ))}
      </div>

      <div className="analises-carousel-wrap">
        <div className="analises-carousel" ref={carouselRef} aria-live="polite">
          {!analytics ? (
            <div className="analises-slide analises-slide--empty">
              {loading
                ? <p>Carregando análises...</p>
                : <p>Faça seu primeiro simulado para ver suas análises aqui!</p>
              }
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
