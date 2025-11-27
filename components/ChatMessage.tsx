import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Message, Attachment } from '../types';
import { User, BookOpen, AlertCircle, Play, X, Loader2, ArrowRight, ArrowLeft, Quote, HelpCircle, Download, FileText, FileAudio, RotateCcw, Maximize, BrainCircuit, Trash2, RefreshCw, Save, Check, Copy, AlertTriangle, Zap, Rabbit, FlaskConical, ClipboardList } from 'lucide-react';

interface ChatMessageProps {
  message: Message;
  onAction?: (text: string, isHidden?: boolean) => void;
  isLast?: boolean;
  zoomLevel?: number;
  onDelete?: () => void;
  onResend?: () => void;
  onSavePrompt?: (text: string) => void;
}

const getTextDirection = (text: string) => {
  const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
  return arabicRegex.test(text) ? 'rtl' : 'ltr';
};

// Hook for Long Press
const useLongPress = (callback: () => void, ms = 500) => {
  const [startLongPress, setStartLongPress] = useState(false);
  const timerId = useRef<NodeJS.Timeout>(undefined);

  useEffect(() => {
    if (startLongPress) {
      timerId.current = setTimeout(callback, ms);
    } else {
      clearTimeout(timerId.current);
    }

    return () => {
      clearTimeout(timerId.current);
    };
  }, [callback, ms, startLongPress]);

  return {
    onMouseDown: () => setStartLongPress(true),
    onMouseUp: () => setStartLongPress(false),
    onMouseLeave: () => setStartLongPress(false),
    onTouchStart: () => setStartLongPress(true),
    onTouchEnd: () => setStartLongPress(false),
  };
};

const HtmlPreviewBlock = ({ code, isStreaming, onAction }: { code: string; isStreaming?: boolean; onAction?: (text: string, isHidden?: boolean) => void }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const isQuiz = code.toLowerCase().includes('quiz') || code.toLowerCase().includes('questions') || code.includes('اختبار');
  const typeLabel = isQuiz ? "Interactive Quiz" : "Interactive Simulation";
  const typeLabelAr = isQuiz ? "اختبار تفاعلي" : "مثال تفاعلي";
  
  const bgGradient = isQuiz ? "from-indigo-600/10 to-purple-600/10" : "from-emerald-600/10 to-blue-600/10";
  const borderColor = isQuiz ? "group-hover:border-indigo-500/50" : "group-hover:border-emerald-500/50";

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    const blob = new Blob([code], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AyatBayyinat_${isQuiz ? 'Quiz' : 'Example'}_${Date.now()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-fullscreen bg-[#0d1117] flex flex-col animate-[fadeIn_0.2s_ease-out_forwards] overflow-hidden">
        {/* Fullscreen Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#0d1117]/90 backdrop-blur-md border-b border-white/10 shrink-0 safe-top absolute top-0 left-0 right-0 z-[10000]">
           <div className="flex items-center gap-2 text-white font-medium font-marhey drop-shadow-md">
             {isQuiz ? <HelpCircle size={18} className="text-indigo-400" /> : <Play size={18} className="text-emerald-400" />}
             <span className="text-sm md:text-base">{typeLabelAr} | {typeLabel}</span>
           </div>
           <div className="flex items-center gap-2">
              <button 
                onClick={handleDownload}
                className="p-2 bg-black/40 hover:bg-white/10 rounded-full text-white/70 hover:text-white transition-colors backdrop-blur-sm"
                title="Download HTML"
              >
                <Download size={20} />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); setIsFullscreen(false); }}
                className="p-2 bg-red-500/80 hover:bg-red-600 rounded-full text-white transition-colors shadow-lg backdrop-blur-sm"
              >
                <X size={24} />
              </button>
           </div>
        </div>
        
        {/* Fullscreen Content */}
        <div className="flex-1 w-full h-full relative bg-[#0d1117] pt-14 md:pt-16">
            <iframe
            srcDoc={code}
            title="Full Screen Preview"
            className="w-full h-full border-0 absolute inset-0 pt-16"
            sandbox="allow-scripts allow-forms allow-popups allow-modals allow-same-origin"
            style={{ width: '100%', height: '100%', backgroundColor: '#0d1117' }}
            />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full my-8 font-marhey select-none flex flex-col gap-4">
      {isStreaming ? (
        <div className="w-full h-48 md:h-64 p-6 rounded-2xl bg-gray-900/40 border border-gray-700/30 backdrop-blur-sm flex flex-col items-center justify-center text-center animate-pulse gap-3 select-none">
           <div className={`p-3 rounded-full ${isQuiz ? 'bg-indigo-500/10' : 'bg-emerald-500/10'}`}>
              <Loader2 className={`animate-spin ${isQuiz ? 'text-indigo-400' : 'text-emerald-400'}`} size={24} />
           </div>
           <p className={`${isQuiz ? 'text-indigo-400/90' : 'text-emerald-400/90'} text-sm font-medium`} dir="rtl">
             {isQuiz ? "جاري تحضير الاختبار..." : "بيتم توليد مثال تفاعلي..."}
           </p>
        </div>
      ) : (
        <>
          <div className="relative group">
            <div 
                className={`w-full relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900 to-gray-950 border border-gray-800 ${borderColor} transition-all duration-300 shadow-lg hover:shadow-lg text-left`}
            >
                <div className={`absolute inset-0 bg-gradient-to-r ${bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                
                <div className="relative p-5 flex flex-col gap-4">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center border border-gray-700 ${isQuiz ? 'text-indigo-400' : 'text-emerald-400'}`}>
                           {isQuiz ? <HelpCircle size={24} /> : <Play size={24} />}
                        </div>
                        <div className="flex flex-col">
                           <h3 className={`text-lg font-bold font-cairo ${isQuiz ? 'text-indigo-300' : 'text-emerald-300'}`}>
                             {typeLabelAr}
                           </h3>
                           <p className="text-xs text-gray-500">HTML5 • Interactive • MathJax</p>
                        </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 w-full mt-2">
                     <button
                        onClick={() => setIsFullscreen(true)}
                        className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 font-bold transition-all shadow-lg active:scale-95 ${
                            isQuiz 
                            ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-900/20' 
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/20'
                        }`}
                     >
                        <Play size={18} className="fill-current" />
                        <span>{isQuiz ? "Start Quiz" : "شاهد المثال التفاعلي"}</span>
                     </button>
                     
                     <button
                        onClick={handleDownload}
                        className="p-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white border border-gray-700 transition-colors"
                        title="Download HTML"
                     >
                        <Download size={20} />
                     </button>
                  </div>
                </div>
            </div>
            
            {/* Generate Related Content Button */}
            <div className="flex items-center justify-center mt-4 animate-[fadeIn_0.5s_ease-out_delay-300ms_forwards] opacity-0">
               {isQuiz ? (
                 <button 
                   onClick={() => onAction?.('Generate another different quiz about this topic with harder questions (QZ)', true)}
                   className="flex items-center gap-2 px-4 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-full text-xs transition-colors border border-indigo-500/30"
                 >
                   <RefreshCw size={12} />
                   <span>اختبار جديد (New Quiz)</span>
                 </button>
               ) : (
                 <button 
                   onClick={() => onAction?.('Create a comprehensive interactive HTML quiz (QZ) about the previous topic with multiple questions.', true)}
                   className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-purple-500/20 to-indigo-500/20 hover:from-purple-500/30 hover:to-indigo-500/30 text-purple-300 rounded-full text-sm font-bold transition-all border border-purple-500/30 shadow-lg shadow-purple-900/10 active:scale-95"
                 >
                   <HelpCircle size={16} />
                   <span>Quiz (اختبار سريع)</span>
                 </button>
               )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export const ChatMessage: React.FC<ChatMessageProps> = ({ 
  message, 
  onAction, 
  isLast,
  zoomLevel = 1,
  onDelete,
  onResend
}) => {
  const isUser = message.role === 'user';
  const dir = getTextDirection(message.text);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  // Auto-scroll logic
  useEffect(() => {
    if (isLast && !isUser && message.isStreaming) {
      // Only auto-scroll if we are near the bottom to allow reading up
      const main = scrollRef.current?.closest('main');
      if (main) {
        const isNearBottom = main.scrollHeight - main.scrollTop - main.clientHeight < 200;
        if (isNearBottom) {
           scrollRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
      } else {
         scrollRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }
    }
  }, [message.text, isLast, isUser, message.isStreaming]);

  // Initial scroll for new message
  useEffect(() => {
    if (isLast) {
       scrollRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  // Long press handler
  const handleCopy = () => {
    navigator.clipboard.writeText(message.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  const longPressProps = useLongPress(handleCopy, 600);

  if (message.isHidden) return null;

  // Split content to separate HTML blocks
  const contentParts = message.text.split(/```html([\s\S]*?)```/);

  const getModelBadge = (id?: string) => {
    if (!id) return null;
    if (id === 'gemini-3-pro-preview') return <BrainCircuit size={10} className="text-emerald-400" />;
    if (id === 'gemini-2.0-pro-exp-02-05') return <BrainCircuit size={10} className="text-blue-400" />;
    if (id === 'gemini-2.5-flash') return <Zap size={10} className="text-yellow-400" />;
    if (id === 'gemini-flash-lite-latest') return <Rabbit size={10} className="text-orange-400" />;
    return <BrainCircuit size={10} className="text-emerald-400" />;
  };

  return (
    <div 
      ref={scrollRef}
      className={`flex w-full mb-10 relative group ${isUser ? 'justify-end' : 'justify-start'}`}
      style={{ fontSize: `${zoomLevel}rem` }}
    >
      {/* Action Buttons (Delete/Resend) */}
      <div className={`absolute top-2 ${isUser ? 'left-2' : 'right-2'} opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1 z-10`}>
        {onDelete && (
          <button onClick={onDelete} className="p-1.5 text-gray-500 hover:text-red-400 bg-gray-900/50 rounded-lg backdrop-blur-sm transition-colors" title="Delete">
            <Trash2 size={14} />
          </button>
        )}
        {onResend && (
          <button onClick={onResend} className="p-1.5 text-gray-500 hover:text-emerald-400 bg-gray-900/50 rounded-lg backdrop-blur-sm transition-colors" title="Resend">
            <RefreshCw size={14} />
          </button>
        )}
      </div>

      <div 
        {...longPressProps}
        className={`
          relative max-w-[95%] md:max-w-[85%] rounded-3xl p-5 md:p-6 shadow-xl overflow-hidden transition-all duration-300
          ${isUser 
            ? 'bg-gray-800 text-white rounded-br-none border border-gray-700/50' 
            : 'bg-[#0d1117] text-gray-200 rounded-bl-none border border-gray-800/50 backdrop-blur-sm'
          }
          ${message.error ? 'border-red-500/50 bg-red-900/10' : ''}
          ${copied ? 'ring-2 ring-emerald-500' : ''}
        `}
      >
        {/* Copied Toast */}
        {copied && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-xs px-2 py-1 rounded-full shadow-lg z-20 animate-[fadeIn_0.2s_ease-out]">
            Copied!
          </div>
        )}

        {/* User Attachments */}
        {message.attachments && message.attachments.length > 0 && (
           <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
             {message.attachments.map((att, i) => (
               <div key={i} className="relative rounded-lg overflow-hidden border border-gray-700 w-24 h-24 flex-shrink-0 bg-black">
                 {att.type === 'image' ? (
                   <img src={att.previewUrl} className="w-full h-full object-cover" alt="attachment" />
                 ) : (
                   <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 p-2 text-center">
                      <FileText size={24} />
                      <span className="text-[10px] mt-1 break-all line-clamp-2">{att.file.name}</span>
                   </div>
                 )}
               </div>
             ))}
           </div>
        )}

        {/* Bot Icon */}
        {!isUser && (
          <div className="absolute top-4 left-4 md:-left-3 md:top-0 w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-900/20 md:hidden">
            <BookOpen size={16} className="text-white" />
          </div>
        )}

        {/* Error Message */}
        {message.error && (
            <div className="flex items-start gap-3 p-3 mb-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-200 text-sm">
                <AlertTriangle className="shrink-0 text-red-400" size={18} />
                <div className="flex flex-col gap-1 w-full">
                    <span className="font-bold">Error</span>
                    <span className="opacity-90">{message.text}</span>
                    <button 
                        onClick={onResend}
                        className="self-end mt-2 px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg text-xs transition-colors border border-red-500/20"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        )}

        {/* Markdown Content */}
        {!message.error && (
        <div className={`prose prose-invert max-w-none leading-relaxed font-marhey ${isUser ? 'prose-p:text-white' : 'prose-p:text-gray-300'} prose-headings:font-cairo prose-headings:text-transparent prose-headings:bg-clip-text prose-headings:bg-gradient-to-r prose-headings:from-emerald-400 prose-headings:to-cyan-400 prose-blockquote:font-amiri prose-blockquote:text-amber-400 prose-blockquote:border-amber-500/50 prose-blockquote:bg-amber-900/10 prose-blockquote:rounded-r-lg prose-strong:text-emerald-400 space-y-4`} dir={dir}>
          {contentParts.map((part, index) => {
            if (index % 2 === 1) {
              // This is HTML code block
              return <HtmlPreviewBlock key={index} code={part} isStreaming={message.isStreaming && index === contentParts.length - 1} onAction={onAction} />;
            } else {
              // Standard Text
              return (
                <ReactMarkdown 
                  key={index}
                  remarkPlugins={[remarkGfm, remarkMath]}
                  rehypePlugins={[rehypeKatex]}
                  components={{
                    // Custom Link Renderer
                    a: ({node, ...props}) => <a {...props} className="text-blue-400 hover:text-blue-300 underline underline-offset-4 decoration-blue-500/30 transition-colors" target="_blank" rel="noopener noreferrer" />,
                    
                    // Custom List Renderer (Visual Shapes)
                    ul: ({node, ...props}) => <ul {...props} className="space-y-3 my-4 list-none pl-0" />,
                    ol: ({node, ...props}) => <ol {...props} className="space-y-4 my-4 list-none pl-0 counter-reset-step" />,
                    
                    li: ({node, ...props}) => {
                      const text = String(props.children);
                      const isQuizOption = /^[A-D]\)/.test(text.trim()) || /^[أ-د]\)/.test(text.trim());
                      
                      if (isQuizOption && !isUser) {
                         // Interactive Quiz Option
                         return (
                           <li className="group">
                             <button 
                               onClick={() => onAction?.(text, false)}
                               className="w-full text-start p-4 rounded-xl bg-gray-800/50 hover:bg-indigo-600/20 border border-gray-700/50 hover:border-indigo-500/50 transition-all duration-300 flex items-center gap-4 active:scale-[0.99] animate-[fadeIn_0.3s_ease-out]"
                             >
                               <div className="w-10 h-10 rounded-full bg-gray-700 group-hover:bg-indigo-500 text-gray-300 group-hover:text-white flex items-center justify-center font-bold text-lg transition-colors shrink-0">
                                 {text.trim().charAt(0)}
                               </div>
                               <span className="text-gray-200 group-hover:text-white font-marhey text-sm md:text-base leading-relaxed">{text.trim().substring(2)}</span>
                             </button>
                           </li>
                         );
                      }
                      
                      return (
                        <li className="flex gap-4 items-start p-3 bg-gray-900/30 rounded-xl border border-gray-800/50 hover:border-emerald-500/30 transition-colors">
                          <ArrowLeft className={`w-5 h-5 text-emerald-500 mt-1 shrink-0 ${dir === 'ltr' ? 'rotate-180' : ''}`} />
                          <span className="flex-1 leading-relaxed">{props.children}</span>
                        </li>
                      );
                    },

                    // Styled Blockquote
                    blockquote: ({node, ...props}) => (
                      <div className="relative my-8 p-6 bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl border border-amber-500/20 shadow-lg shadow-black/20">
                        <Quote className="absolute top-4 right-4 text-amber-500/20 w-8 h-8" />
                        <blockquote {...props} className="border-none p-0 m-0 bg-transparent text-lg md:text-xl leading-relaxed italic text-amber-200/90 font-amiri" />
                      </div>
                    ),

                    // Custom Code Block (Inline)
                    code: ({node, ...props}) => {
                        // @ts-ignore - inline is not in types but exists in props
                        const {inline, className, children} = props;
                        if (inline) {
                           return <code className="bg-gray-700/50 text-emerald-300 px-1.5 py-0.5 rounded text-sm font-mono border border-emerald-500/20" dir="ltr">{children}</code>
                        }
                        return <code className={className}>{children}</code>
                    },
                    
                    // Styled HR
                    hr: () => <hr className="my-10 border-t border-gray-700/50" />
                  }}
                >
                  {part}
                </ReactMarkdown>
              );
            }
          })}
        </div>
        )}

        {/* Loading Indicator */}
        {message.isStreaming && !contentParts.some((_, i) => i % 2 === 1 && i === contentParts.length - 1) && (
          <div className="flex items-center gap-2 mt-4 text-emerald-500/70 animate-pulse font-marhey text-sm">
             <BrainCircuit size={16} className="animate-pulse" />
             <span>يفكر... (Thinking)</span>
          </div>
        )}

        {/* Bot Footer Actions */}
        {!isUser && !message.isStreaming && !message.error && (
           <div className="mt-8 pt-4 border-t border-gray-800/50 flex flex-wrap items-center gap-3 justify-between">
              
              {/* Quick Action Chips */}
              <div className="flex flex-wrap gap-2">
                 <button 
                  onClick={() => onAction?.('Create an interactive simulation about this specific topic', true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/20 transition-all"
                 >
                   <FlaskConical size={14} />
                   🧪 محاكاة (Simulation)
                 </button>

                 <button 
                  onClick={() => onAction?.('Create a comprehensive interactive HTML quiz (QZ) about this topic', true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-xs font-bold border border-indigo-500/20 transition-all"
                 >
                   <ClipboardList size={14} />
                   📝 اختبار (Quiz)
                 </button>
              </div>

              <div className="flex items-center gap-3">
                <button 
                  onClick={() => onAction?.("مش فاهم، ممكن تشرح تاني بشكل أبسط؟ (Simplify)", false)}
                  className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-xs text-gray-400 hover:text-white transition-colors border border-gray-700/50"
                >
                  🤔 مش فاهم (Simplify)
                </button>
                
                {/* Model Badge */}
                <div className="flex items-center gap-1.5 text-[10px] text-gray-600 font-mono px-2 py-1 rounded bg-black/20">
                    {getModelBadge(message.modelId)}
                    <span className="opacity-70">{message.modelId?.replace('gemini-', '').replace('-preview', '').replace('-latest', '').replace('2.0-pro-exp-02-05', '2.5-pro') || 'AI'}</span>
                </div>
              </div>
           </div>
        )}
      </div>
    </div>
  );
};