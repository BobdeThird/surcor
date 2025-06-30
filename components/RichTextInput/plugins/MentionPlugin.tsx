import React, { useCallback, useMemo, useState, useRef, useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  LexicalTypeaheadMenuPlugin,
  MenuOption,
  useBasicTypeaheadTriggerMatch,
  MenuRenderFn,
} from '@lexical/react/LexicalTypeaheadMenuPlugin';
import { $createMentionNode } from '../nodes/MentionNode';
import { $getSelection, $isRangeSelection, TextNode, $isTextNode, $createTextNode } from 'lexical';
import { MentionItem } from '../../Selectors/mentionDropdown';

export class MentionTypeaheadOption extends MenuOption {
  name: string;
  id: string;
  icon?: string;

  constructor(name: string, id: string, icon?: string) {
    super(name);
    this.name = name;
    this.id = id;
    this.icon = icon;
  }
}

interface MentionPluginProps {
  mentionItems: MentionItem[];
  onSearchChange?: (query: string) => void;
  onMenuOpenChange?: (isOpen: boolean) => void;
  onMentionSelect?: (id: string, name: string) => void;
}

// Extract positioning logic to utility function
const calculateDropdownPosition = (anchorRect: DOMRect, dropdownHeight: number) => {
  const offset = 29;
  const spaceBelow = window.innerHeight - anchorRect.bottom;
  const spaceAbove = anchorRect.top;
  
  let top = anchorRect.bottom + offset;
  
  // Position above if not enough space below and more space above
  if (spaceBelow < dropdownHeight + offset && spaceAbove > dropdownHeight + offset) {
    top = anchorRect.top - dropdownHeight - offset;
  }
  // Fit in viewport if still not enough space
  else if (spaceBelow < dropdownHeight + offset) {
    if (spaceAbove > spaceBelow) {
      top = Math.max(5, anchorRect.top - dropdownHeight - offset);
    } else {
      top = Math.min(anchorRect.bottom + offset, window.innerHeight - dropdownHeight - 5);
    }
  }
  
  return { top, left: anchorRect.left };
};

export default function MentionPlugin({ mentionItems, onSearchChange, onMenuOpenChange, onMentionSelect }: MentionPluginProps) {
  const [editor] = useLexicalComposerContext();
  const [queryString, setQueryString] = useState<string | null>(null);

  const checkForMentionMatch = useBasicTypeaheadTriggerMatch('@', {
    minLength: 0,
  });

  const options = useMemo(() => {
    if (queryString === null) return [];

    return mentionItems
      .filter((item) => item.label.toLowerCase().includes(queryString.toLowerCase()))
      .slice(0, 10)
      .map((item) => new MentionTypeaheadOption(item.label, item.value, item.icon));
  }, [queryString, mentionItems]);

  // Track menu open state
  useEffect(() => {
    const isOpen = queryString !== null && options.length > 0;
    onMenuOpenChange?.(isOpen);
  }, [queryString, options.length, onMenuOpenChange]);

  const onSelectOption = useCallback(
    (selectedOption: MentionTypeaheadOption, nodeToReplace: TextNode | null, closeMenu: () => void) => {
      editor.update(() => {
        const mentionNode = $createMentionNode(selectedOption.name, selectedOption.id);
        if (nodeToReplace) {
          nodeToReplace.replace(mentionNode);
        }
        
        // Ensure space after mention
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          const nextSibling = mentionNode.getNextSibling();
          
          if (nextSibling && $isTextNode(nextSibling)) {
            const text = nextSibling.getTextContent();
            if (!text.startsWith(' ')) {
              nextSibling.setTextContent(' ' + text);
            }
            nextSibling.select(1, 1);
          } else {
            const spaceNode = mentionNode.insertAfter($createTextNode(' '));
            if (spaceNode && $isTextNode(spaceNode)) {
              spaceNode.select(1, 1);
            }
          }
        }
        closeMenu();
        // Notify about mention selection for context
        onMentionSelect?.(selectedOption.id, selectedOption.name);
      });
    },
    [editor]
  );

  const checkForMentionMatchWrapper = useCallback(
    (text: string) => {
      const mentionMatch = checkForMentionMatch(text, editor);
      if (mentionMatch !== null) {
        setQueryString(mentionMatch.matchingString);
        onSearchChange?.(mentionMatch.matchingString);
        return mentionMatch;
      }
      return null;
    },
    [checkForMentionMatch, onSearchChange, editor]
  );

  const renderMenu: MenuRenderFn<MentionTypeaheadOption> = useCallback(
    (anchorElementRef, { options, selectedIndex: menuSelectedIndex, selectOptionAndCleanUp, setHighlightedIndex }) => {
      if (!anchorElementRef.current || options.length === 0) return null;

      const anchorRect = anchorElementRef.current.getBoundingClientRect();
      const itemHeight = 32; // px-2 py-1.5 with gap-2 = 8px + 6px + 6px + text height ~= 32px  
      const dropdownPadding = 8; // p-1 on container = 4px top + 4px bottom
      const dropdownHeight = Math.min(options.length * itemHeight + dropdownPadding, 240);
      const position = calculateDropdownPosition(anchorRect, dropdownHeight);

      return (
        <div
          className="fixed z-[9999] w-80 bg-popover text-popover-foreground rounded-md border shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
          style={{
            top: position.top,
            left: position.left,
            maxHeight: '240px'
          }}
        >
          <div className="max-h-60 overflow-y-auto p-1 scrollbar-hide">
            {options.map((option, index) => (
              <div
                key={option.id}
                className={`relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors ${
                  index === menuSelectedIndex
                    ? 'bg-accent text-accent-foreground'
                    : 'hover:bg-accent/50 hover:text-accent-foreground'
                }`}
                onClick={() => selectOptionAndCleanUp(option)}
                onMouseEnter={() => setHighlightedIndex(index)}
              >
                {option.icon && (
                  <img src={option.icon} alt="" className="h-4 w-4 shrink-0" />
                )}
                <span className="truncate">{option.name}</span>
              </div>
            ))}
          </div>
        </div>
      );
    },
    []
  );

  return (
    <LexicalTypeaheadMenuPlugin
      onQueryChange={setQueryString}
      onSelectOption={onSelectOption}
      triggerFn={checkForMentionMatchWrapper}
      options={options}
      menuRenderFn={renderMenu}
      commandPriority={1}
    />
  );
}

 