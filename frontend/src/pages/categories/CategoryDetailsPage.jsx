import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Search, 
  Filter, 
  Plus, 
  Lock, 
  Shield,
  GraduationCap,
  Wallet,
  Activity,
  Car,
  Gavel,
  Briefcase,
  User,
  FileText,
  Clock,
  Loader2,
  CheckCircle2,
  MoreVertical,
  ExternalLink,
  ShieldAlert,
  Archive,
  Share2,
  Star,
  Trash2,
  FileSpreadsheet, 
  Presentation, 
  FileImage, 
  FileCode, 
  FileArchive,
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

const categoryConfig = {
  identity: { name: 'Identity', icon: Shield, theme: 'blue' },
  education: { name: 'Education', icon: GraduationCap, theme: 'indigo' },
  finance: { name: 'Finance', icon: Wallet, theme: 'emerald' },
  health: { name: 'Health', icon: Activity, theme: 'red' },
  vehicle: { name: 'Vehicle', icon: Car, theme: 'orange' },
  legal: { name: 'Legal', icon: Gavel, theme: 'slate' },
  employment: { name: 'Employment', icon: Briefcase, theme: 'cyan' },
  personal: { name: 'Personal', icon: User, theme: 'pink' },
  other: { name: 'Other', icon: Archive, theme: 'slate' },
  shared: { name: 'Shared', icon: Share2, theme: 'purple' },
  favorites: { name: 'Starred', icon: Star, theme: 'amber' },
  archived: { name: 'Archived', icon: Archive, theme: 'slate' },
  trash: { name: 'Trash', icon: Trash2, theme: 'red' }
};

const CategoryDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token, API_URL } = useAuth();
  
  const config = categoryConfig[id] || categoryConfig.personal;
  
  const [documents, setDocuments] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isLocked, setIsLocked] = useState(['Finance', 'Identity', 'Health', 'Legal'].includes(config.name));
  const [pin, setPin] = useState('');
  
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const filteredDocuments = documents.filter(doc => 
    doc.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getFileIcon = (filename) => {
    if (!filename) return { icon: <FileText size={24} />, color: 'text-primary-600 bg-primary-50 dark:bg-primary-900/20' };
    const ext = filename.split('.').pop().toLowerCase();
    const iconProps = { size: 24 };
    
    if (['xls', 'xlsx', 'csv'].includes(ext)) {
      return { icon: <FileSpreadsheet {...iconProps} />, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20' };
    }
    if (['ppt', 'pptx'].includes(ext)) {
      return { icon: <Presentation {...iconProps} />, color: 'text-orange-600 bg-orange-50 dark:bg-orange-900/20' };
    }
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) {
      return { icon: <FileImage {...iconProps} />, color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' };
    }
    if (['js', 'py', 'html', 'css', 'json', 'sql'].includes(ext)) {
      return { icon: <FileCode {...iconProps} />, color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20' };
    }
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
      return { icon: <FileArchive {...iconProps} />, color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20' };
    }
    if (['pdf'].includes(ext)) {
      return { icon: <FileText {...iconProps} />, color: 'text-red-600 bg-red-50 dark:bg-red-900/20' };
    }
    if (['mp4', 'webm', 'ogg', 'mov', 'mkv', 'avi'].includes(ext)) {
      return { icon: <FileVideo {...iconProps} />, color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' };
    }
    
    return { icon: <FileText {...iconProps} />, color: 'text-primary-600 bg-primary-50 dark:bg-primary-900/20' };
  };

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

  const fetchCategoryDocuments = async () => {
    setIsLoading(true);
    try {
      const isSystemOrOther = ['other', 'shared', 'favorites', 'archived', 'trash'].includes(id);
      
      const url = isSystemOrOther
        ? `${API_URL}/api/documents/`
        : `${API_URL}/api/documents/?category=${config.name}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        let data = await response.json();
        
        const trashed = JSON.parse(localStorage.getItem('trashed_documents') || '[]');
        const archived = JSON.parse(localStorage.getItem('archived_documents') || '[]');
        const starred = JSON.parse(localStorage.getItem('starred_documents') || '[]');
        
        if (id === 'other') {
          const standardCategories = ['Identity', 'Education', 'Finance', 'Health', 'Vehicle', 'Legal', 'Employment', 'Personal'];
          data = data.filter(doc => 
            !standardCategories.includes(doc.category) && 
            !trashed.includes(doc.id) && 
            !archived.includes(doc.id) &&
            !doc.folder_id
          );
        } else if (id === 'shared') {
          const shareRes = await fetch(`${API_URL}/api/share/`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (shareRes.ok) {
            const shares = await shareRes.json();
            const sharedDocIds = shares.map(s => s.document_id);
            data = data.filter(doc => sharedDocIds.includes(doc.id) && !trashed.includes(doc.id) && !doc.folder_id);
          } else {
            data = [];
          }
        } else if (id === 'favorites') {
          data = data.filter(doc => starred.includes(doc.id) && !trashed.includes(doc.id) && !doc.folder_id);
        } else if (id === 'archived') {
          data = data.filter(doc => archived.includes(doc.id) && !trashed.includes(doc.id) && !doc.folder_id);
        } else if (id === 'trash') {
          data = data.filter(doc => trashed.includes(doc.id));
        } else {
          // Standard categories
          data = data.filter(doc => !trashed.includes(doc.id) && !archived.includes(doc.id) && !doc.folder_id);
        }
        
        setDocuments(data);
      }
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token && !isLocked) {
      fetchCategoryDocuments();
    }
  }, [token, id, isLocked]);

  const handleUnlock = () => {
    const savedPin = localStorage.getItem('vault_lock_pin') || '1234';
    if (pin === savedPin) {
      setIsLocked(false);
    } else {
      setPin('');
      alert("Incorrect PIN");
    }
  };

  const handleDeleteDocument = (docId, shouldCloseViewer = false) => {
    const doc = documents.find(d => d.id === docId);
    const docName = doc ? doc.name : 'Unknown File';

    if (id === 'trash') {
      triggerConfirm(
        "Permanently Delete?",
        "Are you sure you want to permanently delete this document? This action cannot be undone.",
        "Permanently Delete",
        async () => {
          try {
            const response = await fetch(`${API_URL}/api/documents/${docId}`, {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });

            if (response.ok) {
              fetchCategoryDocuments(); // Refresh the list
              if (shouldCloseViewer) setIsViewerOpen(false);
            } else {
              alert('Failed to delete document');
            }
          } catch (error) {
            console.error('Delete failed:', error);
            alert('Error connecting to server');
          }
        }
      );
    } else {
      triggerConfirm(
        "Move to Trash?",
        "Are you sure you want to move this document to Trash? You can recover or restore it later.",
        "Move to Trash",
        async () => {
          const trashed = JSON.parse(localStorage.getItem('trashed_documents') || '[]');
          if (!trashed.includes(docId)) {
            localStorage.setItem('trashed_documents', JSON.stringify([...trashed, docId]));
          }

          // Log soft-delete to activity log
          try {
            await fetch(`${API_URL}/api/activity/`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                action: 'DELETE',
                details: `Moved document "${docName}" to Trash`
              })
            });
          } catch (err) {
            console.error('Failed to log delete activity:', err);
          }

          fetchCategoryDocuments();
          if (shouldCloseViewer) setIsViewerOpen(false);
        }
      );
    }
  };

  const handleRestoreDocument = async (e, docId) => {
    e.stopPropagation();
    const doc = documents.find(d => d.id === docId);
    const docName = doc ? doc.name : 'Unknown File';

    const trashed = JSON.parse(localStorage.getItem('trashed_documents') || '[]');
    const updated = trashed.filter(id => id !== docId);
    localStorage.setItem('trashed_documents', JSON.stringify(updated));

    // Log restore to activity log
    try {
      await fetch(`${API_URL}/api/activity/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          action: 'UPLOAD',
          details: `Restored document "${docName}" from Trash`
        })
      });
    } catch (err) {
      console.error('Failed to log restore activity:', err);
    }

    fetchCategoryDocuments();
  };

  if (isLocked) {
    return (
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar />
        <main className="flex-1 flex flex-col items-center justify-center p-8 text-center overflow-y-auto">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-10 rounded-[3rem] max-w-md w-full"
          >
            <div className="w-20 h-20 bg-amber-500 text-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-amber-500/40">
              <Lock size={36} />
            </div>
            <h2 className="text-2xl font-bold mb-2">Locked Category</h2>
            <p className="text-muted-foreground text-sm mb-6">
              This category contains highly sensitive financial information. Enter your PIN to view.
            </p>
            <div className="space-y-4">
              <input 
                type="password" 
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="••••"
                className="w-full text-center bg-slate-900 border border-white/5 rounded-2xl py-3 px-4 text-2xl tracking-widest focus:ring-2 focus:ring-amber-500/20 outline-none transition-all"
              />
              <Button onClick={handleUnlock} className="w-full bg-amber-500 hover:bg-amber-600 py-3">Unlock Vault</Button>
            </div>
          </motion.div>
        </main>
      </div>
    );
  }

  const themeClasses = {
    blue: 'bg-blue-600/10 text-blue-500 shadow-blue-500/10',
    indigo: 'bg-indigo-600/10 text-indigo-500 shadow-indigo-500/10',
    emerald: 'bg-emerald-600/10 text-emerald-500 shadow-emerald-500/10',
    red: 'bg-red-600/10 text-red-500 shadow-red-500/10',
    orange: 'bg-orange-600/10 text-orange-500 shadow-orange-500/10',
    slate: 'bg-slate-600/10 text-slate-500 shadow-slate-500/10',
    cyan: 'bg-cyan-600/10 text-cyan-500 shadow-cyan-500/10',
    pink: 'bg-pink-600/10 text-pink-500 shadow-pink-500/10',
    purple: 'bg-purple-600/10 text-purple-500 shadow-purple-500/10',
    amber: 'bg-amber-600/10 text-amber-500 shadow-amber-500/10'
  };

  const themeClass = themeClasses[config.theme] || themeClasses.slate;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Topbar />
        
        <div className={`${['favorites', 'archived'].includes(id) ? 'p-6 space-y-6' : 'p-8 space-y-8'} max-w-7xl mx-auto w-full`}>
          {/* Header Section */}
          <div className={`flex flex-col md:flex-row md:items-center justify-between ${['favorites', 'archived'].includes(id) ? 'gap-4' : 'gap-6'}`}>
            <div className="flex items-center gap-4">
              {!['favorites', 'archived'].includes(id) && (
                <Button 
                  variant="outline" 
                  onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/dashboard')}
                  className="w-10 h-10 p-0 rounded-full flex items-center justify-center"
                >
                  <ArrowLeft size={18} />
                </Button>
              )}
              <div className="flex items-center gap-3">
                <div className={`${['favorites', 'archived'].includes(id) ? 'w-10 h-10 rounded-lg' : 'w-12 h-12 rounded-xl'} flex items-center justify-center text-white ${themeClass.split(' ')[0]} ${themeClass.split(' ')[1]}`}>
                  <config.icon size={['favorites', 'archived'].includes(id) ? 20 : 24} />
                </div>
                <div>
                  <h1 className={`${['favorites', 'archived'].includes(id) ? 'text-2xl' : 'text-3xl'} font-bold font-display`}>{config.name} Documents</h1>
                  <p className="text-muted-foreground text-xs mt-0.5">Secure personal vault storage</p>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-3 w-full sm:w-auto">
              <div className="relative group w-full sm:w-auto">
                <Search className={`absolute ${['favorites', 'archived'].includes(id) ? 'left-3.5' : 'left-4'} top-1/2 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary-500`} size={['favorites', 'archived'].includes(id) ? 16 : 18} />
                <input 
                  type="text" 
                  placeholder={`Search in ${config.name}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl pr-4 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-medium placeholder-slate-400 dark:placeholder-slate-600 text-slate-800 dark:text-slate-100 ${
                    ['favorites', 'archived'].includes(id) 
                      ? 'py-2 pl-10 text-sm w-full sm:w-64' 
                      : 'py-3 pl-12 w-full sm:w-72'
                  }`}
                />
              </div>
              
              {/* Don't show Upload button in System Folders (Shared, Favorites, Archived, Trash) */}
              {!['shared', 'favorites', 'archived', 'trash'].includes(id) && (
                <Button onClick={() => setIsUploadModalOpen(true)} className="xs:w-auto w-full">
                  <Plus size={18} className="mr-2" /> Add Document
                </Button>
              )}
            </div>
          </div>

          {/* Documents Content */}
          <div className="glass bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-[2rem] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-border">
                    <th className="px-8 py-5 text-xs font-bold text-muted-foreground uppercase tracking-wider">Document Name</th>
                    <th className="px-8 py-5 text-xs font-bold text-muted-foreground uppercase tracking-wider">Size</th>
                    <th className="px-8 py-5 text-xs font-bold text-muted-foreground uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {isLoading ? (
                    <tr>
                      <td colSpan="3" className="px-8 py-20 text-center">
                        <Loader2 className="w-8 h-8 animate-spin text-primary-500 mx-auto mb-4" />
                        <p className="text-muted-foreground font-medium">Fetching documents...</p>
                      </td>
                    </tr>
                  ) : documents.length === 0 ? (
                    <tr>
                      <td colSpan="3" className="px-8 py-20 text-center">
                        <div className="w-20 h-20 bg-slate-100 dark:bg-slate-900 rounded-3xl flex items-center justify-center mx-auto mb-6 text-slate-300">
                          <FileText size={40} />
                        </div>
                        <h3 className="text-xl font-bold mb-2">No documents yet</h3>
                        <p className="text-muted-foreground mb-8">
                          {id === 'trash' ? 'Your trash folder is empty.' : 'Start by uploading your first document.'}
                        </p>
                        {!['shared', 'favorites', 'archived', 'trash'].includes(id) && (
                          <Button onClick={() => setIsUploadModalOpen(true)}>
                            <Plus size={18} className="mr-2" /> Upload Document
                          </Button>
                        )}
                      </td>
                    </tr>
                  ) : filteredDocuments.length === 0 ? (
                    <tr>
                      <td colSpan="3" className="px-8 py-20 text-center">
                        <div className="w-20 h-20 bg-slate-100 dark:bg-slate-900 rounded-3xl flex items-center justify-center mx-auto mb-6 text-slate-300">
                          <Search size={40} />
                        </div>
                        <h3 className="text-xl font-bold mb-2">No results found</h3>
                        <p className="text-muted-foreground">
                          No documents matched your query "{searchQuery}".
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredDocuments.map((doc, i) => (
                      <motion.tr 
                        key={doc.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        onClick={() => openViewer(doc)}
                        className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors group cursor-pointer"
                      >
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-4">
                            {(() => {
                              const fileIconObj = getFileIcon(doc.name);
                              return (
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform ${fileIconObj.color}`}>
                                  {fileIconObj.icon}
                                </div>
                              );
                            })()}
                            <div>
                              <div className="font-bold group-hover:text-primary-600 transition-colors">{doc.name}</div>
                              <div className="text-xs text-muted-foreground">{new Date(doc.created_at).toLocaleDateString()}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-5 font-medium text-slate-500">{doc.size}</td>
                        <td className="px-8 py-5 text-right">
                          <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                            {id === 'trash' ? (
                              <>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={(e) => handleRestoreDocument(e, doc.id)}
                                  className="font-bold text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-xl px-3"
                                >
                                  Restore
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => handleDeleteDocument(doc.id)}
                                  className="w-10 h-10 p-0 rounded-xl text-red-400 hover:text-red-500 hover:bg-red-500/10"
                                >
                                  <Trash2 size={18} />
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => openViewer(doc)}
                                  className="font-bold text-primary-500 hover:text-primary-400 rounded-xl px-3"
                                >
                                  View
                                </Button>
                                {/*
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => openShare(doc)}
                                  className="w-10 h-10 p-0 rounded-xl text-slate-400 hover:text-purple-400 hover:bg-purple-500/10"
                                >
                                  <Share2 size={18} />
                                </Button>
                                */}
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => handleDeleteDocument(doc.id)}
                                  className="w-10 h-10 p-0 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-500/10"
                                >
                                  <Trash2 size={18} />
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      <UploadModal 
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUploadSuccess={fetchCategoryDocuments}
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
        onUpdate={fetchCategoryDocuments}
        bypassPin={true}
      />

      <ShareModal 
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        document={selectedDoc}
        token={token}
        API_URL={API_URL}
        bypassPin={true}
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

export default CategoryDetailsPage;
