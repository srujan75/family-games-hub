"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { doc, onSnapshot, collection, query, where, updateDoc } from 'firebase/firestore';
import { SpinWheel } from '@/components/SpinWheel';
import { ArrowLeft, Loader2 } from 'lucide-react';

function SpinWheelGameContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomCode = searchParams.get('roomCode');
  const [players, setPlayers] = useState<any[]>([]);
  const [isHost, setIsHost] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);

  useEffect(() => {
    if (!roomCode) return;
    
    const unsubTrip = onSnapshot(doc(db, "trips", roomCode), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setIsHost(data.hostId === auth.currentUser?.uid);
        if (data.status === 'lobby') {
          router.push(`/lobby?roomCode=${roomCode}`);
        }
      }
    });

    const unsubPlayers = onSnapshot(query(collection(db, "players"), where("tripId", "==", roomCode)), (snap) => {
      setPlayers(snap.docs.map(d => d.data()));
    });

    return () => {
      unsubTrip();
      unsubPlayers();
    };
  }, [roomCode]);

  const handleEndGame = async () => {
    if (isHost) {
      await updateDoc(doc(db, "trips", roomCode as string), {
        status: 'lobby'
      });
    }
  };

  const options = players.map(p => p.name);
  
  if (options.length === 0) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin w-10 h-10 text-indigo-600" /></div>;
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6 flex flex-col items-center max-w-md mx-auto text-center">
      <div className="w-full flex items-center justify-between mb-8">
        <button onClick={() => router.push(`/games?roomCode=${roomCode}`)} className="p-2 -ml-2 text-slate-500">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-2xl font-black text-slate-900">Spin the Wheel!</h1>
        <div className="w-10" />
      </div>

      <SpinWheel 
        options={options} 
        isHost={isHost} 
        onSpinEnd={(result) => setSelectedPlayer(result)} 
      />

      {selectedPlayer && (
        <div className="mt-8 animate-bounce bg-white p-6 rounded-3xl shadow-lg border-4 border-indigo-100 w-full">
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">The Wheel Chose</p>
          <h2 className="text-4xl font-black text-indigo-600">{selectedPlayer}!</h2>
        </div>
      )}

      {isHost && (
        <button onClick={handleEndGame} className="w-full bg-slate-800 text-white font-black py-4 rounded-2xl mt-auto">
          End Game
        </button>
      )}
    </main>
  );
}

export default function SpinWheelGame() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin w-10 h-10 text-indigo-600" /></div>}>
      <SpinWheelGameContent />
    </Suspense>
  );
}
