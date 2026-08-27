'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  loadStore,
  saveStore,
  getProject,
  addNode,
  updateNode,
  deleteNode,
  duplicateNode,
  createIdeaNode,
  createImageNode,
} from '@/lib/store';
import { MiraStore, Project, MiraNode, UIIdeaNode, UIImageNode } from '@/lib/types';
import UIIdeaNodeComponent from '@/components/UIIdeaNode';
import UIImageNodeComponent from '@/components/UIImageNode';
import CommandMenu from '@/components/CommandMenu';

export default function CanvasPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.projectId as string;

  const [store, setStore] = useState<MiraStore>({ projects: [] });
  const [project, setProject] = useState<Project | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedNodeIds, setSelectedNodeIds] = useState<Set<string>>(new Set());
  const [saved, setSaved] = useState(true);
  const [combineLoading, setCombineLoading] = useState(false);
  const [analyzeLoading, setAnalyzeLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [commandMenuOpen, setCommandMenuOpen] = useState(false);

  const canvasRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loaded = loadStore();
    setStore(loaded);
    const proj = getProject(loaded, projectId);
    if (proj) {
      setProject(proj);
    }
    setIsLoaded(true);
  }, [projectId]);

  useEffect(() => {
    if (isLoaded && project) {
      const newStore = {
        ...store,
        projects: store.projects.map((p) => (p.id === projectId ? project : p)),
      };
      setStore(newStore);
      saveStore(newStore);
      setSaved(true);
    }
  }, [project, isLoaded]);

  const handleAddIdeaNode = () => {
    if (!project) return;
    const node = createIdeaNode(100 + Math.random() * 200, 100 + Math.random() * 200);
    setProject({ ...project, nodes: [...project.nodes, node], updatedAt: Date.now() });
    setSaved(false);
  };

  const handleAddImageNode = () => {
    if (!project) return;
    const node = createImageNode(100 + Math.random() * 200, 100 + Math.random() * 200);
    setProject({ ...project, nodes: [...project.nodes, node], updatedAt: Date.now() });
    setSaved(false);
  };

  const handleUpdateNode = useCallback((nodeId: string, updates: Partial<MiraNode>) => {
    setProject((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        nodes: prev.nodes.map((n) =>
          n.id === nodeId ? { ...n, ...updates, updatedAt: Date.now() } as MiraNode : n
        ),
        updatedAt: Date.now(),
      };
    });
    setSaved(false);
  }, []);

  const handleDeleteSelected = useCallback(() => {
    if (!project || selectedNodeIds.size === 0) return;
    setProject({
      ...project,
      nodes: project.nodes.filter((n) => !selectedNodeIds.has(n.id)),
      updatedAt: Date.now(),
    });
    setSelectedNodeIds(new Set());
    setSaved(false);
  }, [project, selectedNodeIds]);

  const handleDuplicateSelected = useCallback(() => {
    if (!project || selectedNodeIds.size === 0) return;
    const newNodes: MiraNode[] = [];
    project.nodes.forEach((node) => {
      if (selectedNodeIds.has(node.id)) {
        const newNode: MiraNode = {
          ...node,
          id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          x: node.x + 20,
          y: node.y + 20,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        newNodes.push(newNode);
      }
    });
    setProject({
      ...project,
      nodes: [...project.nodes, ...newNodes],
      updatedAt: Date.now(),
    });
    setSelectedNodeIds(new Set(newNodes.map((n) => n.id)));
    setSaved(false);
  }, [project, selectedNodeIds]);

  const handleSelectNode = useCallback((nodeId: string, addToSelection: boolean) => {
    setSelectedNodeIds((prev) => {
      const next = new Set(addToSelection ? prev : []);
      if (prev.has(nodeId) && addToSelection) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }, []);

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (e.target === canvasRef.current) {
      setSelectedNodeIds(new Set());
    }
  }, []);

  const handleCombineSelected = async () => {
    if (!project || selectedNodeIds.size !== 2) return;
    setActionError(null);
    setCombineLoading(true);
    
    const selectedNodes = project.nodes.filter((n) => selectedNodeIds.has(n.id));
    const contents = selectedNodes.map((n) => {
      if (n.type === 'idea') return `Title: ${n.title}\nBody: ${(n as UIIdeaNode).body}`;
      if (n.type === 'image') return `Title: ${n.title}\nPrompt: ${(n as UIImageNode).prompt}`;
      return '';
    });

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operation: 'combine', contents }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to combine');

      const newNode = createIdeaNode(
        Math.max(...selectedNodes.map((n) => n.x)) + 40,
        Math.min(...selectedNodes.map((n) => n.y))
      );
      newNode.title = 'Combined Concept';
      newNode.body = data.result;

      setProject({
        ...project,
        nodes: [...project.nodes, newNode],
        updatedAt: Date.now(),
      });
      setSelectedNodeIds(new Set([newNode.id]));
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Combine failed');
    } finally {
      setCombineLoading(false);
    }
  };

  const handleAnalyzeSelected = async () => {
    if (!project || selectedNodeIds.size === 0) return;
    setActionError(null);
    setAnalyzeLoading(true);

    const selectedNodes = project.nodes.filter((n) => selectedNodeIds.has(n.id));
    const contents = selectedNodes.map((n) => {
      if (n.type === 'idea') return `Title: ${n.title}\nBody: ${(n as UIIdeaNode).body}`;
      if (n.type === 'image') return `Title: ${n.title}\nPrompt: ${(n as UIImageNode).prompt}`;
      return '';
    });

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operation: 'analyze', contents }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to analyze');

      const newNode = createIdeaNode(
        Math.max(...selectedNodes.map((n) => n.x)) + 40,
        Math.min(...selectedNodes.map((n) => n.y))
      );
      newNode.title = 'UX Analysis';
      newNode.body = data.result;

      setProject({
        ...project,
        nodes: [...project.nodes, newNode],
        updatedAt: Date.now(),
      });
      setSelectedNodeIds(new Set([newNode.id]));
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setAnalyzeLoading(false);
    }
  };

  const handleUpload = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && project) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageUrl = event.target?.result as string;
        const node = createImageNode(100 + Math.random() * 200, 100 + Math.random() * 200);
        node.title = file.name.replace(/\.[^/.]+$/, '');
        node.imageUrl = imageUrl;
        setProject({ ...project, nodes: [...project.nodes, node], updatedAt: Date.now() });
        setSaved(false);
      };
      reader.readAsDataURL(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [project]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';
      
      if (e.key === '/' && !isInput && !commandMenuOpen) {
        e.preventDefault();
        setCommandMenuOpen(true);
        return;
      }
      
      if ((e.key === 'Delete' || e.key === 'Backspace') && !isInput) {
        e.preventDefault();
        handleDeleteSelected();
      }
      
      if ((e.metaKey || e.ctrlKey) && e.key === 'd' && !isInput) {
        e.preventDefault();
        handleDuplicateSelected();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleDeleteSelected, handleDuplicateSelected, commandMenuOpen]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-[var(--muted)]">Loading...</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-[var(--muted)] mb-4">Project not found</div>
          <button onClick={() => router.push('/app')} className="btn">
            Back to Projects
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Top Bar */}
      <div className="h-14 border-b border-[var(--border)] bg-[var(--card)] flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/app')}
            className="p-2 rounded hover:bg-[#27272a] text-[var(--muted)] hover:text-white transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <h1 className="font-medium">{project.name}</h1>
          <span className="text-xs text-[var(--muted)]">
            {saved ? 'Saved' : 'Saving...'}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handleCombineSelected}
            disabled={selectedNodeIds.size !== 2 || combineLoading}
            className="btn"
            title="Select exactly 2 nodes to combine"
          >
            {combineLoading ? (
              <span className="animate-spin">⟳</span>
            ) : (
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            )}
            Combine ({selectedNodeIds.size}/2)
          </button>
          
          <button
            onClick={handleAnalyzeSelected}
            disabled={selectedNodeIds.size === 0 || analyzeLoading}
            className="btn"
            title="Select 1+ nodes to analyze"
          >
            {analyzeLoading ? (
              <span className="animate-spin">⟳</span>
            ) : (
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" />
                <path d="M8 5v3l2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
            Analyze ({selectedNodeIds.size})
          </button>
        </div>
      </div>

      {/* Action Error */}
      {actionError && (
        <div className="bg-red-900/50 border-b border-red-800 px-4 py-2 text-sm text-red-200 flex items-center justify-between">
          <span>{actionError}</span>
          <button onClick={() => setActionError(null)} className="text-red-400 hover:text-red-200">
            ✕
          </button>
        </div>
      )}

      {/* Canvas */}
      <div
        ref={canvasRef}
        className="flex-1 grid-bg relative overflow-auto"
        onClick={handleCanvasClick}
      >
        {project.nodes.map((node) => (
          node.type === 'idea' ? (
            <UIIdeaNodeComponent
              key={node.id}
              node={node as UIIdeaNode}
              isSelected={selectedNodeIds.has(node.id)}
              onSelect={(addToSelection) => handleSelectNode(node.id, addToSelection)}
              onUpdate={(updates) => handleUpdateNode(node.id, updates)}
            />
          ) : (
            <UIImageNodeComponent
              key={node.id}
              node={node as UIImageNode}
              isSelected={selectedNodeIds.has(node.id)}
              onSelect={(addToSelection) => handleSelectNode(node.id, addToSelection)}
              onUpdate={(updates) => handleUpdateNode(node.id, updates)}
            />
          )
        ))}

        {project.nodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center text-[var(--muted)]">
              <p className="mb-2">Empty canvas</p>
              <p className="text-sm">Press <kbd className="px-1.5 py-0.5 bg-[var(--card)] border border-[var(--border)] rounded text-xs">/</kbd> to add a node</p>
            </div>
          </div>
        )}
      </div>

      <CommandMenu
        isOpen={commandMenuOpen}
        onClose={() => setCommandMenuOpen(false)}
        onAddText={handleAddIdeaNode}
        onAddImage={handleAddImageNode}
        onUpload={handleUpload}
      />

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
