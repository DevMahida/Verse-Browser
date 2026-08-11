"use client";

import { useState, useRef, useCallback, useEffect, memo } from "react";
import { X, Plus, Volume2, VolumeX, ChevronLeft, ChevronRight, Search, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useBrowserStore } from "@/store/useBrowserStore";
import { useShallow } from "zustand/react/shallow";
import clsx from "clsx";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// ─── Single sortable tab row ───────────────────────────────────────────────────
const SortableVerticalTab = memo(function SortableVerticalTab({
  tab,
  isActive,
  isCollapsed,
  onSelect,
  onClose,
  onToggleMute,
  onContextMenu,
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: tab.id });

  const style = {
    transform: CSS.Transform.toString(
      transform ? { ...transform, x: 0 } : null
    ),
    transition,
    zIndex: isDragging ? 50 : "auto",
    opacity: isDragging ? 0.7 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onSelect(tab.id)}
      onAuxClick={(e) => {
        if (e.button === 1) {
          e.preventDefault();
          onClose(tab.id);
        }
      }}
      onContextMenu={(e) => onContextMenu(e, tab.id)}
      title={isCollapsed ? tab.title || tab.url : undefined}
      className={clsx(
        "group flex items-center rounded-lg cursor-pointer transition-all duration-150 select-none relative",
        "no-drag-region",
        isCollapsed
          ? "w-9 h-9 justify-center mx-auto"
          : "w-full px-2.5 py-1.5 gap-2.5",
        isActive
          ? "bg-accent/15 text-foreground border border-accent/30"
          : "text-foreground/70 hover:bg-surface-hover/70 hover:text-foreground border border-transparent"
      )}
    >
      {/* Favicon */}
      <div className="w-4 h-4 shrink-0 flex items-center justify-center">
        {tab.isLoading ? (
          <div className="w-4 h-4 animate-spin rounded-full border-2 border-gray-500 border-t-white" />
        ) : tab.url.startsWith("browser://") ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src="/favicon.png"
            className="w-4 h-4 object-contain"
            alt=""
          />
        ) : tab.favicon ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={tab.favicon}
            className="w-4 h-4 rounded-sm bg-foreground/10"
            alt=""
          />
        ) : (
          <div className="w-4 h-4 rounded-full bg-surface-hover/80" />
        )}
      </div>

      {/* Title + controls (only in expanded mode, non-pinned) */}
      {!isCollapsed && (
        <>
          <span className="flex-1 text-[13px] truncate leading-tight">
            {tab.title || "New Tab"}
          </span>

          <div className="flex items-center gap-0.5 shrink-0">
            {/* Audio indicator */}
            {(tab.isPlayingAudio || tab.isMuted) && (
              <button
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleMute(tab.id);
                }}
                aria-label={tab.isMuted ? "Unmute site" : "Mute site"}
                className="p-0.5 rounded hover:bg-foreground/10 transition-colors"
              >
                {tab.isMuted ? (
                  <VolumeX size={12} />
                ) : (
                  <Volume2 size={12} />
                )}
              </button>
            )}

            {/* Close button */}
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onClose(tab.id);
              }}
              aria-label="Close tab"
              className={clsx(
                "p-0.5 rounded hover:bg-foreground/10 transition-opacity",
                isActive
                  ? "opacity-70 hover:opacity-100"
                  : "opacity-0 group-hover:opacity-70 hover:opacity-100!"
              )}
            >
              <X size={12} />
            </button>
          </div>
        </>
      )}

      {/* Collapsed audio indicator dot */}
      {isCollapsed && tab.isPlayingAudio && !tab.isMuted && (
        <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-accent animate-pulse" />
      )}
      {isCollapsed && tab.isMuted && (
        <div className="absolute -top-0.5 -right-0.5">
          <VolumeX size={8} className="text-foreground/50" />
        </div>
      )}
    </div>
  );
});

// ─── Main Side Tab Panel ────────────────────────────────────────────────────────
export default function SideTabPanel() {
  const {
    tabs,
    activeTabId,
    splitTabId,
    setActiveTab,
    setFocusedPane,
    removeTab,
    addTab,
    toggleMute,
    sideTabsCollapsed,
    sideTabsAutoExpand,
    toggleSideTabsCollapsed,
    reorderTabs,
  } = useBrowserStore(
    useShallow((state) => ({
      tabs: state.tabs,
      activeTabId: state.activeTabId,
      splitTabId: state.splitTabId,
      setActiveTab: state.setActiveTab,
      setFocusedPane: state.setFocusedPane,
      removeTab: state.removeTab,
      addTab: state.addTab,
      toggleMute: state.toggleMute,
      sideTabsCollapsed: state.sideTabsCollapsed,
      sideTabsAutoExpand: state.sideTabsAutoExpand,
      toggleSideTabsCollapsed: state.toggleSideTabsCollapsed,
      reorderTabs: state.reorderTabs,
    }))
  );

  const [isHoverExpanded, setIsHoverExpanded] = useState(false);
  const hoverTimerRef = useRef(null);
  const panelRef = useRef(null);

  // Determine visual state
  const visuallyCollapsed = sideTabsCollapsed && !isHoverExpanded;

  // Auto-expand on hover
  const handleMouseEnter = useCallback(() => {
    if (sideTabsCollapsed && sideTabsAutoExpand) {
      hoverTimerRef.current = setTimeout(() => {
        setIsHoverExpanded(true);
      }, 300);
    }
  }, [sideTabsCollapsed, sideTabsAutoExpand]);

  const handleMouseLeave = useCallback(() => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    setIsHoverExpanded(false);
  }, []);

  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    };
  }, []);

  // Reset hover-expand when user explicitly toggles collapsed state
  const [prevSideTabsCollapsed, setPrevSideTabsCollapsed] = useState(sideTabsCollapsed);
  if (sideTabsCollapsed !== prevSideTabsCollapsed) {
    setPrevSideTabsCollapsed(sideTabsCollapsed);
    setIsHoverExpanded(false);
  }

  // Tab interactions
  const handleSelectTab = useCallback(
    (id) => {
      if (id === splitTabId) setFocusedPane("secondary");
      else if (id === activeTabId) setFocusedPane("primary");
      else setActiveTab(id);
    },
    [splitTabId, activeTabId, setFocusedPane, setActiveTab]
  );

  const handleContextMenu = useCallback((e, id) => {
    e.preventDefault();
    if (
      window.electron &&
      window.electron.tabManager &&
      window.electron.tabManager.openPopup
    ) {
      const popupWidth = 224;
      const popupHeight = 400;
      let x = Math.round(window.screenX + e.clientX);
      let y = Math.round(window.screenY + e.clientY);

      if (x + popupWidth > window.screenX + window.innerWidth) {
        x = window.screenX + window.innerWidth - popupWidth;
      }

      const baseUrl =
        typeof window !== "undefined"
          ? window.location.origin
          : "http://localhost:3000";
      const popupUrl = `${baseUrl}/popup?type=tab-context&tabId=${id}`;

      window.electron.tabManager.openPopup({
        url: popupUrl,
        width: popupWidth,
        height: popupHeight,
        x,
        y,
      });
    }
  }, []);

  const handleTabSearch = useCallback((e) => {
    if (
      window.electron &&
      window.electron.tabManager &&
      window.electron.tabManager.openPopup
    ) {
      const rect = e.currentTarget.getBoundingClientRect();
      const popupWidth = 256;
      const popupHeight = 350;
      let x = Math.round(window.screenX + rect.right + 8);
      let y = Math.round(window.screenY + rect.top);

      const baseUrl =
        typeof window !== "undefined"
          ? window.location.origin
          : "http://localhost:3000";
      const popupUrl = `${baseUrl}/popup?type=tab-search`;

      window.electron.tabManager.openPopup({
        url: popupUrl,
        width: popupWidth,
        height: popupHeight,
        x,
        y,
      });
    }
  }, []);

  // Drag & drop
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = tabs.findIndex((t) => t.id === active.id);
      const newIndex = tabs.findIndex((t) => t.id === over.id);
      reorderTabs(oldIndex, newIndex);
    }
  };

  const pinnedTabs = tabs.filter((t) => t.isPinned);
  const unpinnedTabs = tabs.filter((t) => !t.isPinned);

  return (
    <div
      ref={panelRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={clsx(
        "side-tab-panel flex flex-col bg-background border-r border-border shrink-0 select-none h-full transition-all duration-200 ease-in-out relative z-30",
        visuallyCollapsed ? "side-tab-panel--collapsed" : "side-tab-panel--expanded"
      )}
      style={{
        width: visuallyCollapsed ? 48 : 230,
      }}
    >
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div
        className={clsx(
          "flex items-center shrink-0 border-b border-border/50 no-drag-region",
          visuallyCollapsed
            ? "flex-col gap-1 py-2 px-1"
            : "flex-row justify-between px-3 py-2"
        )}
      >
        {/* Tab search */}
        <button
          onClick={handleTabSearch}
          aria-label="Search tabs"
          title="Search tabs"
          className="p-1.5 rounded-md hover:bg-surface-hover text-foreground/60 hover:text-foreground transition-colors"
        >
          <Search size={15} />
        </button>

        {/* Collapse / Expand toggle */}
        <button
          onClick={toggleSideTabsCollapsed}
          aria-label={sideTabsCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={sideTabsCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="p-1.5 rounded-md hover:bg-surface-hover text-foreground/60 hover:text-foreground transition-colors"
        >
          {visuallyCollapsed ? (
            <PanelLeftOpen size={15} />
          ) : (
            <PanelLeftClose size={15} />
          )}
        </button>
      </div>

      {/* ── Pinned tabs ────────────────────────────────────────────── */}
      {pinnedTabs.length > 0 && (
        <div
          className={clsx(
            "shrink-0 border-b border-border/50",
            visuallyCollapsed
              ? "flex flex-col items-center gap-1 py-2 px-1"
              : "flex flex-wrap gap-1.5 px-2.5 py-2"
          )}
        >
          {pinnedTabs.map((tab) => (
            <div
              key={tab.id}
              onClick={() => handleSelectTab(tab.id)}
              onAuxClick={(e) => {
                if (e.button === 1) {
                  e.preventDefault();
                  removeTab(tab.id);
                }
              }}
              onContextMenu={(e) => handleContextMenu(e, tab.id)}
              title={tab.title || tab.url}
              className={clsx(
                "w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer transition-all no-drag-region",
                tab.id === activeTabId || tab.id === splitTabId
                  ? "bg-accent/15 border border-accent/30"
                  : "hover:bg-surface-hover border border-transparent"
              )}
            >
              {tab.isLoading ? (
                <div className="w-4 h-4 animate-spin rounded-full border-2 border-gray-500 border-t-white" />
              ) : tab.url.startsWith("browser://") ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src="/favicon.png"
                  className="w-4 h-4 object-contain"
                  alt=""
                />
              ) : tab.favicon ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={tab.favicon}
                  className="w-4 h-4 rounded-sm bg-foreground/10"
                  alt=""
                />
              ) : (
                <div className="w-4 h-4 rounded-full bg-surface-hover/80" />
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Unpinned tab list (scrollable) ─────────────────────────── */}
      <div
        className={clsx(
          "flex-1 overflow-y-auto overflow-x-hidden side-tabs-scrollbar",
          visuallyCollapsed ? "px-1 py-1.5 space-y-1" : "px-1.5 py-1.5 space-y-0.5"
        )}
      >
        <DndContext
          id="side-tabs-dnd"
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={unpinnedTabs.map((t) => t.id)}
            strategy={verticalListSortingStrategy}
          >
            {unpinnedTabs.map((tab) => (
              <SortableVerticalTab
                key={tab.id}
                tab={tab}
                isActive={
                  tab.id === activeTabId || tab.id === splitTabId
                }
                isCollapsed={visuallyCollapsed}
                onSelect={handleSelectTab}
                onClose={removeTab}
                onToggleMute={toggleMute}
                onContextMenu={handleContextMenu}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>

      {/* ── Footer — New Tab ──────────────────────────────────────── */}
      <div
        className={clsx(
          "shrink-0 border-t border-border/50 no-drag-region",
          visuallyCollapsed
            ? "flex justify-center py-2"
            : "px-2 py-2"
        )}
      >
        <button
          onClick={() => addTab()}
          aria-label="New Tab"
          title="New Tab"
          className={clsx(
            "flex items-center rounded-lg transition-colors text-foreground/60 hover:text-foreground hover:bg-surface-hover",
            visuallyCollapsed
              ? "p-2 justify-center"
              : "w-full px-2.5 py-1.5 gap-2.5"
          )}
        >
          <Plus size={16} />
          {!visuallyCollapsed && (
            <span className="text-[13px]">New Tab</span>
          )}
        </button>
      </div>
    </div>
  );
}
