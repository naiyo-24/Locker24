import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  Share2, 
  Shield, 
  Clock, 
  Plus, 
  Trash2, 
  Download, 
  Eye, 
  ArrowUpRight, 
  FileSpreadsheet, 
  Presentation, 
  FileImage, 
  FileCode, 
  FileArchive,
  Search,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Activity,
  LogOut,
  FolderOpen,
  FileVideo
} from 'lucide-react';
import Sidebar from '../../components/layout/Sidebar';
import Topbar from '../../components/layout/Topbar';
import Button from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';
import UploadModal from '../../components/dashboard/UploadModal';
import DocumentViewer from '../../components/dashboard/DocumentViewer';
import ShareModal from '../../components/dashboard/ShareModal';
import ConfirmModal from '../../components/common/ConfirmModal';

const DashboardPage = () => {
  const { token, API_URL } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState({
    title: "",
    message: "",
    confirmText: "",
    onConfirm: () => {}
  });

  const triggerConfirm = (title, message, confirmText, onConfirm) => {
    setConfirmConfig({ title, message, confirmText, onConfirm });
    setIsConfirmOpen(true);
  };

  const openViewer = (doc) => {
    setSelectedDoc(doc);
    setIsViewerOpen(true);
  };

  const openShare = (doc) => {
    setSelectedDoc(doc);
    setIsShareModalOpen(true);
  };

  const handleDownloadDirect = async (doc) => {
    const isSensitive = ['Finance', 'Identity', 'Health', 'Legal'].includes(doc.category) || doc.is_sensitive;
    if (isSensitive) {
      openViewer(doc);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/documents/${doc.id}/download?token=${token}`);
      if (!response.ok) throw new Error('Download failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = doc.name;
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const getFileIcon = (filename) => {
    if (!filename) return { icon: <FileText size={20} />, color: 'bg-slate-500/10 text-slate-500' };
    const ext = filename.split('.').pop().toLowerCase();
    const iconProps = { size: 20 };
    
    if (['xls', 'xlsx', 'csv'].includes(ext)) {
      return { icon: <FileSpreadsheet {...iconProps} />, color: 'bg-emerald-500/10 text-emerald-500' };
    }
    if (['ppt', 'pptx'].includes(ext)) {
      return { icon: <Presentation {...iconProps} />, color: 'bg-orange-500/10 text-orange-500' };
    }
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) {
      return { icon: <FileImage {...iconProps} />, color: 'bg-blue-500/10 text-blue-500' };
    }
    if (['js', 'py', 'html', 'css', 'json', 'sql'].includes(ext)) {
      return { icon: <FileCode {...iconProps} />, color: 'bg-purple-500/10 text-purple-500' };
    }
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
      return { icon: <FileArchive {...iconProps} />, color: 'bg-amber-500/10 text-amber-500' };
    }
    if (['pdf'].includes(ext)) {
      return { icon: <FileText {...iconProps} />, color: 'bg-red-500/10 text-red-500' };
    }
    if (['mp4', 'webm', 'ogg', 'mov', 'mkv', 'avi'].includes(ext)) {
      return { icon: <FileVideo {...iconProps} />, color: 'bg-indigo-500/10 text-indigo-500' };
    }
    
    return { icon: <FileText {...iconProps} />, color: 'bg-slate-500/10 text-slate-500' };
  };

  const [sharedCount, setSharedCount] = useState(0);
  const [totalStorageUsed, setTotalStorageUsed] = useState('0 B');

  const parseSizeToBytes = (sizeStr) => {
    if (!sizeStr) return 0;
    const match = sizeStr.trim().match(/^([\d.]+)\s*([A-Za-z]+)?$/);
    if (!match) return 0;
    const value = parseFloat(match[1]);
    const unit = (match[2] || 'B').toUpperCase();
    
    const multipliers = {
      'B': 1,
      'KB': 1024,
      'MB': 1024 * 1024,
      'GB': 1024 * 1024 * 1024,
      'TB': 1024 * 1024 * 1024 * 1024
    };
    
    return value * (multipliers[unit] || 1);
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDeleteDocument = (docId, shouldCloseViewer = false) => {
    triggerConfirm(
      "Move to Trash?",
      "Are you sure you want to move this document to Trash? You can recover or restore it later.",
      "Move to Trash",
      () => {
        const trashed = JSON.parse(localStorage.getItem('trashed_documents') || '[]');
        if (!trashed.includes(docId)) {
          localStorage.setItem('trashed_documents', JSON.stringify([...trashed, docId]));
        }
        fetchDocuments();
        if (shouldCloseViewer) setIsViewerOpen(false);
      }
    );
  };

  const fetchDocuments = async () => {
    setIsLoading(true);
    try {
      const docRes = await fetch(`${API_URL}/api/documents/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (docRes.ok) {
        const rawDocs = await docRes.json();
        const totalBytes = rawDocs.reduce((sum, doc) => sum + parseSizeToBytes(doc.size), 0);
        setTotalStorageUsed(formatBytes(totalBytes));

        const trashed = JSON.parse(localStorage.getItem('trashed_documents') || '[]');
        const archived = JSON.parse(localStorage.getItem('archived_documents') || '[]');
        const activeDocs = rawDocs.filter(doc => !trashed.includes(doc.id) && !archived.includes(doc.id));
        setDocuments(activeDocs);
      }

      const shareRes = await fetch(`${API_URL}/api/share/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (shareRes.ok) {
        const shares = await shareRes.json();
        setSharedCount(shares.length);
      }
    } catch (error) {
      console.error('Failed to fetch:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchDocuments();
    }
  }, [token, API_URL]);

  const stats = [
    { label: 'Total Documents', value: documents.length.toString(), icon: FileText, color: 'bg-blue-500' },
    // { label: 'Recently Shared', value: sharedCount.toString(), icon: Share2, color: 'bg-purple-500' },
    { label: 'Secure Storage', value: totalStorageUsed, icon: Shield, color: 'bg-emerald-500' },
    { label: 'Pending Actions', value: '0', icon: Clock, color: 'bg-amber-500' },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Topbar />
        
        <div className="p-8 space-y-8 max-w-7xl mx-auto w-full">
          {/* Welcome Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/10 dark:bg-slate-900/40 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800">
            <div>
              <h1 className="text-3xl font-bold font-display">Welcome Back to Locker 24</h1>
              <p className="text-muted-foreground mt-1 font-medium">Your personal, zero-knowledge security vault is unlocked and active.</p>
            </div>
            <div>
              <Button onClick={() => setIsUploadModalOpen(true)}>
                <Plus size={18} className="mr-2 animate-pulse" /> Add Document
              </Button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, i) => (
              <motion.div 
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                className="glass bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl hover:shadow-xl transition-all duration-300 group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500 font-bold uppercase tracking-wider">{stat.label}</span>
                  <div className={`w-10 h-10 rounded-xl ${stat.color} text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                    <stat.icon size={20} />
                  </div>
                </div>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-3xl font-bold tracking-tight">{stat.value}</span>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Documents Table */}
          <div className="glass bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold font-display">Recent Secure Files</h2>
                <p className="text-sm text-slate-500 mt-0.5">Quick access to recently uploaded records</p>
              </div>
              <Button variant="outline" className="rounded-2xl px-5 border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 self-start sm:self-auto" onClick={() => window.location.href='/documents'}>
                View All Files <ChevronRight size={16} className="ml-1" />
              </Button>
            </div>

            <div className="overflow-x-auto -mx-6 px-6">
              <table className="w-full text-left min-w-[700px]">
                <thead>
                  <tr className="border-b border-border text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    <th className="pb-4 min-w-[240px]">Name</th>
                    <th className="pb-4 min-w-[120px]">Category</th>
                    <th className="pb-4 min-w-[100px]">Size</th>
                    <th className="pb-4 min-w-[110px]">Uploaded</th>
                    <th className="pb-4 min-w-[130px] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {isLoading ? (
                    <tr>
                      <td colSpan="5" className="py-12 text-center text-slate-500 font-medium">
                        Loading documents...
                      </td>
                    </tr>
                  ) : documents.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="py-12 text-center text-slate-500 font-medium">
                        No documents stored yet. Click "Add Document" above to upload!
                      </td>
                    </tr>
                  ) : (
                    documents.slice(0, 5).map((doc) => (
                      <motion.tr 
                        key={doc.id}
                        onClick={() => openViewer(doc)}
                        className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors cursor-pointer group"
                      >
                        <td className="py-4 flex items-center gap-3 pr-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${getFileIcon(doc.name).color}`}>
                            {getFileIcon(doc.name).icon}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 dark:text-white group-hover:text-primary-500 transition-colors truncate max-w-[200px]" title={doc.name}>
                              {doc.name}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 pr-4">
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 capitalize">
                            {doc.category}
                          </span>
                        </td>
                        <td className="py-4 pr-4 text-slate-500 font-medium">{doc.size}</td>
                        <td className="py-4 pr-4 text-slate-500 font-medium">
                          {new Date(doc.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            <button className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800/40 hover:bg-primary-500/10 hover:text-primary-500 flex items-center justify-center transition-all text-slate-500 dark:text-slate-400" onClick={() => openViewer(doc)} title="Quick View">
                              <Eye size={16} />
                            </button>
                            <button className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800/40 hover:bg-emerald-500/10 hover:text-emerald-500 flex items-center justify-center transition-all text-slate-500 dark:text-slate-400" onClick={() => handleDownloadDirect(doc)} title="Secure Download">
                              <Download size={16} />
                            </button>
                            {/*
                            <button className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800/40 hover:bg-purple-500/10 hover:text-purple-500 flex items-center justify-center transition-all text-slate-500 dark:text-slate-400" onClick={() => openShare(doc)} title="Secure Share Link">
                              <Share2 size={16} />
                            </button>
                            */}
                            <button className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800/40 hover:bg-red-500/10 hover:text-red-500 flex items-center justify-center transition-all text-slate-500 dark:text-slate-400" onClick={() => handleDeleteDocument(doc.id)} title="Move to Trash">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            
            {documents.length > 5 && (
              <div className="p-4 text-center border-t border-border">
                <Button variant="ghost" className="text-sm font-bold text-slate-500" onClick={() => window.location.href='/documents'}>
                  View All Documents ({documents.length})
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>

      <UploadModal 
        isOpen={isUploadModalOpen} 
        onClose={() => setIsUploadModalOpen(false)}
        onUploadSuccess={fetchDocuments}
        token={token}
        API_URL={API_URL}
      />

      <DocumentViewer 
        isOpen={isViewerOpen}
        onClose={() => setIsViewerOpen(false)}
        document={selectedDoc}
        token={token}
        API_URL={API_URL}
        onDelete={(docId) => handleDeleteDocument(docId, true)}
        onUpdate={fetchDocuments}
      />

      <ShareModal 
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        document={selectedDoc}
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

export default DashboardPage;
