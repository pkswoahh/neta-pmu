interface Props {
  title: string
  hint?: string
  icon?: React.ReactNode
}

export default function Empty({ title, hint, icon }: Props) {
  return (
    <div className="text-center py-14 px-6 text-muted">
      {icon && <div className="flex justify-center mb-3 text-muted/60">{icon}</div>}
      <p className="text-primary font-medium mb-1">{title}</p>
      {hint && <p className="text-sm text-muted">{hint}</p>}
    </div>
  )
}
