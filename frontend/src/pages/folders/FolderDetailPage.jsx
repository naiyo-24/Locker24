import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Folder,
  FileText,
  ArrowLeft,
  Plus,
  Eye,
  Download,
  Trash2,
  Loader2,
  Calendar,
  Layers,
  FileSpreadsheet,
  Presentation,
  FileImage,
  FileCode,
  FileArchive,
  FileVideo,
  Shield,
  Lock,
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import Sidebar from '../../components/layout/Sidebar';
import Topbar from '../../components/layout/Topbar';
import Button from '../../components/common/Button';
import ConfirmModal from '../../components/common/ConfirmModal';
import UploadModal from '../../components/dashboard/UploadModal';
import DocumentViewer from '../../components/dashboard/DocumentViewer';
import FolderPasswordGate from '../../components/folders/FolderPasswordGate';
import { useAuth } from '../../context/AuthContext';

const FolderDetailPage = () => {
  const { token, API_URL } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();

  const [folder, setFolder] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUnlocked, setIsUnlocked] = useState(false);  // password gate
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  // Confirm modal
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState({});

  const fetchFolder = async () => {
    setIsLoading(true);
    try {
      // Fetch the folder list to find this folder's name + count
      const folderRes = await fetch(`${API_URL}/api/folders/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (folderRes.ok) {
        const allFolders = await folderRes.json();
        const found = allFolders.find((f) => f.id === parseInt(id));
        if (!found) {
          navigate('/folders');
          return;
        }
        setFolder(found);
      }

      // Fetch documents inside this folder
      const docRes = await fetch(`${API_URL}/api/folders/${id}/documents`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (docRes.ok) {
        const raw = await docRes.json();
        const trashed = JSON.parse(localStorage.getItem('trashed_documents') || '[]');
        setDocuments(raw.filter((d) => !trashed.includes(d.id)));
      }
    } catch (e) {
      console.error('Failed to load folder:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token && id) fetchFolder();
  }, [token, id]);

  // ── Password gate: if folder is locked, show gate until unlocked ──
  if (!isLoading && folder && folder.is_password_protected && !isUnlocked) {
    return (
      <FolderPasswordGate
        folderName={folder.name}
        folderId={folder.id}
        token={token}
        API_URL={API_URL}
        onSuccess={() => setIsUnlocked(true)}
        onCancel={() => navigate('/folders')}
      />
    );
  }

  const getFileIcon = (filename) => {
    if (!filename) return { icon: <FileText size={24} />, color: 'bg-slate-500/10 text-slate-500' };
    const ext = filename.split('.').pop().toLowerCase();
    const p = { size: 24 };
    if (['xls', 'xlsx', 'csv'].includes(ext)) return { icon: <FileSpreadsheet {...p} />, color: 'bg-emerald-500/10 text-emerald-500' };
    if (['ppt', 'pptx'].includes(ext)) return { icon: <Presentation {...p} />, color: 'bg-orange-500/10 text-orange-500' };
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return { icon: <FileImage {...p} />, color: 'bg-blue-500/10 text-blue-500' };
    if (['js', 'py', 'html', 'css', 'json', 'sql'].includes(ext)) return { icon: <FileCode {...p} />, color: 'bg-purple-500/10 text-purple-500' };
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return { icon: <FileArchive {...p} />, color: 'bg-amber-500/10 text-amber-500' };
    if (['pdf'].includes(ext)) return { icon: <FileText {...p} />, color: 'bg-red-500/10 text-red-500' };
    if (['mp4', 'webm', 'ogg', 'mov', 'mkv', 'avi'].includes(ext)) return { icon: <FileVideo {...p} />, color: 'bg-indigo-500/10 text-indigo-500' };
    return { icon: <FileText {...p} />, color: 'bg-slate-500/10 text-slate-500' };
  };

  const handleDeleteDoc = (docId, shouldCloseViewer = false) => {
    const doc = documents.find((d) => d.id === docId);
    setConfirmConfig({
      title: 'Move to Trash?',
      message: `"${doc?.name}" will be moved to Trash.`,
      confirmText: 'Move to Trash',
      onConfirm: () => {
        const trashed = JSON.parse(localStorage.getItem('trashed_documents') || '[]');
        if (!trashed.includes(docId)) {
          localStorage.setItem('trashed_documents', JSON.stringify([...trashed, docId]));
        }
        setDocuments((prev) => prev.filter((d) => d.id !== docId));
        if (shouldCloseViewer) setIsViewerOpen(false);
      },
    });
    setIsConfirmOpen(true);
  };

  const handleDownload = async (doc) => {
    const isSensitive = ['Finance', 'Identity', 'Health', 'Legal'].includes(doc.category) || doc.is_sensitive;
    if (isSensitive) { setSelectedDoc(doc); setIsViewerOpen(true); return; }
    try {
      const response = await fetch(`${API_URL}/api/documents/${doc.id}/download?token=${token}`);
      if (!response.ok) throw new Error();
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url; a.download = doc.name;
      window.document.body.appendChild(a); a.click();
      window.document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch { console.error('Download failed'); }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Topbar />
        <div className="p-8 space-y-8 max-w-7xl mx-auto w-full">

          {/* Breadcrumb + Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/folders')}
                className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800/50 hover:bg-slate-200 dark:hover:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all"
                title="Back to Folders"
              >
                <ArrowLeft size={18} />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-amber-500/10 text-amber-400 rounded-xl flex items-center justify-center">
                  <Folder size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-3xl font-bold font-display">
                      {isLoading ? 'Loading...' : folder?.name || 'Folder'}
                    </h1>
                    {folder?.is_sensitive && (
                      <span className="flex items-center gap-1 text-xs font-bold text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                        <Shield size={11} /> Sensitive
                      </span>
                    )}
                    {folder?.is_password_protected && (
                      <span className="flex items-center gap-1 text-xs font-bold text-primary-400 bg-primary-500/10 px-2.5 py-1 rounded-full border border-primary-500/20">
                        <Lock size={11} /> Locked
                      </span>
                    )}
                  </div>
                  <p className="text-muted-foreground text-sm mt-0.5">
                    {documents.length} document{documents.length !== 1 ? 's' : ''} in this folder
                  </p>
                </div>
              </div>
            </div>

            <Button onClick={() => setIsUploadOpen(true)}>
              <Plus size={18} className="mr-2" /> Upload to Folder
            </Button>
          </div>

          {/* Document Grid */}
          {isLoading ? (
            <div className="py-32 text-center">
              <Loader2 className="w-12 h-12 animate-spin text-primary-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold">Loading Documents</h3>
            </div>
          ) : documents.length === 0 ? (
            <div className="py-32 text-center bg-white dark:bg-slate-900/20 rounded-[2.5rem] border border-dashed border-slate-200 dark:border-slate-800">
              <FileText size={64} className="text-slate-300 dark:text-slate-700 mx-auto mb-6" />
              <h3 className="text-2xl font-bold mb-2">Folder is empty</h3>
              <p className="text-muted-foreground mb-8 max-w-sm mx-auto text-sm leading-relaxed">
                Upload documents directly into this folder, or move existing documents here.
              </p>
              <Button onClick={() => setIsUploadOpen(true)}>
                <Plus size={18} className="mr-2" /> Upload Document
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {documents.map((doc, i) => {
                const fileIconObj = getFileIcon(doc.name);
                return (
                  <motion.div
                    key={doc.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.05 }}
                    className="glass bg-white dark:bg-slate-900/50 hover:bg-white/80 dark:hover:bg-slate-900/80 border border-slate-200 dark:border-slate-800 hover:border-primary-500/30 p-6 rounded-[2.5rem] transition-all duration-300 group hover:shadow-2xl hover:-translate-y-1"
                  >
                    <div className="flex items-start justify-between mb-5">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 ${fileIconObj.color}`}>
                        {fileIconObj.icon}
                      </div>
                      <span className="px-3.5 py-1.5 rounded-full text-xs font-semibold capitalize bg-primary-500/5 text-primary-500 border border-primary-500/10">
                        {doc.category}
                      </span>
                    </div>

                    <h3 className="font-bold text-lg text-foreground mb-1 truncate leading-snug group-hover:text-primary-500 transition-colors">
                      {doc.name}
                    </h3>
                    <div className="flex items-center gap-2 mb-6">
                      <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                        <Calendar size={12} /> {new Date(doc.created_at).toLocaleDateString()}
                      </span>
                      <span className="text-slate-300 dark:text-slate-700">•</span>
                      <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                        <Layers size={12} /> {doc.size}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800/60">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => { setSelectedDoc(doc); setIsViewerOpen(true); }}
                          className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800/40 hover:bg-primary-500/10 hover:text-primary-500 flex items-center justify-center transition-all text-slate-500"
                          title="Quick View"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => handleDownload(doc)}
                          className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800/40 hover:bg-emerald-500/10 hover:text-emerald-500 flex items-center justify-center transition-all text-slate-500"
                          title="Download"
                        >
                          <Download size={18} />
                        </button>
                      </div>
                      <button
                        onClick={() => handleDeleteDoc(doc.id)}
                        className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800/40 hover:bg-red-500/10 hover:text-red-500 flex items-center justify-center transition-all text-slate-500"
                        title="Move to Trash"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Upload modal — pre-set folder_id */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={fetchFolder}
        token={token}
        API_URL={API_URL}
        defaultFolderId={parseInt(id)}
      />

      <DocumentViewer
        isOpen={isViewerOpen}
        onClose={() => setIsViewerOpen(false)}
        document={selectedDoc}
        token={token}
        API_URL={API_URL}
        onDelete={(docId) => handleDeleteDoc(docId, true)}
        onUpdate={fetchFolder}
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

export default FolderDetailPage;
