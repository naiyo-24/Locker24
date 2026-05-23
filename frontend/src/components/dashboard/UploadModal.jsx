import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Upload, 
  File, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  Shield,
  Tag,
  FolderOpen
} from 'lucide-react';
import Button from '../common/Button';

const UploadModal = ({ isOpen, onClose, onUploadSuccess, token, API_URL, defaultFolderId = null }) => {
  const [file, setFile] = useState(null);
  const [category, setCategory] = useState('Personal');
  const [customCategory, setCustomCategory] = useState('');
  const [isSensitive, setIsSensitive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null); // 'success' | 'error' | 'expired'
  const [errorMessage, setErrorMessage] = useState('');
  const [folderId, setFolderId] = useState(defaultFolderId);
  const [folders, setFolders] = useState([]);
  const fileInputRef = useRef(null);

  const categories = [
    'Identity', 'Education', 'Finance', 'Health', 
    'Vehicle', 'Legal', 'Employment', 'Personal', 'Other'
  ];

  // Fetch user folders whenever modal opens
  useEffect(() => {
    if (!isOpen || !token) return;
    setFolderId(defaultFolderId);
    fetch(`${API_URL}/api/folders/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.ok ? r.json() : [])
      .then(setFolders)
      .catch(() => setFolders([]));
  }, [isOpen, token, API_URL, defaultFolderId]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setUploadStatus(null);
      if (category === 'Other') {
        const nameWithoutExtension = selectedFile.name.split('.').slice(0, -1).join('.') || selectedFile.name;
        setCustomCategory(nameWithoutExtension);
      }
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setUploadStatus(null);
    setErrorMessage('');

    const finalCategory = category === 'Other' ? (customCategory.trim() || 'Other') : category;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', finalCategory);
    formData.append('is_sensitive', isSensitive);
    if (folderId) formData.append('folder_id', folderId);

    try {
      const response = await fetch(`${API_URL}/api/upload/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });

      if (response.ok) {
        setUploadStatus('success');
        setTimeout(() => {
          onUploadSuccess();
          onClose();
          resetForm();
        }, 1500);
      } else if (response.status === 401 || response.status === 403) {
        setUploadStatus('expired');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setTimeout(() => {
          window.location.href = '/login?expired=true';
        }, 2500);
      } else if (response.status === 413) {
        const errorData = await response.json().catch(() => ({}));
        setErrorMessage(errorData.detail || 'Storage limit of 15 GB reached.');
        setUploadStatus('error');
      } else {
        const errorData = await response.json().catch(() => ({}));
        setErrorMessage(errorData.detail || 'Upload failed. Try again.');
        setUploadStatus('error');
      }
    } catch (error) {
      console.error('Upload failed:', error);
      setErrorMessage(error.message || 'Upload failed. Try again.');
      setUploadStatus('error');
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setCategory('Personal');
    setCustomCategory('');
    setIsSensitive(false);
    setUploadStatus(null);
    setErrorMessage('');
    setFolderId(defaultFolderId);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
        />
        
        <motion.div 
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative w-full max-w-lg glass bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/10"
        >
          {/* Header */}
          <div className="p-6 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-600/10 text-primary-500 rounded-xl flex items-center justify-center">
                <Upload size={20} />
              </div>
              <h2 className="text-xl font-bold font-display">Upload Document</h2>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-slate-500 transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="p-8 space-y-6">
            {/* File Dropzone */}
            <div 
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-3xl p-10 text-center cursor-pointer transition-all ${file ? 'border-primary-500 bg-primary-500/5' : 'border-slate-800 hover:border-slate-700 bg-slate-900/30'}`}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
              />
              
              {file ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-primary-600/20">
                    <File size={32} />
                  </div>
                  <div className="text-sm font-bold text-slate-200 truncate max-w-xs">{file.name}</div>
                  <div className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</div>
                  <button className="text-xs text-primary-500 font-bold hover:underline">Change file</button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center text-slate-500">
                    <Upload size={32} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-300">Click to browse or drag & drop</p>
                    <p className="text-xs text-slate-500 mt-1">Any file type supported (Max 10MB)</p>
                  </div>
                </div>
              )}
            </div>

            {/* Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2 px-1">
                  <Tag size={12} /> Category
                </label>
                <select 
                  value={category}
                  onChange={(e) => {
                    const val = e.target.value;
                    setCategory(val);
                    if (val === 'Other' && file) {
                      const nameWithoutExtension = file.name.split('.').slice(0, -1).join('.') || file.name;
                      setCustomCategory(nameWithoutExtension);
                    }
                  }}
                  className="w-full bg-slate-900 border border-white/5 rounded-2xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary-600/20 outline-none transition-all"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2 px-1">
                  <Shield size={12} /> Security
                </label>
                <button 
                  onClick={() => setIsSensitive(!isSensitive)}
                  className={`w-full flex items-center justify-between border rounded-2xl py-3 px-4 text-sm transition-all ${isSensitive ? 'border-amber-500/50 bg-amber-500/5 text-amber-500' : 'border-white/5 bg-slate-900 text-slate-400'}`}
                >
                  <span className="font-bold">Highly Sensitive</span>
                  <div className={`w-8 h-4 rounded-full relative transition-all ${isSensitive ? 'bg-amber-500' : 'bg-slate-800'}`}>
                    <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${isSensitive ? 'right-0.5' : 'left-0.5'}`} />
                  </div>
                </button>
              </div>
            </div>

            {/* Folder Selector */}
            {folders.length > 0 && !defaultFolderId && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2 px-1">
                  <FolderOpen size={12} /> Save to Folder (optional)
                </label>
                <select
                  value={folderId ?? ''}
                  onChange={(e) => setFolderId(e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full bg-slate-900 border border-white/5 rounded-2xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary-600/20 outline-none transition-all"
                >
                  <option value="">— No Folder —</option>
                  {folders.map((f) => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Custom Category Input */}
            {category === 'Other' && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2"
              >
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2 px-1">
                  <Tag size={12} /> Custom Category Name
                </label>
                <input 
                  type="text" 
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="Enter custom category name (defaults to file name)"
                  className="w-full bg-slate-900 border border-white/5 rounded-2xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary-600/20 outline-none transition-all text-slate-200"
                />
              </motion.div>
            )}

            {/* Status Messages */}
            {uploadStatus === 'success' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 text-emerald-500 justify-center font-bold">
                <CheckCircle size={20} /> Upload successful!
              </motion.div>
            )}
            {uploadStatus === 'expired' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-1.5 text-amber-500 justify-center text-center">
                <div className="flex items-center gap-2 font-bold">
                  <AlertCircle size={20} /> Session Expired!
                </div>
                <p className="text-xs font-medium text-slate-400">Redirecting to login page...</p>
              </motion.div>
            )}
            {uploadStatus === 'error' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 text-red-500 justify-center font-bold text-center text-sm">
                <AlertCircle size={20} className="shrink-0" /> 
                <span>{errorMessage || 'Upload failed. Try again.'}</span>
              </motion.div>
            )}

            {/* Actions */}
            <div className="flex gap-4 pt-2">
              <Button variant="ghost" onClick={onClose} className="flex-1 py-4">Cancel</Button>
              <Button 
                onClick={handleUpload} 
                disabled={!file || isUploading}
                isLoading={isUploading}
                className="flex-1 py-4"
              >
                {isUploading ? 'Uploading...' : 'Start Upload'}
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default UploadModal;
