import React, { useState, useEffect, useRef } from 'react';
import { generateStoryStep, generateSceneImage } from './services/geminiService';
import { StoryState, Turn, GameStatus } from './types';
import { Sidebar } from './components/Sidebar';
import { StoryBlock } from './components/StoryBlock';
import { Spinner } from './components/Spinner';

// Initial State
const INITIAL_STATE: StoryState = {
  turns: [],
  inventory: [],
  currentQuest: 'Awaken and discover where you are.',
  isGameOver: false,
};

export default function App() {
  const [gameState, setGameState] = useState<StoryState>(INITIAL_STATE);
  const [status, setStatus] = useState<GameStatus>(GameStatus.START);
  const [loadingNext, setLoadingNext] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const scrollEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new content arrives
  useEffect(() => {
    if (scrollEndRef.current) {
      scrollEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [gameState.turns, status]);

  const handleStart = () => {
    setStatus(GameStatus.LOADING);
    processTurn('START_GAME');
  };

  const handleChoice = (choice: string) => {
    setLoadingNext(true);
    processTurn(choice);
  };

  const processTurn = async (action: string) => {
    try {
      // 1. Generate Text & Logic (Fast)
      // Include more context for better continuity
      const historyText = gameState.turns.map(t => `Scene: ${t.text}`).slice(-5); 
      
      const response = await generateStoryStep(
        historyText,
        action,
        gameState.inventory,
        gameState.currentQuest
      );

      // 2. Create the new turn object immediately with loading image state
      const newTurnId = Date.now().toString();
      const newTurn: Turn = {
        id: newTurnId,
        text: response.story_segment,
        choices: response.choices,
        isImageLoading: true, // Start loading
      };

      // 3. Update State with Text immediately
      setGameState(prev => {
        // Handle Inventory
        let newInventory = [...prev.inventory];
        if (response.inventory_updates?.add) {
          newInventory = [...newInventory, ...response.inventory_updates.add];
        }
        if (response.inventory_updates?.remove) {
          newInventory = newInventory.filter(item => !response.inventory_updates.remove.includes(item));
        }

        return {
          ...prev,
          inventory: newInventory,
          currentQuest: response.quest_update || prev.currentQuest,
          isGameOver: response.is_game_over,
          turns: [...prev.turns, newTurn]
        };
      });

      setStatus(GameStatus.PLAYING);
      setLoadingNext(false);

      // 4. Trigger Image Generation in background
      generateSceneImage(response.image_prompt).then((imageUrl) => {
        setGameState(prev => ({
          ...prev,
          turns: prev.turns.map(t => 
            t.id === newTurnId 
              ? { ...t, imageUrl: imageUrl || undefined, isImageLoading: false } 
              : t
          )
        }));
      });

    } catch (error) {
      console.error("Turn processing failed", error);
      setStatus(GameStatus.ERROR);
      setLoadingNext(false);
    }
  };

  const getLastTurn = () => gameState.turns[gameState.turns.length - 1];

  return (
    <div className="flex h-screen w-full bg-game-bg overflow-hidden">
      
      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative h-full overflow-hidden">
        {/* Header */}
        <header className="p-6 border-b border-gray-800 bg-game-bg/95 z-10 flex justify-between items-center sticky top-0">
          <button 
            className="lg:hidden text-game-highlight p-2 mr-4 hover:bg-gray-800 rounded"
            onClick={() => setIsSidebarOpen(true)}
            aria-label="Open Menu"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="text-xl md:text-3xl font-display text-game-highlight text-center tracking-widest uppercase flex-1 truncate">
            Chronicles of Infinity
          </h1>
           <div className="w-10 lg:hidden"></div> {/* Spacer for alignment */}
        </header>

        {/* Scrollable Story Feed */}
        <div className="flex-1 overflow-y-auto p-6 md:p-12 max-w-4xl mx-auto w-full pb-48 scroll-smooth">
          {status === GameStatus.START && (
            <div className="flex flex-col items-center justify-center h-full space-y-8 animate-fade-in">
              <p className="text-gray-400 text-lg text-center max-w-md font-serif">
                Enter a world that never ends. Your choices shape the narrative, the visuals, and your destiny.
              </p>
              <button 
                onClick={handleStart}
                className="px-8 py-3 bg-game-highlight text-gray-900 font-bold rounded-sm hover:bg-yellow-500 transition-transform hover:scale-105 shadow-[0_0_15px_rgba(255,215,0,0.3)] font-display tracking-wider"
              >
                BEGIN ADVENTURE
              </button>
            </div>
          )}

          {gameState.turns.map((turn, index) => (
            <StoryBlock 
              key={turn.id} 
              turn={turn} 
              isLast={index === gameState.turns.length - 1}
            />
          ))}
          
          {/* Loading Indicator for next text chunk */}
          {(status === GameStatus.LOADING || loadingNext) && (
             <div className="mt-8">
               <Spinner />
               <p className="text-center text-gray-500 text-sm font-serif animate-pulse">The weavers of fate are spinning...</p>
             </div>
          )}
          
          {status === GameStatus.ERROR && (
            <div className="text-red-500 text-center mt-10 border border-red-900 p-4 rounded bg-red-900/20">
              <p>A rift in reality occurred. The spirits cannot communicate.</p>
              <button onClick={() => window.location.reload()} className="mt-4 underline">Try Refreshing</button>
            </div>
          )}

          <div ref={scrollEndRef} />
        </div>

        {/* Fixed Choice Area (Bottom) */}
        {status === GameStatus.PLAYING && !loadingNext && !gameState.isGameOver && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-game-bg via-game-bg to-transparent pt-16 pb-8 px-4">
            <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4 animate-slide-up">
              {getLastTurn()?.choices.map((choice, idx) => (
                <button
                  key={idx}
                  onClick={() => handleChoice(choice)}
                  className="bg-game-panel border border-gray-700 hover:border-game-highlight hover:bg-gray-800 text-gray-200 py-4 px-6 rounded text-left transition-all duration-200 group shadow-lg"
                >
                  <span className="text-game-highlight mr-2 font-bold group-hover:mr-3 transition-all">›</span>
                  {choice}
                </button>
              ))}
            </div>
          </div>
        )}
        
        {gameState.isGameOver && !loadingNext && (
          <div className="absolute bottom-0 left-0 right-0 bg-black/80 p-8 text-center z-20 backdrop-blur-sm">
            <h2 className="text-3xl font-display text-red-500 mb-4">FATE SEALED</h2>
            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-2 border border-white text-white hover:bg-white hover:text-black transition-colors"
            >
              Reincarnate
            </button>
          </div>
        )}
      </main>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div 
            className="absolute inset-0 bg-black/80 transition-opacity" 
            onClick={() => setIsSidebarOpen(false)}
          />
          <div className="absolute left-0 top-0 bottom-0 w-80 bg-game-panel shadow-2xl border-r border-gray-700 flex flex-col transform transition-transform duration-300 translate-x-0">
              <div className="flex justify-end p-4 border-b border-gray-700">
                  <button onClick={() => setIsSidebarOpen(false)} className="text-gray-400 hover:text-white p-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
              </div>
              <div className="flex-1 overflow-hidden">
                <Sidebar 
                  inventory={gameState.inventory}
                  currentQuest={gameState.currentQuest}
                  gameContext={gameState.turns.map(t => t.text).join('\n').slice(-2000)}
                />
              </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-80 h-full shadow-2xl z-20 relative">
        <Sidebar 
          inventory={gameState.inventory}
          currentQuest={gameState.currentQuest}
          gameContext={gameState.turns.map(t => t.text).join('\n').slice(-2000)}
        />
      </aside>
    </div>
  );
}
