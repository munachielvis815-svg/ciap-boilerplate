'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Image as ImageIcon, 
  Link as LinkIcon, 
  Trash, 
  ArrowsClockwise, 
  MagnifyingGlass,
  CheckCircle,
  VideoCamera,
  Globe
} from '@phosphor-icons/react';
import { useContentItems, useCreateContentItem, useYoutubeMetrics } from '@/lib/api/hooks';
import { toast } from 'sonner';

export default function LibraryScreen() {
  const { data: items, isLoading: loadingItems, refetch } = useContentItems();
  const { refetch: syncYoutube, isFetching: isSyncing } = useYoutubeMetrics(false);
  const createItem = useCreateContentItem();

  const isLoading = loadingItems || isSyncing;

  const handleSync = async () => {
    try {
      await syncYoutube();
      await refetch();
      toast.success('Library synchronized');
    } catch (err) {
      toast.error('Failed to sync library');
    }
  };
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    url: '',
    thumbnailUrl: '',
    platform: 'manual'
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createItem.mutateAsync(formData);
      toast.success('Asset added to library');
      setIsModalOpen(false);
      setFormData({ title: '', url: '', thumbnailUrl: '', platform: 'manual' });
      refetch();
    } catch (err) {
      toast.error('Failed to add asset');
    }
  };

  const filteredItems = items?.filter(item => 
    item.title?.toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#0B1C30]" style={{ fontFamily: "'Space Grotesk'" }}>Content Library</h1>
          <p className="text-[#6B7280] mt-1">Manage and organize your portfolio of visual assets.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleSync}
            disabled={isLoading}
            className="flex items-center gap-2 px-5 py-2.5 bg-white text-[#0B1C30] border border-[#E5E7EB] rounded-xl font-bold hover:bg-gray-50 transition-all shadow-sm disabled:opacity-50"
          >
            <ArrowsClockwise size={20} weight="bold" className={isLoading ? 'animate-spin' : ''} />
            <span>{isSyncing ? 'Syncing...' : 'Sync'}</span>
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-[#006D32] text-white px-5 py-2.5 rounded-xl font-bold hover:bg-[#005227] transition-all shadow-sm"
          >
            <Plus size={20} weight="bold" />
            <span>Add Asset</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center bg-white p-2 rounded-2xl border border-[#E5E7EB] shadow-sm">
        <div className="relative flex-1 w-full">
          <MagnifyingGlass size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6B7280]" />
          <input 
            type="text"
            placeholder="Search assets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-transparent border-none focus:ring-0 text-sm font-medium"
          />
        </div>
        <div className="flex gap-2 p-1">
          {['All', 'Images', 'Videos', 'Links'].map(f => (
            <button key={f} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${f === 'All' ? 'bg-[#EFF4FF] text-[#006D32]' : 'text-[#6B7280] hover:bg-gray-50'}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="aspect-[4/5] rounded-2xl bg-white border border-[#E5E7EB] animate-pulse" />
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-3xl border-2 border-dashed border-[#E5E7EB]">
          <div className="w-20 h-20 rounded-full bg-[#EFF4FF] flex items-center justify-center mb-6">
            <ImageIcon size={40} className="text-[#006D32]" />
          </div>
          <h3 className="text-xl font-bold text-[#0B1C30]">No assets found</h3>
          <p className="text-[#6B7280] mt-2 max-w-sm px-6">Start building your library by uploading images or linking your best content.</p>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="mt-6 flex items-center gap-2 text-[#006D32] font-bold hover:underline"
          >
            <Plus size={18} weight="bold" />
            Add your first asset
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
          {filteredItems.map((item) => (
            <motion.div 
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              key={item.youtubeVideoId} 
              className="group relative aspect-[4/5] bg-white rounded-2xl overflow-hidden border border-[#E5E7EB] hover:border-[#006D32] hover:shadow-xl transition-all cursor-pointer"
            >
              {item.thumbnailUrl ? (
                <img src={item.thumbnailUrl} alt={item.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-[#F8F9FF] text-[#D1D5DB]">
                  {item.platform === 'youtube' ? <VideoCamera size={48} /> : <Globe size={48} />}
                </div>
              )}
              
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-end">
                <p className="text-white font-bold text-sm truncate">{item.title || 'Untitled Asset'}</p>
                <p className="text-white/70 text-[10px] uppercase font-bold tracking-widest mt-1">{item.platform}</p>
              </div>

              {item.platform === 'youtube' && (
                <div className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm">
                  <VideoCamera size={16} className="text-[#FF0000]" weight="fill" />
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-[#0B1C30]/40 backdrop-blur-sm z-[200]"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-3xl p-8 z-[201] shadow-2xl border border-[#E5E7EB]"
            >
              <h2 className="text-2xl font-bold text-[#0B1C30] mb-2" style={{ fontFamily: "'Space Grotesk'" }}>Add Library Asset</h2>
              <p className="text-sm text-[#6B7280] mb-8">Upload a thumbnail and link to your best work.</p>
              
              <form onSubmit={handleCreate} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-[#3C4A3D] uppercase tracking-wider mb-2">Asset Title</label>
                  <input 
                    required
                    value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                    placeholder="e.g. Summer Campaign Reel"
                    className="w-full px-4 py-3 rounded-xl bg-[#F8F9FF] border border-[#E5E7EB] focus:border-[#006D32] focus:ring-1 focus:ring-[#006D32] outline-none transition-all font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#3C4A3D] uppercase tracking-wider mb-2">Direct URL (Link)</label>
                  <div className="relative">
                    <LinkIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6B7280]" />
                    <input 
                      value={formData.url}
                      onChange={e => setFormData({...formData, url: e.target.value})}
                      placeholder="https://youtube.com/..."
                      className="w-full pl-11 pr-4 py-3 rounded-xl bg-[#F8F9FF] border border-[#E5E7EB] focus:border-[#006D32] focus:ring-1 focus:ring-[#006D32] outline-none transition-all font-medium"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#3C4A3D] uppercase tracking-wider mb-2">Thumbnail URL (Image)</label>
                  <div className="relative">
                    <ImageIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6B7280]" />
                    <input 
                      value={formData.thumbnailUrl}
                      onChange={e => setFormData({...formData, thumbnailUrl: e.target.value})}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full pl-11 pr-4 py-3 rounded-xl bg-[#F8F9FF] border border-[#E5E7EB] focus:border-[#006D32] focus:ring-1 focus:ring-[#006D32] outline-none transition-all font-medium"
                    />
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button 
                    type="button" onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-3.5 rounded-xl font-bold text-[#6B7280] hover:bg-gray-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={createItem.isPending}
                    className="flex-1 py-3.5 rounded-xl bg-[#006D32] text-white font-bold hover:bg-[#005227] transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    {createItem.isPending ? <ArrowsClockwise size={20} className="animate-spin" /> : <><CheckCircle size={20} weight="fill" /> Save Asset</>}
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
