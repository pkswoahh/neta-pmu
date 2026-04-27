import { useEffect, useRef } from 'react'

interface Dot {
  x: number
  y: number
  vx: number
  vy: number
  r: number
  alpha: number
  color: string
}

export default function Particles() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number>()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let dpr = Math.min(window.devicePixelRatio || 1, 2)
    let w = 0
    let h = 0
    let dots: Dot[] = []
    let mouseX = -9999
    let mouseY = -9999

    const isMobile = window.matchMedia('(max-width: 768px)').matches
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const baseCount = isMobile ? 28 : 60

    function resize() {
      if (!canvas) return
      w = window.innerWidth
      h = window.innerHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)
      buildDots()
    }

    function buildDots() {
      dots = Array.from({ length: baseCount }, () => makeDot())
    }

    function makeDot(): Dot {
      const useAccent = Math.random() < 0.35
      return {
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.12,
        vy: (Math.random() - 0.5) * 0.12,
        r: Math.random() * 1.4 + 0.4,
        alpha: Math.random() * 0.5 + 0.2,
        color: useAccent ? '232,165,152' : '255,255,255',
      }
    }

    function step() {
      ctx!.clearRect(0, 0, w, h)

      for (let i = 0; i < dots.length; i++) {
        const d = dots[i]
        d.x += d.vx
        d.y += d.vy
        if (d.x < -10) d.x = w + 10
        if (d.x > w + 10) d.x = -10
        if (d.y < -10) d.y = h + 10
        if (d.y > h + 10) d.y = -10

        const baseAlpha = d.color.startsWith('232') ? 0.045 : 0.07
        ctx!.beginPath()
        ctx!.fillStyle = `rgba(${d.color},${d.alpha * baseAlpha * 5})`
        ctx!.arc(d.x, d.y, d.r, 0, Math.PI * 2)
        ctx!.fill()
      }

      const linkDist = isMobile ? 90 : 130
      for (let i = 0; i < dots.length; i++) {
        for (let j = i + 1; j < dots.length; j++) {
          const a = dots[i]
          const b = dots[j]
          const dx = a.x - b.x
          const dy = a.y - b.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < linkDist) {
            const op = (1 - dist / linkDist) * 0.05
            ctx!.strokeStyle = `rgba(255,255,255,${op})`
            ctx!.lineWidth = 0.6
            ctx!.beginPath()
            ctx!.moveTo(a.x, a.y)
            ctx!.lineTo(b.x, b.y)
            ctx!.stroke()
          }
        }
        const dxm = dots[i].x - mouseX
        const dym = dots[i].y - mouseY
        const dm = Math.sqrt(dxm * dxm + dym * dym)
        if (dm < 120) {
          const op = (1 - dm / 120) * 0.18
          ctx!.strokeStyle = `rgba(232,165,152,${op})`
          ctx!.lineWidth = 0.7
          ctx!.beginPath()
          ctx!.moveTo(dots[i].x, dots[i].y)
          ctx!.lineTo(mouseX, mouseY)
          ctx!.stroke()
        }
      }

      rafRef.current = requestAnimationFrame(step)
    }

    function onMove(e: MouseEvent) {
      mouseX = e.clientX
      mouseY = e.clientY
    }
    function onLeave() {
      mouseX = -9999
      mouseY = -9999
    }

    resize()
    if (!reduce) rafRef.current = requestAnimationFrame(step)
    else {
      ctx.clearRect(0, 0, w, h)
      dots.forEach(d => {
        ctx.beginPath()
        ctx.fillStyle = `rgba(${d.color},${d.alpha * 0.3})`
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2)
        ctx.fill()
      })
    }
    window.addEventListener('resize', resize)
    if (!isMobile) {
      window.addEventListener('mousemove', onMove)
      window.addEventListener('mouseleave', onLeave)
    }

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseleave', onLeave)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-0"
    />
  )
}
