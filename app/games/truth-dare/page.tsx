"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { doc, onSnapshot, updateDoc, collection, query, where, setDoc, serverTimestamp } from 'firebase/firestore';
import { TRUTH_DATA, DARE_DATA } from '@/data/truthDareData';
import { ArrowLeft, Loader2 } from 'lucide-react';

function TruthDareGameContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomCode = searchParams.get('roomCode');
  const [isHost, setIsHost] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState<{type: string, text: string} | null>(null);

  useEffect(() => {
    if (!roomCode) return;
    
    const unsubTrip = onSnapshot(doc(db, "trips", roomCode), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setIsHost(data.hostId === auth.currentUser?.uid);
      }
    });

    const unsubGame = onSnapshot(doc(db, "games", `${roomCode}_truth_dare`), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setCurrentPrompt(data.prompt);
      } else if (isHost) {
        setDoc(doc(db, "games", `${roomCode}_truth_dare`), {
          prompt: null
        });
      }
    });

    return () => {
      unsubTrip();
      unsubGame();
    };
  }, [roomCode, isHost]);

  const selectPrompt = async (type: 'truth' | 'dare') => {
    const list = type === 'truth' ? TRUTH_DATA : DARE_DATA;
    const randomItem = list[Math.floor(Math.random() * list.length)];
    
    await updateDoc(doc(db, "games", `${roomCode}_truth_dare`), {
      prompt: { type, text: randomItem }
    });
  };

  return (
    <main className="min-h-screen bg-slate-50 p-6 flex flex-col items-center max-w-md mx-auto text-center">
      <div className="w-full flex items-center justify-between mb-8">
        <button onClick={() => router.push(`/games?roomCode=${roomCode}`)} className="p-2 -ml-2 text-slate-500">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-2xl font-black text-slate-900">Truth or Dare</h1>
        <div className="w-10" />
      </div>

      {!currentPrompt ? (
        <div className="flex-1 flex flex-col items-center justify-center w-full gap-6">
          <button 
            onClick={() => selectPrompt('truth')}
            className="w-full bg-blue-500 text-white h-40 rounded-3xl font-black text-4xl shadow-xl shadow-blue-200 active:scale-95 transition-transform"
          >
            TRUTH
          </button>
          <button 
            onClick={() => selectPrompt('dare')}
            className="w-full bg-red-500 text-white h-40 rounded-3xl font-black text-4xl shadow-xl shadow-red-200 active:scale-95 transition-transform"
          >
            DARE
          </button>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center w-full">
          <div className={`p-8 rounded-3xl w-full shadow-2xl ${currentPrompt.type === 'truth' ? 'bg-blue-500' : 'bg-red-500'} text-white`}>
            <h2 className="text-sm font-bold uppercase tracking-widest opacity-80 mb-4">{currentPrompt.type}</h2>
            <p className="text-3xl font-black leading-tight">{currentPrompt.text}</p>
          </div>
          
          <button 
            onClick={() => updateDoc(doc(db, "games", `${roomCode}_truth_dare`), { prompt: null })}
            className="mt-8 bg-white text-slate-800 border-2 border-slate-200 px-8 py-4 rounded-full font-bold shadow-sm"
          >
            Next Turn
          </button>
        </div>
      )}
    </main>
  );
}

export default function TruthDareGame() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin w-10 h-10 text-indigo-600" /></div>}>
      <TruthDareGameContent />
    </Suspense>
  );
}
