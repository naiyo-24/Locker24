import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FolderOpen,
  FolderPlus,
  Folder,
  Trash2,
  Pencil,
  ChevronRight,
  Loader2,
  Search,
  FileText,
  Lock,
  Shield,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/layout/Sidebar';
import Topbar from '../../components/layout/Topbar';
import Button from '../../components/common/Button';
import ConfirmModal from '../../components/common/ConfirmModal';
import CreateFolderModal from '../../components/folders/CreateFolderModal';
import { useAuth } from '../../context/AuthContext';

const FoldersPage = () => {
  const { token, API_URL } = useAuth();
  const navigate = useNavigate();

  const [folders, setFolders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Rename state
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const [renameLoading, setRenameLoading] = useState(false);

  // Confirm delete
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState({});

  const fetchFolders = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/folders/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setFolders(await res.json());
    } catch (e) {
      console.error('Failed to fetch folders:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { if (token) fetchFolders(); }, [token]);

  const handleCreated = (folder) => setFolders((prev) => [folder, ...prev]);

  const startRename = (folder) => { setRenamingId(folder.id); setRenameValue(folder.name); };

  const commitRename = async (folderId) => {
    const trimmed = renameValue.trim();
    if (!trimmed) { setRenamingId(null); return; }
    setRenameLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/folders/${folderId}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
      });
      if (res.ok) {
        const updated = await res.json();
        setFolders((prev) => prev.map((f) => (f.id === folderId ? { ...f, name: updated.name } : f)));
      }
    } catch (e) { console.error('Rename failed:', e); }
    finally { setRenameLoading(false); setRenamingId(null); }
  };

  const handleDelete = (folder) => {
    setConfirmConfig({
      title: 'Delete Folder?',
      message: `"${folder.name}" will be deleted. The ${folder.document_count} document(s) inside will NOT be deleted — they'll appear in All Documents.`,
      confirmText: 'Delete Folder',
      onConfirm: async () => {
        await fetch(`${API_URL}/api/folders/${folder.id}`, {
          method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
        });
        setFolders((prev) => prev.filter((f) => f.id !== folder.id));
      },
    });
    setIsConfirmOpen(true);
  };

  const filteredFolders = folders.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Topbar />
        <div className="p-8 space-y-8 max-w-7xl mx-auto w-full">

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <FolderOpen size={24} />
              </div>
              <div>
                <h1 className="text-3xl font-bold font-display">My Folders</h1>
                <p className="text-muted-foreground mt-0.5 text-sm">
                  {folders.length} folder{folders.length !== 1 ? 's' : ''} in your vault
                </p>
              </div>
            </div>
            <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-3 w-full sm:w-auto">
              <div className="relative group w-full sm:w-auto">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary-500 transition-colors" size={18} />
                <input
                  type="text" placeholder="Search folders..." value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 pl-12 pr-4 w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-medium placeholder-slate-400 dark:placeholder-slate-600 text-slate-800 dark:text-slate-100"
                />
              </div>
              <Button onClick={() => setIsCreateOpen(true)}>
                <FolderPlus size={18} className="mr-2" /> New Folder
              </Button>
            </div>
          </div>

          {/* Grid */}
          {isLoading ? (
            <div className="py-32 text-center">
              <Loader2 className="w-12 h-12 animate-spin text-primary-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold">Loading Folders</h3>
            </div>
          ) : filteredFolders.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="py-32 text-center bg-white dark:bg-slate-900/20 rounded-[2.5rem] border border-dashed border-slate-200 dark:border-slate-800"
            >
              <Folder size={64} className="text-slate-300 dark:text-slate-700 mx-auto mb-6" />
              <h3 className="text-2xl font-bold mb-2">{searchQuery ? 'No folders matched' : 'No folders yet'}</h3>
              <p className="text-muted-foreground mb-8 max-w-sm mx-auto text-sm leading-relaxed">
                {searchQuery ? 'Try a different search term.' : 'Create your first folder to organise your documents.'}
              </p>
              {!searchQuery && (
                <Button onClick={() => setIsCreateOpen(true)}>
                  <FolderPlus size={18} className="mr-2" /> Create First Folder
                </Button>
              )}
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              <AnimatePresence>
                {filteredFolders.map((folder, i) => (
                  <motion.div
                    key={folder.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3, delay: i * 0.04 }}
                    className={`group glass border rounded-[2rem] p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 flex flex-col gap-4 ${
                      folder.is_sensitive
                        ? 'bg-amber-500/5 border-amber-500/20 hover:border-amber-400/40'
                        : 'bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 hover:border-amber-400/30'
                    }`}
                  >
                    {/* Top row: icon + badges */}
                    <div className="flex items-start justify-between">
                      <div
                        className={`w-14 h-14 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 cursor-pointer ${
                          folder.is_sensitive ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-500/10 text-amber-400'
                        }`}
                        onClick={() => navigate(`/folders/${folder.id}`)}
                      >
                        <Folder size={28} />
                      </div>

                      <div className="flex flex-col items-end gap-1.5">
                        {/* Doc count */}
                        <span className="flex items-center gap-1 text-xs font-semibold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">
                          <FileText size={11} /> {folder.document_count}
                        </span>
                        {/* Sensitive badge */}
                        {folder.is_sensitive && (
                          <span className="flex items-center gap-1 text-xs font-bold text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                            <Shield size={11} /> Sensitive
                          </span>
                        )}
                        {/* Password badge */}
                        {folder.is_password_protected && (
                          <span className="flex items-center gap-1 text-xs font-bold text-primary-400 bg-primary-500/10 px-2.5 py-1 rounded-full border border-primary-500/20">
                            <Lock size={11} /> Locked
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Name */}
                    {renamingId === folder.id ? (
                      <input
                        autoFocus value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onBlur={() => commitRename(folder.id)}
                        onKeyDown={(e) => { if (e.key === 'Enter') commitRename(folder.id); if (e.key === 'Escape') setRenamingId(null); }}
                        disabled={renameLoading}
                        className="w-full bg-slate-900/60 border border-primary-500/40 rounded-xl py-1.5 px-3 text-sm font-semibold outline-none text-slate-100"
                      />
                    ) : (
                      <div
                        className="font-bold text-lg text-foreground group-hover:text-amber-400 transition-colors truncate cursor-pointer flex items-center gap-2"
                        onClick={() => navigate(`/folders/${folder.id}`)}
                        title={folder.name}
                      >
                        {folder.is_password_protected && <Lock size={14} className="text-primary-400 shrink-0" />}
                        {folder.name}
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/60 mt-auto">
                      <button
                        onClick={() => navigate(`/folders/${folder.id}`)}
                        className="flex items-center gap-1 text-xs font-semibold text-primary-400 hover:text-primary-300 transition-colors"
                      >
                        Open <ChevronRight size={14} />
                      </button>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => startRename(folder)}
                          className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800/40 hover:bg-primary-500/10 hover:text-primary-400 flex items-center justify-center transition-all text-slate-400"
                          title="Rename"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(folder)}
                          className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800/40 hover:bg-red-500/10 hover:text-red-400 flex items-center justify-center transition-all text-slate-400"
                          title="Delete Folder"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </main>

      <CreateFolderModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={handleCreated}
        token={token}
        API_URL={API_URL}
      />

      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={confirmConfig.onConfirm}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmText={confirmConfig.confirmText}
      />
    </div>
  );
};

export default FoldersPage;
