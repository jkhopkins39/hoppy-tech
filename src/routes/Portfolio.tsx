import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Footer from '../components/Footer';

interface Project {
  id: number;
  title: string;
  description: string;
  shortDescription: string;
  image: string;
  imageWebP?: string;
  imageFallback?: string;
  technologies: string[];
  repoUrl?: string;
  liveUrl?: string;
  category: 'web' | 'mobile' | 'ai' | 'other';
}

const CATEGORY_COLORS: Record<string, string> = {
  web: '#E8971A',
  mobile: '#0EA5E9',
  ai: '#7C5CBF',
  other: '#10B981',
};

const CATEGORY_BG: Record<string, string> = {
  web: 'rgba(232,151,26,0.1)',
  mobile: 'rgba(14,165,233,0.1)',
  ai: 'rgba(124,92,191,0.1)',
  other: 'rgba(16,185,129,0.1)',
};

const initialProjects: Project[] = [
  {
    id: 1,
    title: "Watch Trading Post",
    description: "A luxury timepiece marketplace showcasing exceptional watches from the world's finest brands. Features an elegant design with smooth animations and a comprehensive collection of high-end timepieces for discerning collectors.",
    shortDescription: "Luxury timepiece marketplace",
    image: "/images/projects/watch.webp",
    imageWebP: "/images/projects/watch.webp",
    imageFallback: "/images/projects/watch.png",
    technologies: ["React", "Node.js", "Tailwind CSS", "Stripe"],
    repoUrl: "",
    liveUrl: "https://www.watchtradingpost.com/",
    category: "web",
  },
  {
    id: 2,
    title: "Landlock Solutions LLC",
    description: "A professional business website showcasing comprehensive solutions and services. Built with modern web technologies to provide an excellent user experience and clear communication of business offerings.",
    shortDescription: "Professional business solutions website",
    image: "/images/projects/land.webp",
    imageWebP: "/images/projects/land.webp",
    imageFallback: "/images/projects/land.png",
    technologies: ["React", "Node.js", "Tailwind CSS"],
    repoUrl: "",
    liveUrl: "https://landlocksolutionsllc.com",
    category: "web",
  },
  {
    id: 3,
    title: "SXNCTUARY",
    description: "A modern web platform featuring innovative design and functionality. This project demonstrates advanced web development techniques and creative user interface design for a DNB music artist.",
    shortDescription: "Modern website for DNB artist",
    image: "/images/projects/sxnctuary.webp",
    imageWebP: "/images/projects/sxnctuary.webp",
    imageFallback: "/images/projects/sxnctuary.png",
    technologies: ["React", "Node.js", "Tailwind CSS"],
    repoUrl: "",
    liveUrl: "https://sxnctuary.com",
    category: "web",
  },
  {
    id: 4,
    title: "Joshua 1:9 Law Firm LLC",
    description:
      "A website that informs the user of the legal services offered by the firm. In addition, it offers multiple ways for the user to reach out if they need legal help. Built with React, Tailwind CSS, and Resend; deployed on Vercel.",
    shortDescription: "Alabama law firm",
    image: "/images/projects/joshua19.svg",
    imageFallback: "/images/projects/joshua-firm.png",
    technologies: ["React", "Tailwind CSS", "Resend", "Vercel"],
    repoUrl: "",
    liveUrl: "https://joshua19lawfirm.com",
    category: "web",
  },
];

const categories = [
  { id: 'all', label: 'All' },
  { id: 'web', label: 'Web' },
  { id: 'mobile', label: 'Mobile' },
  { id: 'ai', label: 'AI / ML' },
  { id: 'other', label: 'Other' },
];

const Portfolio: React.FC = () => {
  const [expandedProject, setExpandedProject] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [techInput, setTechInput] = useState('');

  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem('portfolioProjects');
    return saved ? JSON.parse(saved) : initialProjects;
  });

  const [newProject, setNewProject] = useState<Partial<Project>>({
    title: '', description: '', shortDescription: '',
    image: '', technologies: [], category: 'web', liveUrl: '', repoUrl: '',
  });

  React.useEffect(() => {
    const check = () => setIsLoggedIn(localStorage.getItem('blogAdminLoggedIn') === 'true');
    check();
    window.addEventListener('storage', check);
    const iv = setInterval(check, 1000);
    return () => { window.removeEventListener('storage', check); clearInterval(iv); };
  }, []);

  const saveProjects = (p: Project[]) => {
    setProjects(p);
    localStorage.setItem('portfolioProjects', JSON.stringify(p));
  };

  const handleAddProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProject.title || !newProject.description) return;

    if (editingId) {
      saveProjects(projects.map(p => p.id === editingId
        ? { ...p, ...newProject, id: p.id, technologies: newProject.technologies || [] } as Project
        : p
      ));
      setEditingId(null);
    } else {
      const project: Project = {
        id: Date.now(),
        title: newProject.title!,
        description: newProject.description!,
        shortDescription: newProject.shortDescription || '',
        image: newProject.image || '/placeholder-image.jpg',
        imageWebP: newProject.image,
        imageFallback: newProject.image,
        technologies: newProject.technologies || [],
        category: newProject.category as Project['category'],
        liveUrl: newProject.liveUrl,
        repoUrl: newProject.repoUrl,
      };
      saveProjects([project, ...projects]);
    }

    setNewProject({ title: '', description: '', shortDescription: '', image: '', technologies: [], category: 'web', liveUrl: '', repoUrl: '' });
    setIsAddingProject(false);
  };

  const handleEditProject = (project: Project) => {
    setNewProject({ ...project });
    setEditingId(project.id);
    setIsAddingProject(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteProject = (id: number) => {
    if (window.confirm('Delete this project?')) saveProjects(projects.filter(p => p.id !== id));
  };

  const handleAddTech = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && techInput.trim()) {
      e.preventDefault();
      setNewProject(prev => ({ ...prev, technologies: [...(prev.technologies || []), techInput.trim()] }));
      setTechInput('');
    }
  };

  const removeTech = (t: string) => {
    setNewProject(prev => ({ ...prev, technologies: (prev.technologies || []).filter(x => x !== t) }));
  };

  const filteredProjects = selectedCategory === 'all'
    ? projects
    : projects.filter(p => p.category === selectedCategory);

  const inputClass = "w-full px-4 py-3 bg-surface border border-subtle rounded-xl text-ink placeholder-muted-3 focus:border-accent-subtle transition-colors text-sm";
  const labelClass = "block text-[11px] uppercase tracking-widest text-muted font-semibold mb-2";

  return (
    <div className="min-h-screen bg-canvas text-ink">
      {/* ─── Header ─────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-14 pb-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span className="text-accent text-[13px] font-mono uppercase tracking-widest">Featured work</span>
          <h1 className="mt-2 text-[clamp(2.2rem,5vw,4rem)] font-bold leading-[1.1] tracking-tight">
            Projects &{' '}
            <span
              style={{
                fontFamily: "'DM Serif Display', Georgia, serif",
                fontStyle: "italic",
                background: "linear-gradient(135deg, var(--accent-light), var(--accent))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Case Studies
            </span>
          </h1>
          <p className="mt-4 text-muted text-lg leading-relaxed max-w-2xl">
            A selection of projects I've built — from luxury marketplaces to AI-powered applications.
          </p>
        </motion.div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-24">
        {/* Admin add button */}
        {isLoggedIn && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-8 flex justify-end"
          >
            <button
              onClick={() => {
                if (isAddingProject) { setIsAddingProject(false); setEditingId(null); }
                else setIsAddingProject(true);
              }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-subtle bg-surface hover:border-emerald-500/30 hover:bg-emerald-500/5 text-[14px] font-medium text-ink transition-all duration-200"
            >
              {isAddingProject ? (
                <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>Cancel</>
              ) : (
                <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>Add Project</>
              )}
            </button>
          </motion.div>
        )}

        {/* Add/Edit form */}
        <AnimatePresence>
          {isLoggedIn && isAddingProject && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden mb-10"
            >
              <div className="rounded-2xl border border-subtle bg-surface p-6 md:p-8">
                <h2 className="font-bold text-lg text-ink mb-6">{editingId ? 'Edit Project' : 'Add New Project'}</h2>
                <form onSubmit={handleAddProject} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className={labelClass}>Title</label>
                      <input type="text" value={newProject.title} onChange={e => setNewProject({...newProject, title: e.target.value})} className={inputClass} placeholder="Project title" required />
                    </div>
                    <div>
                      <label className={labelClass}>Category</label>
                      <select value={newProject.category} onChange={e => setNewProject({...newProject, category: e.target.value as Project['category']})} className={inputClass}>
                        <option value="web" className="bg-surface">Web</option>
                        <option value="mobile" className="bg-surface">Mobile</option>
                        <option value="ai" className="bg-surface">AI / ML</option>
                        <option value="other" className="bg-surface">Other</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Short Description</label>
                    <input type="text" value={newProject.shortDescription} onChange={e => setNewProject({...newProject, shortDescription: e.target.value})} className={inputClass} placeholder="One-liner summary" />
                  </div>
                  <div>
                    <label className={labelClass}>Full Description</label>
                    <textarea value={newProject.description} onChange={e => setNewProject({...newProject, description: e.target.value})} className={`${inputClass} resize-none h-28`} placeholder="Detailed description" required />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className={labelClass}>Image URL</label>
                      <input type="text" value={newProject.image} onChange={e => setNewProject({...newProject, image: e.target.value})} className={inputClass} placeholder="/path/to/image.webp" />
                    </div>
                    <div>
                      <label className={labelClass}>Technologies (Enter to add)</label>
                      <div className={`${inputClass} flex flex-wrap gap-2 min-h-[46px]`} style={{ padding: '8px 12px' }}>
                        {newProject.technologies?.map(t => (
                          <span key={t} className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-accent-subtle text-accent text-xs">
                            {t}
                            <button type="button" onClick={() => removeTech(t)} className="hover:text-white">×</button>
                          </span>
                        ))}
                        <input type="text" value={techInput} onChange={e => setTechInput(e.target.value)} onKeyDown={handleAddTech} className="bg-transparent outline-none flex-1 min-w-[80px] text-sm" placeholder="Type & Enter" />
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className={labelClass}>Live URL</label>
                      <input type="text" value={newProject.liveUrl} onChange={e => setNewProject({...newProject, liveUrl: e.target.value})} className={inputClass} placeholder="https://..." />
                    </div>
                    <div>
                      <label className={labelClass}>Repository URL</label>
                      <input type="text" value={newProject.repoUrl} onChange={e => setNewProject({...newProject, repoUrl: e.target.value})} className={inputClass} placeholder="https://github.com/..." />
                    </div>
                  </div>
                  <button type="submit" className="w-full py-3.5 bg-accent hover:bg-accent-light text-canvas font-semibold rounded-xl transition-colors duration-200 text-[14px]">
                    {editingId ? 'Update Project' : 'Save Project'}
                  </button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Category filter */}
        <div className="flex gap-2 flex-wrap mb-10">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-xl text-[13px] font-medium transition-all duration-200 ${
                selectedCategory === cat.id
                  ? 'bg-accent text-canvas'
                  : 'border border-subtle bg-surface text-muted hover:text-ink hover:border-white/[0.12]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Projects grid */}
        <motion.div
          layout
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <AnimatePresence mode="popLayout">
            {filteredProjects.map((project, index) => {
              const color = CATEGORY_COLORS[project.category] || '#E8971A';
              const bg = CATEGORY_BG[project.category] || 'rgba(232,151,26,0.1)';
              const isExpanded = expandedProject === project.id;

              return (
                <motion.div
                  key={project.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.4, delay: index * 0.07 }}
                  className="group rounded-2xl border border-subtle bg-surface overflow-hidden hover:border-white/[0.12] transition-all duration-300 flex flex-col"
                >
                  {/* Image */}
                  <div className="relative h-48 overflow-hidden flex-none">
                    {isLoggedIn && (
                      <div className="absolute top-3 right-3 z-20 flex gap-2">
                        <button onClick={(e) => { e.stopPropagation(); handleEditProject(project); }} className="p-2 rounded-lg bg-black/60 backdrop-blur-sm border border-white/10 text-white hover:border-blue-400/40 transition-all">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleDeleteProject(project.id); }} className="p-2 rounded-lg bg-black/60 backdrop-blur-sm border border-white/10 text-white hover:border-red-400/40 transition-all">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    )}
                    <picture>
                      {project.imageWebP ? (
                        <source srcSet={project.imageWebP} type="image/webp" />
                      ) : null}
                      <img
                        src={project.imageFallback || project.image}
                        alt={project.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                        onError={(e) => {
                          const t = e.target as HTMLImageElement;
                          if (project.imageFallback && project.imageFallback !== project.image) t.src = project.imageFallback;
                          else t.style.display = 'none';
                        }}
                      />
                    </picture>
                    <div className="absolute inset-0 bg-gradient-to-t from-[#111119] via-transparent to-transparent opacity-70" />

                    {/* Category chip */}
                    <div className="absolute bottom-3 left-3">
                      <span
                        className="px-2.5 py-1 rounded-lg text-[11px] font-semibold uppercase tracking-wider"
                        style={{ background: bg, color }}
                      >
                        {project.category}
                      </span>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="flex flex-col flex-1 p-5">
                    <div
                      className="h-[2px] w-8 mb-4 rounded-full flex-none"
                      style={{ background: color }}
                    />
                    <h3 className="font-semibold text-[17px] text-ink mb-1.5 leading-snug">{project.title}</h3>
                    <p className="text-muted text-sm leading-relaxed mb-4">{project.shortDescription}</p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5 mb-5">
                      {project.technologies.slice(0, 3).map(t => (
                        <span key={t} className="px-2.5 py-1 rounded-lg text-[11px] font-medium text-muted bg-white/[0.04] border border-white/[0.05]">
                          {t}
                        </span>
                      ))}
                      {project.technologies.length > 3 && (
                        <span className="px-2.5 py-1 rounded-lg text-[11px] font-medium text-muted bg-white/[0.04] border border-white/[0.05]">
                          +{project.technologies.length - 3}
                        </span>
                      )}
                    </div>

                    {/* Expand toggle */}
                    <button
                      onClick={() => setExpandedProject(isExpanded ? null : project.id)}
                      className="mt-auto w-full py-2.5 rounded-xl border border-subtle hover:border-white/[0.12] text-[13px] font-medium text-muted hover:text-ink transition-all duration-200"
                    >
                      {isExpanded ? 'Show less' : 'Learn more'}
                    </button>

                    {/* Expanded content */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <div className="pt-4 mt-4 border-t border-subtle">
                            <p className="text-muted text-sm leading-relaxed mb-4">{project.description}</p>
                            <div className="flex gap-3">
                              {project.repoUrl && (
                                <a href={project.repoUrl} target="_blank" rel="noopener noreferrer"
                                  className="flex-1 py-2.5 flex items-center justify-center gap-2 rounded-xl border border-subtle text-[13px] font-medium text-muted hover:text-ink hover:border-white/[0.15] transition-all">
                                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" /></svg>
                                  Repo
                                </a>
                              )}
                              {project.liveUrl && (
                                <a href={project.liveUrl} target="_blank" rel="noopener noreferrer"
                                  className="flex-1 py-2.5 flex items-center justify-center gap-2 rounded-xl text-[13px] font-semibold text-canvas transition-all hover:scale-[1.01]"
                                  style={{ background: `linear-gradient(135deg, #FFBE3D, ${color})` }}>
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                  Live
                                </a>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>

        {filteredProjects.length === 0 && (
          <div className="text-center py-20 text-muted">
            <svg className="w-12 h-12 mx-auto mb-4 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <p>No projects in this category yet.</p>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default Portfolio;
