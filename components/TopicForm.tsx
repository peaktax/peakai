import React, { useState, useRef } from 'react';
import { TaxCategory, UploadedFile, AuthorProfile } from '../types';
import { Search, Briefcase, User, Sparkles, Loader2, Paperclip, X, FileText, Mic, AlignLeft, ShieldCheck } from 'lucide-react';

interface TopicFormProps {
  onSubmit: (category: TaxCategory, topic: string, author: AuthorProfile, files: UploadedFile[], tone: string, wordCount: string) => void;
  isProcessing: boolean;
}

const TONE_OPTIONS = [
  "Expert Tax Advisor (Professional & Authoritative)",
  "Tax Journalist (Objective & News-focused)",
  "Friendly Tax Consultant (Approachable & Helpful)",
  "Strict CPA (Formal & Regulation-heavy)",
  "Financial Educator (Instructional & Clear)"
];

const WORD_COUNT_OPTIONS = [
  "Short Overview (500-800 words)",
  "Standard Blog Post (800-1200 words)",
  "Deep Dive / Guide (1500-2000 words)",
  "Comprehensive Whitepaper (2500+ words)"
];

// Hardcoded Author Profile
const FIXED_AUTHOR: AuthorProfile = {
  name: "ARUN KP",
  credentials: "Entrepreneur | AI Content Generator | India-US Tax Professional | Accountant",
  bio: "With over 15 years of extensive experience in the accounting and taxation industry, Arun KP specializes in cross-border India-US taxation. As an Entrepreneur and AI Content Generator, he leverages cutting-edge technology to simplify complex financial landscapes for individuals and businesses."
};

export const TopicForm: React.FC<TopicFormProps> = ({ onSubmit, isProcessing }) => {
  const [category, setCategory] = useState<TaxCategory>(TaxCategory.INDIVIDUAL);
  const [topic, setTopic] = useState('');
  const [tone, setTone] = useState(TONE_OPTIONS[0]);
  const [wordCount, setWordCount] = useState(WORD_COUNT_OPTIONS[1]);
  
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles: UploadedFile[] = [];
      for (let i = 0; i < e.target.files.length; i++) {
        const file = e.target.files[i];
        try {
          const base64 = await fileToBase64(file);
          newFiles.push({
            name: file.name,
            mimeType: file.type,
            data: base64
          });
        } catch (err) {
          console.error("Error reading file", file.name, err);
        }
      }
      setFiles(prev => [...prev, ...newFiles]);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (topic.trim()) {
      // Use the FIXED_AUTHOR constant
      onSubmit(category, topic, FIXED_AUTHOR, files, tone, wordCount);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
        <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-blue-600" />
          Create New Blog Post
        </h2>
        <p className="text-slate-500 text-sm mt-1">
          YMYL Compliant Generation: Live IRS Data & Fact Checking.
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Read-Only Author Badge */}
        <div className="bg-green-50 p-3 rounded-lg border border-green-100 flex items-center gap-3">
           <div className="bg-green-100 p-2 rounded-full">
             <ShieldCheck className="w-5 h-5 text-green-700" />
           </div>
           <div>
             <div className="text-xs font-bold text-green-800 uppercase tracking-wide">Active Author Profile (E-E-A-T)</div>
             <div className="text-sm font-medium text-slate-700">{FIXED_AUTHOR.name}</div>
             <div className="text-xs text-slate-500 truncate max-w-md">{FIXED_AUTHOR.credentials}</div>
           </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-3">Tax Category</label>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setCategory(TaxCategory.INDIVIDUAL)}
              className={`flex items-center justify-center gap-2 p-4 rounded-lg border transition-all ${
                category === TaxCategory.INDIVIDUAL
                  ? 'border-blue-600 bg-blue-50 text-blue-700'
                  : 'border-slate-200 hover:border-slate-300 text-slate-600'
              }`}
            >
              <User className="w-5 h-5" />
              <span className="font-medium">Individual</span>
            </button>
            <button
              type="button"
              onClick={() => setCategory(TaxCategory.BUSINESS)}
              className={`flex items-center justify-center gap-2 p-4 rounded-lg border transition-all ${
                category === TaxCategory.BUSINESS
                  ? 'border-blue-600 bg-blue-50 text-blue-700'
                  : 'border-slate-200 hover:border-slate-300 text-slate-600'
              }`}
            >
              <Briefcase className="w-5 h-5" />
              <span className="font-medium">Business</span>
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="topic" className="block text-sm font-medium text-slate-700 mb-2">
            Topic or Question
          </label>
          <div className="relative">
            <input
              id="topic"
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder={category === TaxCategory.INDIVIDUAL ? "e.g., 2025 Standard Deduction Increases" : "e.g., Section 179 Expensing Rules 2024"}
              className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              disabled={isProcessing}
            />
            <Search className="w-5 h-5 text-slate-400 absolute left-3 top-3.5" />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
             <label htmlFor="tone" className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
               <Mic className="w-4 h-4 text-slate-400" /> Tone of Voice
             </label>
             <select
               id="tone"
               value={tone}
               onChange={(e) => setTone(e.target.value)}
               className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
               disabled={isProcessing}
             >
               {TONE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
             </select>
          </div>
          <div>
             <label htmlFor="wordCount" className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
               <AlignLeft className="w-4 h-4 text-slate-400" /> Target Length
             </label>
             <select
               id="wordCount"
               value={wordCount}
               onChange={(e) => setWordCount(e.target.value)}
               className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
               disabled={isProcessing}
             >
               {WORD_COUNT_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
             </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Reference Documents (Optional)
          </label>
          <p className="text-xs text-slate-500 mb-3">
            Upload PDFs, images, or text files containing source material.
          </p>
          
          <div className="space-y-3">
            {files.length > 0 && (
              <div className="grid gap-2">
                {files.map((file, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-slate-50 p-2 rounded border border-slate-200">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <FileText className="w-4 h-4 text-blue-500 flex-shrink-0" />
                      <span className="text-sm text-slate-700 truncate">{file.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(idx)}
                      className="p-1 hover:bg-slate-200 rounded text-slate-500 hover:text-red-500"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                multiple
                accept=".pdf,.txt,.md,.csv,image/*"
                className="hidden"
                id="file-upload"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 bg-white transition-colors"
              >
                <Paperclip className="w-4 h-4" />
                Add Documents
              </button>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={!topic.trim() || isProcessing}
          className={`w-full py-3 px-4 rounded-lg font-medium text-white flex items-center justify-center gap-2 transition-all ${
            !topic.trim() || isProcessing
              ? 'bg-slate-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg'
          }`}
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Fact-Checking & Writing...
            </>
          ) : (
            <>
              Generate Compliant Blog Post
            </>
          )}
        </button>
      </form>
    </div>
  );
};