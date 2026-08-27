import { MiraStore, Project, MiraNode, UIIdeaNode, UIImageNode } from './types';

const STORAGE_KEY = 'mira_v0';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export function loadStore(): MiraStore {
  if (typeof window === 'undefined') {
    return { projects: [] };
  }
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      return JSON.parse(data) as MiraStore;
    }
  } catch (e) {
    console.error('Failed to load store:', e);
  }
  return { projects: [] };
}

export function saveStore(store: MiraStore): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch (e) {
    console.error('Failed to save store:', e);
  }
}

export function createProject(name: string): Project {
  const now = Date.now();
  return {
    id: generateId(),
    name,
    nodes: [],
    createdAt: now,
    updatedAt: now,
  };
}

export function createIdeaNode(x: number, y: number): UIIdeaNode {
  const now = Date.now();
  return {
    id: generateId(),
    type: 'idea',
    x,
    y,
    title: 'Untitled Idea',
    body: '',
    createdAt: now,
    updatedAt: now,
  };
}

export function createImageNode(x: number, y: number): UIImageNode {
  const now = Date.now();
  return {
    id: generateId(),
    type: 'image',
    x,
    y,
    title: 'Untitled Image',
    prompt: '',
    imageUrl: null,
    imageUrls: [],
    createdAt: now,
    updatedAt: now,
  };
}

export function addProject(store: MiraStore, project: Project): MiraStore {
  return {
    ...store,
    projects: [...store.projects, project],
  };
}

export function updateProject(store: MiraStore, projectId: string, updates: Partial<Project>): MiraStore {
  return {
    ...store,
    projects: store.projects.map((p) =>
      p.id === projectId ? { ...p, ...updates, updatedAt: Date.now() } : p
    ),
  };
}

export function deleteProject(store: MiraStore, projectId: string): MiraStore {
  return {
    ...store,
    projects: store.projects.filter((p) => p.id !== projectId),
  };
}

export function getProject(store: MiraStore, projectId: string): Project | undefined {
  return store.projects.find((p) => p.id === projectId);
}

export function addNode(store: MiraStore, projectId: string, node: MiraNode): MiraStore {
  return updateProject(store, projectId, {
    nodes: [...(getProject(store, projectId)?.nodes || []), node],
  });
}

export function updateNode(store: MiraStore, projectId: string, nodeId: string, updates: Partial<MiraNode>): MiraStore {
  const project = getProject(store, projectId);
  if (!project) return store;

  return updateProject(store, projectId, {
    nodes: project.nodes.map((n) =>
      n.id === nodeId ? { ...n, ...updates, updatedAt: Date.now() } as MiraNode : n
    ),
  });
}

export function deleteNode(store: MiraStore, projectId: string, nodeId: string): MiraStore {
  const project = getProject(store, projectId);
  if (!project) return store;

  return updateProject(store, projectId, {
    nodes: project.nodes.filter((n) => n.id !== nodeId),
  });
}

export function duplicateNode(store: MiraStore, projectId: string, nodeId: string): MiraStore {
  const project = getProject(store, projectId);
  if (!project) return store;

  const node = project.nodes.find((n) => n.id === nodeId);
  if (!node) return store;

  const newNode: MiraNode = {
    ...node,
    id: generateId(),
    x: node.x + 20,
    y: node.y + 20,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  return addNode(store, projectId, newNode);
}
