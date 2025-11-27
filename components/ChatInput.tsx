import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Paperclip, X, FileAudio, FileText, Image as ImageIcon, Square, UploadCloud } from 'lucide-react';
import { Attachment } from '../types';

interface ChatInputProps {
  onSend: (message: string, attachments: Attachment[]) => void;
  onStop: () => void;
  disabled: boolean;
  isStreaming: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSend, onStop, disabled, isStreaming }) => {
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setIsUploading(true);
      setUploadProgress(0);
      
      const newAttachments: Attachment[] = [];
      const files = Array.from(e.target.files);
      const totalFiles = files.length;
      
      // Simulate viral upload effect with steps
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Progress animation step 1
        setUploadProgress(prev => Math.min(prev + (100 / totalFiles) * 0.2, 90));
        
        const reader = new FileReader();
        await new Promise<void>((resolve) => {
          reader.onload = (event) => {
            if (event.target?.result) {
              const base64 = (event.target.result as string).split(',')[1];
              const type = file.type.startsWith('image/') ? 'image' 
                         : file.type.startsWith('audio/') ? 'audio'
                         : file.type.includes('pdf') ? 'pdf'
                         : 'other';
              
              newAttachments.push({
                file,
                previewUrl: URL.createObjectURL(file),
                type,
                base64
              });
            }
            // Progress animation step 2
            setUploadProgress(prev => Math.min(prev + (100 / totalFiles) * 0.8, 99));
            setTimeout(resolve, 200); // Artificial delay for visual effect
          };
          reader.readAsDataURL(file);
        });
      }

      setUploadProgress(100);
      setTimeout(() => {
          setAttachments(prev => [...prev, ...newAttachments]);
          setIsUploading(false);
          setUploadProgress(0);
          if (fileInputRef.current) fileInputRef.current.value = '';
      }, 500);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((input.trim() || attachments.length > 0) && !disabled && !isStreaming) {
      onSend(input, attachments);
      setInput('');
      setAttachments([]);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900/80 backdrop-blur-xl border-t border-gray-800 p-4 z-50">
      <div className="max-w-4xl mx-auto w-full">
        {/* Attachments Preview */}
        {attachments.length > 0 && (
          <div className="flex gap-3 mb-3 overflow-x-auto pb-2 scrollbar-thin animate-in slide-in-from-bottom-2">
            {attachments.map((att, i) => (
              <div key={i} className="relative group flex-shrink-0">
                <div className="w-16 h-16 rounded-xl overflow-hidden border border-gray-700 bg-gray-800 relative shadow-md">
                  {att.type === 'image' ? (
                    <img src={att.previewUrl} alt="preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-800/50">
                      {att.type === 'pdf' ? <FileText size={24} className="text-red-400" /> : <FileAudio size={24} className="text-yellow-400" />}
                    </div>
                  )}
                  <button 
                    onClick={() => removeAttachment(i)}
                    className="absolute top-0.5 right-0.5 bg-black/50 hover:bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Viral Upload Progress */}
        {isUploading && (
           <div className="w-full mb-4 relative p-4 bg-gray-800/80 rounded-2xl border border-gray-700 shadow-2xl animate-in fade-in zoom-in-95 duration-300">
             <div className="flex items-center justify-between mb-2 text-xs font-bold font-mono">
                <span className="text-blue-400 flex items-center gap-2">
                    <UploadCloud className="animate-bounce" size={14} />
                    UPLOADING FILES...
                </span>
                <span className="text-white">{Math.round(uploadProgress)}%</span>
             </div>
             <div className="w-full h-2 bg-gray-900 rounded-full overflow-hidden shadow-inner">
               <div 
                 className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 transition-all duration-300 shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                 style={{ width: `${uploadProgress}%` }}
               />
             </div>
           </div>
        )}

        <form onSubmit={handleSubmit} className="relative flex items-end gap-2 bg-gray-800/50 border border-gray-700/50 rounded-2xl p-2 focus-within:ring-2 focus-within:ring-emerald-500/30 focus-within:border-emerald-500/50 transition-all hover:bg-gray-800">
          
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-3 text-gray-400 hover:text-emerald-400 hover:bg-gray-700/50 rounded-xl transition-colors"
            title="Upload Image/PDF/Audio"
          >
            <Paperclip size={20} />
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileSelect} 
            className="hidden" 
            multiple 
            accept="image/*,application/pdf,audio/*"
          />

          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            dir="auto"
            placeholder={attachments.length > 0 ? "Add a caption to your files..." : "أكتب هنا... / Ask anything..."}
            className="flex-1 max-h-[200px] min-h-[44px] py-2.5 px-2 bg-transparent text-gray-100 placeholder-gray-500 focus:outline-none resize-none overflow-y-auto scrollbar-thin font-marhey"
            disabled={disabled && !isStreaming}
            rows={1}
          />
          
          {isStreaming ? (
            <button
              type="button"
              onClick={onStop}
              className="flex-shrink-0 p-3 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/50 transition-all duration-300 animate-pulse"
            >
              <Square size={20} className="fill-current" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={(!input.trim() && attachments.length === 0) || disabled}
              className={`flex-shrink-0 p-3 rounded-xl transition-all duration-300 ${
                (input.trim() || attachments.length > 0) && !disabled
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-500 hover:to-teal-500 shadow-lg shadow-emerald-500/20 transform hover:scale-105'
                  : 'bg-gray-700/50 text-gray-500 cursor-not-allowed'
              }`}
            >
              {disabled ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <Send size={20} className={(input.trim() || attachments.length > 0) ? "fill-current" : ""} />
              )}
            </button>
          )}
        </form>
        <div className="text-center mt-3">
            <p className="text-[10px] text-gray-500/70 font-marhey flex items-center justify-center gap-2">
               <span>Gemini 3 Pro</span>
               <span className="w-1 h-1 rounded-full bg-gray-600"></span>
               <span>أيات بينات (Session Auto-Saved)</span>
            </p>
        </div>
      </div>
    </div>
  );
};