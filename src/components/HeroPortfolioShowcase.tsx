import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useReducedMotion } from 'framer-motion';
import { heroShowcaseProjects, type HeroShowcaseProject } from '../data/heroShowcaseProjects';

const INACTIVITY_MS = 10_000;
const AUTO_SCROLL_PX_PER_SEC = 58;
const AUTO_SCROLL_PX_PER_SEC_REDUCED = 28;
const DRAG_THRESHOLD_PX = 8;
const ACTIVE_SYNC_MS = 250;
const TRACK_GAP_PX = 18;

function ShowcaseCard({
  project,
  priority,
  isActive,
}: {
  project: HeroShowcaseProject;
  priority?: boolean;
  isActive?: boolean;
}) {
  const [src, setSrc] = useState(project.image);

  return (
    <article
      data-project-id={project.id}
      className={`hero-showcase__card${isActive ? ' hero-showcase__card--active' : ''}`}
    >
      <div className="hero-showcase__frame">
        <div className="hero-showcase__chrome">
          <span className="hero-showcase__dot" />
          <span className="hero-showcase__dot" />
          <span className="hero-showcase__dot" />
          <span className="hero-showcase__url">{project.title}</span>
        </div>
        <div className="hero-showcase__screen">
          <img
            src={src}
            alt={`Screenshot of ${project.title}`}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            draggable={false}
            className={project.imageFit === 'contain' ? 'hero-showcase__img--contain' : undefined}
            style={{
              objectFit: project.imageFit ?? 'cover',
              objectPosition: project.imagePosition ?? 'top center',
            }}
            onError={() => {
              if (project.fallback && src !== project.fallback) setSrc(project.fallback);
            }}
          />
        </div>
      </div>
    </article>
  );
}

function ProjectSegment({
  projects,
  priorityCount,
  activeId,
  segmentRef,
  ariaHidden,
}: {
  projects: HeroShowcaseProject[];
  priorityCount?: number;
  activeId: number | null;
  segmentRef?: React.Ref<HTMLDivElement>;
  ariaHidden?: boolean;
}) {
  return (
    <div ref={segmentRef} className="hero-showcase__segment" aria-hidden={ariaHidden || undefined}>
      {projects.map((project, i) => (
        <ShowcaseCard
          key={project.id}
          project={project}
          priority={i < (priorityCount ?? 0)}
          isActive={activeId === project.id}
        />
      ))}
    </div>
  );
}

const HeroPortfolioShowcase: React.FC = () => {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const segmentRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const lastFrameRef = useRef(0);
  const lastActiveSyncRef = useRef(0);
  const inactivityTimerRef = useRef<number | null>(null);
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);
  const isDraggingRef = useRef(false);
  const dragStartOffsetRef = useRef(0);
  const isPausedRef = useRef(false);
  const canScrollRef = useRef(false);
  const offsetRef = useRef(0);
  const loopHeightRef = useRef(0);
  const touchStartYRef = useRef(0);
  const touchStartOffsetRef = useRef(0);

  const [isPaused, setIsPaused] = useState(false);
  const [activeId, setActiveId] = useState<number | null>(heroShowcaseProjects[0]?.id ?? null);
  const [isReady, setIsReady] = useState(false);

  const projects = heroShowcaseProjects;
  const activeProject = projects.find((p) => p.id === activeId);
  const scrollSpeed = reduceMotion ? AUTO_SCROLL_PX_PER_SEC_REDUCED : AUTO_SCROLL_PX_PER_SEC;

  const measureLoopHeight = useCallback(() => {
    const segment = segmentRef.current;
    if (!segment) return loopHeightRef.current;
    const height = segment.offsetHeight + TRACK_GAP_PX;
    if (height > 0) loopHeightRef.current = height;
    return loopHeightRef.current;
  }, []);

  const applyOffset = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const y = Math.round(offsetRef.current * 100) / 100;
    track.style.transform = `translate3d(0, ${-y}px, 0)`;
  }, []);

  const wrapOffset = useCallback(() => {
    const loopHeight = measureLoopHeight();
    if (loopHeight <= 0) return;
    if (offsetRef.current >= loopHeight) {
      offsetRef.current %= loopHeight;
    } else if (offsetRef.current < 0) {
      offsetRef.current = ((offsetRef.current % loopHeight) + loopHeight) % loopHeight;
    }
  }, [measureLoopHeight]);

  const nudgeOffset = useCallback(
    (delta: number) => {
      offsetRef.current += delta;
      wrapOffset();
      applyOffset();
    },
    [applyOffset, wrapOffset],
  );

  const getCenteredProjectId = useCallback((): number | null => {
    const viewport = viewportRef.current;
    if (!viewport) return projects[0]?.id ?? null;

    const viewportCenter = viewport.getBoundingClientRect().top + viewport.clientHeight / 2;
    let bestId: number | null = null;
    let bestDist = Infinity;

    viewport.querySelectorAll<HTMLElement>('[data-project-id]').forEach((el) => {
      const rect = el.getBoundingClientRect();
      const center = rect.top + rect.height / 2;
      const dist = Math.abs(center - viewportCenter);
      const id = Number(el.dataset.projectId);
      if (dist < bestDist) {
        bestDist = dist;
        bestId = id;
      }
    });

    return bestId;
  }, [projects]);

  const clearInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current != null) {
      window.clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }
  }, []);

  const syncActiveProject = useCallback(
    (force = false) => {
      const now = performance.now();
      if (!force && now - lastActiveSyncRef.current < ACTIVE_SYNC_MS) return;
      lastActiveSyncRef.current = now;
      setActiveId(getCenteredProjectId());
    },
    [getCenteredProjectId],
  );

  const updateScrollReady = useCallback(() => {
    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!viewport || !track) return;
    measureLoopHeight();
    canScrollRef.current = loopHeightRef.current > 0 && track.offsetHeight > viewport.clientHeight + 1;
    setIsReady(canScrollRef.current);
    wrapOffset();
    applyOffset();
  }, [applyOffset, measureLoopHeight, wrapOffset]);

  const bumpInactivity = useCallback(() => {
    if (!isPausedRef.current) return;
    clearInactivityTimer();
    inactivityTimerRef.current = window.setTimeout(() => {
      isPausedRef.current = false;
      setIsPaused(false);
    }, INACTIVITY_MS);
  }, [clearInactivityTimer]);

  const enterInteractive = useCallback(() => {
    if (!isPausedRef.current) {
      isPausedRef.current = true;
      setIsPaused(true);
      syncActiveProject(true);
    }
    bumpInactivity();
  }, [bumpInactivity, syncActiveProject]);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  useEffect(() => {
    if (isPaused) {
      bumpInactivity();
    } else {
      clearInactivityTimer();
    }
    return clearInactivityTimer;
  }, [isPaused, bumpInactivity, clearInactivityTimer]);

  useEffect(() => {
    updateScrollReady();
    const viewport = viewportRef.current;
    const track = trackRef.current;
    const segment = segmentRef.current;
    if (!viewport || !track) return;

    const observer = new ResizeObserver(() => updateScrollReady());
    observer.observe(viewport);
    observer.observe(track);
    if (segment) observer.observe(segment);

    const onLoad = () => updateScrollReady();
    window.addEventListener('load', onLoad);

    return () => {
      observer.disconnect();
      window.removeEventListener('load', onLoad);
    };
  }, [updateScrollReady]);

  useEffect(() => {
    if (isPaused || !isReady) {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      return;
    }

    lastFrameRef.current = performance.now();

    const step = (now: number) => {
      const tr = trackRef.current;
      if (!tr || isPausedRef.current || !canScrollRef.current) {
        rafRef.current = requestAnimationFrame(step);
        return;
      }

      const elapsed = Math.min(now - lastFrameRef.current, 48);
      lastFrameRef.current = now;

      offsetRef.current += (scrollSpeed * elapsed) / 1000;
      wrapOffset();
      applyOffset();
      syncActiveProject();

      rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [isPaused, isReady, scrollSpeed, applyOffset, wrapOffset, syncActiveProject]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (!isPausedRef.current) {
        isPausedRef.current = true;
        setIsPaused(true);
      }
      nudgeOffset(e.deltaY);
      syncActiveProject(true);
      bumpInactivity();
    };

    const onTouchStart = (e: TouchEvent) => {
      if (!isPausedRef.current) {
        isPausedRef.current = true;
        setIsPaused(true);
      }
      touchStartYRef.current = e.touches[0]?.clientY ?? 0;
      touchStartOffsetRef.current = offsetRef.current;
      bumpInactivity();
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isPausedRef.current) return;
      e.preventDefault();
      const y = e.touches[0]?.clientY ?? touchStartYRef.current;
      offsetRef.current = touchStartOffsetRef.current + (touchStartYRef.current - y);
      wrapOffset();
      applyOffset();
      syncActiveProject(true);
      bumpInactivity();
    };

    viewport.addEventListener('wheel', onWheel, { passive: false });
    viewport.addEventListener('touchstart', onTouchStart, { passive: true });
    viewport.addEventListener('touchmove', onTouchMove, { passive: false });

    return () => {
      viewport.removeEventListener('wheel', onWheel);
      viewport.removeEventListener('touchstart', onTouchStart);
      viewport.removeEventListener('touchmove', onTouchMove);
    };
  }, [applyOffset, bumpInactivity, nudgeOffset, syncActiveProject, wrapOffset]);

  const handlePointerDown = (e: React.PointerEvent) => {
    pointerStartRef.current = { x: e.clientX, y: e.clientY };
    if (e.pointerType !== 'mouse') return;
    isDraggingRef.current = false;
    dragStartOffsetRef.current = offsetRef.current;
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (e.pointerType !== 'mouse' || e.buttons !== 1) return;
    const start = pointerStartRef.current;
    if (!start) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    if (!isDraggingRef.current) {
      if (Math.abs(dx) < DRAG_THRESHOLD_PX && Math.abs(dy) < DRAG_THRESHOLD_PX) return;
      isDraggingRef.current = true;
      enterInteractive();
    }
    offsetRef.current = dragStartOffsetRef.current - dy;
    wrapOffset();
    applyOffset();
    syncActiveProject(true);
    bumpInactivity();
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (e.pointerType === 'mouse') isDraggingRef.current = false;
  };

  const handleClick = (e: React.MouseEvent) => {
    const start = pointerStartRef.current;
    if (start) {
      const dx = Math.abs(e.clientX - start.x);
      const dy = Math.abs(e.clientY - start.y);
      if (dx > DRAG_THRESHOLD_PX || dy > DRAG_THRESHOLD_PX) return;
    }
    if (!isPausedRef.current) enterInteractive();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown' || e.key === 'PageDown') {
      e.preventDefault();
      enterInteractive();
      nudgeOffset(72);
      syncActiveProject(true);
      bumpInactivity();
      return;
    }

    if (e.key === 'ArrowUp' || e.key === 'PageUp') {
      e.preventDefault();
      enterInteractive();
      nudgeOffset(-72);
      syncActiveProject(true);
      bumpInactivity();
      return;
    }

    if (e.key === 'Enter' && isPausedRef.current && activeId != null) {
      e.preventDefault();
      navigate(`/portfolio?project=${activeId}`);
    }
  };

  const viewLabel = activeProject?.title ?? 'project';

  return (
    <div className="hero-showcase">
      <div
        ref={viewportRef}
        className={`hero-showcase__viewport${isPaused ? ' hero-showcase__viewport--interactive' : ' hero-showcase__viewport--auto'}`}
        tabIndex={0}
        aria-label="Portfolio project showcase"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
      >
        <div ref={trackRef} className="hero-showcase__track">
          <ProjectSegment
            segmentRef={segmentRef}
            projects={projects}
            priorityCount={2}
            activeId={activeId}
          />
          <ProjectSegment projects={projects} activeId={activeId} ariaHidden />
        </div>
      </div>

      {isPaused && activeId != null && (
        <div className="hero-showcase__footer">
          <button
            type="button"
            className="hero-showcase__view-btn"
            onClick={() => navigate(`/portfolio?project=${activeId}`)}
          >
            View {viewLabel}
          </button>
        </div>
      )}
    </div>
  );
};

export default HeroPortfolioShowcase;
