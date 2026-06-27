import { useEffect, useRef, useState } from 'react'

const INTRO_DURATION = 5600

export default function IntroScreen({
  onFinish,
  title = 'Ambassador Control Panel',
  subtitle = 'Loading your workspace',
  footerText = 'Preparing your panel',
}) {
  const videoRef = useRef(null)
  const finishedRef = useRef(false)
  const [progress, setProgress] = useState(0)

  const finishIntro = () => {
    if (finishedRef.current) return
    finishedRef.current = true
    setProgress(100)
    onFinish()
  }

  useEffect(() => {
    const startTime = Date.now()

    const progressTimer = setInterval(() => {
      const elapsed = Date.now() - startTime
      const nextProgress = Math.min((elapsed / INTRO_DURATION) * 100, 100)

      setProgress(nextProgress)

      if (nextProgress >= 100) clearInterval(progressTimer)
    }, 70)

    const fallbackTimer = setTimeout(() => {
      finishIntro()
    }, INTRO_DURATION + 900)

    return () => {
      clearInterval(progressTimer)
      clearTimeout(fallbackTimer)
    }
  }, [])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const playVideo = async () => {
      try {
        video.currentTime = 0
        await video.play()
      } catch {
        finishIntro()
      }
    }

    playVideo()
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-[#05070B] px-4 py-6 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_32%_45%,rgba(0,96,248,0.18),transparent_38%),radial-gradient(circle_at_78%_55%,rgba(112,192,248,0.12),transparent_34%)]" />

      <div
        className="
          relative z-10 w-full max-w-[320px] rounded-[32px]
          border border-white/10 bg-[#111111]/70 p-4 shadow-2xl backdrop-blur-xl

          md:max-w-5xl md:rounded-[34px] md:p-10
        "
      >
        <div
          className="
            flex flex-col gap-5
            md:grid md:min-h-[520px] md:grid-cols-[390px_1fr]
            md:items-center md:gap-14
          "
        >
          <div className="flex justify-center md:justify-end">
            <div className="overflow-hidden rounded-[28px] border border-white/10 bg-black shadow-xl">
              <video
                ref={videoRef}
                src="/logomotion-720p.mp4"
                className="
                  h-[430px] w-[242px] object-cover
                  md:h-[500px] md:w-[282px]
                "
                muted
                playsInline
                autoPlay
                onEnded={finishIntro}
              />
            </div>
          </div>

          <div
            className="
              rounded-[24px] border border-white/10 bg-white/[0.06]
              p-5 backdrop-blur-xl
              md:max-w-[360px] md:rounded-[28px] md:p-7
            "
          >
            <img
              src="/logo.svg"
              alt="Frint"
              className="h-12 w-auto"
            />

            <h1 className="mt-6 text-2xl font-black leading-tight md:text-3xl">
              {title}
            </h1>

            <p className="mt-2 text-sm font-medium text-slate-400">
              {subtitle}
            </p>

            <div className="mt-7 h-[5px] overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-[#70C0F8] transition-all duration-100"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="mt-3 flex items-center justify-between text-xs font-semibold text-slate-400">
              <span>{footerText}</span>
              <span>{Math.round(progress)}%</span>
            </div>

            <button
              onClick={finishIntro}
              className="
                mt-6 rounded-full border border-white/10 bg-white/10
                px-5 py-2.5 text-sm font-bold text-white
                hover:bg-white/15
              "
            >
              Skip
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}