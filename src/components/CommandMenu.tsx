'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

interface CommandMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onAddText: () => void;
  onAddImage: () => void;
  onUpload: () => void;
}

const menuItems = [
  {
    id: 'text',
    label: 'UI Idea',
    shortcut: 'T',
    icon: (
      <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
        <path d="M4 2h8a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V4a2 2 0 012-2z" stroke="currentColor" strokeWidth="1.5" />
        <path d="M5 6h6M5 8h6M5 10h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'image',
    label: 'UI Image',
    shortcut: 'I',
    icon: (
      <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
        <rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="5.5" cy="5.5" r="1.5" fill="currentColor" />
        <path d="M14 10l-3-3-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

const sourceItems = [
  {
    id: 'upload',
    label: 'Upload',
    shortcut: 'U',
    icon: (
      <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
        <path d="M8 10V3M8 3L5 6M8 3l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M3 10v2a2 2 0 002 2h6a2 2 0 002-2v-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
];

export default function CommandMenu({ isOpen, onClose, onAddText, onAddImage, onUpload }: CommandMenuProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allItems = useMemo(() => [...menuItems, ...sourceItems], []);

  const handleSelect = useCallback((id: string) => {
    switch (id) {
      case 'text':
        onAddText();
        break;
      case 'image':
        onAddImage();
        break;
      case 'upload':
        fileInputRef.current?.click();
        return;
    }
    onClose();
  }, [onAddText, onAddImage, onClose]);

  useEffect(() => {
    if (isOpen) {
      setSelectedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : allItems.length - 1));
          break;
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) => (prev < allItems.length - 1 ? prev + 1 : 0));
          break;
        case 'Enter':
          e.preventDefault();
          handleSelect(allItems[selectedIndex].id);
          break;
        case 't':
        case 'T':
          e.preventDefault();
          handleSelect('text');
          break;
        case 'i':
        case 'I':
          e.preventDefault();
          handleSelect('image');
          break;
        case 'u':
        case 'U':
          e.preventDefault();
          handleSelect('upload');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, onClose, handleSelect, allItems]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload();
    }
    onClose();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={handleBackdropClick}
    >
      <div
        ref={menuRef}
        className="w-72 bg-[#1c1c1e] border border-[#3a3a3c] rounded-xl shadow-2xl overflow-hidden"
      >
        <div className="px-4 py-3 text-xs text-[#8e8e93] font-medium">
          Add Node
        </div>

        <div className="pb-2">
          {menuItems.map((item, index) => (
            <button
              key={item.id}
              onClick={() => handleSelect(item.id)}
              onMouseEnter={() => setSelectedIndex(index)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                selectedIndex === index ? 'bg-[#2c2c2e]' : 'hover:bg-[#2c2c2e]'
              }`}
            >
              <span className="w-9 h-9 flex items-center justify-center bg-[#3a3a3c] rounded-lg text-white">
                {item.icon}
              </span>
              <span className="flex-1 text-white font-medium">{item.label}</span>
              <span className="text-[#8e8e93] text-sm">{item.shortcut}</span>
            </button>
          ))}
        </div>

        <div className="border-t border-[#3a3a3c]">
          <div className="px-4 py-3 text-xs text-[#8e8e93] font-medium">
            Add Source
          </div>
          {sourceItems.map((item, index) => (
            <button
              key={item.id}
              onClick={() => handleSelect(item.id)}
              onMouseEnter={() => setSelectedIndex(menuItems.length + index)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                selectedIndex === menuItems.length + index ? 'bg-[#2c2c2e]' : 'hover:bg-[#2c2c2e]'
              }`}
            >
              <span className="w-9 h-9 flex items-center justify-center bg-[#3a3a3c] rounded-lg text-white">
                {item.icon}
              </span>
              <span className="flex-1 text-white font-medium">{item.label}</span>
              <span className="text-[#8e8e93] text-sm">{item.shortcut}</span>
            </button>
          ))}
        </div>

        <div className="border-t border-[#3a3a3c] px-4 py-3 flex items-center gap-4 text-xs text-[#8e8e93]">
          <span className="flex items-center gap-1.5">
            <span className="text-[10px]">↑↓</span> Navigate
          </span>
          <span className="flex items-center gap-1.5">
            <span className="text-[10px]">↵</span> Select
          </span>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
