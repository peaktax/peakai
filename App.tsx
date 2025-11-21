import React, { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { TopicForm } from './components/TopicForm';
import { StatusCard } from './components/StatusCard';
import { BlogView } from './components/BlogView';
import { HistorySidebar } from './components/HistorySidebar';
import { TaxCategory, BlogState, UploadedFile, AuthorProfile, HistoryItem } from './types';
import { performTaxResearch, generateBlogContent, generateSEOKeywords, generateSEOMetadata, generateBlogImage } from './services/geminiService';
import { WifiOff, Lock, ArrowRight } from 'lucide-react';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');
  
  const [state, setState] = useState<BlogState>({
    category: TaxCategory.INDIVIDUAL,
    topic: '',
    author: { 
      name: 'ARUN KP', 
      credentials: 'Entrepreneur | AI Content Generator | India-US Tax Professional | Accountant', 
      bio: 'With over 15 years of extensive experience in the accounting and taxation industry, Arun KP specializes in cross-border India-US taxation.' 
    },
    status: 'idle',
  });
  
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // Load history from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('peaktax_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Check authentication
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // CRITICAL FIX: Use import.meta.env instead of process.env
    const correctPassword = import.meta.env.VITE_APP_PASSWORD || 'admin123';
    if (passwordInput === correctPassword) {
      setIsAuthenticated(true);
    } else {
      setLoginError('Incorrect access code.');
    }
  };

  // Save history item
  const saveToHistory = (newItem: HistoryItem) => {
    const updated = [newItem, ...history];
    setHistory(updated);
    localStorage.setItem('peaktax_history', JSON.stringify(updated));
  };

  const deleteHistoryItem = (id: string) => {
    const updated = history.filter(item => item.id !== id);
    setHistory(updated);
    localStorage.setItem('peaktax_history', JSON.stringify(updated));
  };

  const loadHistoryItem = (item: HistoryItem) => {
    setState({
      status: 'complete',
      category: item.category,
      topic: item.topic,
      author: item.author,
      researchData: item.researchData,
      blogContent: item.blogContent,
      seoMetadata: item.seoMetadata,
      keywords: item.keywords
    });
    setIsHistoryOpen(false);
  };

  const handleGenerate = useCallback(async (
    category: TaxCategory, 
    topic: string, 
    author: AuthorProfile,
    files: UploadedFile[],
    tone: string,
    wordCount: string
  ) => {
    if (isOffline) {
      setState(prev => ({
        ...prev,
        status: 'error',
        error: 'No internet connection. AI generation requires an active network to reach Google servers.'
      }));
      return;
    }

    setState(prev => ({ 
      ...prev, 
      category, 
      topic, 
      author,
      files,
      status: 'researching', 
      error: undefined, 
      blogContent: undefined, 
      researchData: undefined, 
      keywords: undefined,
      seoMetadata: undefined
    }));

    try {
      // Step 1: Research (Flash + Search - IRS Priority)
      const researchData = await performTaxResearch(topic, category);
      
      // Step 1.5: Generate Keywords (Pro + Search + RAG)
      const keywords = await generateSEOKeywords(topic);

      setState(prev => ({ ...prev, status: 'thinking', researchData, keywords }));

      // Step 2: Write (Pro + Thinking + Files + Tone/Count + Keywords + Author E-E-A-T)
      const blogContent = await generateBlogContent(topic, category, researchData, author, files, tone, wordCount, keywords);
      
      // Step 3: Generate SEO Metadata (Flash + Author Schema + Citations)
      // PASSING CITATIONS HERE NOW:
      const seoMetadata = await generateSEOMetadata(topic, blogContent, author, researchData.citations);

      // Complete state
      setState(prev => ({ ...prev, blogContent, seoMetadata, status: 'complete' }));

      // Save to History
      saveToHistory({
        id: Date.now().toString(),
        date: Date.now(),
        category,
        topic,
        author,
        researchData,
        blogContent,
        seoMetadata,
        keywords
      });

    } catch (error: any) {
      setState(prev => ({ 
        ...prev, 
        status: 'error', 
        error: error.message || "An error occurred during generation." 
      }));
    }
  }, [isOffline, history]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-8 text-center">
             <div className="w-16 h-16 bg-white rounded-xl mx-auto mb-4 p-1">
               <img src="https://peakbcs.com/assets/images/logo.jpg" alt="Logo" className="w-full h-full object-contain" />
             </div>
             <h1 className="text-2xl font-bold text-white">PEAKtax AI</h1>
             <p className="text-blue-100 text-sm">Secure Content Generation Portal</p>
          </div>
          <form onSubmit={handleLogin} className="p-8 space-y-6">
             <div>
               <label className="block text-sm font-medium text-slate-700 mb-2">Access Code</label>
               <div className="relative">
                 <input 
                   type="password" 
                   value={passwordInput}
                   onChange={(e) => { setPasswordInput(e.target.value); setLoginError(''); }}
                   className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                   placeholder="Enter password..."
                 />
                 <Lock className="w-5 h-5 text-slate-400 absolute left-3 top-3.5" />
               </div>
               {loginError && <p className="text-red-500 text-sm mt-2">{loginError}</p>}
             </div>
             <button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-all">
               Access Portal <ArrowRight className="w-4 h-4" />
             </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20 relative overflow-x-hidden">
      <Header onToggleHistory={() => setIsHistoryOpen(true)} />
      
      <HistorySidebar 
        isOpen={isHistoryOpen} 
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onLoad={loadHistoryItem}
        onDelete={deleteHistoryItem}
      />

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8 transition-all duration-300">
        
        {isOffline && (
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg flex items-center gap-3 text-amber-800 animate-in fade-in slide-in-from-top-2">
            <WifiOff className="w-5 h-5" />
            <div>
              <p className="font-bold text-sm">You are currently offline.</p>
              <p className="text-xs">You can view the app, but AI generation features require an internet connection to function.</p>
            </div>
          </div>
        )}

        {/* Introduction / Hero */}
        {state.status === 'idle' && (
          <div className="text-center py-12 space-y-4">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-800 tracking-tight">
              Simplify US Tax Complexity
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Generate E-E-A-T compliant tax articles powered by real-time IRS data, advanced AI reasoning, and strict fact-checking.
            </p>
          </div>
        )}

        {/* Input Form */}
        <div className="max-w-2xl mx-auto">
          <TopicForm 
            onSubmit={handleGenerate} 
            isProcessing={state.status === 'researching' || state.status === 'thinking'} 
          />
        </div>

        {/* Status Area */}
        {(state.status !== 'idle') && (
          <div className="max-w-2xl mx-auto">
             <StatusCard status={state.status} error={state.error} />
          </div>
        )}

        {/* Results Area */}
        {state.status === 'complete' && state.blogContent && state.researchData && (
          <BlogView 
            content={state.blogContent} 
            citations={state.researchData.citations} 
            category={state.category}
            keywords={state.keywords || []}
            seoMetadata={state.seoMetadata}
            onGenerateImage={generateBlogImage}
          />
        )}
      </main>
    </div>
  );
};

export default App;
