import React from 'react';
import { Sun, Moon, MessageSquare, FolderOpen, ShieldCheck } from 'lucide-react';
import { ThemeType, UserProfile } from '../../types';
import './Navbar.css';

interface NavbarProps {
  theme: ThemeType;
  onToggleTheme: () => void;
  activeTab: 'chat' | 'documents' | 'evaluation';
  setActiveTab: (tab: 'chat' | 'documents' | 'evaluation') => void;
  docCount: number;
  userProfile?: UserProfile | null;
}

export default function Navbar({ 
  theme, 
  onToggleTheme, 
  activeTab, 
  setActiveTab, 
  docCount,
  userProfile
}: NavbarProps) {
  return (
    <header className="chatgpt-top-header">
      {/* Left: Navigation Tabs */}
      <div className="header-left">
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
            <span>Projects ({docCount})</span>
          </button>

          {userProfile?.is_superuser && (
            <button 
              className={'tab-btn dev-tab ' + (activeTab === 'evaluation' ? 'active' : '')}
              onClick={() => setActiveTab('evaluation')}
            >
              <ShieldCheck size={13} className="text-indigo-400" />
              <span>Benchmarks</span>
              <span className="navbar-dev-pill">DEV</span>
            </button>
          )}
        </div>
      </div>

      {/* Right: Theme Toggle */}
      <div className="header-right">
        <button className="theme-btn" onClick={onToggleTheme} title="Toggle Theme">
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>
    </header>
  );
}
