import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './components/animated-characters-login-page';
import { Dashboard } from './pages/Dashboard';
import { Transfer } from './pages/Transfer';
import { AdminPortal } from './pages/Admin';
import { SplashScreen } from './components/SplashScreen';

function CustomerApp() {
  const [view, setView] = useState<'login' | 'dashboard' | 'transfer'>('login');
  const [userId, setUserId] = useState<string | null>(null);

  const handleLoginSuccess = (uid: string) => {
    setUserId(uid);
    setView('dashboard');
  };

  const handleLogout = () => {
    setUserId(null);
    setView('login');
  };

  return (
    <div className="App min-h-screen">
      {view === 'login' && (
        <LoginPage onLoginSuccess={handleLoginSuccess} />
      )}
      
      {view === 'dashboard' && userId && (
        <Dashboard 
          userId={userId} 
          onNavigateToTransfer={() => setView('transfer')}
          onLogout={handleLogout}
        />
      )}

      {view === 'transfer' && userId && (
        <Transfer 
          userId={userId} 
          onBack={() => setView('dashboard')} 
        />
      )}
    </div>
  );
}

function App() {
  const [showSplash, setShowSplash] = useState(true);

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<CustomerApp />} />
        <Route path="/admin" element={<AdminPortal />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
