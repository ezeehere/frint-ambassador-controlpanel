import { useEffect, useRef, useState } from 'react'

const VIDEO_SRC = '/logomotion-720p.mp4'
const MIN_PLAY_TIME = 3600
const MAX_VIDEO_WAIT = 6500

export default function IntroScreen({ onComplete, onFinish, onDone }) {
  const [videoReady, setVideoReady] = useState(false)
  const [progress, setProgress] = useState(0)
  const [videoFailed, setVideoFailed] = useState(false)

  const completedRef = useRef(false)
  const startedRef = useRef(false)

  const finishIntro = () => {
    if (completedRef.current) return

    completedRef.current = true

    const finish = onComplete || onFinish || onDone
    if (finish) finish()
  }

  const markVideoReady = () => {
    if (startedRef.current) return

    startedRef.current = true
    setVideoReady(true)
  }

  useEffect(() => {
    const fallbackTimer = window.setTimeout(() => {
      setVideoFailed(true)
      markVideoReady()
    }, MAX_VIDEO_WAIT)

    return () => window.clearTimeout(fallbackTimer)
  }, [])

  useEffect(() => {
    if (!videoReady) return

    let animationFrame
    const startTime = performance.now()

    const animate = (now) => {
      const elapsed = now - startTime
      const nextProgress = Math.min((elapsed / MIN_PLAY_TIME) * 100, 100)

      setProgress(nextProgress)

      if (nextProgress >= 100) {
        window.setTimeout(finishIntro, 250)
        return
      }

      animationFrame = requestAnimationFrame(animate)
    }

    animationFrame = requestAnimationFrame(animate)

    return () => cancelAnimationFrame(animationFrame)
  }, [videoReady])

  return (
    <main className="frint-page fixed inset-0 z-[9999] flex min-h-[100svh] items-center justify-center overflow-hidden px-4 py-5">
      <div className="pointer-events-none absolute left-[-120px] top-[-120px] h-[280px] w-[280px] rounded-full bg-[var(--frint-accent)]/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-140px] right-[-120px] h-[320px] w-[320px] rounded-full bg-[#0060f8]/10 blur-3xl" />

      <section className="relative mx-auto grid w-full max-w-5xl items-center gap-5 lg:grid-cols-[0.9fr_1fr]">
        <div className="flex justify-center">
          <div className="relative grid h-[48svh] max-h-[430px] min-h-[300px] w-[min(72vw,300px)] place-items-center overflow-hidden rounded-[34px] border frint-border bg-[var(--frint-soft-card)] shadow-xl sm:h-[520px] sm:max-h-[560px] sm:w-[330px] lg:h-[580px] lg:w-[370px]">
            {!videoReady && (
              <div className="absolute inset-0 z-10 grid place-items-center bg-[var(--frint-soft-card)]">
                <img
                  src="/logo.svg"
                  alt="Frint"
                  className="h-14 w-auto object-contain"
                />
              </div>
            )}

            <video
              src={VIDEO_SRC}
              muted
              playsInline
              autoPlay
              preload="auto"
              onLoadedData={markVideoReady}
              onCanPlay={markVideoReady}
              onError={() => {
                setVideoFailed(true)
                markVideoReady()
              }}
              className="h-full w-full object-contain"
            />
          </div>
        </div>

        <div className="hidden lg:block">
          <div className="frint-card max-w-md rounded-[32px] p-7">
            <img
              src="/logo.svg"
              alt="Frint"
              className="h-12 w-auto object-contain"
            />

            <h1 className="mt-8 text-[34px] font-semibold leading-tight tracking-[-0.06em] text-[var(--frint-text)]">
              Ambassador Control Panel
            </h1>

            <p className="mt-3 text-sm leading-6 frint-muted">
              {videoFailed
                ? 'Preparing your workspace'
                : videoReady
                  ? 'Loading your workspace'
                  : 'Preparing intro'}
            </p>

            <div className="mt-7">
              <div className="h-2 overflow-hidden rounded-full bg-[var(--frint-soft-card)]">
                <div
                  className="h-full rounded-full bg-[var(--frint-accent)] transition-[width]"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className="mt-3 flex items-center justify-between text-xs font-semibold frint-muted">
                <span>{videoReady ? 'Preparing your panel' : 'Loading video'}</span>
                <span>{Math.round(progress)}%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto w-full max-w-[310px] lg:hidden">
          <div className="rounded-[26px] border frint-border bg-[var(--frint-card)] px-5 py-5 shadow-sm">
            <img
              src="/logo.svg"
              alt="Frint"
              className="mx-auto h-10 w-auto object-contain"
            />

            <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-[var(--frint-soft-card)]">
              <div
                className="h-full rounded-full bg-[var(--frint-accent)] transition-[width]"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}