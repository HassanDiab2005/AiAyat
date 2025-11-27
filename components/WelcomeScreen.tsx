import React, { useState } from 'react';
import { BookOpen, Key, User, ArrowRight, ExternalLink } from 'lucide-react';
import { UserSettings } from '../types';

interface WelcomeScreenProps {
  onComplete: (settings: UserSettings) => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onComplete }) => {
  const [apiKey, setApiKey] = useState('');
  const [userName, setUserName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim().startsWith('AIza')) {
      setError('Please enter a valid Google Gemini API Key (starts with AIza...)');
      return;
    }
    if (!userName.trim()) {
      setError('Please enter your name.');
      return;
    }
    
    const settings: UserSettings = {
      apiKey: apiKey.trim(),
      userName: userName.trim()
    };
    
    // Save to local storage
    localStorage.setItem('ayat_user_settings', JSON.stringify(settings));
    onComplete(settings);
  };

  return (
    <div className="min-h-[100dvh] bg-[#0d1117] flex items-center justify-center p-4 relative overflow-hidden font-marhey">
       {/* Background Effects */}
       <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-emerald-600/20 rounded-full blur-[120px] pointer-events-none" />
       <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />

       <div className="max-w-md w-full relative z-10 animate-[fadeIn_0.5s_ease-out]">
          <div className="text-center mb-8">
             <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl mx-auto flex items-center justify-center shadow-2xl shadow-emerald-500/20 mb-6">
                <BookOpen size={40} className="text-white" />
             </div>
             <h1 className="text-3xl md:text-4xl font-bold font-cairo text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 mb-2">
               أيات بينات
             </h1>
             <p className="text-gray-400 text-sm">Ayat Bayyinat AI Assistant</p>
          </div>

          <form onSubmit={handleSubmit} className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 p-8 rounded-3xl shadow-xl space-y-6">
             
             <div>
               <label className="block text-gray-400 text-xs font-bold mb-2 uppercase tracking-wider">Your Name</label>
               <div className="relative">
                 <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                 <input 
                   type="text" 
                   value={userName}
                   onChange={(e) => setUserName(e.target.value)}
                   className="w-full bg-black/40 border border-gray-700 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 transition-all placeholder-gray-600"
                   placeholder="الاسم (e.g. Ahmed)"
                 />
               </div>
             </div>

             <div>
               <label className="block text-gray-400 text-xs font-bold mb-2 uppercase tracking-wider">Gemini API Key</label>
               <div className="relative">
                 <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                 <input 
                   type="password" 
                   value={apiKey}
                   onChange={(e) => setApiKey(e.target.value)}
                   className="w-full bg-black/40 border border-gray-700 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 transition-all placeholder-gray-600 font-mono text-sm"
                   placeholder="AIzaSy..."
                 />
               </div>
               <a 
                 href="https://aistudio.google.com/app/apikey" 
                 target="_blank" 
                 rel="noopener noreferrer"
                 className="flex items-center gap-1 text-[10px] text-emerald-500 mt-2 hover:underline"
               >
                 <ExternalLink size={10} />
                 <span>Get a free API Key from Google AI Studio</span>
               </a>
             </div>

             {error && (
               <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs text-center font-bold">
                 {error}
               </div>
             )}

             <button 
               type="submit" 
               className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-900/20 transform transition-all active:scale-[0.98] flex items-center justify-center gap-2"
             >
               <span>Start Chatting</span>
               <ArrowRight size={18} />
             </button>
          </form>
          
          <p className="text-center text-[10px] text-gray-600 mt-6">
            Your API Key is stored locally in your browser and is never shared.
          </p>
       </div>
    </div>
  );
};