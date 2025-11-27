import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Message, Attachment, ChatSession, GeminiModelId, UserSettings } from './types';
import { ChatMessage } from './components/ChatMessage';
import { ChatInput } from './components/ChatInput';
import { SideMenu } from './components/SideMenu';
import { WelcomeScreen } from './components/WelcomeScreen';
import { sendMessageStream, resetChatSession, AVAILABLE_MODELS } from './services/gemini';
import { Github, BookOpen, ZoomIn, ZoomOut, Menu, Plus, Edit3, Send, ChevronDown, Zap, BrainCircuit, Rabbit, AlertTriangle } from 'lucide-react';
import { GenerateContentResponse } from '@google/genai';

const App: React.FC = () => {
  // User Settings State
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);

  // Session State
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  
  // UI State
  const [isLoading, setIsLoading] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false);
  
  // Model State
  const [selectedModel, setSelectedModel] = useState<GeminiModelId>('gemini-3-pro-preview');
  const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);

  // Derived State (Current Messages)
  const currentSession = sessions.find(s => s.id === currentSessionId);
  const messages = currentSession?.messages || [];

  const stopGenerationRef = useRef(false);
  
  // --- Initialization & Auto-Save Logic ---

  // 1. Check for User Settings (API Key) on Mount
  useEffect(() => {
    const storedSettings = localStorage.getItem('ayat_user_settings');
    if (storedSettings) {
      try {
        setUserSettings(JSON.parse(storedSettings));
      } catch (e) {
        console.error("Failed to parse settings", e);
      }
    }
  }, []);

  // 2. Load Sessions from LocalStorage on Mount
  useEffect(() => {
    const savedSessions = localStorage.getItem('ayat_chat_sessions');
    if (savedSessions) {
      try {
        const parsed: ChatSession[] = JSON.parse(savedSessions);
        // Sort by updatedAt desc
        parsed.sort((a, b) => b.updatedAt - a.updatedAt);
        setSessions(parsed);
        if (parsed.length > 0) {
          setCurrentSessionId(parsed[0].id);
        } else {
          createNewSession();
        }
      } catch (e) {
        console.error("Failed to parse sessions", e);
        createNewSession();
      }
    } else {
      createNewSession();
    }
  }, []);

  // 3. Auto-Save Sessions to LocalStorage whenever they change
  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem('ayat_chat_sessions', JSON.stringify(sessions));
    }
  }, [sessions]);

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to sign out? This will remove your API Key from this browser.")) {
      localStorage.removeItem('ayat_user_settings');
      setUserSettings(null);
      resetChatSession();
      setIsSideMenuOpen(false);
    }
  };

  // --- Session Management ---

  const createNewSession = () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: 'محادثة جديدة (New Chat)',
      messages: [],
      updatedAt: Date.now()
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    resetChatSession();
    setIsSideMenuOpen(false);
  };

  const deleteSession = (id: string) => {
    const newSessions = sessions.filter(s => s.id !== id);
    setSessions(newSessions);
    localStorage.setItem('ayat_chat_sessions', JSON.stringify(newSessions)); // Force save immediately
    
    if (currentSessionId === id) {
      if (newSessions.length > 0) {
        setCurrentSessionId(newSessions[0].id);
      } else {
        createNewSession();
      }
    }
  };

  const updateSessionTitle = (id: string, newTitle: string) => {
    setSessions(prev => prev.map(s => 
      s.id === id ? { ...s, title: newTitle, updatedAt: Date.now() } : s
    ));
  };

  const updateCurrentMessages = (newMessages: Message[]) => {
    if (!currentSessionId) return;
    
    setSessions(prev => prev.map(s => {
      if (s.id === currentSessionId) {
        // Auto-generate title from first user message if it's "New Chat"
        let title = s.title;
        if (s.messages.length === 0 && newMessages.length > 0 && s.title.includes('New Chat')) {
           const firstMsg = newMessages.find(m => m.role === 'user');
           if (firstMsg) {
             title = firstMsg.text.slice(0, 30) + (firstMsg.text.length > 30 ? '...' : '');
           }
        }
        return { ...s, messages: newMessages, title, updatedAt: Date.now() };
      }
      return s;
    }));
  };

  // --- Chat Logic ---

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.1, 1.5));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.1, 0.8));

  const handleStop = () => {
    stopGenerationRef.current = true;
    setIsLoading(false);
    
    // Finalize the last message in the current session
    if (currentSessionId) {
       setSessions(prev => prev.map(s => {
         if (s.id === currentSessionId) {
            const updatedMsgs = s.messages.map(msg => 
               msg.isStreaming ? { ...msg, isStreaming: false, text: msg.text + "..." } : msg
            );
            return { ...s, messages: updatedMsgs };
         }
         return s;
       }));
    }
  };

  const handleDeleteMessage = (index: number) => {
    const updated = messages.filter((_, i) => i !== index);
    updateCurrentMessages(updated);
  };

  const handleResend = (index: number) => {
    const msgToResend = messages[index];
    const updated = messages.slice(0, index);
    updateCurrentMessages(updated);
    handleSend(msgToResend.text, msgToResend.attachments || []);
  };

  const handleSend = async (text: string, attachments: Attachment[] | boolean = []) => {
    if (!userSettings?.apiKey) return;

    const hidden = typeof attachments === 'boolean' ? attachments : false;
    const files = Array.isArray(attachments) ? attachments : [];

    stopGenerationRef.current = false;

    // 1. Add User Message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: text,
      isHidden: hidden,
      attachments: files,
      modelId: selectedModel
    };

    const newMessagesWithUser = [...messages, userMessage];
    updateCurrentMessages(newMessagesWithUser); // Save to state/LS
    setIsLoading(true);

    // 2. Add Bot Placeholder
    const botMessageId = (Date.now() + 1).toString();
    const initialBotMessage: Message = {
      id: botMessageId,
      role: 'model',
      text: '',
      isStreaming: true,
      modelId: selectedModel
    };

    const newMessagesWithBot = [...newMessagesWithUser, initialBotMessage];
    updateCurrentMessages(newMessagesWithBot);

    try {
      const streamResult = await sendMessageStream(text, files, selectedModel, userSettings.apiKey);
      
      let fullText = '';
      let lastUpdateTime = 0;
      
      for await (const chunk of streamResult) {
        if (stopGenerationRef.current) break;

        const responseChunk = chunk as GenerateContentResponse;
        const chunkText = responseChunk.text || ''; 
        fullText += chunkText;

        const now = Date.now();
        // Throttled update to avoid lag
        if (now - lastUpdateTime > 50) {
           setSessions(prev => prev.map(s => {
             if (s.id === currentSessionId) {
               return {
                 ...s,
                 messages: s.messages.map(m => m.id === botMessageId ? { ...m, text: fullText } : m)
               };
             }
             return s;
           }));
           lastUpdateTime = now;
        }
      }

      // Final update
      setSessions(prev => prev.map(s => {
         if (s.id === currentSessionId) {
           return {
             ...s,
             messages: s.messages.map(m => m.id === botMessageId ? { ...m, text: fullText, isStreaming: false } : m)
           };
         }
         return s;
       }));

    } catch (error: any) {
      console.error("Chat error:", error);
      
      // AUTO-FALLBACK LOGIC
      const isQuotaError = error.message?.includes('429') || error.message?.includes('quota') || error.message?.includes('exhausted');
      
      if (isQuotaError && selectedModel === 'gemini-3-pro-preview') {
         // Auto switch to Flash and inform user
         setSelectedModel('gemini-2.5-flash');
         setSessions(prev => prev.map(s => {
           if (s.id === currentSessionId) {
             return {
               ...s,
               messages: s.messages.map(m => m.id === botMessageId ? { 
                 ...m, 
                 text: `⚠️ **High Traffic on Pro Model**\nSwitching to **Gemini 2.5 Flash** for unlimited speed...\n\n(Please retry your last message)`, 
                 error: true, 
                 isStreaming: false 
               } : m)
             };
           }
           return s;
         }));
      } else {
         setSessions(prev => prev.map(s => {
           if (s.id === currentSessionId) {
             return {
               ...s,
               messages: s.messages.map(m => m.id === botMessageId ? { ...m, text: m.text + "\n(Connection Error: " + (error.message || "Unknown") + ")", error: true, isStreaming: false } : m)
             };
           }
           return s;
         }));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getModelIcon = (id: string) => {
    switch(id) {
      case 'gemini-3-pro-preview': return <BrainCircuit size={16} className="text-emerald-400" />;
      case 'gemini-2.0-pro-exp-02-05': return <BrainCircuit size={16} className="text-blue-400" />;
      case 'gemini-2.5-flash': return <Zap size={16} className="text-yellow-400" />;
      case 'gemini-flash-lite-latest': return <Rabbit size={16} className="text-orange-400" />;
      default: return <BrainCircuit size={16} />;
    }
  };

  const currentModelInfo = AVAILABLE_MODELS.find(m => m.id === selectedModel);

  // If no user settings (Not logged in), show Welcome Screen
  if (!userSettings) {
    return <WelcomeScreen onComplete={setUserSettings} />;
  }

  return (
    <div className="flex flex-col h-[100dvh] bg-[#0d1117] text-gray-100 font-marhey bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-900 via-[#0d1117] to-black overflow-hidden relative">
      
      <SideMenu 
        isOpen={isSideMenuOpen} 
        onClose={() => setIsSideMenuOpen(false)}
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSelectSession={(id) => {
            setCurrentSessionId(id);
            setIsSideMenuOpen(false);
        }}
        onDeleteSession={deleteSession}
        onNewSession={createNewSession}
        onLogout={handleLogout}
      />

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-[#0d1117]/80 backdrop-blur-xl border-b border-gray-800 z-50 h-16 flex items-center justify-between px-2 md:px-6 shrink-0 transition-all shadow-sm">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <button 
            onClick={() => setIsSideMenuOpen(true)}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          >
            <Menu size={24} />
          </button>
          
          <div className="hidden md:flex bg-gradient-to-br from-emerald-500 to-teal-600 p-2 rounded-xl shadow-lg shadow-emerald-900/20">
            <BookOpen className="text-white w-5 h-5" />
          </div>

          {/* Editable Title */}
          <div className="flex items-center gap-2 flex-1 max-w-[150px] md:max-w-xs group">
             <input 
               value={currentSession?.title || ''}
               onChange={(e) => currentSessionId && updateSessionTitle(currentSessionId, e.target.value)}
               className="bg-transparent border border-transparent hover:border-gray-700 focus:border-emerald-500 rounded-lg px-2 py-1 text-base md:text-lg font-bold font-cairo text-gray-100 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 w-full transition-all truncate"
               placeholder="Chat Title..."
             />
             <Edit3 size={14} className="text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
        
        {/* Controls */}
        <div className="flex items-center gap-2 shrink-0">
           
           {/* Model Selector */}
           <div className="relative">
              <button 
                onClick={() => setIsModelMenuOpen(!isModelMenuOpen)}
                className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-gray-800/50 hover:bg-gray-800 border border-gray-700 rounded-lg transition-all text-xs md:text-sm font-cairo"
              >
                {getModelIcon(selectedModel)}
                <span className="hidden lg:inline">{currentModelInfo?.name}</span>
                <ChevronDown size={14} className="text-gray-500" />
              </button>
              
              {/* Mobile Model Icon */}
              <button 
                onClick={() => setIsModelMenuOpen(!isModelMenuOpen)}
                className="flex md:hidden items-center justify-center p-2 bg-gray-800/50 rounded-lg"
              >
                {getModelIcon(selectedModel)}
              </button>

              {isModelMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsModelMenuOpen(false)}></div>
                  <div className="absolute top-full right-0 mt-2 w-64 bg-[#161b22] border border-gray-700 rounded-xl shadow-2xl z-50 p-1 flex flex-col gap-1 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                     {AVAILABLE_MODELS.map(model => (
                        <button
                          key={model.id}
                          onClick={() => { setSelectedModel(model.id); setIsModelMenuOpen(false); }}
                          className={`flex items-start gap-3 p-3 rounded-lg text-left transition-colors ${selectedModel === model.id ? 'bg-emerald-500/10 border border-emerald-500/20' : 'hover:bg-gray-800'}`}
                        >
                           <div className="mt-1">{getModelIcon(model.id)}</div>
                           <div>
                              <div className={`font-bold text-sm ${selectedModel === model.id ? 'text-emerald-400' : 'text-gray-200'}`}>
                                {model.name}
                              </div>
                              <div className="text-[10px] text-gray-500 leading-tight mt-0.5">
                                {model.description}
                              </div>
                           </div>
                           {selectedModel === model.id && <div className="ml-auto text-emerald-500 text-xs">●</div>}
                        </button>
                     ))}
                  </div>
                </>
              )}
           </div>

           <div className="w-px h-6 bg-gray-800 mx-1 hidden sm:block"></div>

           {/* Zoom Controls */}
           <div className="hidden sm:flex items-center bg-gray-800/50 rounded-lg p-1 border border-gray-700/50">
              <button onClick={handleZoomOut} className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded-md"><ZoomOut size={16} /></button>
              <button onClick={handleZoomIn} className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded-md"><ZoomIn size={16} /></button>
           </div>

           <button onClick={createNewSession} className="p-2 text-emerald-400 hover:text-white hover:bg-emerald-500/10 rounded-xl transition-colors"><Plus size={24} /></button>

           <a href="https://t.me/SCI_students" target="_blank" rel="noopener noreferrer" className="p-2 bg-[#24A1DE]/10 hover:bg-[#24A1DE] text-[#24A1DE] hover:text-white rounded-xl transition-all border border-[#24A1DE]/30 flex items-center gap-2">
              <Send size={20} className="-rotate-45 translate-y-[2px]" />
           </a>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pt-24 pb-32 px-1 md:px-4 scroll-smooth scrollbar-thin scrollbar-thumb-gray-800/50 overscroll-contain -webkit-overflow-scrolling-touch">
        <div className="w-full max-w-[1600px] mx-auto space-y-6">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-8 opacity-0 animate-[fadeIn_0.5s_ease-out_forwards] mt-10">
              <div className="relative group cursor-default">
                <div className="absolute -inset-1 bg-gradient-to-r from-emerald-600 to-blue-600 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative w-24 h-24 bg-gray-900 rounded-3xl flex items-center justify-center border border-gray-800 shadow-2xl">
                  {getModelIcon(selectedModel)}
                </div>
              </div>
              
              <div className="space-y-4 max-w-lg">
                <h2 className="text-4xl font-bold text-white font-cairo leading-tight">
                  مرحباً بك في <br/>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">أيات بينات</span>
                </h2>
                <div className="flex flex-col items-center gap-2">
                  <p className="text-gray-400 font-marhey text-lg">
                    Welcome, <span className="text-emerald-400 font-bold">{userSettings.userName}</span>
                  </p>
                  <p className="text-gray-500 font-marhey text-sm">
                    Powered by <span className="text-emerald-400 font-bold">{currentModelInfo?.name}</span>
                  </p>
                </div>
              </div>
            </div>
          )}

          {messages.map((msg, index) => (
            <ChatMessage 
              key={msg.id} 
              message={msg} 
              onAction={handleSend}
              isLast={index === messages.length - 1}
              zoomLevel={zoomLevel}
              onDelete={() => handleDeleteMessage(index)}
              onResend={msg.role === 'user' || msg.error ? () => handleResend(index) : undefined}
            />
          ))}
        </div>
      </main>

      {/* Input Area */}
      <ChatInput 
        onSend={(text, files) => handleSend(text, files)} 
        onStop={handleStop}
        disabled={isLoading} 
        isStreaming={isLoading}
      />
    </div>
  );
};

export default App;