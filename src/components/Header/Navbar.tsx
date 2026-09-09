import React from 'react';
import { Sun, Moon, MessageSquare, FolderOpen, ShieldCheck, PanelLeft } from 'lucide-react';
import { ThemeType, UserProfile } from '../../types';
import './Navbar.css';

interface NavbarProps {
  theme: ThemeType;
  onToggleTheme: () => void;
  activeTab: 'chat' | 'documents' | 'evaluation';
  setActiveTab: (tab: 'chat' | 'documents' | 'evaluation') => void;
  docCount: number;
  userProfile?: UserProfile | null;
  onToggleSidebar?: () => void;
  isSidebarCollapsed?: boolean;
}

export default function Navbar({ 
  theme, 
  onToggleTheme, 
  activeTab, 
  setActiveTab, 
  docCount,
  userProfile,
  onToggleSidebar,
  isSidebarCollapsed
}: NavbarProps) {
  return (
    <header className="chatgpt-top-header">
      {/* Left: Sidebar Toggle + Navigation Tabs */}
      <div className="header-left">
        {onToggleSidebar && (
          <button 
            className={`navbar-sidebar-toggle-btn ${isSidebarCollapsed ? 'is-collapsed' : ''}`} 
            onClick={onToggleSidebar}
            title={isSidebarCollapsed ? "Open sidebar" : "Close sidebar"}
            aria-label="Toggle navigation menu"
          >
            <PanelLeft size={18} />
          </button>
        )}

        <div className="header-tabs">
          <button 
            className={'tab-btn ' + (activeTab === 'chat' ? 'active' : '')}
            onClick={() => setActiveTab('chat')}
          >
            <MessageSquare size={13} />
            <span>Chat</span>
          </button>
          <button 
            className={'tab-btn ' + (activeTab === 'documents' ? 'active' : '')}
            onClick={() => setActiveTab('documents')}
          >
            <FolderOpen size={13} />
            <span className="tab-label-text">Projects ({docCount})</span>
            <span className="tab-label-short">Docs</span>
          </button>

          {userProfile?.is_superuser && (
            <button 
              className={'tab-btn dev-tab ' + (activeTab === 'evaluation' ? 'active' : '')}
              onClick={() => setActiveTab('evaluation')}
            >
              <ShieldCheck size={13} className="text-indigo-400" />
              <span className="tab-label-text">Benchmarks</span>
              <span className="navbar-dev-pill">DEV</span>
            </button>
          )}
        </div>
      </div>

      {/* Right: Theme Toggle */}
      <div className="header-right">
        <button className="theme-btn" onClick={onToggleTheme} title="Toggle Theme" aria-label="Toggle theme">
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>
    </header>
  );
}
