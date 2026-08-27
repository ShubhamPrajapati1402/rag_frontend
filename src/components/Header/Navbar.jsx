import { ChevronDown, Sun, Moon, MessageSquare, FolderOpen, Sparkles } from 'lucide-react';
import './Navbar.css';

export default function Navbar({ 
  theme, 
  onToggleTheme, 
  activeTab, 
  setActiveTab, 
  docCount 
}) {
  return (
    <header className="chatgpt-top-header">
      {/* Left: ChatGPT Model Selector Pill */}
      <div className="header-left">
        <div className="model-selector-pill">
          <span className="model-title">DocuMind RAG</span>
          <ChevronDown size={14} className="model-chevron" />
        </div>

        <div className="header-tabs">
          <button 
            className={`tab-btn ${activeTab === 'chat' ? 'active' : ''}`}
            onClick={() => setActiveTab('chat')}
          >
            <MessageSquare size={13} />
            <span>Chat</span>
          </button>
          <button 
            className={`tab-btn ${activeTab === 'documents' ? 'active' : ''}`}
            onClick={() => setActiveTab('documents')}
          >
            <FolderOpen size={13} />
            <span>Documents ({docCount})</span>
          </button>
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
