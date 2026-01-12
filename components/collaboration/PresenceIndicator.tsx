'use client'

import { useRealtimeStore } from '@/stores/realtime.store'

export function PresenceIndicator() {
  const { activeUsers } = useRealtimeStore()

  if (activeUsers.size === 0) {
    return null
  }

  const users = Array.from(activeUsers.values())
  const colors = [
    'bg-blue-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-teal-500',
  ]

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">Editing</span>
      <div className="flex -space-x-1.5">
        {users.slice(0, 3).map((user, index) => {
          const color = colors[index % colors.length]
          const initial = user.name?.[0]?.toUpperCase() || String.fromCharCode(65 + index)
          
          return (
            <div
              key={user.id}
              className={`w-7 h-7 rounded-full ${color} border-2 border-white dark:border-gray-800 flex items-center justify-center text-xs text-white font-semibold shadow-sm cursor-default`}
              title={user.name || `User ${index + 1}`}
            >
              {initial}
            </div>
          )
        })}
        {users.length > 3 && (
          <div
            className="w-7 h-7 rounded-full bg-gray-300 dark:bg-gray-700 border-2 border-white dark:border-gray-800 flex items-center justify-center text-xs text-gray-700 dark:text-gray-300 font-semibold shadow-sm"
            title={`${users.length - 3} more`}
          >
            +{users.length - 3}
          </div>
        )}
      </div>
    </div>
  )
}
