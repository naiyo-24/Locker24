import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FolderPlus, AlertCircle, Loader2, Shield, Eye, EyeOff, Lock } from 'lucide-react';
import Button from '../common/Button';

const CreateFolderModal = ({ isOpen, onClose, onCreated, token, API_URL }) => {
  const [name, setName] = useState('');
  const [isSensitive, setIsSensitive] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [usePassword, setUsePassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async () => {
    const trimmed = name.trim();
    if (!trimmed) { setError('Please enter a folder name.'); return; }
    if (usePassword && !password.trim()) { setError('Please enter a password or disable password protection.'); return; }

    setIsLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_URL}/api/folders/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: trimmed,
          is_sensitive: isSensitive,
          password: usePassword ? password.trim() : null,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.detail || 'Could not create folder.');
        return;
      }

      const folder = await res.json();
      onCreated(folder);
      handleClose();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setName(''); setIsSensitive(false); setPassword('');
    setUsePassword(false); setShowPassword(false); setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={handleClose}
          className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 16 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 16 }}
          transition={{ type: 'spring', damping: 22, stiffness: 260 }}
          className="relative w-full max-w-md glass bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl border border-white/10 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-500/10 text-amber-400 rounded-xl flex items-center justify-center">
                <FolderPlus size={20} />
              </div>
              <h2 className="text-xl font-bold font-display">New Folder</h2>
            </div>
            <button onClick={handleClose} className="p-2 hover:bg-white/5 rounded-full text-slate-500 transition-colors">
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-5">

            {/* Folder Name */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Folder Name</label>
              <input
                id="folder-name-input"
                type="text"
                autoFocus
                value={name}
                onChange={(e) => { setName(e.target.value); setError(''); }}
                onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') handleClose(); }}
                placeholder="e.g. Tax Documents 2024"
                maxLength={80}
                className="w-full bg-slate-900/60 dark:bg-slate-950/40 border border-white/5 rounded-2xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary-600/30 outline-none transition-all text-slate-100 placeholder-slate-600"
              />
            </div>

            {/* Highly Sensitive Toggle */}
            <button
              onClick={() => setIsSensitive(!isSensitive)}
              className={`w-full flex items-center justify-between border rounded-2xl py-3 px-4 text-sm transition-all ${
                isSensitive
                  ? 'border-amber-500/50 bg-amber-500/5 text-amber-400'
                  : 'border-white/5 bg-slate-900/50 text-slate-400'
              }`}
            >
              <div className="flex items-center gap-2 font-bold">
                <Shield size={16} />
                Highly Sensitive Folder
              </div>
              <div className={`w-9 h-5 rounded-full relative transition-all ${isSensitive ? 'bg-amber-500' : 'bg-slate-700'}`}>
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${isSensitive ? 'right-0.5' : 'left-0.5'}`} />
              </div>
            </button>

            {/* Password Protection Toggle */}
            <button
              onClick={() => { setUsePassword(!usePassword); if (usePassword) setPassword(''); }}
              className={`w-full flex items-center justify-between border rounded-2xl py-3 px-4 text-sm transition-all ${
                usePassword
                  ? 'border-primary-500/50 bg-primary-500/5 text-primary-400'
                  : 'border-white/5 bg-slate-900/50 text-slate-400'
              }`}
            >
              <div className="flex items-center gap-2 font-bold">
                <Lock size={16} />
                Password Protected
              </div>
              <div className={`w-9 h-5 rounded-full relative transition-all ${usePassword ? 'bg-primary-500' : 'bg-slate-700'}`}>
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${usePassword ? 'right-0.5' : 'left-0.5'}`} />
              </div>
            </button>

            {/* Password Input */}
            <AnimatePresence>
              {usePassword && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2 overflow-hidden"
                >
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Set Folder Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setError(''); }}
                      placeholder="Enter a strong password"
                      className="w-full bg-slate-900/60 border border-white/5 rounded-2xl py-3 pl-4 pr-12 text-sm focus:ring-2 focus:ring-primary-600/30 outline-none transition-all text-slate-100 placeholder-slate-600"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 px-1">
                    You'll need this password every time you open the folder.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 text-red-400 text-sm font-medium"
              >
                <AlertCircle size={16} /> {error}
              </motion.div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <Button variant="ghost" onClick={handleClose} className="flex-1">Cancel</Button>
              <Button onClick={handleCreate} disabled={!name.trim() || isLoading} isLoading={isLoading} className="flex-1">
                {isLoading ? 'Creating...' : 'Create Folder'}
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default CreateFolderModal;
