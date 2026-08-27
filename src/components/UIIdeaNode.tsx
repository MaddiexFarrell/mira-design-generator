'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { UIIdeaNode } from '@/lib/types';

interface Props {
  node: UIIdeaNode;
  isSelected: boolean;
  onSelect: (addToSelection: boolean) => void;
  onUpdate: (updates: Partial<UIIdeaNode>) => void;
}

export default function UIIdeaNodeComponent({ node, isSelected, onSelect, onUpdate }: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nodeRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({ startX: 0, startY: 0, nodeX: 0, nodeY: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.tagName === 'BUTTON' ||
      target.closest('button')
    ) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();
    
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    
    onSelect(e.shiftKey || e.metaKey || e.ctrlKey);
    
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      nodeX: node.x,
      nodeY: node.y,
    };
    setIsDragging(true);
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const deltaX = e.clientX - dragRef.current.startX;
    const deltaY = e.clientY - dragRef.current.startY;
    
    onUpdate({
      x: Math.max(0, dragRef.current.nodeX + deltaX),
      y: Math.max(0, dragRef.current.nodeY + deltaY),
    });
  }, [onUpdate]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (!isDragging) return;

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.tagName === 'BUTTON' ||
      target.closest('button')
    ) {
      return;
    }
    e.stopPropagation();
    onSelect(e.shiftKey || e.metaKey || e.ctrlKey);
  };

  const handleGenerateIdea = async () => {
    if (!node.title && !node.body) {
      setError('Add a title or body first');
      return;
    }
    
    setError(null);
    setIsGenerating(true);

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation: 'idea',
          prompt: node.body || node.title,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate');
      
      onUpdate({ body: data.result });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div
      ref={nodeRef}
      className="absolute"
      style={{
        left: node.x,
        top: node.y,
        cursor: isDragging ? 'grabbing' : 'grab',
        zIndex: isSelected ? 10 : 1,
      }}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
    >
      {/* Floating Title Bar - positioned above the card */}
      <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-2 rounded-md bg-[#1a1a1c]">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="text-[var(--muted)] shrink-0">
          <path d="M4 2h8a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V4a2 2 0 012-2z" stroke="currentColor" strokeWidth="1.5" />
          <path d="M5 6h6M5 8h6M5 10h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <input
          type="text"
          value={node.title}
          onChange={(e) => onUpdate({ title: e.target.value })}
          onKeyDown={(e) => e.key === 'Escape' && e.currentTarget.blur()}
          className="bg-transparent border-none outline-none text-sm font-medium text-[var(--foreground)] w-48"
          placeholder="Idea title..."
        />
      </div>

      <div className={`node-card w-72 ${isSelected ? 'selected' : ''}`}>
        <div className="p-3">
        <textarea
          value={node.body}
          onChange={(e) => onUpdate({ body: e.target.value })}
          onKeyDown={(e) => e.key === 'Escape' && e.currentTarget.blur()}
          className="input text-sm"
          placeholder="Describe your UI idea..."
          rows={4}
        />
        
        {error && (
          <div className="mt-2 text-xs text-red-400">{error}</div>
        )}
        
        <button
          onClick={handleGenerateIdea}
          disabled={isGenerating}
          className="btn btn-accent w-full mt-3 text-xs"
        >
          {isGenerating ? (
            <>
              <span className="animate-spin">⟳</span>
              Generating...
            </>
          ) : (
            <>
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.5 3.5l1.4 1.4M11.1 11.1l1.4 1.4M3.5 12.5l1.4-1.4M11.1 4.9l1.4-1.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              AI: Generate Idea
            </>
          )}
        </button>
        </div>
      </div>
    </div>
  );
}
