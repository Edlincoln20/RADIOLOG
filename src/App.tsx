/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { Monitoring } from './components/Monitoring';
import { Maintenance } from './components/Maintenance';
import { Reports } from './components/Reports';
import { Settings } from './components/Settings';
import { UserManagement } from './components/UserManagement';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { 
  auth, 
  db,
  googleProvider, 
  signInWithPopup, 
  onAuthStateChanged, 
  signOut,
  doc,
  getDoc,
  setDoc,
  collection
} from './firebase';
import { Button } from './components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './components/ui/card';
import { Scan, LogIn } from 'lucide-react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { UserProfile } from './types';

export default function App() {
  const [activeTab, setActiveTab] = React.useState('dashboard');
  const [user, setUser] = React.useState<any>(null);
  const [profile, setProfile] = React.useState<UserProfile | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [loginError, setLoginError] = React.useState<string | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false);
  const [isDarkMode, setIsDarkMode] = React.useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  React.useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        setUser(authUser);
        setLoginError(null);
        // Fetch or create profile
        try {
          const profileRef = doc(db, 'users', authUser.uid);
          const profileDoc = await getDoc(profileRef);
          
          if (profileDoc.exists()) {
            setProfile(profileDoc.data() as UserProfile);
          } else {
            // Create default profile
            const isAdminEmail = authUser.email === 'nlocnilde@gmail.com';
            const newProfile: UserProfile = {
              uid: authUser.uid,
              name: authUser.displayName || 'Usuário',
              email: authUser.email || '',
              role: isAdminEmail ? 'admin' : 'operador'
            };
            await setDoc(profileRef, newProfile);
            setProfile(newProfile);
          }
        } catch (error) {
          console.error('Error fetching profile:', error);
        }
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    setLoginError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      console.error('Login error:', error);
      if (error.code === 'auth/popup-closed-by-user') {
        setLoginError('O login foi cancelado porque a janela foi fechada. Por favor, tente novamente.');
      } else if (error.code === 'auth/cancelled-popup-request') {
        setLoginError('Apenas uma janela de login pode estar aberta por vez.');
      } else {
        setLoginError('Ocorreu um erro ao tentar fazer login. Verifique sua conexão ou se os pop-ups estão permitidos.');
      }
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const updateProfile = (newProfile: UserProfile) => {
    setProfile(newProfile);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <motion.div 
          animate={{ scale: [1, 1.1, 1] }} 
          transition={{ repeat: Infinity, duration: 2 }}
          className="flex flex-col items-center gap-4"
        >
          <Scan className="text-blue-600 h-12 w-12" />
          <p className="text-slate-500 font-medium animate-pulse">Carregando RadioLog...</p>
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
        <Card className="w-full max-w-md bg-slate-800 border-slate-700 text-white">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto bg-blue-600 p-3 rounded-2xl w-fit mb-4">
              <Scan className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-3xl font-bold tracking-tight">RadioLog</CardTitle>
            <CardDescription className="text-slate-400">
              Gestão Técnica e Monitoramento de Radiologia
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-center text-slate-400 mb-6">
              Acesse com sua conta institucional para monitorar equipamentos e gerenciar manutenções.
            </p>
            
            {loginError && (
              <div className="p-3 rounded-lg bg-red-900/30 border border-red-500/50 text-red-200 text-xs text-center mb-4 animate-in fade-in slide-in-from-top-1">
                {loginError}
              </div>
            )}

            <Button 
              onClick={handleLogin} 
              className="w-full h-12 bg-white text-slate-900 hover:bg-slate-100 gap-3 font-semibold"
            >
              <LogIn size={20} />
              Entrar com Google
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'monitoring':
        return <Monitoring />;
      case 'maintenance':
        return <Maintenance />;
      case 'reports':
        return <Reports profile={profile} />;
      case 'users':
        return <UserManagement />;
      case 'settings':
        return <Settings 
          isDarkMode={isDarkMode} 
          toggleDarkMode={toggleDarkMode} 
          profile={profile}
          onProfileUpdate={updateProfile}
        />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background text-foreground flex transition-colors duration-300">
        <Sidebar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          onLogout={handleLogout} 
          profile={profile}
          isCollapsed={isSidebarCollapsed}
          setIsCollapsed={setIsSidebarCollapsed}
          isDarkMode={isDarkMode}
        />
        
        <main className={cn(
          "flex-1 transition-all duration-300 p-4 md:p-8",
          isSidebarCollapsed ? "md:ml-20" : "md:ml-64"
        )}>
          <div className="max-w-7xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                {renderContent()}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </ErrorBoundary>
  );
}


