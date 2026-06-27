import { useEffect, useRef, useState } from 'react'

const VIDEO_SRC = '/logomotion-720p.mp4'
const MIN_PLAY_TIME = 3800
const MAX_VIDEO_WAIT = 7000

export default function IntroScreen({ onComplete, onFinish, onDone }) {
  const [videoReady, setVideoReady] = useState(false)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState('Loading...')

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
    setStatus('Loading...')
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setStatus('Preparing...')
      startIntro()
    }, MAX_VIDEO_WAIT)

    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const playVideo = async () => {
      try {
        video.muted = true
        await video.play()
      } catch {
        // Mobile browsers can still delay autoplay. The fallback timer will continue.
      }
    }

    playVideo()
  }, [])

  useEffect(() => {
    if (!videoReady) return

    let frame
    const start = performance.now()

    const tick = (now) => {
      const elapsed = now - start
      const next = Math.min((elapsed / MIN_PLAY_TIME) * 100, 100)
      setProgress(next)

      if (next >= 100) {
        window.setTimeout(finishIntro, 220)
        return
      }

      frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [videoReady])

  return (
    <main className="fixed inset-0 z-[9999] min-h-[100svh] overflow-hidden bg-[var(--frint-bg)]">
      <div className="pointer-events-none absolute left-[-140px] top-[-120px] h-[340px] w-[340px] rounded-full bg-[var(--frint-accent)]/25 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-160px] right-[-130px] h-[360px] w-[360px] rounded-full bg-[#0060f8]/10 blur-3xl" />

      <section className="relative mx-auto flex min-h-[100svh] w-full max-w-6xl items-center justify-center px-4 py-4">
        <div className="grid w-full items-center gap-8 lg:grid-cols-[0.92fr_1.08fr]">
          <div className="mx-auto w-full max-w-[390px] rounded-[32px] border frint-border bg-[var(--frint-card)]/82 p-3 shadow-[0_28px_80px_rgba(15,23,42,0.12)] backdrop-blur-xl sm:p-4 lg:max-w-[420px]">
            <div className="overflow-hidden rounded-[26px] bg-[var(--frint-soft-card)]">
              <div className="relative grid aspect-[0.78] max-h-[62svh] min-h-[390px] place-items-center sm:min-h-[470px] lg:min-h-[560px]">
                <div className={`absolute inset-0 grid place-items-center transition-opacity duration-500 ${videoReady ? 'opacity-0' : 'opacity-100'}`}>
                  <img src="/logo.svg" alt="Frint" className="h-16 w-auto object-contain" />
                </div>

                <video
                  ref={videoRef}
                  src={VIDEO_SRC}
                  muted
                  playsInline
                  autoPlay
                  preload="auto"
                  onLoadedData={startIntro}
                  onCanPlay={startIntro}
                  onPlaying={startIntro}
                  onError={startIntro}
                  className={`h-full w-full object-contain transition-opacity duration-500 ${videoReady ? 'opacity-100' : 'opacity-0'}`}
                />
              </div>
            </div>

            <div className="px-4 pb-4 pt-4 sm:px-5 sm:pb-5">
              <p className="text-[15px] font-semibold tracking-[-0.02em] text-[var(--frint-text)]">
                {status}
              </p>

              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[var(--frint-soft-card)]">
                <div
                  className="h-full rounded-full bg-[var(--frint-accent)] transition-[width]"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>

          <div className="hidden lg:block">
            <div className="max-w-lg">
              <img src="/logo.svg" alt="Frint" className="h-14 w-auto object-contain" />

              <h1 className="mt-8 max-w-md text-[48px] font-semibold leading-[1.02] tracking-[-0.07em] text-[var(--frint-text)]">
                Ambassador Control Panel
              </h1>

              <p className="mt-5 max-w-md text-base leading-7 frint-muted">
                Preparing your Frint workspace for campaigns, referral links, leads, tasks, proofs, and reports.
              </p>

              <div className="mt-8 max-w-sm">
                <div className="h-2 overflow-hidden rounded-full bg-[var(--frint-soft-card)]">
                  <div
                    className="h-full rounded-full bg-[var(--frint-accent)] transition-[width]"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                <div className="mt-3 flex items-center justify-between text-xs font-semibold frint-muted">
                  <span>{videoReady ? 'Preparing panel' : 'Loading intro'}</span>
                  <span>{Math.round(progress)}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
