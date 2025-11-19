import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { sendChatMessage } from '../services/geminiService';

interface SidebarProps {
  inventory: string[];
  currentQuest: string;
  gameContext: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ inventory, currentQuest, gameContext }) => {
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    { id: 'init', sender: 'ai', text: 'I am the Guide. Ask me if you lose your way.', timestamp: Date.now() }
  ]);
  const [input, setInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isChatLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: input,
      timestamp: Date.now()
    };

    setChatHistory(prev => [...prev, userMsg]);
    setInput('');
    setIsChatLoading(true);

    try {
      const responseText = await sendChatMessage(input, gameContext);
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: responseText,
        timestamp: Date.now()
      };
      setChatHistory(prev => [...prev, aiMsg]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsChatLoading(false);
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  return (
    <div className="h-full flex flex-col bg-game-panel border-l border-gray-800 text-game-text font-sans">
      {/* Stats Section */}
      <div className="p-6 border-b border-gray-700">
        <h2 className="text-xl font-display text-game-highlight mb-4">Journal</h2>
        
        <div className="mb-6">
          <h3 className="text-xs uppercase tracking-widest text-gray-500 mb-2">Current Quest</h3>
          <p className="text-sm font-serif italic text-white bg-gray-900/50 p-3 rounded border border-gray-700">
            {currentQuest || "No active quest."}
          </p>
        </div>

        <div>
          <h3 className="text-xs uppercase tracking-widest text-gray-500 mb-2">Inventory</h3>
          {inventory.length === 0 ? (
            <p className="text-sm text-gray-600">Empty...</p>
          ) : (
            <ul className="space-y-2">
              {inventory.map((item, idx) => (
                <li key={idx} className="text-sm flex items-center gap-2">
                  <span className="w-1 h-1 bg-game-accent rounded-full"></span>
                  {item}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Chat Section */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="p-4 border-b border-gray-700 bg-gray-900/30">
          <h2 className="text-lg font-display text-game-highlight flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
            </svg>
            The Oracle
          </h2>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {chatHistory.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-lg p-3 text-sm ${
                msg.sender === 'user' 
                  ? 'bg-game-accent text-gray-900' 
                  : 'bg-gray-800 text-gray-200 border border-gray-700'
              }`}>
                {msg.text}
              </div>
            </div>
          ))}
          {isChatLoading && (
            <div className="flex justify-start">
               <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
                 <div className="flex space-x-1">
                   <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                   <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-75"></div>
                   <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-150"></div>
                 </div>
               </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <form onSubmit={handleSend} className="p-4 border-t border-gray-700 bg-gray-900">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask the guide..."
              className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-game-accent"
            />
            <button 
              type="submit"
              disabled={isChatLoading}
              className="bg-game-highlight text-gray-900 px-3 py-2 rounded font-bold hover:bg-yellow-500 disabled:opacity-50 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};