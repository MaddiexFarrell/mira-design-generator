export type NodeType = 'idea' | 'image';

export interface BaseNode {
  id: string;
  type: NodeType;
  x: number;
  y: number;
  title: string;
  createdAt: number;
  updatedAt: number;
}

export interface UIIdeaNode extends BaseNode {
  type: 'idea';
  body: string;
}

export interface UIImageNode extends BaseNode {
  type: 'image';
  prompt: string;
  imageUrl: string | null;
  imageUrls: string[];
}

export type MiraNode = UIIdeaNode | UIImageNode;

export interface Project {
  id: string;
  name: string;
  nodes: MiraNode[];
  createdAt: number;
  updatedAt: number;
}

export interface MiraStore {
  projects: Project[];
}
