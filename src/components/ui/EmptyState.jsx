export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      {Icon && (
        <div className="w-14 h-14 rounded-full bg-canvas flex items-center justify-center mb-4">
          <Icon className="w-7 h-7 text-ink-muted" />
        </div>
      )}
      <h3 className="text-lg font-medium text-ink mb-1">{title}</h3>
      {description && <p className="text-sm text-ink-muted max-w-sm mb-5">{description}</p>}
      {action}
    </div>
  )
}
