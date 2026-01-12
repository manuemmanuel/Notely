import { create } from 'zustand'
import type { Editor } from '@tiptap/react'

interface EditorState {
  editor: Editor | null
  isSaving: boolean
  lastSaved: Date | null
  hasUnsavedChanges: boolean
  isRemoteUpdate: boolean // Flag to prevent update loops
  
  // Actions
  setEditor: (editor: Editor | null) => void
  setSaving: (saving: boolean) => void
  setLastSaved: (date: Date | null) => void
  setHasUnsavedChanges: (has: boolean) => void
  setRemoteUpdate: (isRemote: boolean) => void
}

export const useEditorStore = create<EditorState>((set) => ({
  editor: null,
  isSaving: false,
  lastSaved: null,
  hasUnsavedChanges: false,
  isRemoteUpdate: false,

  setEditor: (editor) => set({ editor }),
  setSaving: (saving) => set({ isSaving: saving }),
  setLastSaved: (date) => set({ lastSaved: date }),
  setHasUnsavedChanges: (has) => set({ hasUnsavedChanges: has }),
  setRemoteUpdate: (isRemote) => set({ isRemoteUpdate: isRemote }),
}))

