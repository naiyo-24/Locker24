import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Eye, EyeOff, AlertCircle, Loader2, X } from 'lucide-react';
import Button from '../common/Button';

/**
 * FolderPasswordGate
 * Shows a full-screen password prompt before revealing folder contents.
 * Props:
 *   folderName  — displayed in the heading
 *   folderId    — used to call the verify endpoint
 *   token / API_URL — auth
 *   onSuccess   — called when the password is verified
 *   onCancel    — called when user cancels / goes back
 */
const FolderPasswordGate = ({ folderName, folderId, token, API_URL, onSuccess, onCancel }) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);

  const handleVerify = async () => {
    if (!password.trim()) { setError('Please enter the folder password.'); return; }

    setIsLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_URL}/api/folders/${folderId}/verify-password`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      if (!res.ok) throw new Error('Server error');
      const data = await res.json();

      if (data.verified) {
        onSuccess();
      } else {
        const next = attempts + 1;
        setAttempts(next);
        setError(`Incorrect password. Please try again.`);
        setPassword('');
      }
    } catch {
      setError('Could not verify password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Full-page centred gate */}
      <div className="flex-1 flex items-center justify-center p-6 bg-background">
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 220 }}
          className="w-full max-w-sm"
        >
          {/* Lock Icon */}
          <div className="flex flex-col items-center mb-8">
            <motion.div
              animate={{ rotate: [0, -5, 5, -5, 0] }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="w-20 h-20 rounded-3xl bg-primary-600/10 text-primary-400 flex items-center justify-center mb-4 shadow-xl shadow-primary-500/10"
            >
              <Lock size={36} />
            </motion.div>
            <h1 className="text-2xl font-bold font-display text-center">Password Required</h1>
            <p className="text-muted-foreground text-sm mt-1 text-center">
              <span className="font-semibold text-foreground">"{folderName}"</span> is protected.
            </p>
          </div>

          {/* Password Field */}
          <div className="space-y-4">
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                autoFocus
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                onKeyDown={(e) => { if (e.key === 'Enter') handleVerify(); if (e.key === 'Escape') onCancel(); }}
                placeholder="Enter folder password"
                className="w-full bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/5 rounded-2xl py-4 pl-4 pr-12 text-sm focus:ring-2 focus:ring-primary-600/30 focus:border-primary-500/40 outline-none transition-all text-foreground placeholder-slate-400 dark:placeholder-slate-600"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2 text-red-400 text-sm font-medium px-1"
                >
                  <AlertCircle size={15} /> {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Unlock Button */}
            <Button
              onClick={handleVerify}
              disabled={!password.trim() || isLoading}
              isLoading={isLoading}
              className="w-full py-4 text-base"
            >
              {isLoading ? (
                <><Loader2 size={18} className="animate-spin mr-2" /> Verifying...</>
              ) : (
                <><Lock size={18} className="mr-2" /> Unlock Folder</>
              )}
            </Button>

            {/* Cancel */}
            <button
              onClick={onCancel}
              className="w-full text-center text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-medium transition-colors py-2"
            >
              Go back
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default FolderPasswordGate;
