import { useState, useEffect } from 'react';
import { 
  Search, 
  MessageSquare, 
  FolderOpen, 
  Plus, 
  ArrowRight
} from 'lucide-react';
import { ChatSession } from '../../types';
import './CommandPalette.css';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  chatSessions: ChatSession[];
  onOpenDocManager: () => void;
}

export default function CommandPalette({ 
  isOpen, 
  onClose, 
  onSelectSession, 
  onNewSession, 
  chatSessions, 
  onOpenDocManager 
}: CommandPaletteProps) {
  const [query, setQuery] = useState<string>('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredSessions = chatSessions.filter(s => 
    s.title.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="cmd-overlay-backdrop anim-fade-in" onClick={onClose}>
      <div className="cmd-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="cmd-input-header">
          <Search size={18} className="cmd-search-icon" />
          <input 
            type="text" 
            placeholder="Search conversations, files, or start new chat..." 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          <kbd className="esc-key-badge">ESC</kbd>
        </div>

        <div className="cmd-scrollable-list">
          {/* Quick Actions */}
          <div className="cmd-section-group">
            <span className="cmd-group-label">ACTIONS</span>
            <div 
              className="cmd-row-item"
              onClick={() => {
                onNewSession();
                onClose();
              }}
            >
              <div className="cmd-row-left">
                <Plus size={15} className="cmd-icon-accent" />
                <span className="cmd-row-text">Start New Conversation</span>
              </div>
              <ArrowRight size={13} className="cmd-arrow" />
            </div>

            <div 
              className="cmd-row-item"
              onClick={() => {
                onOpenDocManager();
                onClose();
              }}
            >
              <div className="cmd-row-left">
                <FolderOpen size={15} className="cmd-icon-accent" />
                <span className="cmd-row-text">Manage Document Library</span>
              </div>
              <ArrowRight size={13} className="cmd-arrow" />
            </div>
          </div>

          {/* Search Results */}
          <div className="cmd-section-group">
            <span className="cmd-group-label">
              CONVERSATIONS {filteredSessions.length > 0 ? `(${filteredSessions.length})` : ''}
            </span>
            {filteredSessions.length > 0 ? (
              filteredSessions.map((session) => (
                <div 
                  key={session.id}
                  className="cmd-row-item"
                  onClick={() => {
                    onSelectSession(session.id);
                    onClose();
                  }}
                >
                  <div className="cmd-row-left">
                    <MessageSquare size={14} className="cmd-row-icon" />
                    <span className="cmd-row-text">{session.title}</span>
                  </div>
                  <span className="cmd-jump-badge">Jump to chat</span>
                </div>
              ))
            ) : (
              <div className="cmd-empty-conversations">
                No active conversations
              </div>
            )}
          </div>
        </div>

        <div className="cmd-footer-bar">
          <div className="cmd-nav-hint">
            <span>Navigation:</span>
            <kbd>↑</kbd>
            <kbd>↓</kbd>
            <span style={{ marginLeft: '8px' }}>Select:</span>
            <kbd>↵</kbd>
          </div>
        </div>
      </div>
    </div>
  );
}
