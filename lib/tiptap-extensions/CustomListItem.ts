import { ListItem } from '@tiptap/extension-list-item'

/**
 * Custom ListItem extension that handles Backspace behavior:
 * - At start of nested bullet: outdents (lifts list item)
 * - At start of top-level bullet: converts to paragraph
 * - Otherwise: normal backspace behavior
 */
export const CustomListItem = ListItem.extend({
  addKeyboardShortcuts() {
    return {
      Backspace: ({ editor }) => {
        const { state } = editor.view
        const { selection } = state
        const { $from } = selection

        // Only handle if selection is empty (cursor, not range)
        if (!selection.empty) {
          return false
        }

        // Find the list item node we're in
        let listItemDepth = -1
        let listItemNode = null
        
        for (let depth = $from.depth; depth > 0; depth--) {
          const node = $from.node(depth)
          if (node.type.name === 'listItem') {
            listItemNode = node
            listItemDepth = depth
            break
          }
        }

        // If we're not in a list item, let default behavior happen
        if (!listItemNode || listItemDepth === -1) {
          return false
        }

        // Check if cursor is at the start of the list item content
        // $from.start(listItemDepth) gives us the start position of the list item
        // We need to check if we're at position 1 within the list item (after the opening tag)
        const listItemStart = $from.start(listItemDepth)
        const posInListItem = $from.pos - listItemStart

        // If cursor is at the very start of the list item content (position 1 = right after opening tag)
        if (posInListItem === 1) {
          // Check if this is a nested list item by checking if we can lift it
          // If we can lift, it means it's nested; if we can't, it's top-level
          const canLift = editor.can().liftListItem('listItem')
          
          if (canLift) {
            // Case 1: Nested bullet - lift the list item (outdent)
            return editor.commands.liftListItem('listItem')
          } else {
            // Case 2: Top-level bullet - convert to paragraph
            // Try bullet list first, then ordered list
            if (editor.isActive('bulletList')) {
              return editor.commands.toggleBulletList()
            } else if (editor.isActive('orderedList')) {
              return editor.commands.toggleOrderedList()
            }
          }
        }

        // Case 3: Cursor not at start - let default backspace behavior happen
        return false
      },
    }
  },
})
