'use client'

import { Chip } from '@heroui/react'

interface SidebarSectionProps {
  title: string
  isActive: boolean
  onClick: () => void
  count?: number
}

export function SidebarSection({ title, isActive, onClick, count }: SidebarSectionProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-2 text-sm font-medium rounded-md transition-all duration-150 ${
        isActive
          ? 'bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-gray-50 shadow-sm'
          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100/50 dark:hover:bg-gray-800/50'
      }`}
    >
      <div className="flex items-center justify-between">
        <span>{title}</span>
        {count !== undefined && count > 0 && (
          <Chip
            size="sm"
            variant="flat"
            className={`h-5 min-w-5 px-1.5 text-xs ${
              isActive
                ? 'bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                : 'bg-gray-200 dark:bg-gray-800 text-gray-500 dark:text-gray-500'
            }`}
          >
            {count}
          </Chip>
        )}
      </div>
    </button>
  )
}
