'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { UIImageNode } from '@/lib/types';

interface Props {
  node: UIImageNode;
  isSelected: boolean;
  onSelect: (addToSelection: boolean) => void;
  onUpdate: (updates: Partial<UIImageNode>) => void;
}

export default function UIImageNodeComponent({ node, isSelected, onSelect, onUpdate }: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageCount, setImageCount] = useState(1);
  const [isCountSelectorOpen, setIsCountSelectorOpen] = useState(false);
  const [modalImageUrl, setModalImageUrl] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const countSelectorRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({ startX: 0, startY: 0, nodeX: 0, nodeY: 0 });

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (countSelectorRef.current && !countSelectorRef.current.contains(e.target as Node)) {
        setIsCountSelectorOpen(false);
      }
    };
    if (isCountSelectorOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isCountSelectorOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && modalImageUrl) {
        setModalImageUrl(null);
      }
    };
    if (modalImageUrl) {
      document.addEventListener('keydown', handleEscape);
    }
    return () => document.removeEventListener('keydown', handleEscape);
  }, [modalImageUrl]);

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

  const handleGenerateImage = async () => {
    if (!node.prompt.trim()) {
      setError('Add a prompt first');
      return;
    }
    
    setError(null);
    setIsGenerating(true);

    try {
      const res = await fetch('/api/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: node.prompt, count: imageCount }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate image');
      
      onUpdate({ 
        imageUrl: data.imageUrl,
        imageUrls: data.imageUrls || [data.imageUrl]
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Image generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className="absolute"
      style={{ left: node.x, top: node.y, zIndex: isSelected ? 10 : 1 }}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
    >
      {/* Floating Title Bar - positioned above the card */}
      <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-2 rounded-md bg-[#1a1a1c]">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-[var(--muted)]">
          <rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="5.5" cy="5.5" r="1.5" fill="currentColor" />
          <path d="M14 10l-3-3-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="text-sm font-medium text-[var(--foreground)]">Image</span>
      </div>

      {/* Card + Add Button row */}
      <div className="flex items-center gap-2">
        <div
          className={`node-card w-80 ${isSelected ? 'selected' : ''}`}
          style={{
            cursor: isDragging ? 'grabbing' : 'grab',
          }}
        >
          {/* Preview Area - shown when generating or images exist */}
        {isGenerating && !node.imageUrl && !node.imageUrls?.length && (
          <div className="px-3 pt-3">
            <div className="rounded-lg overflow-hidden bg-[#09090b] aspect-[4/3] flex items-center justify-center relative">
              {/* Subtle radial glow behind spinner */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-24 h-24 rounded-full bg-white/[0.03] blur-xl animate-shimmer-glow" />
              </div>
              {/* Primary shimmer wave */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.04] to-transparent animate-shimmer" />
              {/* Secondary slower shimmer wave */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#a1a1aa]/[0.06] to-transparent animate-shimmer-slow" />
              <div className="flex flex-col items-center gap-3 z-10">
                <div className="relative">
                  <svg width="32" height="32" viewBox="0 0 24 24" className="animate-spin">
                    <defs>
                      <linearGradient id="previewSpinnerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#6F58E8" />
                        <stop offset="100%" stopColor="#4F38B5" />
                      </linearGradient>
                    </defs>
                    <circle 
                      cx="12" 
                      cy="12" 
                      r="9" 
                      fill="none" 
                      stroke="url(#previewSpinnerGradient)" 
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeDasharray="42 14"
                    />
                  </svg>
                  <div className="absolute inset-0 animate-pulse opacity-50">
                    <svg width="32" height="32" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="9" fill="none" stroke="#6F58E8" strokeWidth="2" opacity="0.3" />
                    </svg>
                  </div>
                </div>
                <span className="text-xs text-[var(--muted)] animate-pulse">Generating...</span>
              </div>
            </div>
          </div>
        )}
        {(node.imageUrls?.length > 0 || node.imageUrl) && (
          <div className="px-3 pt-3">
            {node.imageUrls?.length > 1 ? (
              <div className={`grid gap-2 ${node.imageUrls.length === 2 ? 'grid-cols-2' : node.imageUrls.length === 3 ? 'grid-cols-2' : 'grid-cols-2'}`}>
                {node.imageUrls.map((url, idx) => (
                  <div 
                    key={idx} 
                    className={`rounded-lg overflow-hidden bg-[#09090b] aspect-square cursor-pointer ${node.imageUrls.length === 3 && idx === 2 ? 'col-span-2 aspect-[2/1]' : ''}`}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      setModalImageUrl(url);
                    }}
                  >
                    <img
                      src={url}
                      alt={`${node.prompt} - variant ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div 
                className="rounded-lg overflow-hidden bg-[#09090b] aspect-[4/3] cursor-pointer"
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  setModalImageUrl(node.imageUrl || node.imageUrls?.[0] || null);
                }}
              >
                <img
                  src={node.imageUrl || node.imageUrls?.[0]}
                  alt={node.prompt}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>
        )}

        {/* Input Area */}
        <div className="p-3">
          <div className="relative bg-[#09090b] rounded-lg border border-[var(--border)] transition-colors">
            <textarea
              value={node.prompt}
              onChange={(e) => onUpdate({ prompt: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleGenerateImage();
                }
                if (e.key === 'Escape') e.currentTarget.blur();
              }}
              className="w-full bg-transparent px-3 py-3 pb-12 text-sm text-[var(--foreground)] placeholder-[var(--muted)] outline-none resize-none"
              placeholder='Try "A clean onboarding flow with progress steps"'
              rows={6}
            />
            <div className="absolute right-2 bottom-2 flex items-center gap-2">
              {/* Animated Count Selector */}
              <div ref={countSelectorRef} className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsCountSelectorOpen(!isCountSelectorOpen);
                  }}
                  className="w-7 h-7 flex items-center justify-center text-xs font-medium text-[var(--muted)] border border-[var(--border)] rounded-md hover:bg-[#27272a] hover:text-[var(--foreground)] transition-colors"
                >
                  {imageCount}x
                </button>
                
                {/* Dropdown selector */}
                <div 
                  className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-1 flex flex-col-reverse items-center overflow-hidden transition-all duration-200 ease-out ${
                    isCountSelectorOpen 
                      ? 'opacity-100 max-h-32' 
                      : 'opacity-0 max-h-0 pointer-events-none'
                  }`}
                >
                  <div className="bg-[#1a1a1c] border border-[var(--border)] rounded-lg p-1 flex flex-col gap-0.5">
                    {[4, 3, 2, 1].map((num) => (
                      <button
                        key={num}
                        onClick={(e) => {
                          e.stopPropagation();
                          setImageCount(num);
                          setIsCountSelectorOpen(false);
                        }}
                        className={`w-7 h-7 flex items-center justify-center rounded text-xs font-medium transition-colors ${
                          imageCount === num 
                            ? 'bg-[var(--accent)] text-white' 
                            : 'text-[var(--muted)] hover:bg-[#27272a] hover:text-[var(--foreground)]'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              
              <button
                onClick={handleGenerateImage}
                disabled={isGenerating}
                className="w-7 h-7 flex items-center justify-center rounded-md bg-[var(--card)] hover:bg-[#27272a] border border-[var(--border)] transition-colors disabled:opacity-50"
              >
                {isGenerating ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" className="animate-spin">
                    <defs>
                      <linearGradient id="spinnerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#6F58E8" />
                        <stop offset="100%" stopColor="#4F38B5" />
                      </linearGradient>
                    </defs>
                    <circle 
                      cx="12" 
                      cy="12" 
                      r="9" 
                      fill="none" 
                      stroke="url(#spinnerGradient)" 
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeDasharray="42 14"
                    />
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-[var(--foreground)]">
                    <path d="M12 19V5M12 5l-6 6M12 5l6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
            </div>
          </div>
          {error && (
            <div className="mt-2 text-xs text-red-400">{error}</div>
          )}
        </div>
        </div>

        {/* Add Button - centered with card */}
        <button
          className="w-8 h-8 flex items-center justify-center rounded-full border border-[var(--border)] bg-[var(--card)] hover:bg-[#27272a] transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-[var(--muted)]">
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Image Modal */}
      {modalImageUrl && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setModalImageUrl(null)}
        >
          <div 
            className="relative max-w-[90vw] max-h-[90vh] rounded-xl overflow-hidden bg-[#09090b] border border-[var(--border)] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setModalImageUrl(null)}
              className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-black/50 hover:bg-black/70 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-white">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
            <img
              src={modalImageUrl}
              alt={node.prompt}
              className="max-w-[90vw] max-h-[90vh] object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
