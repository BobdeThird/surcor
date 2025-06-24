import React, { useState, useEffect } from "react"

export interface MentionItem {
  value: string
  label: string
  icon?: string
}

interface Props {
  visible: boolean
  position: { top: number; left: number }
  items: MentionItem[]
  onSelect: (item: MentionItem) => void
  commandRef?: React.Ref<HTMLDivElement>
}

export default function MentionDropdown({ visible, position, items, onSelect, commandRef }: Props) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSelectedIndex(0);
  }, [items]);

  useEffect(() => {
    if (visible && dropdownRef.current) {
      dropdownRef.current.focus();
    }
  }, [visible]);

  if (!visible) return null;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, items.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        e.stopPropagation();
        if (items[selectedIndex]) {
          onSelect(items[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        // Could add onEscape callback here if needed
        break;
    }
  };

  return (
    <div
      ref={dropdownRef}
      className="fixed z-[9999] w-80 bg-white text-gray-900 rounded-md border border-gray-200 shadow-lg"
      style={{ 
        top: position.top + 5, 
        left: position.left,
        maxHeight: '240px'
      }}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <div className="max-h-60 overflow-y-auto">
        {items.length === 0 ? (
          <div className="py-4 text-center text-gray-500">No results.</div>
        ) : (
          <div>
            {items.map((item, index) => (
              <div 
                key={item.value} 
                onClick={() => onSelect(item)}
                className={`flex items-center gap-2 px-3 py-2 cursor-pointer ${
                  index === selectedIndex 
                    ? 'bg-blue-100 text-blue-900' 
                    : 'hover:bg-gray-100'
                }`}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                {item.icon && <img src={item.icon} alt="" className="w-4 h-4 flex-shrink-0" />}
                <span className="truncate">{item.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 