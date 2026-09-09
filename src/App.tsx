import { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Navigation/Sidebar';
import Navbar from './components/Header/Navbar';
import ChatStudio, { evictSessionCache } from './components/Chat/ChatStudio';
import IngestionHub from './components/Ingestion/IngestionHub';
import DeveloperEvaluationDashboard from './components/Evaluation/DeveloperEvaluationDashboard';
import AuthModal from './components/Auth/AuthModal';
import AcceptInviteModal from './components/Evaluation/AcceptInviteModal';
import CommandPalette from './components/CommandPalette/CommandPalette';
import SimpleModelModal from './components/Models/SimpleModelModal';
import { chatApi } from './services/chatApi';
import { authApi } from './services/authApi';
import { DocumentItem, ChatSession, ThemeType, UserProfile } from './types';
import './App.css';

function getInitialTheme(): ThemeType {
  const saved = localStorage.getItem('app-theme') as ThemeType | null;
  let initialTheme: ThemeType = 'dark';
  if (saved === 'dark' || saved === 'light') {
    initialTheme = saved;
  } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    initialTheme = 'dark';
  } else {
    initialTheme = 'light';
  }
  document.documentElement.setAttribute('data-theme', initialTheme);
  document.documentElement.classList.remove('light', 'dark');
  document.documentElement.classList.add(initialTheme);
  return initialTheme;
}

function getSessionIdFromPath(): string {
  const match = window.location.pathname.match(/^\/c\/([^/]+)/);
  return match ? match[1] : '';
}

function getInitialTabFromPath(): 'chat' | 'documents' | 'evaluation' {
  if (window.location.pathname.startsWith('/developer/evaluation') || window.location.pathname.startsWith('/evaluation')) {
    return 'evaluation';
  }
  return 'chat';
}

function App() {
  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(() => {
    return typeof document !== 'undefined' && document.cookie.includes('rag_logged_in=1');
  });
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const [theme, setTheme] = useState<ThemeType>(getInitialTheme);
  const [activeTab, setActiveTab] = useState<'chat' | 'documents' | 'evaluation'>(getInitialTabFromPath);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    return typeof window !== 'undefined' && window.innerWidth < 768;
  });
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);
  
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>(getSessionIdFromPath);

  // Auto-close sidebar on mobile after navigating
  const closeSidebarIfMobile = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setIsSidebarCollapsed(true);
    }
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsSidebarCollapsed(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Simple Model & Key state
  const [selectedModel, setSelectedModel] = useState<string>(() => {
    return localStorage.getItem('noesis_model_name') || 'inbuilt';
  });
  const [customApiKey, setCustomApiKey] = useState<string>(() => {
    return localStorage.getItem('noesis_api_key') || '';
  });
  const [customBaseUrl, setCustomBaseUrl] = useState<string>(() => {
    return localStorage.getItem('noesis_base_url') || '';
  });
  const [isModelModalOpen, setIsModelModalOpen] = useState<boolean>(false);

  const handleSaveModel = (modelName: string, apiKey: string, baseUrl?: string) => {
    setSelectedModel(modelName);
    setCustomApiKey(apiKey);
    setCustomBaseUrl(baseUrl || '');
    localStorage.setItem('noesis_model_name', modelName);
    if (apiKey) localStorage.setItem('noesis_api_key', apiKey);
    else localStorage.removeItem('noesis_api_key');
    if (baseUrl) localStorage.setItem('noesis_base_url', baseUrl);
    else localStorage.removeItem('noesis_base_url');
  };

  const handleResetToInbuilt = () => {
    setSelectedModel('inbuilt');
    setCustomApiKey('');
    setCustomBaseUrl('');
    localStorage.removeItem('noesis_model_name');
    localStorage.removeItem('noesis_api_key');
    localStorage.removeItem('noesis_base_url');
  };

  const loadSessions = useCallback(async () => {
    try {
      const sessions = await chatApi.getSessions();
      setChatSessions(sessions);
    } catch (err) {
      console.warn('Failed to load chat sessions:', err);
    }
  }, []);

  const loadDocuments = useCallback(async () => {
    try {
      const docs = await chatApi.getDocuments();
      setDocuments(docs);
    } catch (err) {
      console.warn('Failed to load documents:', err);
    }
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      if (window.location.pathname.startsWith('/developer/evaluation') || window.location.pathname.startsWith('/evaluation')) {
        setActiveTab('evaluation');
        return;
      }
      const sid = getSessionIdFromPath();
      setCurrentSessionId(sid);
      setActiveTab('chat');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    const hasSession = typeof document !== 'undefined' && document.cookie.includes('rag_logged_in=1');

    if (!hasSession) {
      setIsAuthenticated(false);
      setIsAuthChecking(false);
      return; // Zero network requests fired on unauthenticated visits
    }

    const initAuth = async () => {
      try {
        const user = await authApi.getMe();
        if (user) {
          setUserProfile(user);
          setIsAuthenticated(true);
          loadSessions();
          loadDocuments();
        } else {
          // Indicator cookie existed but server session is invalid/expired
          document.cookie = 'rag_logged_in=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
          setIsAuthenticated(false);
        }
      } catch (err) {
        document.cookie = 'rag_logged_in=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
        setIsAuthenticated(false);
      } finally {
        setIsAuthChecking(false);
      }
    };
    initAuth();
  }, [loadSessions, loadDocuments]);

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

  const handleTabSwitch = (tab: 'chat' | 'documents' | 'evaluation') => {
    setActiveTab(tab);
    closeSidebarIfMobile();
    if (tab === 'evaluation') {
      window.history.pushState(null, '', '/developer/evaluation');
    } else if (tab === 'documents') {
      window.history.pushState(null, '', '/');
    } else {
      if (currentSessionId) {
        window.history.pushState(null, '', '/c/' + currentSessionId);
      } else {
        window.history.pushState(null, '', '/');
      }
    }
  };

  const handleLogin = useCallback((user: UserProfile) => {
    document.cookie = 'rag_logged_in=1; path=/; max-age=2592000; SameSite=Lax';
    setUserProfile(user);
    setIsAuthenticated(true);
    loadSessions();
    loadDocuments();
  }, [loadSessions, loadDocuments]);

  const handleLogout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch (e) {
      console.error(e);
    }
    document.cookie = 'rag_logged_in=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
    evictSessionCache();
    setIsAuthenticated(false);
    setUserProfile(null);
    setChatSessions([]);
    setDocuments([]);
    setCurrentSessionId('');
    window.history.pushState(null, '', '/');
  }, []);

  const handleToggleTheme = () => {
    setTheme(prev => {
      const nextTheme = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem('app-theme', nextTheme);
      document.documentElement.setAttribute('data-theme', nextTheme);
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(nextTheme);
      return nextTheme;
    });
  };

  const handleSelectSession = (id: string) => {
    setCurrentSessionId(id);
    setActiveTab('chat');
    closeSidebarIfMobile();
    window.history.pushState(null, '', id ? ('/c/' + id) : '/');
  };

  const handleNewSession = () => {
    setCurrentSessionId('');
    setActiveTab('chat');
    closeSidebarIfMobile();
    window.history.pushState(null, '', '/');
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
    window.history.pushState(null, '', '/c/' + newSession.id);
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
    evictSessionCache(id);
    setChatSessions(prev => prev.filter(s => s.id !== id));
    if (currentSessionId === id) {
      handleNewSession();
    }
  };

  if (isAuthChecking) {
    return (
      <div className={'app-root ' + theme} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '32px', height: '32px', border: '3px solid rgba(99,102,241,0.2)', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spinRing 0.8s linear infinite' }} />
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Verifying session...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className={'app-root ' + theme}>
        <AuthModal onLogin={handleLogin} />
        {/* Developer Team Invite Acceptance Gateway */}
        <AcceptInviteModal
          userProfile={userProfile}
          onInviteAccepted={async () => {
            try {
              const updated = await authApi.getMe();
              if (updated) {
                setUserProfile(updated);
                setIsAuthenticated(true);
                loadSessions();
                loadDocuments();
              }
            } catch (e) {
              console.error(e);
            }
          }}
        />
      </div>
    );
  }

  return (
    <div className={'app-root ' + theme}>
      {/* Developer Team Invite Acceptance Gateway */}
      <AcceptInviteModal
        userProfile={userProfile}
        onInviteAccepted={async () => {
          try {
            const updated = await authApi.getMe();
            if (updated) {
              setUserProfile(updated);
            }
          } catch (e) {
            console.error(e);
          }
          setActiveTab('evaluation');
          window.history.pushState(null, '', '/developer/evaluation');
        }}
      />

      {/* Mobile Drawer Backdrop */}
      <div 
        className={`sidebar-mobile-backdrop ${!isSidebarCollapsed ? 'active' : ''}`}
        onClick={() => setIsSidebarCollapsed(true)}
        aria-hidden="true"
      />

      <div className="app-workspace-container">
        <Sidebar 
          chatSessions={chatSessions}
          currentSessionId={currentSessionId}
          onSelectSession={handleSelectSession}
          onNewSession={handleNewSession}
          onDeleteSession={handleDeleteSession}
          onOpenDocManager={() => handleTabSwitch('documents')}
          onOpenEvaluations={() => handleTabSwitch('evaluation')}
          activeTab={activeTab}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(prev => !prev)}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          docCount={documents.length}
          theme={theme}
          onToggleTheme={handleToggleTheme}
          onLogout={handleLogout}
          userProfile={userProfile}
          selectedModel={selectedModel}
          onOpenModelModal={() => setIsModelModalOpen(true)}
        />

        <main className="app-main-viewport">
          <Navbar 
            theme={theme}
            onToggleTheme={handleToggleTheme}
            activeTab={activeTab}
            setActiveTab={handleTabSwitch}
            docCount={documents.length}
            userProfile={userProfile}
            onToggleSidebar={() => setIsSidebarCollapsed(prev => !prev)}
            isSidebarCollapsed={isSidebarCollapsed}
          />

          <div className="app-content-stage">
            {activeTab === 'chat' ? (
              <ChatStudio 
                currentSessionId={currentSessionId}
                onSelectSession={handleSelectSession}
                onSessionCreated={handleSessionCreated}
                onSessionTitleUpdated={handleSessionTitleUpdated}
                onNavigateToIngestion={() => handleTabSwitch('documents')}
                docCount={documents.length}
                documents={documents}
                onDocumentUploaded={(newDoc) => {
                  setDocuments(prev => {
                    if (prev.some(d => d.id === newDoc.id)) return prev;
                    return [newDoc, ...prev];
                  });
                }}
                onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
                userProfile={userProfile}
                selectedModel={selectedModel}
                customApiKey={customApiKey}
                customBaseUrl={customBaseUrl}
                onOpenModelModal={() => setIsModelModalOpen(true)}
              />
            ) : activeTab === 'documents' ? (
              <IngestionHub 
                documents={documents}
                setDocuments={setDocuments}
              />
            ) : (
              <DeveloperEvaluationDashboard 
                userProfile={userProfile}
                onNavigateToChat={() => handleTabSwitch('chat')}
              />
            )}
          </div>
        </main>
      </div>

      <CommandPalette 
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onSelectSession={(id) => {
          handleSelectSession(id);
          setIsCommandPaletteOpen(false);
        }}
        onNewSession={() => {
          handleNewSession();
          setIsCommandPaletteOpen(false);
        }}
        chatSessions={chatSessions}
        onOpenDocManager={() => {
          handleTabSwitch('documents');
          setIsCommandPaletteOpen(false);
        }}
      />

      {/* Simple Model Name & API Key Modal */}
      <SimpleModelModal
        isOpen={isModelModalOpen}
        onClose={() => setIsModelModalOpen(false)}
        selectedModel={selectedModel}
        apiKey={customApiKey}
        baseUrl={customBaseUrl}
        onSave={handleSaveModel}
        onResetToInbuilt={handleResetToInbuilt}
      />
    </div>
  );
}

export default App;
