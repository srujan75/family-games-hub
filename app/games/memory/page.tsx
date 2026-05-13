"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { doc, onSnapshot, updateDoc, setDoc } from 'firebase/firestore';
import { MEMORY_ITEMS } from '@/data/memoryItems';
import { ArrowLeft, Loader2, Eye, Brain } from 'lucide-react';
import { addPoints } from '@/lib/scoring';

function MemoryGameContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomCode = searchParams.get('roomCode');
  const [isHost, setIsHost] = useState(false);
  const [gameState, setGameState] = useState<any>(null);
  
  const [userAnswers, setUserAnswers] = useState('');
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);

  useEffect(() => {
    if (!roomCode) return;
    
    const unsubTrip = onSnapshot(doc(db, "trips", roomCode), (docSnap) => {
      if (docSnap.exists()) {
        setIsHost(docSnap.data().hostId === auth.currentUser?.uid);
      }
    });

    const unsubGame = onSnapshot(doc(db, "games", `${roomCode}_memory`), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setGameState(data);
        
        // Reset local state when a new round starts
        if (data.phase === 'memorize') {
          setHasSubmitted(false);
          setUserAnswers('');
          setScore(null);
        }
      } else if (isHost) {
        setDoc(doc(db, "games", `${roomCode}_memory`), {
          phase: 'waiting', // waiting, memorize, recall, results
          items: MEMORY_ITEMS.slice(0, 8)
        });
      }
    });

    return () => {
      unsubTrip();
      unsubGame();
    };
  }, [roomCode, isHost]);

  const startGame = async () => {
    if (!isHost) return;
    const shuffledItems = [...MEMORY_ITEMS].sort(() => 0.5 - Math.random()).slice(0, 8);
    await updateDoc(doc(db, "games", `${roomCode}_memory`), {
      phase: 'memorize',
      items: shuffledItems
    });
    
    // Auto switch to recall after 15 seconds
    setTimeout(() => {
      updateDoc(doc(db, "games", `${roomCode}_memory`), {
        phase: 'recall'
      });
    }, 15000);
  };

  const submitAnswers = async () => {
    if (hasSubmitted || !gameState) return;
    setHasSubmitted(true);
    
    const userWords = userAnswers.toLowerCase().split(/[,\s]+/).filter(w => w.length > 0);
    const correctWords = gameState.items.map((i: string) => i.toLowerCase().split(' ')[1]); // get word without emoji
    
    let correctCount = 0;
    userWords.forEach(word => {
      if (correctWords.some((cw: string) => cw.includes(word) || word.includes(cw))) {
        correctCount++;
      }
    });

    setScore(correctCount);
    
    if (correctCount > 0) {
      await addPoints(roomCode as string, auth.currentUser?.uid as string, correctCount * 2, "Memory Match");
    }
  };

  const showResults = async () => {
    if (!isHost) return;
    await updateDoc(doc(db, "games", `${roomCode}_memory`), {
      phase: 'results'
    });
  };

  if (!gameState) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin w-10 h-10 text-indigo-600" /></div>;

  return (
    <main className="min-h-screen bg-slate-50 p-6 flex flex-col max-w-md mx-auto text-center">
      <div className="w-full flex items-center justify-between mb-8">
        <button onClick={() => router.push(`/games?roomCode=${roomCode}`)} className="p-2 -ml-2 text-slate-500">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-2xl font-black text-slate-900">Memory Match</h1>
        <div className="w-10" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center w-full">
        {gameState.phase === 'waiting' && (
          <div className="space-y-6">
            <Brain className="w-24 h-24 text-teal-500 mx-auto" />
            <p className="text-slate-600 font-medium">You will have 15 seconds to memorize 8 items. Then you must type as many as you can remember!</p>
            {isHost ? (
              <button onClick={startGame} className="w-full bg-teal-600 text-white font-black py-4 rounded-2xl shadow-lg">
                Start Memorizing
              </button>
            ) : (
              <p className="font-bold text-teal-600 animate-pulse">Waiting for host to start...</p>
            )}
          </div>
        )}

        {gameState.phase === 'memorize' && (
          <div className="w-full animate-in zoom-in duration-500">
            <div className="flex items-center justify-center gap-2 text-teal-600 font-bold mb-6">
              <Eye className="w-5 h-5 animate-pulse" /> Memorize These!
            </div>
            <div className="grid grid-cols-2 gap-4">
              {gameState.items.map((item: string, i: number) => (
                <div key={i} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 font-bold text-lg">
                  {item}
                </div>
              ))}
            </div>
          </div>
        )}

        {gameState.phase === 'recall' && (
          <div className="w-full space-y-6">
            <h2 className="text-2xl font-black text-slate-800">What do you remember?</h2>
            <textarea
              disabled={hasSubmitted}
              value={userAnswers}
              onChange={(e) => setUserAnswers(e.target.value)}
              placeholder="Type items here, separated by spaces or commas..."
              className="w-full h-40 p-4 rounded-2xl border-2 border-slate-200 focus:border-teal-500 outline-none resize-none"
            />
            {!hasSubmitted ? (
              <button onClick={submitAnswers} className="w-full bg-teal-600 text-white font-black py-4 rounded-2xl shadow-lg">
                Submit Answers
              </button>
            ) : (
              <div className="bg-green-50 text-green-700 p-4 rounded-2xl font-bold border border-green-200">
                You remembered {score} items! (+{score! * 2} pts)
              </div>
            )}

            {isHost && (
              <button onClick={showResults} className="w-full bg-slate-800 text-white font-black py-4 rounded-2xl mt-8">
                Reveal Items
              </button>
            )}
          </div>
        )}

        {gameState.phase === 'results' && (
          <div className="w-full">
            <h2 className="text-2xl font-black text-slate-800 mb-6">The Items Were:</h2>
            <div className="grid grid-cols-2 gap-4 mb-8">
              {gameState.items.map((item: string, i: number) => (
                <div key={i} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 font-bold text-lg">
                  {item}
                </div>
              ))}
            </div>
            {isHost && (
              <button onClick={startGame} className="w-full bg-teal-600 text-white font-black py-4 rounded-2xl">
                Play Again
              </button>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

export default function MemoryGame() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin w-10 h-10 text-indigo-600" /></div>}>
      <MemoryGameContent />
    </Suspense>
  );
}
