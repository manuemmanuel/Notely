'use client'

import { useEditorStore } from '@/stores/editor.store'

export function StatusBar() {
  const { isSaving, lastSaved, hasUnsavedChanges } = useEditorStore()

  const getStatusText = () => {
    if (isSaving) return 'Saving...'
    if (hasUnsavedChanges) return 'Unsaved'
    if (lastSaved) return `Saved ${formatTime(lastSaved)}`
    return 'Saved'
  }

  const formatTime = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffSecs = Math.floor(diffMs / 1000)
    const diffMins = Math.floor(diffMs / 60000)

    if (diffSecs < 10) return 'just now'
    if (diffSecs < 60) return `${diffSecs}s ago`
    if (diffMins < 60) return `${diffMins}m ago`
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  }

  return (
    <div className="absolute bottom-5 right-5 text-xs text-gray-400 dark:text-gray-500 font-medium">
      {isSaving ? (
        <span className="text-blue-500 dark:text-blue-400">{getStatusText()}</span>
      ) : hasUnsavedChanges ? (
        <span className="text-amber-500 dark:text-amber-400">{getStatusText()}</span>
      ) : (
        <span className="text-gray-400 dark:text-gray-500">{getStatusText()}</span>
      )}
    </div>
  )
}
