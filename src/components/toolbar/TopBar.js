"use client";

import { X, Plus, User, LogOut, LogIn, MoreVertical, Settings, History, Download, Volume2, VolumeX, ChevronDown } from "lucide-react";
import { useEffect, useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useBrowserStore } from "@/store/useBrowserStore";
import { useShallow } from 'zustand/react/shallow';
import clsx from "clsx";
import TabContextMenu from "./TabContextMenu";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy, sortableKeyboardCoordinates, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Floating mini-window preview shown when tearing off a tab (Chrome-style)
function TearOffWindowPreview({ tab, mousePos }) {
  if (!tab || !mousePos) return null;
  return createPortal(
    <div
      className="fixed pointer-events-none z-9999"
      style={{
        left: mousePos.x - 150,
        top: mousePos.y - 10,
      }}
    >
      {/* Mini window frame */}
      <div className="w-75 rounded-lg overflow-hidden shadow-2xl border border-border/60/60" style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)' }}>
        {/* Mini title bar */}
        <div className="h-8 bg-background flex items-center px-3 space-x-2">
          <div className="flex items-center space-x-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
          </div>
        </div>
        {/* Mini tab bar showing the tab being torn */}
        <div className="h-7 bg-surface flex items-center px-2">
          <div className="flex items-center bg-surface rounded-t px-2 py-1 max-w-50">
            {tab.favicon ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={tab.favicon} className="w-3 h-3 rounded-sm mr-1.5 shrink-0" alt="" />
            ) : (
              <div className="w-3 h-3 rounded-full bg-gray-600 mr-1.5 shrink-0" />
            )}
            <span className="text-[10px] text-foreground/90 truncate">{tab.title || 'New Tab'}</span>
          </div>
        </div>
        {/* Mini page content placeholder */}
        <div className="h-40 bg-surface flex items-center justify-center">
          <div className="text-center">
            {tab.favicon ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={tab.favicon} className="w-8 h-8 mx-auto mb-2 rounded opacity-50" alt="" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src="/favicon.png" className="w-8 h-8 mx-auto mb-2 opacity-40" alt="" />
            )}
            <p className="text-[10px] text-gray-500 max-w-50 truncate px-4">{tab.title || tab.url}</p>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

function SortableTab({ tab, isActive, setActiveTab, removeTab, toggleMute, onContextMenu, frozenTabWidth, tabCount, isTearingOff }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: tab.id });

  // Always constrain to X-axis in the original DOM to prevent vertical scrollbars on the container.
  // The TearOffWindowPreview portal handles the actual vertical visual.
  const effectiveTransform = transform ? { ...transform, y: 0 } : null;

  const style = {
    transform: CSS.Transform.toString(effectiveTransform),
    transition: isTearingOff ? 'none' : transition,
    zIndex: isDragging ? 50 : 'auto',
    opacity: isDragging ? (isTearingOff ? 0 : 0.8) : 1, // Hide original completely when tearing off
    width: (!tab.isPinned && frozenTabWidth) ? frozenTabWidth : undefined,
    maxWidth: (!tab.isPinned && frozenTabWidth) ? frozenTabWidth : undefined,
  };

  const isOnlyTab = tabCount === 1 && !tab.isPinned;

  // Custom Window Dragging State
  const dragState = useRef({ isDragging: false, startX: 0, startY: 0 });

  const customListeners = isOnlyTab ? {
    onPointerDown: (e) => {
      if (e.button === 0) {
        dragState.current = { isDragging: true, startX: e.screenX, startY: e.screenY };
        e.currentTarget.setPointerCapture(e.pointerId);
      }
    },
    onPointerMove: (e) => {
      if (dragState.current.isDragging) {
        const dx = e.screenX - dragState.current.startX;
        const dy = e.screenY - dragState.current.startY;
        if (dx !== 0 || dy !== 0) {
          window.electron?.moveWindow(dx, dy);
          dragState.current.startX = e.screenX;
          dragState.current.startY = e.screenY;
        }
      }
    },
    onPointerUp: (e) => {
      if (dragState.current.isDragging) {
        dragState.current.isDragging = false;
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    },
    onPointerCancel: (e) => {
      if (dragState.current.isDragging) {
        dragState.current.isDragging = false;
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    }
  } : {
    ...listeners,
    onPointerDown: (e) => {
      // Don't let dnd-kit intercept middle (1) or right (2) clicks
      if (e.button === 1 || e.button === 2) {
        e.stopPropagation();
      } else {
        listeners?.onPointerDown?.(e);
      }
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...customListeners}
      onClick={() => setActiveTab(tab.id)}
      onContextMenu={(e) => onContextMenu(e, tab.id)}
      onAuxClick={(e) => {
        if (e.button === 1) { // middle click
          e.preventDefault();
          removeTab(tab.id);
        }
      }}
      className={clsx(
        "group flex items-center h-8 rounded-t-xl cursor-pointer border-t border-x transition-colors shrink-0",
        "no-drag-region", // Always no-drag-region natively, so we can intercept right clicks
        isActive 
          ? "bg-surface border-surface-hover text-foreground" 
          : "bg-transparent border-transparent text-foreground/70 hover:bg-surface-hover/50 hover:text-foreground/90",
        tab.isPinned ? "px-2 w-10 justify-center flex-none" : "px-3 min-w-12 max-w-60 flex-1"
      )}
    >
      <div 
        className="flex-1 flex items-center overflow-hidden h-full"
      >
        {tab.isLoading ? (
          <div className={clsx("w-4 h-4 shrink-0 animate-spin rounded-full border-2 border-gray-500 border-t-white", !tab.isPinned && "mr-2")} />
        ) : tab.url.startsWith('browser://') ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src="/favicon.png" className={clsx("w-4 h-4 object-contain shrink-0", !tab.isPinned && "mr-2")} alt="" />
        ) : tab.favicon ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={tab.favicon} className={clsx("w-4 h-4 rounded-sm shrink-0 bg-foreground/10", !tab.isPinned && "mr-2")} alt="" />
        ) : (
          <div className={clsx("w-4 h-4 rounded-full bg-surface-hover/80 shrink-0", !tab.isPinned && "mr-2")} />
        )}
        
        {!tab.isPinned && (
          <span className="flex-1 text-xs truncate">{tab.title}</span>
        )}
      </div>
      
      {!tab.isPinned && (
        <>
          <div className="flex items-center ml-1">
            {(tab.isPlayingAudio || tab.isMuted) && (
              <button
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleMute(tab.id);
                }}
                aria-label={tab.isMuted ? "Unmute site" : "Mute site"}
                className={clsx(
                  "relative before:absolute before:-inset-2 before:content-[''] p-1 rounded-md hover:bg-foreground/10 transition-colors mr-1 shrink-0 no-drag-region hidden sm:flex focus-visible:ring-2 focus-visible:outline-none",
                  isActive ? "text-foreground" : "text-foreground/70 group-hover:text-foreground/90"
                )}
                title={tab.isMuted ? "Unmute site" : "Mute site"}
              >
                {tab.isMuted ? <VolumeX size={12} /> : <Volume2 size={12} />}
              </button>
            )}
            <button
              onPointerDown={(e) => e.stopPropagation()} // Prevent drag when clicking close
              onClick={(e) => {
                e.stopPropagation();
                removeTab(tab.id);
              }}
              aria-label="Close tab"
              className={clsx(
                "relative before:absolute before:-inset-2 before:content-[''] p-1 rounded-md hover:bg-foreground/10 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 no-drag-region hidden sm:flex focus-visible:ring-2 focus-visible:outline-none",
                isActive ? "opacity-100" : ""
              )}
            >
              <X size={12} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default function TopBar() {
  const { tabs, activeTabId, splitTabId, setFocusedPane, setActiveTab, removeTab, addTab, isLoggedIn, userProfilePic, currentUser, accounts, checkLoginState, logoutGoogle, switchAccount, toggleMute, openSettingsTab, setDropdownOffset } = useBrowserStore(
    useShallow((state) => ({
      tabs: state.tabs,
      activeTabId: state.activeTabId,
      splitTabId: state.splitTabId,
      setFocusedPane: state.setFocusedPane,
      setActiveTab: state.setActiveTab,
      removeTab: state.removeTab,
      addTab: state.addTab,
      isLoggedIn: state.isLoggedIn,
      userProfilePic: state.userProfilePic,
      currentUser: state.currentUser,
      accounts: state.accounts,
      checkLoginState: state.checkLoginState,
      logoutGoogle: state.logoutGoogle,
      switchAccount: state.switchAccount,
      toggleMute: state.toggleMute,
      openSettingsTab: state.openSettingsTab,
      setDropdownOffset: state.setDropdownOffset,
    }))
  );
  
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [selectedLogoutAccount, setSelectedLogoutAccount] = useState('all');
  const [contextMenu, setContextMenu] = useState(null);
  const [frozenTabWidth, setFrozenTabWidth] = useState(null);
  const menuRef = useRef(null);
  const tabsContainerRef = useRef(null);

  useEffect(() => {
    if (showProfileMenu || contextMenu) {
      setDropdownOffset(250);
    } else {
      // Small timeout to avoid race condition with NavigationBar
      setTimeout(() => setDropdownOffset(0), 10);
    }
  }, [showProfileMenu, contextMenu, setDropdownOffset]);

  const handleRemoveTab = (id) => {
    if (tabsContainerRef.current) {
      const tabNodes = tabsContainerRef.current.querySelectorAll('.group');
      for (const node of tabNodes) {
        if (node.offsetWidth > 45) { // measure an unpinned tab
          setFrozenTabWidth(node.offsetWidth);
          break;
        }
      }
    }
    removeTab(id);
  };

  const [tearingOffTabId, setTearingOffTabId] = useState(null);
  const [mousePos, setMousePos] = useState(null);
  const [activeDragId, setActiveDragId] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Track mouse position globally during drag for the floating preview
  const mouseMoveHandler = useCallback((e) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  }, []);

  const handleDragStart = (event) => {
    setActiveDragId(event.active.id);
    window.addEventListener('mousemove', mouseMoveHandler);
    useBrowserStore.getState().setIsDraggingTab(true);
  };

  const handleDragMove = (event) => {
    const { active, delta } = event;
    // Mark as tearing off when dragged vertically beyond threshold
    if (Math.abs(delta.y) > 50) {
      setTearingOffTabId(active.id);
    } else {
      setTearingOffTabId(null);
    }
  };

  const handleDragEnd = (event) => {
    const { active, over, delta } = event;
    setTearingOffTabId(null);
    setActiveDragId(null);
    setMousePos(null);
    window.removeEventListener('mousemove', mouseMoveHandler);
    useBrowserStore.getState().setIsDraggingTab(false);
    
    // If dragged vertically by more than 50 pixels, consider it a tear-off
    if (Math.abs(delta.y) > 50) {
      const draggedTab = tabs.find(t => t.id === active.id);
      if (draggedTab && !draggedTab.isPinned && tabs.length > 1 && window.electron?.detachTab) {
        window.electron.detachTab(draggedTab, isIncognitoWindow);
        removeTab(draggedTab.id);
      }
      return;
    }

    if (over && active.id !== over.id) {
      const oldIndex = tabs.findIndex(t => t.id === active.id);
      const newIndex = tabs.findIndex(t => t.id === over.id);
      useBrowserStore.getState().reorderTabs(oldIndex, newIndex);
    }
  };

  const handleDragCancel = () => {
    setTearingOffTabId(null);
    setActiveDragId(null);
    setMousePos(null);
    window.removeEventListener('mousemove', mouseMoveHandler);
    useBrowserStore.getState().setIsDraggingTab(false);
  };

  const tearingOffTab = tearingOffTabId ? tabs.find(t => t.id === tearingOffTabId) : null;

  useEffect(() => {
    if (!useBrowserStore.getState().isLoggedIn) {
      useBrowserStore.getState().checkLoginState();
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div 
      className="h-11 bg-background flex items-end px-2 space-x-1 select-none drag-region"
      onDoubleClick={(e) => {
        if (!e.target.closest('.no-drag-region')) {
          window.electron?.maximize?.();
        }
      }}
    >
      {/* Invisible overlay to capture clicks over the webview when menus are open */}
      {showProfileMenu && (
        <div 
          className="fixed inset-0 z-40 no-drag-region"
          onClick={() => {
            setShowProfileMenu(false);
          }}
        />
      )}
      {/* App Icon / Logo area */}
      <div className="flex items-center px-3 h-8 mb-1 space-x-2 text-foreground no-drag-region">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/favicon.png" alt="Logo" className="w-5 h-5 object-contain" />
        <span className="text-sm font-semibold tracking-wide">Verse</span>
      </div>

      {/* Tab Search */}
      <button 
        aria-label="Search Tabs"
        className="h-8 w-8 flex items-center justify-center hover:bg-surface-hover text-foreground/70 hover:text-foreground transition-colors mb-px no-drag-region focus-visible:ring-2 focus-visible:outline-none rounded-md"
      >
        <ChevronDown size={16} />
      </button>

      {/* Tabs */}
      <div 
        className="flex-1 flex items-end space-x-1 overflow-x-auto no-scrollbar"
        ref={tabsContainerRef}
        onMouseLeave={() => setFrozenTabWidth(null)}
      >
        <DndContext 
          id="browser-tabs-dnd"
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragMove={handleDragMove}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <SortableContext 
            items={tabs.map(t => t.id)} 
            strategy={horizontalListSortingStrategy}
          >
            {tabs.map((tab) => (
              <SortableTab 
                key={tab.id} 
                tab={tab} 
                isActive={tab.id === activeTabId || tab.id === splitTabId} 
                setActiveTab={(id) => {
                  if (id === splitTabId) setFocusedPane('secondary');
                  else if (id === activeTabId) setFocusedPane('primary');
                  else setActiveTab(id);
                }}
                removeTab={handleRemoveTab} 
                toggleMute={toggleMute}
                frozenTabWidth={frozenTabWidth}
                tabCount={tabs.length}
                isTearingOff={tearingOffTabId === tab.id}
                onContextMenu={(e, id) => {
                  e.preventDefault();
                  setContextMenu({ x: e.clientX, y: e.clientY, tabId: id });
                }}
              />
            ))}
          </SortableContext>
        </DndContext>

        {/* Add Tab Button */}
        <button
          onClick={() => {
            setFrozenTabWidth(null);
            addTab();
          }}
          aria-label="New Tab"
          className="relative before:absolute before:-inset-2 before:content-[''] h-8 w-8 flex items-center justify-center rounded-t-lg hover:bg-surface-hover text-foreground/70 hover:text-foreground transition-colors mb-px no-drag-region focus-visible:ring-2 focus-visible:outline-none"
        >
          <Plus size={16} />
        </button>
      </div>

      {/* Window Controls */}
      <div className="flex items-center h-full text-foreground/70 space-x-2 relative no-drag-region" ref={menuRef}>
        <div className="flex items-center h-full space-x-0 ml-2">
          <button 
            onClick={() => window.electron?.minimize?.()}
          className="h-8 w-10 flex items-center justify-center hover:bg-foreground/10 transition-colors"
        >
          <div className="w-2.5 h-px bg-current" />
        </button>
        <button 
          onClick={() => window.electron?.maximize?.()}
          className="h-8 w-10 flex items-center justify-center hover:bg-foreground/10 transition-colors"
        >
          <div className="w-2.5 h-2.5 border border-current" />
        </button>
        <button 
          onClick={() => window.electron?.close?.()}
          className="h-8 w-10 flex items-center justify-center hover:bg-red-500 hover:text-foreground transition-colors"
        >
          <X size={16} />
        </button>
        </div>
      </div>

      {/* In-App Logout Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/60 z-200 flex items-center justify-center font-sans no-drag-region">
          <div className="bg-surface border border-border w-96 rounded-2xl shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-200">
            <button onClick={() => setShowLogoutModal(false)} className="absolute top-4 right-4 text-foreground/70 hover:text-foreground transition-colors">
              <X size={20} />
            </button>
            
            <h2 className="text-xl font-semibold text-foreground mb-2">Sign out</h2>
            <p className="text-sm text-foreground/70 mb-6">Signing out will remove all Google accounts from this browser. You will need to sign in again to access synced data.</p>
            
            <div className="space-y-2 mb-6 max-h-75 overflow-y-auto custom-scrollbar">
              {accounts?.map((acc, idx) => (
                <div key={idx} className="flex items-center p-3 rounded-xl bg-foreground/10 border border-border">
                  <div className="w-8 h-8 rounded-full overflow-hidden mr-3 shrink-0 bg-foreground/10 flex items-center justify-center">
                    {acc.pic ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={acc.pic} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <User size={16} className="text-foreground/70" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground truncate">{acc.name || 'Account'}</p>
                    <p className="text-xs text-foreground/70 truncate">{acc.email}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end space-x-3">
              <button 
                onClick={() => setShowLogoutModal(false)}
                className="px-4 py-2 text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  logoutGoogle();
                  setShowLogoutModal(false);
                }}
                className="px-5 py-2 text-sm font-medium bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors"
              >
                Sign out of all accounts
              </button>
            </div>
          </div>
        </div>
      )}

      {contextMenu && (
        <TabContextMenu 
          x={contextMenu.x} 
          y={contextMenu.y} 
          tabId={contextMenu.tabId} 
          onClose={() => setContextMenu(null)} 
        />
      )}

      {/* Chrome-style floating window preview during tab tear-off */}
      <TearOffWindowPreview tab={tearingOffTab} mousePos={mousePos} />
    </div>
  );
}
