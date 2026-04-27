import { cn } from '@/lib/utils'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const sizes = {
  sm: 'text-xl',
  md: 'text-2xl',
  lg: 'text-4xl',
  xl: 'text-6xl',
}

export default function Logo({ size = 'md', className }: LogoProps) {
  return (
    <span className={cn('font-semibold tracking-tight text-primary leading-none', sizes[size], className)}>
      Neta<span className="neta-logo-dot">.</span>
    </span>
  )
}
