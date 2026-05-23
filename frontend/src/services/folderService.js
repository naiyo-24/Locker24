/**
 * folderService.js — API calls for the Folder feature
 */

export const folderService = {
  async listFolders(API_URL, token) {
    const res = await fetch(`${API_URL}/api/folders/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to fetch folders');
    return res.json();
  },

  async createFolder(API_URL, token, name) {
    const res = await fetch(`${API_URL}/api/folders/`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to create folder');
    }
    return res.json();
  },

  async renameFolder(API_URL, token, folderId, name) {
    const res = await fetch(`${API_URL}/api/folders/${folderId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to rename folder');
    }
    return res.json();
  },

  async deleteFolder(API_URL, token, folderId) {
    const res = await fetch(`${API_URL}/api/folders/${folderId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to delete folder');
  },

  async getFolderDocuments(API_URL, token, folderId) {
    const res = await fetch(`${API_URL}/api/folders/${folderId}/documents`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to fetch folder documents');
    return res.json();
  },

  async moveDocumentToFolder(API_URL, token, folderId, documentId) {
    const res = await fetch(`${API_URL}/api/folders/${folderId}/move-document/${documentId}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to move document');
    return res.json();
  },
};
