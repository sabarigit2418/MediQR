import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { GlassCard } from '../components/GlassCard';
import { Button } from '../components/Button';
import { Input } from '../components/Input';

export const Documents: React.FC = () => {
  const { user, addDocument, removeDocument } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  // Upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [docName, setDocName] = useState('');
  const [docCategory, setDocCategory] = useState('Lab Report');
  
  // Document Upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  if (!user) return null;

  // Filter documents
  const filteredDocs = user.patientRecord.documents.filter((doc) => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          doc.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory ? doc.category === selectedCategory : true;
    return matchesSearch && matchesCategory;
  });

  const getDocIcon = (category: string) => {
    switch (category) {
      case 'Prescription':
        return 'medication';
      case 'Lab Report':
        return 'science';
      case 'Insurance':
        return 'health_and_safety';
      case 'ID Proof':
        return 'badge';
      default:
        return 'description';
    }
  };

  const getCategoryCount = (category: string) => {
    return user.patientRecord.documents.filter(d => d.category === category).length;
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docName.trim() || !selectedFile) return;

    setUploading(true);
    setUploadProgress(20);

    const reader = new FileReader();
    reader.onloadend = async () => {
      setUploadProgress(50);
      
      const base64String = reader.result as string;
      
      try {
        const token = localStorage.getItem('auth_token');
        const uploadResponse = await fetch('/api/documents/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            fileName: selectedFile.name,
            fileType: selectedFile.type,
            fileData: base64String
          })
        });

        if (!uploadResponse.ok) {
          throw new Error('Server upload failed');
        }

        const data = await uploadResponse.json();
        setUploadProgress(90);

        addDocument({
          name: docName.trim(),
          category: docCategory,
          size: `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB`,
          url: data.fileUrl // Store the static URL path returned by server
        });

        setUploadProgress(100);
      } catch (err) {
        console.error('Document server upload failed:', err);
        alert('Failed to upload document to server. Saving fallback copy locally...');
        
        // Fallback: save local data URL if server upload fails
        addDocument({
          name: docName.trim(),
          category: docCategory,
          size: `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB`,
          url: base64String
        });
      } finally {
        setUploading(false);
        setShowUploadModal(false);
        setSelectedFile(null);
        setUploadProgress(0);
      }
    };
    
    reader.onerror = (error) => {
      console.error('Upload failed:', error);
      setUploading(false);
    };

    reader.readAsDataURL(selectedFile);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header, Search & Action */}
      <div className="space-y-4">
        <div>
          <span className="font-label-caps text-xs text-on-surface-variant/70 tracking-widest block mb-1">Secure Files</span>
          <h1 className="font-headline-lg-mobile md:font-headline-lg text-on-surface font-bold">Document Vault</h1>
        </div>

        {/* Search Bar */}
        <Input
          type="text"
          placeholder="Search by name or category..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          icon="search"
        />

        {/* Upload Button */}
        <Button
          variant="primary"
          onClick={() => {
            setDocName('');
            setDocCategory('Lab Report');
            setSelectedFile(null);
            setShowUploadModal(true);
          }}
          icon="cloud_upload"
          className="w-full justify-center"
        >
          Upload New Document
        </Button>
      </div>

      {/* Categories Grid */}
      <section className="space-y-3">
        <div className="flex justify-between items-center px-1">
          <h3 className="font-title-md text-sm text-on-surface font-semibold">Categories</h3>
          {selectedCategory && (
            <button 
              onClick={() => setSelectedCategory(null)}
              className="text-xs text-primary font-semibold hover:underline cursor-pointer"
            >
              Clear Filter
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {/* Prescriptions */}
          <button
            onClick={() => setSelectedCategory(selectedCategory === 'Prescription' ? null : 'Prescription')}
            className={`glass-panel rounded-xl p-4 flex flex-col items-start gap-3 active:scale-95 transition-all text-left border cursor-pointer ${
              selectedCategory === 'Prescription' ? 'border-primary bg-primary/5 shadow-md' : 'border-white/60 hover:bg-white/90'
            }`}
          >
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined">medication</span>
            </div>
            <div>
              <h4 className="font-semibold text-sm text-on-surface">Prescriptions</h4>
              <p className="text-xs text-outline">{getCategoryCount('Prescription')} files</p>
            </div>
          </button>

          {/* Lab Reports */}
          <button
            onClick={() => setSelectedCategory(selectedCategory === 'Lab Report' ? null : 'Lab Report')}
            className={`glass-panel rounded-xl p-4 flex flex-col items-start gap-3 active:scale-95 transition-all text-left border cursor-pointer ${
              selectedCategory === 'Lab Report' ? 'border-primary bg-primary/5 shadow-md' : 'border-white/60 hover:bg-white/90'
            }`}
          >
            <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-700">
              <span className="material-symbols-outlined">science</span>
            </div>
            <div>
              <h4 className="font-semibold text-sm text-on-surface">Lab Reports</h4>
              <p className="text-xs text-outline">{getCategoryCount('Lab Report')} files</p>
            </div>
          </button>

          {/* Insurance */}
          <button
            onClick={() => setSelectedCategory(selectedCategory === 'Insurance' ? null : 'Insurance')}
            className={`glass-panel rounded-xl p-4 flex flex-col items-start gap-3 active:scale-95 transition-all text-left border cursor-pointer ${
              selectedCategory === 'Insurance' ? 'border-primary bg-primary/5 shadow-md' : 'border-white/60 hover:bg-white/90'
            }`}
          >
            <div className="w-10 h-10 rounded-full bg-teal-500/10 flex items-center justify-center text-teal-700">
              <span className="material-symbols-outlined">health_and_safety</span>
            </div>
            <div>
              <h4 className="font-semibold text-sm text-on-surface">Insurance</h4>
              <p className="text-xs text-outline">{getCategoryCount('Insurance')} files</p>
            </div>
          </button>

          {/* ID Proofs */}
          <button
            onClick={() => setSelectedCategory(selectedCategory === 'ID Proof' ? null : 'ID Proof')}
            className={`glass-panel rounded-xl p-4 flex flex-col items-start gap-3 active:scale-95 transition-all text-left border cursor-pointer ${
              selectedCategory === 'ID Proof' ? 'border-primary bg-primary/5 shadow-md' : 'border-white/60 hover:bg-white/90'
            }`}
          >
            <div className="w-10 h-10 rounded-full bg-slate-500/10 flex items-center justify-center text-slate-700">
              <span className="material-symbols-outlined">badge</span>
            </div>
            <div>
              <h4 className="font-semibold text-sm text-on-surface">ID Proofs</h4>
              <p className="text-xs text-outline">{getCategoryCount('ID Proof')} files</p>
            </div>
          </button>
        </div>
      </section>

      {/* Recent Uploads List */}
      <section className="space-y-3">
        <h3 className="font-title-md text-sm text-on-surface font-semibold px-1">
          {selectedCategory ? `${selectedCategory} Uploads` : 'Recent Uploads'}
        </h3>
        {filteredDocs.length === 0 ? (
          <GlassCard className="text-center py-12">
            <span className="material-symbols-outlined text-outline-variant text-4xl mb-2">folder_open</span>
            <p className="text-on-surface-variant font-medium">No documents found matching the criteria.</p>
          </GlassCard>
        ) : (
          <div className="flex flex-col gap-3">
            {filteredDocs.map((doc) => (
              <GlassCard
                key={doc.id}
                className="flex items-center gap-4 hover:bg-white/95 p-4 border border-white/60 shadow-sm"
              >
                <div className="w-12 h-12 rounded-lg bg-surface-container flex items-center justify-center text-primary flex-shrink-0">
                  <span className="material-symbols-outlined">{getDocIcon(doc.category)}</span>
                </div>
                <div className="flex-grow min-w-0">
                  <h4 className="font-semibold text-sm text-on-surface truncate">{doc.name}</h4>
                  <p className="text-xs text-on-surface-variant mt-0.5 truncate">
                    Uploaded: {doc.date} &bull; {doc.category} &bull; {doc.size}
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => removeDocument(doc.id)}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-outline hover:text-error hover:bg-error/5 transition-colors cursor-pointer"
                    title="Delete"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                  <a
                    href={doc.url || '#'}
                    target={doc.url ? '_blank' : '_self'}
                    rel="noopener noreferrer"
                    onClick={(e) => {
                      if (!doc.url) e.preventDefault();
                    }}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-outline hover:text-primary hover:bg-primary/5 transition-colors"
                    title="Download File"
                  >
                    <span className="material-symbols-outlined text-[18px]">download</span>
                  </a>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </section>

      {/* Upload Document Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm px-4">
          <GlassCard className="w-full max-w-md border border-white/80 shadow-2xl">
            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <h3 className="font-title-md text-on-surface font-semibold">Upload Document</h3>
              
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="font-label-caps text-[10px] text-on-surface-variant pl-1">Document Title</label>
                  <Input
                    type="text"
                    placeholder="e.g. Lab Chemistry Panel"
                    value={docName}
                    onChange={(e) => setDocName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-label-caps text-[10px] text-on-surface-variant pl-1">Category</label>
                  <div className="relative">
                    <select
                      className="w-full rounded-[16px] py-3.5 pl-4 pr-8 font-body-lg text-sm bg-surface-container-high border border-transparent focus:bg-white/90 focus:border-primary/50 focus:ring-0 outline-none transition-all shadow-inner text-on-surface appearance-none cursor-pointer"
                      value={docCategory}
                      onChange={(e) => setDocCategory(e.target.value)}
                    >
                      <option value="Prescription">Prescription</option>
                      <option value="Lab Report">Lab Report</option>
                      <option value="Insurance">Insurance</option>
                      <option value="ID Proof">ID Proof</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none text-[20px]">
                      arrow_drop_down
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-label-caps text-[10px] text-on-surface-variant pl-1">Select File</label>
                  <input
                    type="file"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setSelectedFile(e.target.files[0]);
                        if (!docName) {
                          setDocName(e.target.files[0].name);
                        }
                      }
                    }}
                    className="block w-full text-sm text-on-surface-variant file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                    required
                  />
                </div>
                
                {uploading && (
                  <div className="w-full bg-surface-container rounded-full h-2 mt-4 overflow-hidden">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <Button
                  variant="secondary"
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  disabled={uploading}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                  icon="upload"
                  disabled={uploading || !selectedFile}
                >
                  {uploading ? 'Uploading...' : 'Upload File'}
                </Button>
              </div>
            </form>
          </GlassCard>
        </div>
      )}
    </div>
  );
};
