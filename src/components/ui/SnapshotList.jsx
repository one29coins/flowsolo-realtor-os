// SnapshotList — list card (clients / cast / leads) with avatars,
// status badges, "View all" link, and 44x44 edit touch targets.

export default function SnapshotList({ title, items, onViewAll, maxVisible = 5 }) {
  const visible = items.slice(0, maxVisible)
  return (
    <div style={{
      margin: '12px 16px 0',
      background: '#ffffff',
      borderRadius: 12,
      border: '0.5px solid #eeeeee',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 14px 8px',
      }}>
        <span style={{
          fontSize: 14,
          fontWeight: 600,
          color: '#111111',
        }}>
          {title}
        </span>
        {onViewAll && (
          <button
            onClick={onViewAll}
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: 'var(--fs-primary-mid, #16a34a)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px 0',
              minHeight: 44,
              display: 'flex',
              alignItems: 'center',
              fontFamily: 'inherit',
            }}
          >
            View all
          </button>
        )}
      </div>

      {/* Rows */}
      {visible.map((item) => (
        <div
          key={item.id}
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '10px 14px',
            borderTop: '0.5px solid #f5f5f0',
            gap: 10,
          }}
        >
          {/* Avatar */}
          <div style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: '#f5f5f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12,
            fontWeight: 600,
            color: '#666666',
            flexShrink: 0,
          }}>
            {item.name.split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase()}
          </div>

          {/* Name + subtitle */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 13,
              fontWeight: 500,
              color: '#111111',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {item.name}
            </div>
            {item.subtitle && (
              <div style={{
                fontSize: 11,
                color: '#999999',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                marginTop: 1,
              }}>
                {item.subtitle}
              </div>
            )}
          </div>

          {/* Status badge */}
          {item.status && (
            <span style={{
              fontSize: 11,
              fontWeight: 500,
              padding: '2px 8px',
              borderRadius: 999,
              background: item.statusColor === 'red' ? '#fee2e2'
                : item.statusColor === 'amber' ? '#fef3c7'
                : '#dcfce7',
              color: item.statusColor === 'red' ? '#991b1b'
                : item.statusColor === 'amber' ? '#92400e'
                : '#166534',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}>
              {item.status}
            </span>
          )}

          {/* Edit button */}
          {item.onEdit && (
            <button
              onClick={item.onEdit}
              aria-label={`Edit ${item.name}`}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                minWidth: 44,
                minHeight: 44,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24"
                fill="none" stroke="#cccccc" strokeWidth="2"
                strokeLinecap="round">
                <path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                <path d="m15 5 4 4" />
              </svg>
            </button>
          )}
        </div>
      ))}
    </div>
  )
}
