import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  GraduationCap, 
  Wallet, 
  Activity, 
  Car, 
  Gavel, 
  Briefcase, 
  User, 
  Share2, 
  Star, 
  Archive, 
  Trash2,
  ChevronRight,
  MoreVertical,
  FolderOpen
} from 'lucide-react';
import Sidebar from '../../components/layout/Sidebar';
import Topbar from '../../components/layout/Topbar';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import DocumentViewer from '../../components/dashboard/DocumentViewer';
import ShareModal from '../../components/dashboard/ShareModal';
import ConfirmModal from '../../components/common/ConfirmModal';

const categories = [
  { 
    id: 'identity', 
    name: 'Identity', 
    icon: Shield, 
    color: 'bg-blue-500', 
    description: 'Aadhaar, PAN, Passport, Voter ID',
    badge: 'Verified',
    count: 6
  },
  { 
    id: 'education', 
    name: 'Education', 
    icon: GraduationCap, 
    color: 'bg-indigo-500', 
    description: 'Marksheets, Degrees, Certificates',
    count: 4
  },
  { 
    id: 'finance', 
    name: 'Finance', 
    icon: Wallet, 
    color: 'bg-emerald-500', 
    description: 'Tax returns, Salary slips, Insurance',
    isSensitive: true,
    count: 8
  },
  { 
    id: 'health', 
    name: 'Health', 
    icon: Activity, 
    color: 'bg-red-500', 
    description: 'Medical reports, Prescriptions',
    count: 12
  },
  { 
    id: 'vehicle', 
    name: 'Vehicle', 
    icon: Car, 
    color: 'bg-orange-500', 
    description: 'RC, Insurance, Pollution certs',
    expiryReminder: true,
    count: 3
  },
  { 
    id: 'legal', 
    name: 'Legal', 
    icon: Gavel, 
    color: 'bg-slate-700', 
    description: 'Agreements, Affidavits, Contracts',
    count: 5
  },
  { 
    id: 'employment', 
    name: 'Employment', 
    icon: Briefcase, 
    color: 'bg-cyan-600', 
    description: 'Offer letters, Payslips, Resume',
    count: 7
  },
  { 
    id: 'personal', 
    name: 'Personal', 
    icon: User, 
    color: 'bg-pink-500', 
    description: 'Photos, Notes, Misc docs',
    hasPrivateMode: true,
    count: 15
  },
  { 
    id: 'other', 
    name: 'Other', 
    icon: Archive, 
    color: 'bg-slate-500', 
    description: 'Custom and other documents',
    count: 0
  }
];

const systemCategories = [
  // { id: 'shared', name: 'Shared', icon: Share2, color: 'text-purple-500' },
  // { id: 'favorites', name: 'Starred', icon: Star, color: 'text-amber-500' },
  // { id: 'archived', name: 'Archived', icon: Archive, color: 'text-slate-500' },
  { id: 'trash', name: 'Trash', icon: Trash2, color: 'text-red-500' }
];

const formatTimeAgo = (dateString) => {
  if (!dateString) return 'some time ago';
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  return date.toLocaleDateString();
};

const getCategoryDetails = (categoryName) => {
  const cat = categories.find(c => c.name.toLowerCase() === categoryName?.toLowerCase());
  if (cat) return { icon: cat.icon, color: cat.color };
  return { icon: Shield, color: 'bg-slate-500' };
};

const CategoriesPage = () => {
  const navigate = useNavigate();
  const { token, API_URL } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [sharedCount, setSharedCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  // Modal and Viewer states
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

  const isTrashed = (docId) => {
    const trashed = JSON.parse(localStorage.getItem('trashed_documents') || '[]');
    return trashed.includes(docId);
  };

  const isArchived = (docId) => {
    const archived = JSON.parse(localStorage.getItem('archived_documents') || '[]');
    return archived.includes(docId);
  };

  const getRecentDocuments = () => {
    return [...documents]
      .filter(doc => !isTrashed(doc.id) && !isArchived(doc.id) && !doc.folder_id)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 8);
  };

  const handleDeleteDocument = (docId, shouldCloseViewer = false) => {
    const doc = documents.find(d => d.id === docId);
    const docName = doc ? doc.name : 'Unknown File';

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

        // Refetch documents
        const docRes = await fetch(`${API_URL}/api/documents/`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (docRes.ok) {
          const data = await docRes.json();
          setDocuments(data);
        }
        if (shouldCloseViewer) setIsViewerOpen(false);
      }
    );
  };

  useEffect(() => {
    const fetchDocumentsAndShares = async () => {
      setIsLoading(true);
      try {
        const docRes = await fetch(`${API_URL}/api/documents/`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (docRes.ok) {
          const data = await docRes.json();
          setDocuments(data);
        }

        const shareRes = await fetch(`${API_URL}/api/share/`, {
          headers: { 'Authorization': `Bearer ${token}` }
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

    if (token) {
      fetchDocumentsAndShares();
    }
  }, [token, API_URL]);

  const getCategoryCount = (catId, catName) => {
    if (catId === 'other') {
      const standardCategories = ['Identity', 'Education', 'Finance', 'Health', 'Vehicle', 'Legal', 'Employment', 'Personal'];
      return documents.filter(doc => !standardCategories.includes(doc.category) && !isTrashed(doc.id) && !isArchived(doc.id) && !doc.folder_id).length;
    }
    if (catId === 'shared') {
      return sharedCount;
    }
    if (catId === 'favorites') {
      const starred = JSON.parse(localStorage.getItem('starred_documents') || '[]');
      return documents.filter(doc => starred.includes(doc.id) && !isTrashed(doc.id) && !doc.folder_id).length;
    }
    if (catId === 'archived') {
      const archived = JSON.parse(localStorage.getItem('archived_documents') || '[]');
      return documents.filter(doc => archived.includes(doc.id) && !isTrashed(doc.id) && !doc.folder_id).length;
    }
    if (catId === 'trash') {
      const trashed = JSON.parse(localStorage.getItem('trashed_documents') || '[]');
      return documents.filter(doc => trashed.includes(doc.id)).length;
    }
    return documents.filter(doc => doc.category?.toLowerCase() === catName.toLowerCase() && !isTrashed(doc.id) && !isArchived(doc.id) && !doc.folder_id).length;
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Topbar />
        
        <div className="p-8 space-y-8 max-w-7xl mx-auto w-full">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary-600/10 text-primary-500 flex items-center justify-center">
                <FolderOpen size={24} />
              </div>
              <div>
                <h1 className="text-3xl font-bold font-display">Document Categories</h1>
                <p className="text-muted-foreground mt-0.5 text-sm">Organize and manage your vault by document types</p>
              </div>
            </div>
            <div className="flex items-center gap-4 bg-white dark:bg-slate-900/50 p-1.5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
              <button 
                onClick={() => setActiveTab('all')}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                  activeTab === 'all' 
                    ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/20' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                All Categories
              </button>
              <button 
                onClick={() => setActiveTab('recent')}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                  activeTab === 'recent' 
                    ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/20' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Recently Added
              </button>
            </div>
          </div>

          {activeTab === 'all' ? (
            <>
              {/* Main Categories Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {categories.map((cat, i) => (
                  <motion.div
                    key={cat.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    whileHover={{ y: -5 }}
                    onClick={() => navigate(`/categories/${cat.id}`)}
                    className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-6 rounded-[2rem] cursor-pointer group relative overflow-hidden"
                  >
                    {/* Background Accent */}
                    <div className={`absolute top-0 right-0 w-24 h-24 ${cat.color} opacity-5 -mr-12 -mt-12 rounded-full group-hover:scale-150 transition-transform duration-500`}></div>

                    <div className="flex items-start justify-between mb-6">
                      <div className={`${cat.color} w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-${cat.color.split('-')[1]}-500/30 group-hover:scale-110 transition-transform`}>
                        <cat.icon size={28} />
                      </div>
                      <div className="flex items-center gap-1">
                        {cat.badge && (
                          <span className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 text-[10px] font-bold px-2 py-1 rounded-full uppercase">
                            {cat.badge}
                          </span>
                        )}
                        {cat.isSensitive && (
                          <span className="bg-red-100 dark:bg-red-900/30 text-red-600 p-1.5 rounded-full" title="Highly Sensitive">
                            <Wallet size={12} />
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <h3 className="text-xl font-bold">{cat.name}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-1">{cat.description}</p>
                    </div>

                    <div className="mt-6 flex items-center justify-between pt-4 border-t border-border">
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        {isLoading ? '...' : `${getCategoryCount(cat.id, cat.name)} Documents`}
                      </span>
                      <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-primary-600 group-hover:text-white transition-colors">
                        <ChevronRight size={16} />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* System Categories Section */}
              <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-8">
                <h2 className="text-xl font-bold mb-6">System Folders</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {systemCategories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => navigate(`/categories/${cat.id}`)}
                      className="flex items-center gap-3 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-left group"
                    >
                      <div className={`w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center ${cat.color} group-hover:scale-110 transition-transform`}>
                        <cat.icon size={20} />
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-sm">{cat.name}</div>
                        <div className="text-[10px] text-muted-foreground uppercase font-bold">
                          {isLoading ? '...' : `${getCategoryCount(cat.id, cat.name)} Files`}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            /* Recently Added Documents Grid */
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-200">Latest Vault Uploads</h2>
                <span className="text-[10px] bg-slate-800 text-slate-400 font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  Last 8 documents
                </span>
              </div>

              {getRecentDocuments().length === 0 ? (
                <div className="py-20 text-center glass rounded-3xl border border-dashed border-slate-800">
                  <Shield size={48} className="mx-auto mb-4 text-slate-700 animate-pulse" />
                  <h3 className="text-xl font-bold text-slate-400">No documents found</h3>
                  <p className="text-slate-500">Upload some documents in the dashboard to see them here.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {getRecentDocuments().map((doc, i) => {
                    const catDetails = getCategoryDetails(doc.category);
                    const CatIcon = catDetails.icon;
                    return (
                      <motion.div
                        key={doc.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        whileHover={{ y: -4 }}
                        onClick={() => openViewer(doc)}
                        className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-6 rounded-[2rem] cursor-pointer group relative overflow-hidden flex flex-col justify-between"
                      >
                        <div className="flex items-start gap-4">
                          <div className={`${catDetails.color} w-12 h-12 rounded-2xl flex items-center justify-center text-white group-hover:scale-110 transition-transform shadow-lg`}>
                            <CatIcon size={24} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-slate-200 group-hover:text-primary-400 transition-colors truncate">
                              {doc.name}
                            </h4>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1.5">
                              <span className="bg-slate-800 text-slate-400 font-bold px-2 py-0.5 rounded text-[10px] uppercase">
                                {doc.category}
                              </span>
                              <span>•</span>
                              <span>{doc.size}</span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-6 flex items-center justify-between pt-4 border-t border-border">
                          <span className="text-xs font-bold text-slate-500">
                            Added {formatTimeAgo(doc.created_at)}
                          </span>
                          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-primary-600 group-hover:text-white transition-colors">
                            <ChevronRight size={16} />
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <DocumentViewer 
        isOpen={isViewerOpen}
        onClose={() => setIsViewerOpen(false)}
        document={selectedDoc}
        token={token}
        API_URL={API_URL}
        onShare={openShare}
        onDelete={(docId) => handleDeleteDocument(docId, true)}
        onUpdate={async () => {
          const docRes = await fetch(`${API_URL}/api/documents/`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (docRes.ok) {
            const data = await docRes.json();
            setDocuments(data);
          }
        }}
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

export default CategoriesPage;
