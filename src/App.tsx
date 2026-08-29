import { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Header/Navbar';
import Sidebar from './components/Navigation/Sidebar';
import ChatStudio from './components/Chat/ChatStudio';
import IngestionHub from './components/Ingestion/IngestionHub';
import CommandPalette from './components/CommandPalette/CommandPalette';
import AuthModal from './components/Auth/AuthModal';
import { authApi } from './services/authApi';
import { chatApi } from './services/chatApi';
import { ThemeType, DocumentItem, ChatSession, UserProfile } from './types';
import './App.css';

function getInitialTheme(): ThemeType {
  const saved = localStorage.getItem('app-theme') as ThemeType | null;
  if (saved === 'dark' || saved === 'light') {
    return saved;
  }
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
}

function App() {
  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const [theme, setTheme] = useState<ThemeType>(getInitialTheme);
  const [activeTab, setActiveTab] = useState<'chat' | 'documents'>('chat');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);
  
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>('');

  const loadSessions = useCallback(async () => {
    try {
      const sessions = await chatApi.getSessions();
      setChatSessions(sessions);
    } catch (err) {
      console.warn('Failed to load chat sessions:', err);
    }
  }, []);

  useEffect(() => {
    const verifySession = async () => {
      try {
        const user = await authApi.getMe();
        if (user) {
          setIsAuthenticated(true);
          setUserProfile(user);
          loadSessions();
        } else {
          setIsAuthenticated(false);
          setUserProfile(null);
        }
      } catch {
        setIsAuthenticated(false);
        setUserProfile(null);
      } finally {
        setIsAuthChecking(false);
      }
    };
    verifySession();
  }, [loadSessions]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem('app-theme')) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    };
    mediaQuery.addEventListener('change', handleSystemThemeChange);
    return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
  }, [theme]);

  useEffect(() => {
    const handleGlobalShortcuts = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setIsSidebarCollapsed(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalShortcuts);
    return () => window.removeEventListener('keydown', handleGlobalShortcuts);
  }, []);

  const handleLogin = (user: UserProfile) => {
    setUserProfile(user);
    setIsAuthenticated(true);
    loadSessions();
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch (e) {
      console.error(e);
    }
    setIsAuthenticated(false);
    setUserProfile(null);
    setChatSessions([]);
    setCurrentSessionId('');
  };

  const handleToggleTheme = () => {
    const nextTheme: ThemeType = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('app-theme', nextTheme);
  };

  const handleNewSession = () => {
    setCurrentSessionId('');
    setActiveTab('chat');
  };

  const handleSessionCreated = useCallback((newSession: { id: string; title: string }) => {
    setChatSessions(prev => {
      const exists = prev.some(s => s.id === newSession.id);
      if (exists) {
        return prev.map(s => s.id === newSession.id ? { ...s, title: newSession.title || s.title } : s);
      }
      return [{ id: newSession.id, title: newSession.title || 'New Conversation' }, ...prev];
    });
    setCurrentSessionId(newSession.id);
  }, []);

  const handleSessionTitleUpdated = useCallback((sessionId: string, title: string) => {
    setChatSessions(prev => 
      prev.map(s => s.id === sessionId ? { ...s, title } : s)
    );
  }, []);

  const handleDeleteSession = async (id: string) => {
    try {
      await chatApi.deleteSession(id);
    } catch (err) {
      console.error('Error deleting session:', err);
    }
    setChatSessions(prev => prev.filter(s => s.id !== id));
    if (currentSessionId === id) {
      setCurrentSessionId('');
    }
  };

  if (isAuthChecking) {
    return (
      <div className={`app-root ${theme}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '32px', height: '32px', border: '3px solid rgba(99,102,241,0.2)', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spinRing 0.8s linear infinite' }} />
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Verifying session...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`app-root ${theme}`}>
      {!isAuthenticated && (
        <AuthModal onLogin={handleLogin} />
      )}

      <div className={`app-workspace-container ${!isAuthenticated ? 'workspace-inert' : ''}`}>
        <Sidebar 
          chatSessions={chatSessions}
          currentSessionId={currentSessionId}
          onSelectSession={(id) => {
            setCurrentSessionId(id);
            setActiveTab('chat');
          }}
          onNewSession={handleNewSession}
          onDeleteSession={handleDeleteSession}
          onOpenDocManager={() => setActiveTab('documents')}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(prev => !prev)}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          docCount={documents.length}
          theme={theme}
          onToggleTheme={handleToggleTheme}
          onLogout={handleLogout}
          userProfile={userProfile}
        />

        <main className="app-main-viewport">
          <Navbar 
            theme={theme}
            onToggleTheme={handleToggleTheme}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            docCount={documents.length}
          />

          <div className="app-content-stage">
            {activeTab === 'chat' ? (
              <ChatStudio 
                currentSessionId={currentSessionId}
                onSelectSession={setCurrentSessionId}
                onSessionCreated={handleSessionCreated}
                onSessionTitleUpdated={handleSessionTitleUpdated}
                onNavigateToIngestion={() => setActiveTab('documents')}
                docCount={documents.length}
                documents={documents}
                onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
              />
            ) : (
              <IngestionHub 
                documents={documents}
                setDocuments={setDocuments}
              />
            )}
          </div>
        </main>
      </div>

      <CommandPalette 
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onSelectSession={(id) => {
          setCurrentSessionId(id);
          setActiveTab('chat');
          setIsCommandPaletteOpen(false);
        }}
        onNewSession={() => {
          handleNewSession();
          setIsCommandPaletteOpen(false);
        }}
        chatSessions={chatSessions}
        onOpenDocManager={() => {
          setActiveTab('documents');
          setIsCommandPaletteOpen(false);
        }}
      />
    </div>
  );
}

export default App;
