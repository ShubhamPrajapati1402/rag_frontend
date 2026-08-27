import { useState, useEffect } from 'react';
import { MessageSquare, FolderOpen, Settings, Moon, Sun, LogOut } from 'lucide-react';
import './Sidebar.css';

export default function Sidebar({ activeTab, setActiveTab, onLogout }) {
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const navItems = [
    { id: 'chat', label: 'Chat Assistant', icon: <MessageSquare size={20} /> },
    { id: 'documents', label: 'Data Sources', icon: <FolderOpen size={20} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={20} /> },
  ];

  return (
    <div className="sidebar glass-panel">
      <div className="sidebar-brand">
        <div className="brand-logo">RAG</div>
        <h2>Enterprise</h2>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <button
            key={item.id}
            className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => setActiveTab(item.id)}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-recent">
        <h3>Recent Chats</h3>
        <div className="recent-list">
          <div className="recent-item skeleton-text skeleton"></div>
          <div className="recent-item skeleton-text skeleton" style={{ width: '80%' }}></div>
          <div className="recent-item skeleton-text skeleton" style={{ width: '90%' }}></div>
        </div>
      </div>

      <div className="sidebar-footer">
        <button className="nav-item theme-toggle" onClick={toggleTheme}>
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
        </button>
        <button className="nav-item text-danger" onClick={onLogout}>
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}
