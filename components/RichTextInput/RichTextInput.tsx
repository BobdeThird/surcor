import React, { useRef, useCallback, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { $createParagraphNode, $getRoot, $getSelection, COMMAND_PRIORITY_LOW, KEY_ENTER_COMMAND, LexicalEditor } from 'lexical';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { $isNodeSelection, $isRangeSelection, ElementNode } from 'lexical';
import { mergeRegister } from '@lexical/utils';

import MentionPlugin from './plugins/MentionPlugin';
import { MentionNode, $isMentionNode } from './nodes/MentionNode';
import { MentionItem } from '../Selectors/mentionDropdown';

// Create a context to share menu state
const MentionMenuContext = React.createContext<{
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}>({
  isOpen: false,
  setIsOpen: () => {},
});

interface RichTextInputProps {
  value: string;
  onChange: (value: string) => void;
  mentionItems: MentionItem[];
  onMentionSearchChange?: (query: string) => void;
  onSend?: (visibleMessage: string, processedMessage: string) => void;
  onMentionSelect?: (id: string, name: string) => void;
  onMentionNodesChange?: (ids: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export interface RichTextInput {
  clearEditor: () => void;
}

// Component to handle editor state and send functionality
function EditorStateHandler({ 
  onSend, 
  disabled,
  onClearEditor
}: { 
  onSend?: (visibleMessage: string, processedMessage: string) => void;
  disabled?: boolean;
  onClearEditor?: (clearFn: () => void) => void;
}) {
  const [editor] = useLexicalComposerContext();
  const { isOpen: isMentionMenuOpen } = React.useContext(MentionMenuContext);

  // Function to clear the editor
  const clearEditor = useCallback(() => {
    editor.update(() => {
      const root = $getRoot();
      root.clear();
      const paragraph = $createParagraphNode();
      root.append(paragraph);
      paragraph.select();
    });
  }, [editor]);

  // Expose the clear function to parent
  useEffect(() => {
    if (onClearEditor) {
      onClearEditor(clearEditor);
    }
  }, [onClearEditor, clearEditor]);

  useEffect(() => {
    return mergeRegister(
      editor.registerCommand(
        KEY_ENTER_COMMAND,
        (event: KeyboardEvent | null) => {
          // If mention menu is open, let it handle the Enter key
          if (isMentionMenuOpen) {
            return false;
          }
          
          if (event && !event.shiftKey && !event.ctrlKey && !event.metaKey && !disabled && onSend) {
            event.preventDefault();
            
            // Get the current content
            editor.getEditorState().read(() => {
              const root = $getRoot();
              const visibleMessage = root.getTextContent();
              
              // Build processed message with mention IDs
              let processedMessage = '';
              root.getChildren().forEach((paragraph) => {
                if (paragraph instanceof ElementNode) {
                  paragraph.getChildren().forEach((node) => {
                    if ($isMentionNode(node)) {
                      processedMessage += `@${node.getMentionName()} [fileID${node.getMentionId()}] `;
                    } else {
                      processedMessage += node.getTextContent();
                    }
                  });
                  processedMessage += '\n';
                }
              });
              
              processedMessage = processedMessage.trim();
              
              if (visibleMessage.trim()) {
                onSend(visibleMessage, processedMessage);
                
                // Clear editor
                clearEditor();
              }
            });
            
            return true;
          }
          return false;
        },
        COMMAND_PRIORITY_LOW // Use LOW priority so mention plugin can handle it first
      )
    );
  }, [editor, onSend, disabled, isMentionMenuOpen, clearEditor]);

  return null;
}

const RichTextInput = forwardRef<RichTextInput, RichTextInputProps>(({
  value,
  onChange,
  mentionItems,
  onMentionSearchChange,
  onSend,
  onMentionSelect,
  onMentionNodesChange,
  placeholder = "Imagine, plan, write anything...",
  disabled = false,
  className = "",
}, ref) => {
  const [isMentionMenuOpen, setIsMentionMenuOpen] = useState(false);
  const clearEditorRef = useRef<(() => void) | null>(null);
  
  const editorConfig = {
    namespace: 'RichTextInput',
    theme: {
      paragraph: 'mb-0',
      text: {
        bold: 'font-bold',
        italic: 'italic',
        underline: 'underline',
        strikethrough: 'line-through',
      },
    },
    onError: (error: Error) => {
      console.error(error);
    },
    nodes: [MentionNode],
  };

  // Expose clearEditor function via ref
  useImperativeHandle(ref, () => ({
    clearEditor: () => {
      if (clearEditorRef.current) {
        clearEditorRef.current();
      }
    }
  }), []);

  const handleClearEditor = useCallback((clearFn: () => void) => {
    clearEditorRef.current = clearFn;
  }, []);

  const handleChange = useCallback((editorState: any, editor: LexicalEditor) => {
    editor.getEditorState().read(() => {
      const root = $getRoot();
      const textContent = root.getTextContent();
      // Propagate text changes
      onChange(textContent);

      // Collect current mention IDs to detect deletions
      const mentionIds: string[] = [];
      root.getChildren().forEach((paragraph) => {
        if (paragraph instanceof ElementNode) {
          paragraph.getChildren().forEach((node) => {
            if ($isMentionNode(node)) {
              mentionIds.push(node.getMentionId());
            }
          });
        }
      });
      onMentionNodesChange?.(mentionIds);
    });
  }, [onChange, onMentionNodesChange]);

  return (
    <MentionMenuContext.Provider value={{ isOpen: isMentionMenuOpen, setIsOpen: setIsMentionMenuOpen }}>
      <LexicalComposer initialConfig={editorConfig}>
        <div className={`relative ${className}`}>
          <RichTextPlugin
            contentEditable={
              <ContentEditable
                className="flex-grow min-h-12 max-h-36 text-base leading-6 border-none focus-visible:ring-0 focus-visible:ring-offset-0 p-1 shadow-none whitespace-pre-wrap break-words overflow-y-auto outline-none"
                aria-placeholder={placeholder}
                aria-label="Rich text editor"
                placeholder={<></>}
              />
            }
            placeholder={<div className="absolute top-1 left-1 text-base text-gray-400 pointer-events-none">{placeholder}</div>}
            ErrorBoundary={LexicalErrorBoundary}
          />
          <OnChangePlugin onChange={handleChange} />
          <HistoryPlugin />
          <MentionPlugin 
            mentionItems={mentionItems} 
            onSearchChange={onMentionSearchChange}
            onMenuOpenChange={setIsMentionMenuOpen}
            onMentionSelect={onMentionSelect}
          />
          <EditorStateHandler onSend={onSend} disabled={disabled} onClearEditor={handleClearEditor} />
        </div>
      </LexicalComposer>
    </MentionMenuContext.Provider>
  );
});

RichTextInput.displayName = 'RichTextInput';

export default RichTextInput; 