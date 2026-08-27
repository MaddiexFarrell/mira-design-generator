'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { loadStore, saveStore, createProject, addProject, deleteProject, updateProject } from '@/lib/store';
import { MiraStore, Project } from '@/lib/types';

type NavItem = 'projects' | 'shared' | 'settings';

export default function ProjectsPage() {
  const router = useRouter();
  const [store, setStore] = useState<MiraStore>({ projects: [] });
  const [isLoaded, setIsLoaded] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [activeNav, setActiveNav] = useState<NavItem>('projects');

  useEffect(() => {
    setStore(loadStore());
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      saveStore(store);
    }
  }, [store, isLoaded]);

  const handleCreateProject = () => {
    const project = createProject('Untitled Project');
    setStore(addProject(store, project));
    router.push(`/app/${project.id}`);
  };

  const handleDeleteProject = (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation();
    if (confirm('Delete this project?')) {
      setStore(deleteProject(store, projectId));
    }
  };

  const handleStartRename = (e: React.MouseEvent, project: Project) => {
    e.stopPropagation();
    setEditingId(project.id);
    setEditingName(project.name);
  };

  const handleSaveRename = (projectId: string) => {
    if (editingName.trim()) {
      setStore(updateProject(store, projectId, { name: editingName.trim() }));
    }
    setEditingId(null);
    setEditingName('');
  };

  const handleKeyDown = (e: React.KeyboardEvent, projectId: string) => {
    if (e.key === 'Enter') {
      handleSaveRename(projectId);
    } else if (e.key === 'Escape') {
      setEditingId(null);
      setEditingName('');
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-[var(--muted)]">Loading...</div>
      </div>
    );
  }

  const navItems: { id: NavItem; label: string; icon: React.ReactNode }[] = [
    {
      id: 'projects',
      label: 'Projects',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      ),
    },
    {
      id: 'shared',
      label: 'Shared with me',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left Navigation Sidebar */}
      <aside className="w-64 border-r border-[var(--border)] flex flex-col">
        {/* User Profile Section */}
        <div className="p-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--accent)] to-purple-400 flex items-center justify-center text-white font-medium text-sm">
              MF
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">Madeline Farrell</p>
              <p className="text-xs text-[var(--muted)] truncate">madeline@example.com</p>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-3">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => setActiveNav(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    activeNav === item.id
                      ? 'bg-[var(--accent)] text-white'
                      : 'text-[var(--muted)] hover:text-white hover:bg-[#27272a]'
                  }`}
                >
                  {item.icon}
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Logo at bottom */}
        <div className="p-4 border-t border-[var(--border)]">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-[var(--accent)] flex items-center justify-center">
              <span className="text-white text-xs font-bold">M</span>
            </div>
            <span className="text-sm font-medium">Mira</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-8">
        <div className="max-w-5xl">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-semibold">
                {activeNav === 'projects' && 'Projects'}
                {activeNav === 'shared' && 'Shared with me'}
                {activeNav === 'settings' && 'Settings'}
              </h1>
              <p className="text-[var(--muted)] text-sm mt-1">
                {activeNav === 'projects' && 'Your design projects'}
                {activeNav === 'shared' && 'Projects shared with you'}
                {activeNav === 'settings' && 'Manage your preferences'}
              </p>
            </div>
            {activeNav === 'projects' && (
              <button onClick={handleCreateProject} className="btn btn-accent">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                New Project
              </button>
            )}
          </div>

          {activeNav === 'projects' && (
            <>
              {store.projects.length === 0 ? (
                <div className="text-center py-20">
                  <div className="text-[var(--muted)] mb-4">No projects yet</div>
                  <button onClick={handleCreateProject} className="btn">
                    Create your first project
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {store.projects
                    .sort((a, b) => b.updatedAt - a.updatedAt)
                    .map((project) => (
                      <div
                        key={project.id}
                        onClick={() => router.push(`/app/${project.id}`)}
                        className="node-card p-4 cursor-pointer group"
                      >
                        <div className="aspect-video bg-[#09090b] rounded-lg mb-3 grid-bg" />
                        
                        {editingId === project.id ? (
                          <input
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            onBlur={() => handleSaveRename(project.id)}
                            onKeyDown={(e) => handleKeyDown(e, project.id)}
                            onClick={(e) => e.stopPropagation()}
                            className="input text-sm font-medium"
                            autoFocus
                          />
                        ) : (
                          <h3 className="font-medium truncate">{project.name}</h3>
                        )}
                        
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-[var(--muted)]">
                            {project.nodes.length} node{project.nodes.length !== 1 ? 's' : ''}
                          </span>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => handleStartRename(e, project)}
                              className="p-1.5 rounded hover:bg-[#27272a] text-[var(--muted)] hover:text-white transition-colors"
                              title="Rename"
                            >
                              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                                <path d="M11.5 2.5l2 2M2 14l1-4 9-9 2 2-9 9-4 1z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </button>
                            <button
                              onClick={(e) => handleDeleteProject(e, project.id)}
                              className="p-1.5 rounded hover:bg-[#27272a] text-[var(--muted)] hover:text-red-400 transition-colors"
                              title="Delete"
                            >
                              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                                <path d="M3 4h10M6 4V3a1 1 0 011-1h2a1 1 0 011 1v1M5 4v9a1 1 0 001 1h4a1 1 0 001-1V4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </>
          )}

          {activeNav === 'shared' && (
            <div className="text-center py-20">
              <div className="text-[var(--muted)] mb-2">No shared projects</div>
              <p className="text-sm text-[var(--muted)]">Projects shared with you will appear here</p>
            </div>
          )}

          {activeNav === 'settings' && (
            <div className="space-y-6">
              <div className="node-card p-6">
                <h3 className="font-medium mb-4">Profile</h3>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[var(--accent)] to-purple-400 flex items-center justify-center text-white font-medium text-xl">
                    MF
                  </div>
                  <div>
                    <p className="font-medium">Madeline Farrell</p>
                    <p className="text-sm text-[var(--muted)]">madeline@example.com</p>
                  </div>
                </div>
              </div>
              <div className="node-card p-6">
                <h3 className="font-medium mb-4">Preferences</h3>
                <p className="text-sm text-[var(--muted)]">Settings options coming soon</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
