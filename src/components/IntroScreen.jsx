import { useEffect, useRef, useState } from 'react'

const VIDEO_SRC = '/logomotion-720p.mp4'
const INTRO_DURATION = 4200
const MAX_VIDEO_WAIT = 6500

export default function IntroScreen({ onComplete, onFinish, onDone }) {
  const [videoReady, setVideoReady] = useState(false)
  const [videoFailed, setVideoFailed] = useState(false)
  const [progress, setProgress] = useState(0)

  const completedRef = useRef(false)
  const startedRef = useRef(false)
  const videoRef = useRef(null)

  const finishIntro = () => {
    if (completedRef.current) return

    completedRef.current = true

    const finish = onComplete || onFinish || onDone
    if (finish) finish()
  }

  const startIntro = () => {
    if (startedRef.current) return

    startedRef.current = true
    setVideoReady(true)

    const video = videoRef.current
    if (video) {
      const playPromise = video.play()
      if (playPromise?.catch) {
        playPromise.catch(() => { })
      }
    }
  }

  useEffect(() => {
    const fallbackTimer = window.setTimeout(() => {
      setVideoFailed(true)
      startIntro()
    }, MAX_VIDEO_WAIT)

    return () => window.clearTimeout(fallbackTimer)
  }, [])

  useEffect(() => {
    if (!videoReady) return

    let animationFrame
    const startTime = performance.now()

    const animate = (now) => {
      const elapsed = now - startTime
      const nextProgress = Math.min((elapsed / INTRO_DURATION) * 100, 100)

      setProgress(nextProgress)

      if (nextProgress >= 100) {
        window.setTimeout(finishIntro, 220)
        return
      }

      animationFrame = requestAnimationFrame(animate)
    }

    animationFrame = requestAnimationFrame(animate)

    return () => cancelAnimationFrame(animationFrame)
  }, [videoReady])

  return (
    <main className="fixed inset-0 z-[9999] h-[100svh] w-screen overflow-hidden bg-[var(--frint-bg)] text-[var(--frint-text)]">
      <div className="pointer-events-none absolute left-[-120px] top-[-120px] h-[300px] w-[300px] rounded-full bg-[var(--frint-accent)]/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-150px] right-[-140px] h-[360px] w-[360px] rounded-full bg-[#0060f8]/10 blur-3xl" />

      <section className="relative flex h-full w-full flex-col">
        <div className="flex h-[80svh] w-full items-center justify-center px-2 pt-2 sm:px-6 sm:pt-4">
          {!videoReady && (
            <div className="absolute inset-x-0 top-0 flex h-[80svh] items-center justify-center">
              <img
                src="/logo.svg"
                alt="Frint"
                className="h-16 w-auto object-contain sm:h-20"
              />
            </div>
          )}

          <video
            ref={videoRef}
            src={VIDEO_SRC}
            muted
            playsInline
            autoPlay
            preload="auto"
            onLoadedData={startIntro}
            onCanPlay={startIntro}
            onCanPlayThrough={startIntro}
            onError={() => {
              setVideoFailed(true)
              startIntro()
            }}
            className={`h-full w-full object-contain transition-opacity duration-500 ${videoReady ? 'opacity-100' : 'opacity-0'
              }`}
          />
        </div>

        <div className="flex h-[20svh] w-full flex-col justify-start px-8 pt-1 sm:px-12 lg:mx-auto lg:max-w-xl">
          <div className="mt-1 flex items-center justify-between text-sm font-semibold sm:text-base">
            <span className="frint-muted">
              {videoReady
                ? videoFailed
                  ? 'Preparing workspace'
                  : 'Loading workspace'
                : 'Loading video'}
            </span>
            <span className="frint-muted">{Math.round(progress)}%</span>
          </div>

          <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--frint-soft-card)] sm:h-2.5">
            <div
              className="h-full rounded-full bg-[var(--frint-accent)] transition-[width] duration-150"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </section>
    </main>
  )
}
