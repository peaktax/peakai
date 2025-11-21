import React from 'react';
import { HistoryItem } from '../types';
import { X, Trash2, FileText, Calendar, ChevronRight } from 'lucide-react';

interface HistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryItem[];
  onLoad: (item: HistoryItem) => void;
  onDelete: (id: string) => void;
}

export const HistorySidebar: React.FC<HistorySidebarProps> = ({ isOpen, onClose, history, onLoad, onDelete }) => {
  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity" 
          onClick={onClose}
        />
      )}

      {/* Sidebar Panel */}
      <div className={`fixed top-0 right-0 h-full w-80 sm:w-96 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50">
          <h2 className="font-bold text-slate-800 text-lg">Blog History</h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto h-[calc(100%-80px)] p-4 space-y-3">
          {history.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>No blogs generated yet.</p>
              <p className="text-sm">Your drafts will appear here.</p>
            </div>
          ) : (
            history.map((item) => (
              <div 
                key={item.id} 
                className="group bg-white border border-slate-200 hover:border-blue-300 rounded-xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer relative"
                onClick={() => onLoad(item)}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                    item.category === 'Individual' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                  }`}>
                    {item.category}
                  </span>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(item.id);
                    }}
                    className="text-slate-300 hover:text-red-500 p-1 rounded hover:bg-red-50 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                
                <h3 className="font-semibold text-slate-800 text-sm line-clamp-2 mb-2 leading-snug">
                  {item.topic}
                </h3>
                
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Calendar className="w-3 h-3" />
                  {new Date(item.date).toLocaleDateString()} 
                  <span className="text-slate-300">•</span> 
                  {new Date(item.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </div>

                <div className="absolute right-4 bottom-4 opacity-0 group-hover:opacity-100 transition-opacity text-blue-600">
                  <ChevronRight className="w-5 h-5" />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
};