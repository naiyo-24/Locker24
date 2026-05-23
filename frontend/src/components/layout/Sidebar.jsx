import React from 'react';
import { NavLink, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Files, 
  ShieldCheck, 
  Settings, 
  LogOut, 
  Lock,
  History,
  FolderOpen,
  Folder,
  User,
  DownloadCloud,
  X,
  Star,
  Archive
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { clsx } from 'clsx';
import logo from '../../assets/logo.png';

const Sidebar = () => {
  const { logout, isSidebarOpen, setIsSidebarOpen } = useAuth();
  const [isInstallable, setIsInstallable] = React.useState(!!window.deferredPrompt);
  const { pathname } = useLocation();

  React.useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname, setIsSidebarOpen]);

  React.useEffect(() => {
    const handleInstallable = () => {
      setIsInstallable(true);
    };

    window.addEventListener('pwa-installable', handleInstallable);
    
    const handleBeforePrompt = (e) => {
      e.preventDefault();
      window.deferredPrompt = e;
      setIsInstallable(true);
    };
    window.addEventListener('beforeinstallprompt', handleBeforePrompt);

    window.addEventListener('appinstalled', () => {
      setIsInstallable(false);
      window.deferredPrompt = null;
    });

    return () => {
      window.removeEventListener('pwa-installable', handleInstallable);
      window.removeEventListener('beforeinstallprompt', handleBeforePrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    const promptEvent = window.deferredPrompt;
    if (!promptEvent) {
      alert(
        "💡 How to Install Locker 24 App on PC:\n\n" +
        "1. Look at your browser's address bar at the very top of this window.\n" +
        "2. Click the 'Install' icon (a computer monitor screen with a down arrow, or a '+' icon located next to the bookmark star).\n" +
        "3. Click 'Install' in the prompt to add Locker 24 to your Desktop instantly!"
      );
      return;
    }
    
    try {
      promptEvent.prompt();
      const { outcome } = await promptEvent.userChoice;
      if (outcome === 'accepted') {
        setIsInstallable(false);
        window.deferredPrompt = null;
      }
    } catch (err) {
      console.error("Install prompt failed:", err);
    }
  };

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: FolderOpen, label: 'Categories', path: '/categories' },
    { icon: Folder, label: 'My Folders', path: '/folders' },
    { icon: Files, label: 'All Documents', path: '/documents' },
    // { icon: Star, label: 'Starred', path: '/categories/favorites' },
    // { icon: Archive, label: 'Archived', path: '/categories/archived' },
    { icon: History, label: 'Activity Log', path: '/activity' },
  ];
  const bottomItems = [
    { icon: User, label: 'My Profile', path: '/profile' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  const NavItem = ({ icon: Icon, label, path }) => (
    <NavLink
      to={path}
      end
      className={({ isActive }) => clsx(
        "flex items-center gap-3 px-4 py-2.5 rounded-2xl transition-all duration-300 group relative",
        isActive 
          ? "bg-primary-600/10 text-primary-400 shadow-[inset_0_0_0_1px_rgba(2,132,199,0.2)]" 
          : "text-slate-400 hover:bg-slate-900/50 hover:text-slate-200"
      )}
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <motion.div 
              layoutId="sidebar-active"
              className="absolute left-0 w-1 h-6 bg-primary-500 rounded-r-full"
            />
          )}
          <Icon size={20} className={clsx("transition-transform group-hover:scale-110", isActive ? "text-primary-400" : "text-slate-500 group-hover:text-slate-300")} />
          <span className="font-semibold tracking-wide text-sm">{label}</span>
        </>
      )}
    </NavLink>
  );

  const sidebarContent = (isMobile = false) => (
    <>
      <div className="flex items-center justify-between px-2 mb-6">
        <Link to="/dashboard" className="flex items-center gap-3 hover:opacity-90 active:scale-[0.98] transition-all group">
          <div className="w-[88px] h-[88px] flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
            <img src={logo} alt="Locker 24" className="w-full h-full object-contain" />
          </div>
          {/*
          <span className="text-xl font-bold font-display tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            Locker 24
          </span>
          */}
        </Link>
        {isMobile && (
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="p-2 hover:bg-white/5 rounded-xl text-slate-500 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        )}
      </div>

      <nav className="flex-1 space-y-1.5">
        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] px-4 mb-2">Main Menu</div>
        {menuItems.map(item => (
          <NavItem key={item.path} {...item} />
        ))}
        
        <div className="pt-5 mb-1.5">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] px-4 mb-2">Account</div>
          {bottomItems.map(item => (
            <NavItem key={item.path} {...item} />
          ))}
        </div>

      </nav>

      <div className="mt-auto pt-4 border-t border-white/5 space-y-1.5">
        <button
          onClick={handleInstallClick}
          className="flex items-center gap-3 w-full px-4 py-2.5 text-slate-400 hover:bg-primary-500/5 hover:text-primary-400 rounded-2xl transition-all font-semibold group"
        >
          <DownloadCloud size={20} className="transition-transform group-hover:scale-110 text-slate-500 group-hover:text-primary-400" />
          <span className="text-sm">Install App</span>
        </button>

        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-4 py-2.5 text-slate-400 hover:bg-red-500/5 hover:text-red-400 rounded-2xl transition-all font-semibold group"
        >
          <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm">Sign Out</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="w-72 hidden lg:flex flex-col border-r border-white/5 bg-slate-950/50 backdrop-blur-xl p-6 sticky top-0 h-screen">
        {sidebarContent(false)}
      </aside>

      {/* Mobile Sidebar Slider */}
      <AnimatePresence>
        {isSidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            {/* Dark blur backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            />
            {/* Sliding content */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute top-0 left-0 bottom-0 w-72 bg-slate-950 border-r border-white/5 p-6 flex flex-col h-full shadow-2xl"
            >
              {sidebarContent(true)}
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;
