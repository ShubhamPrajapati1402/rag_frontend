import React, { useState, useRef, useEffect } from 'react';
import { 
  SquarePen, 
  FolderOpen, 
  Search, 
  Trash2, 
  PanelLeftOpen,
  PanelLeftClose,
  Settings, 
  LogOut, 
  HelpCircle, 
  Sun, 
  Moon, 
  X,
  Keyboard,
  Check,
  ChevronsUpDown,
  ShieldCheck
} from 'lucide-react';
import { ChatSession, ThemeType, UserProfile } from '../../types';
import './Sidebar.css';

interface SidebarProps {
  chatSessions: ChatSession[];
  currentSessionId: string;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  onDeleteSession: (id: string) => void;
  onOpenDocManager: () => void;
  onOpenEvaluations?: () => void;
  activeTab?: 'chat' | 'documents' | 'evaluation';
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onOpenCommandPalette: () => void;
  docCount: number;
  onToggleTheme: () => void;
  theme: ThemeType;
  onLogout: () => void;
  userProfile?: UserProfile | null;
}

export default function Sidebar({ 
  chatSessions, 
  currentSessionId, 
  onSelectSession, 
  onNewSession, 
  onDeleteSession,
  onOpenDocManager,
  onOpenEvaluations,
  activeTab = 'chat',
  isCollapsed,
  onToggleCollapse,
  onOpenCommandPalette,
  docCount,
  onToggleTheme,
  theme,
  onLogout,
  userProfile
}: SidebarProps) {
  const [hoveredSessionId, setHoveredSessionId] = useState<string | null>(null);
  const [sessionToDelete, setSessionToDelete] = useState<ChatSession | null>(null);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState<boolean>(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState<boolean>(false);

  const profileRef = useRef<HTMLDivElement>(null);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const confirmDelete = () => {
    if (sessionToDelete) {
      onDeleteSession(sessionToDelete.id);
      setSessionToDelete(null);
    }
  };

  // Derive dynamic user display properties
  const userName = userProfile?.name?.trim() || (userProfile?.email ? userProfile.email.split('@')[0] : '');
  const userEmail = userProfile?.email || '';
  const userAvatar = userProfile?.avatarUrl || userProfile?.avatar || userProfile?.picture || userProfile?.image || '';
  const userInitial = (userName?.[0] || userEmail?.[0] || 'U').toUpperCase();

  return (
    <>
      <aside className={`chatgpt-sidebar-root ${isCollapsed ? 'collapsed' : ''}`}>
        {/* Top Section */}
        {isCollapsed ? (
          /* Collapsed State: Single Clean Vertical Stack of Icon Buttons */
          <div className="collapsed-vertical-stack">
            <button 
              className="sidebar-action-btn" 
              onClick={onToggleCollapse} 
              data-tooltip="Expand sidebar (Ctrl+B)"
            >
              <PanelLeftOpen size={17} />
            </button>
            <button 
              className="sidebar-action-btn" 
              onClick={onNewSession} 
              data-tooltip="New chat"
            >
              <SquarePen size={17} />
            </button>
            <button 
              className="sidebar-action-btn" 
              onClick={onOpenCommandPalette} 
              data-tooltip="Search (Ctrl+K)"
            >
              <Search size={17} />
            </button>
            <button 
              className={`sidebar-action-btn ${activeTab === 'documents' ? 'is-active' : ''}`} 
              onClick={onOpenDocManager} 
              data-tooltip={`Projects (${docCount})`}
            >
              <FolderOpen size={17} />
            </button>

            {userProfile?.is_superuser && onOpenEvaluations && (
              <button 
                className={`sidebar-action-btn ${activeTab === 'evaluation' ? 'is-active' : ''}`} 
                onClick={onOpenEvaluations} 
                data-tooltip="RAG benchmarks (Developer)"
              >
                <ShieldCheck size={17} className="text-indigo-400" />
              </button>
            )}
          </div>
        ) : (
          /* Expanded State: Full ChatGPT-style Layout */
          <>
            {/* Top Header Row */}
            <div className="sidebar-brand-header">
              <div className="sidebar-brand-left">
                <span className="sidebar-brand-title">Noesis<span className="brand-reg">®</span></span>
              </div>
              <div className="brand-header-actions">
                <button
                  className="sidebar-action-btn"
                  onClick={onToggleCollapse}
                  data-tooltip="Collapse sidebar (Ctrl+B)"
                >
                  <PanelLeftClose size={17} />
                </button>
              </div>
            </div>

            {/* Search Bar Row (Ctrl+K) */}
            <div 
              className="sidebar-search-bar"
              onClick={onOpenCommandPalette}
              data-tooltip="Search chats (Ctrl+K)"
            >
              <Search size={14} className="sidebar-search-icon" />
              <span className="sidebar-search-placeholder">Search</span>
              <kbd className="sidebar-kbd">Ctrl K</kbd>
            </div>

            {/* Primary Action Button */}
            <div className="sidebar-action-container">
              <button className="sidebar-new-chat-row" onClick={onNewSession}>
                <SquarePen size={15} />
                <span>New chat</span>
              </button>
            </div>

            {/* Navigation Section Tabs */}
            <div className="sidebar-nav-section">
              <button 
                className={`sidebar-nav-item ${activeTab === 'documents' ? 'is-active' : ''}`} 
                onClick={onOpenDocManager}
              >
                <FolderOpen size={15} />
                <span className="nav-item-label">Projects</span>
                <span className="nav-item-badge">{docCount}</span>
              </button>

              {userProfile?.is_superuser && onOpenEvaluations && (
                <button 
                  className={`sidebar-nav-item ${activeTab === 'evaluation' ? 'is-active' : ''}`} 
                  onClick={onOpenEvaluations}
                >
                  <ShieldCheck size={15} className="text-indigo-400" />
                  <span className="nav-item-label">RAG Benchmarks</span>
                  <span className="sidebar-dev-tag">DEV</span>
                </button>
              )}
            </div>
          </>
        )}

        {/* Chat History Section */}
        {!isCollapsed && (
          <div className="sidebar-history-pane">
            {chatSessions.length > 0 ? (
              (() => {
                // Group sessions dynamically by date periods like ChatGPT
                const now = new Date();
                const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
                const startOfYesterday = startOfToday - 86400000;
                const startOf7Days = startOfToday - 7 * 86400000;
                const startOf30Days = startOfToday - 30 * 86400000;

                const groups: { [key: string]: ChatSession[] } = {
                  'Today': [],
                  'Yesterday': [],
                  'Previous 7 Days': [],
                  'Previous 30 Days': []
                };
                const olderGroups: { [key: string]: ChatSession[] } = {};

                for (const session of chatSessions) {
                  const timeStr = session.updated_at || session.created_at;
                  const sessionTime = timeStr ? new Date(timeStr).getTime() : startOfToday;

                  if (isNaN(sessionTime) || sessionTime >= startOfToday) {
                    groups['Today'].push(session);
                  } else if (sessionTime >= startOfYesterday) {
                    groups['Yesterday'].push(session);
                  } else if (sessionTime >= startOf7Days) {
                    groups['Previous 7 Days'].push(session);
                  } else if (sessionTime >= startOf30Days) {
                    groups['Previous 30 Days'].push(session);
                  } else {
                    const d = new Date(sessionTime);
                    const monthYear = d.toLocaleString('en-US', { month: 'long', year: 'numeric' });
                    if (!olderGroups[monthYear]) {
                      olderGroups[monthYear] = [];
                    }
                    olderGroups[monthYear].push(session);
                  }
                }

                const allCategories: { category: string; sessions: ChatSession[] }[] = [];
                for (const [category, list] of Object.entries(groups)) {
                  if (list.length > 0) allCategories.push({ category, sessions: list });
                }
                for (const [category, list] of Object.entries(olderGroups)) {
                  if (list.length > 0) allCategories.push({ category, sessions: list });
                }

                return allCategories.map(({ category, sessions }) => (
                  <div key={category} className="history-date-group">
                    <div className="history-section-header">
                      <span>{category.toUpperCase()}</span>
                    </div>

                    <div className="history-items-scroll">
                      {sessions.map(session => {
                        const isActive = session.id === currentSessionId;
                        const isHovered = session.id === hoveredSessionId;

                        return (
                          <div
                            key={session.id}
                            className={`history-row-item ${isActive ? 'active' : ''}`}
                            onClick={() => onSelectSession(session.id)}
                            onMouseEnter={() => setHoveredSessionId(session.id)}
                            onMouseLeave={() => setHoveredSessionId(null)}
                          >
                            <div className="history-item-title-wrapper">
                              <span className="history-item-title">{session.title}</span>
                            </div>

                            {(isHovered || isActive) && (
                              <button
                                className="history-delete-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSessionToDelete(session);
                                }}
                                data-tooltip="Delete chat"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ));
              })()
            ) : null}
          </div>
        )}

        {/* Bottom User Profile Section */}
        <div className="sidebar-bottom-profile" ref={profileRef}>
          <button 
            className="user-profile-row-btn"
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            data-tooltip="User profile"
          >
            <div className="user-avatar-wrap">
              <div className="user-avatar-circle">
                {userAvatar ? (
                  <img 
                    src={userAvatar} 
                    alt={userName || 'User'} 
                    className="user-avatar-img"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <span>{userInitial}</span>
                )}
              </div>
              <span className="user-status-dot-active"></span>
            </div>

            {!isCollapsed && (
              <>
                <div className="user-info-text">
                  <span className="user-name">{userName || userEmail || 'Account'}</span>
                  {userEmail && <span className="user-email-text">{userEmail}</span>}
                </div>
                <ChevronsUpDown size={14} className="user-profile-chevron" />
              </>
            )}
          </button>

          {/* User Settings Dropdown Menu */}
          {isProfileMenuOpen && (
            <div className="profile-dropdown-menu anim-pop-in">
              <div className="dropdown-user-header">
                {userAvatar && (
                  <img 
                    src={userAvatar} 
                    alt={userName || 'User'} 
                    className="dropdown-user-avatar-img"
                    referrerPolicy="no-referrer"
                  />
                )}
                <div className="dropdown-user-text">
                  <div className="dropdown-user-name">{userName || 'Account'}</div>
                  {userEmail && <div className="dropdown-user-email">{userEmail}</div>}
                </div>
              </div>

              <div className="dropdown-divider"></div>

              <button 
                className="dropdown-menu-item"
                onClick={() => {
                  setIsSettingsOpen(true);
                  setIsProfileMenuOpen(false);
                }}
              >
                <Settings size={15} />
                <span>Settings</span>
              </button>

              <button 
                className="dropdown-menu-item"
                onClick={() => {
                  setIsShortcutsOpen(true);
                  setIsProfileMenuOpen(false);
                }}
              >
                <Keyboard size={15} />
                <span>Keyboard Shortcuts</span>
              </button>

              <button 
                className="dropdown-menu-item"
                onClick={() => {
                  onToggleTheme();
                }}
              >
                {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
                <span>{theme === 'dark' ? 'Light Theme' : 'Dark Theme'}</span>
              </button>

              <div className="dropdown-divider"></div>

              <button 
                className="dropdown-menu-item text-danger"
                onClick={() => {
                  setIsLogoutModalOpen(true);
                  setIsProfileMenuOpen(false);
                }}
              >
                <LogOut size={15} />
                <span>Log out</span>
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="modal-backdrop-overlay anim-fade-in" onClick={() => setIsSettingsOpen(false)}>
          <div className="settings-modal-card anim-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="settings-modal-header">
              <h3>Settings</h3>
              <button className="modal-close-btn" onClick={() => setIsSettingsOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="settings-modal-body">
              <div className="settings-section-title">Theme & Appearance</div>
              <div className="settings-row-item">
                <div>
                  <div className="settings-label">Color Theme</div>
                  <div className="settings-sublabel">Choose between clean light mode and sleek dark mode</div>
                </div>
                <button className="settings-toggle-btn" onClick={onToggleTheme}>
                  {theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
                </button>
              </div>

              <div className="settings-section-title">RAG Engine Parameters</div>
              <div className="settings-row-item">
                <div>
                  <div className="settings-label">Semantic Chunk Size</div>
                  <div className="settings-sublabel">512 tokens with 64 token sliding overlap</div>
                </div>
                <span className="settings-badge">Optimized</span>
              </div>

              <div className="settings-row-item">
                <div>
                  <div className="settings-label">Embedding Model</div>
                  <div className="settings-sublabel">text-embedding-3-large (3072 dimensions)</div>
                </div>
                <span className="settings-badge">Active</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Modal */}
      {isShortcutsOpen && (
        <div className="modal-backdrop-overlay anim-fade-in" onClick={() => setIsShortcutsOpen(false)}>
          <div className="settings-modal-card anim-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="settings-modal-header">
              <h3>Keyboard Shortcuts</h3>
              <button className="modal-close-btn" onClick={() => setIsShortcutsOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="shortcuts-list-grid">
              <div className="shortcut-row">
                <span>Search Conversations</span>
                <kbd>Ctrl + K</kbd>
              </div>
              <div className="shortcut-row">
                <span>Toggle Sidebar</span>
                <kbd>Ctrl + B</kbd>
              </div>
              <div className="shortcut-row">
                <span>Previous / Next Prompts</span>
                <kbd>↑ / ↓</kbd>
              </div>
              <div className="shortcut-row">
                <span>Send Message</span>
                <kbd>Enter</kbd>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {sessionToDelete && (
        <div className="delete-modal-backdrop anim-fade-in" onClick={() => setSessionToDelete(null)}>
          <div className="delete-modal-card anim-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="delete-modal-header">
              <h3>Delete conversation?</h3>
              <button className="modal-x" onClick={() => setSessionToDelete(null)}>
                <X size={16} />
              </button>
            </div>
            <p className="delete-modal-desc">
              This will permanently delete <strong>&ldquo;{sessionToDelete.title}&rdquo;</strong> from your chat history. This action cannot be undone.
            </p>
            <div className="delete-modal-actions">
              <button className="btn-cancel" onClick={() => setSessionToDelete(null)}>
                Cancel
              </button>
              <button className="btn-danger-confirm" onClick={confirmDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Logout Confirmation Modal */}
      {isLogoutModalOpen && (
        <div className="delete-modal-backdrop anim-fade-in" onClick={() => setIsLogoutModalOpen(false)}>
          <div className="delete-modal-card anim-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="delete-modal-header">
              <h3>Log out of Noesis?</h3>
              <button className="modal-x" onClick={() => setIsLogoutModalOpen(false)}>
                <X size={16} />
              </button>
            </div>
            <p className="delete-modal-desc">
              Are you sure you want to log out of <strong>{userName || userEmail || 'your account'}</strong>? You will need to authenticate again to access your indexed documents and private chat sessions.
            </p>
            <div className="delete-modal-actions">
              <button className="btn-cancel" onClick={() => setIsLogoutModalOpen(false)}>
                Cancel
              </button>
              <button 
                className="btn-danger-confirm" 
                onClick={() => {
                  setIsLogoutModalOpen(false);
                  if (onLogout) {
                    onLogout();
                  }
                }}
              >
                Log out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
