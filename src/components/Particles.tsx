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
    const baseCount = isMobile ? 36 : 80

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
      const r = Math.random()
      const color = r < 0.45 ? '232,165,152' : r < 0.6 ? '212,169,106' : '255,255,255'
      return {
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.14,
        vy: (Math.random() - 0.5) * 0.14,
        r: Math.random() * 1.6 + 0.5,
        alpha: Math.random() * 0.5 + 0.4,
        color,
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

        // Halo suave alrededor de cada punto
        const isAccent = d.color.startsWith('232') || d.color.startsWith('212')
        const haloAlpha = (isAccent ? 0.12 : 0.08) * d.alpha
        const grad = ctx!.createRadialGradient(d.x, d.y, 0, d.x, d.y, d.r * 6)
        grad.addColorStop(0, `rgba(${d.color},${haloAlpha})`)
        grad.addColorStop(1, `rgba(${d.color},0)`)
        ctx!.fillStyle = grad
        ctx!.beginPath()
        ctx!.arc(d.x, d.y, d.r * 6, 0, Math.PI * 2)
        ctx!.fill()

        // Núcleo del punto
        const coreAlpha = d.alpha * (isAccent ? 0.55 : 0.45)
        ctx!.fillStyle = `rgba(${d.color},${coreAlpha})`
        ctx!.beginPath()
        ctx!.arc(d.x, d.y, d.r, 0, Math.PI * 2)
        ctx!.fill()
      }

      const linkDist = isMobile ? 100 : 140
      for (let i = 0; i < dots.length; i++) {
        for (let j = i + 1; j < dots.length; j++) {
          const a = dots[i]
          const b = dots[j]
          const dx = a.x - b.x
          const dy = a.y - b.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < linkDist) {
            const op = (1 - dist / linkDist) * 0.1
            ctx!.strokeStyle = `rgba(232,165,152,${op})`
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
        if (dm < 140) {
          const op = (1 - dm / 140) * 0.32
          ctx!.strokeStyle = `rgba(232,165,152,${op})`
          ctx!.lineWidth = 0.8
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
