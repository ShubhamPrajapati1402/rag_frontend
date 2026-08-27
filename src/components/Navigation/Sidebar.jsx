import { useState, useRef, useEffect } from 'react';
import { 
  SquarePen, 
  PanelLeftClose, 
  PanelLeftOpen, 
  FolderOpen, 
  Search, 
  Trash2, 
  X,
  Settings,
  Keyboard,
  LogOut,
  Sparkles,
  ShieldCheck,
  Check
} from 'lucide-react';
import './Sidebar.css';

export default function Sidebar({ 
  chatSessions, 
  currentSessionId, 
  onSelectSession, 
  onNewSession, 
  onDeleteSession,
  onOpenDocManager,
  isCollapsed,
  onToggleCollapse,
  onOpenCommandPalette,
  docCount,
  onToggleTheme,
  theme
}) {
  const [hoveredSessionId, setHoveredSessionId] = useState(null);
  const [sessionToDelete, setSessionToDelete] = useState(null);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const profileRef = useRef(null);

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setIsProfileMenuOpen(false);
      }
    };
    if (isProfileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isProfileMenuOpen]);

  const confirmDelete = () => {
    if (sessionToDelete) {
      onDeleteSession(sessionToDelete.id);
      setSessionToDelete(null);
    }
  };

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {!isCollapsed && (
        <div className="mobile-sidebar-backdrop" onClick={onToggleCollapse} />
      )}

      <aside className={`chatgpt-sidebar ${isCollapsed ? 'collapsed' : ''}`}>
        {/* Top Header Row */}
        {!isCollapsed ? (
          <div className="sidebar-brand-header">
            <span className="sidebar-brand-title">DocuMind</span>
            <div className="brand-header-actions">
              <button 
                className="sidebar-action-btn" 
                onClick={onOpenCommandPalette} 
                title="Search (Ctrl+K)"
              >
                <Search size={18} />
              </button>
              <button 
                className="sidebar-action-btn" 
                onClick={onToggleCollapse} 
                title="Close sidebar (Ctrl+B)"
              >
                <PanelLeftClose size={18} />
              </button>
            </div>
          </div>
        ) : (
          <div className="collapsed-vertical-stack">
            <button 
              className="sidebar-action-btn collapsed-btn-wrap" 
              onClick={onToggleCollapse} 
              title="Open sidebar (Ctrl+B)"
            >
              <PanelLeftOpen size={18} />
              <span className="collapsed-tooltip">Open sidebar (Ctrl+B)</span>
            </button>

            <button 
              className="sidebar-action-btn collapsed-btn-wrap" 
              onClick={onNewSession} 
              title="New chat"
            >
              <SquarePen size={18} />
              <span className="collapsed-tooltip">New chat</span>
            </button>

            <button 
              className="sidebar-action-btn collapsed-btn-wrap" 
              onClick={onOpenDocManager} 
              title="Document Library"
            >
              <FolderOpen size={18} />
              <span className="collapsed-tooltip">Document Library</span>
            </button>
          </div>
        )}

        {/* Primary Action Buttons */}
        {!isCollapsed && (
          <div className="sidebar-primary-actions">
            <button 
              className="new-chat-row-btn"
              onClick={onNewSession}
              title="New chat"
            >
              <SquarePen size={18} className="new-chat-icon" />
              <span>New chat</span>
            </button>

            <button 
              className="quick-nav-row-btn"
              onClick={onOpenDocManager}
              title="Document Library"
            >
              <FolderOpen size={18} className="quick-nav-icon" />
              <span className="nav-text">Document Library</span>
              <span className="nav-count">{docCount} files</span>
            </button>
          </div>
        )}

        {/* Chat History Section */}
        {!isCollapsed && (
          <div className="sidebar-history-container">
            <div className="history-section-header">Recents</div>
            <div className="history-items-list">
              {chatSessions.map((session) => (
                <div 
                  key={session.id}
                  className={`history-item-row ${currentSessionId === session.id ? 'active' : ''}`}
                  onClick={() => onSelectSession(session.id)}
                  onMouseEnter={() => setHoveredSessionId(session.id)}
                  onMouseLeave={() => setHoveredSessionId(null)}
                >
                  <span className="history-item-title">{session.title}</span>
                  {hoveredSessionId === session.id && (
                    <button 
                      className="history-delete-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSessionToDelete(session);
                      }}
                      title="Delete chat"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bottom Profile (Interactive Menu Trigger) */}
        <div className="sidebar-footer-profile" ref={profileRef}>
          {/* Profile Popup Menu */}
          {isProfileMenuOpen && (
            <div className="profile-popup-menu anim-pop-in">
              <div className="popup-user-header">
                <div className="popup-avatar">SP</div>
                <div className="popup-user-text">
                  <span className="user-email">shubham@enterprise.ai</span>
                  <span className="user-badge">Pro Plan</span>
                </div>
              </div>

              <div className="popup-divider" />

              <button 
                className="popup-menu-item"
                onClick={() => {
                  setIsSettingsOpen(true);
                  setIsProfileMenuOpen(false);
                }}
              >
                <Settings size={15} />
                <span>Settings</span>
              </button>

              <button 
                className="popup-menu-item"
                onClick={() => {
                  setIsShortcutsOpen(true);
                  setIsProfileMenuOpen(false);
                }}
              >
                <Keyboard size={15} />
                <span>Keyboard Shortcuts</span>
              </button>

              <div className="popup-divider" />

              <button 
                className="popup-menu-item logout"
                onClick={() => {
                  setIsProfileMenuOpen(false);
                  setIsLogoutModalOpen(true);
                }}
              >
                <LogOut size={15} />
                <span>Log out</span>
              </button>
            </div>
          )}

          <div 
            className={`profile-pill-card ${isProfileMenuOpen ? 'active' : ''} collapsed-btn-wrap`}
            onClick={() => setIsProfileMenuOpen(prev => !prev)}
            title="Account & Settings"
          >
            <div className="profile-avatar">SP</div>
            {!isCollapsed && (
              <div className="profile-info">
                <span className="profile-name">Shubham Prajapati</span>
                <span className="profile-sub">Pro Workspace</span>
              </div>
            )}
            {isCollapsed && <span className="collapsed-tooltip">Shubham Prajapati</span>}
          </div>
        </div>
      </aside>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="settings-modal-backdrop anim-fade-in" onClick={() => setIsSettingsOpen(false)}>
          <div className="settings-modal-card anim-pop-in" onClick={(e) => e.stopPropagation()}>
            <div className="modal-top-bar">
              <h3>Settings</h3>
              <button className="modal-close" onClick={() => setIsSettingsOpen(false)}>
                <X size={16} />
              </button>
            </div>

            <div className="settings-content-body">
              <div className="settings-row">
                <div className="settings-row-info">
                  <h4>Theme</h4>
                  <p>Choose between light and dark mode or follow system.</p>
                </div>
                <button className="settings-toggle-btn" onClick={onToggleTheme}>
                  {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                </button>
              </div>

              <div className="settings-row">
                <div className="settings-row-info">
                  <h4>Embedding Model</h4>
                  <p>OpenAI text-embedding-3-small (1536d)</p>
                </div>
                <span className="settings-pill-badge">Active</span>
              </div>

              <div className="settings-row">
                <div className="settings-row-info">
                  <h4>Indexed Documents</h4>
                  <p>{docCount} files processed across PDF, Excel & Markdown</p>
                </div>
                <button className="settings-action-link" onClick={() => { setIsSettingsOpen(false); onOpenDocManager(); }}>
                  Manage
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Modal */}
      {isShortcutsOpen && (
        <div className="settings-modal-backdrop anim-fade-in" onClick={() => setIsShortcutsOpen(false)}>
          <div className="settings-modal-card anim-pop-in" onClick={(e) => e.stopPropagation()}>
            <div className="modal-top-bar">
              <h3>Keyboard Shortcuts</h3>
              <button className="modal-close" onClick={() => setIsShortcutsOpen(false)}>
                <X size={16} />
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
              <h3>Log out of DocuMind?</h3>
              <button className="modal-x" onClick={() => setIsLogoutModalOpen(false)}>
                <X size={16} />
              </button>
            </div>
            <p className="delete-modal-desc">
              Are you sure you want to log out of <strong>Shubham Prajapati</strong> (Pro Workspace)? You will need to authenticate again to access your indexed documents and private chat sessions.
            </p>
            <div className="delete-modal-actions">
              <button className="btn-cancel" onClick={() => setIsLogoutModalOpen(false)}>
                Cancel
              </button>
              <button 
                className="btn-danger-confirm" 
                onClick={() => {
                  setIsLogoutModalOpen(false);
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
