import React, { useRef } from 'react';
import { X, Trash2, Plus, MessageSquare, Upload, Download, BookOpen, LogOut, Settings } from 'lucide-react';
import { ChatSession } from '../types';

interface SideMenuProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: ChatSession[];
  currentSessionId: string | null;
  onSelectSession: (id: string) => void;
  onDeleteSession: (id: string) => void;
  onNewSession: () => void;
  onLogout: () => void;
}

export const SideMenu: React.FC<SideMenuProps> = ({ 
  isOpen, 
  onClose, 
  sessions, 
  currentSessionId,
  onSelectSession, 
  onDeleteSession,
  onNewSession,
  onLogout
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(sessions));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "ayat_bayyinat_history.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const parsed = JSON.parse(content);
          if (Array.isArray(parsed)) {
            // Simple validation could be added here
             localStorage.setItem('ayat_chat_sessions', JSON.stringify(parsed));
             window.location.reload(); // Simple reload to reflect changes
          } else {
            alert("Invalid JSON format");
          }
        } catch (err) {
          alert("Error reading file");
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <>
      {/* Overlay */}
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Sidebar Panel */}
      <div className={`fixed top-0 left-0 bottom-0 w-80 bg-[#0d1117] border-r border-gray-800 z-[70] shadow-2xl transform transition-transform duration-300 flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        
        {/* Header */}
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <BookOpen size={16} className="text-white" />
             </div>
             <h2 className="text-lg font-bold font-cairo text-gray-100">سجل المحادثات</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* New Chat Button */}
        <div className="p-4">
            <button 
                onClick={onNewSession}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl flex items-center justify-center gap-2 font-marhey transition-all shadow-lg shadow-emerald-900/20 active:scale-95 border border-emerald-500/50"
            >
                <Plus size={20} />
                <span>محادثة جديدة (New Chat)</span>
            </button>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto px-3 space-y-1 scrollbar-thin">
          <div className="px-2 pb-2 text-xs font-bold text-gray-500 uppercase tracking-wider font-marhey">History</div>
          
          {sessions.length === 0 ? (
            <div className="text-center py-10 text-gray-600 font-marhey text-sm border-2 border-dashed border-gray-800 rounded-xl mx-2">
              <MessageSquare size={32} className="mx-auto mb-3 opacity-20" />
              <p>No conversations yet.</p>
            </div>
          ) : (
            sessions.map((session) => (
              <div 
                key={session.id} 
                className={`group relative rounded-xl transition-all duration-200 ${currentSessionId === session.id ? 'bg-gray-800 border border-emerald-500/30' : 'hover:bg-gray-800/50 border border-transparent hover:border-gray-700'}`}
              >
                <button 
                  onClick={() => onSelectSession(session.id)}
                  className="w-full text-left p-3 pr-10"
                >
                  <h3 className={`font-bold text-sm mb-1 line-clamp-1 font-marhey ${currentSessionId === session.id ? 'text-emerald-400' : 'text-gray-300'}`}>
                    {session.title || 'New Chat'}
                  </h3>
                  <p className="text-gray-500 text-[10px] font-mono">
                    {new Date(session.updatedAt).toLocaleDateString()}
                  </p>
                </button>
                <button 
                  onClick={(e) => {
                      e.stopPropagation();
                      if(window.confirm('Delete this chat?')) onDeleteSession(session.id);
                  }}
                  className="absolute top-3 right-2 p-1.5 text-gray-600 hover:text-red-400 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-800 bg-gray-900/30 space-y-3">
          <button 
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 font-medium text-sm transition-colors border border-red-500/20 group"
          >
            <LogOut size={16} className="group-hover:-translate-x-1 transition-transform" />
            <span>Sign Out / Change Key</span>
          </button>

          <button 
            onClick={handleExport}
            className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium text-sm transition-colors border border-gray-700"
          >
            <Download size={16} />
            <span>Backup Chats (JSON)</span>
          </button>
          
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium text-sm transition-colors border border-gray-700"
          >
            <Upload size={16} />
            <span>Import Backup</span>
          </button>
          <input 
            type="file" 
            ref={fileInputRef}
            className="hidden"
            accept=".json"
            onChange={handleImport}
          />
        </div>
      </div>
    </>
  );
};