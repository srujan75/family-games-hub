"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { PlayerCard } from '@/components/PlayerCard';
import { ArrowLeft, Trophy, Medal, Loader2 } from 'lucide-react';
import confetti from 'canvas-confetti';

function LeaderboardContent() {
  const searchParams = useSearchParams();
  const roomCode = searchParams.get('roomCode');
  const router = useRouter();
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!roomCode) return;

    const q = query(
      collection(db, "players"), 
      where("tripId", "==", roomCode),
      orderBy("totalScore", "desc")
    );

    const unsub = onSnapshot(q, (snap) => {
      const playersList = snap.docs.map(doc => doc.data());
      setPlayers(playersList);
      setLoading(false);
    });

    return () => unsub();
  }, [roomCode]);

  const getRankIcon = (index: number) => {
    switch(index) {
      case 0: return <Trophy className="w-6 h-6 text-yellow-500" />;
      case 1: return <Medal className="w-6 h-6 text-slate-400" />;
      case 2: return <Medal className="w-6 h-6 text-amber-600" />;
      default: return <span className="font-bold text-slate-400">#{index + 1}</span>;
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 p-6 flex flex-col max-w-md mx-auto">
      <div className="flex items-center justify-between mb-8">
        <button onClick={() => router.back()} className="p-2 -ml-2 text-slate-500">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-2xl font-black text-slate-900">Leaderboard</h1>
        <div className="w-10" />
      </div>

      <div className="flex-1 space-y-4">
        {players.map((player, index) => (
          <div key={player.playerId} className="flex items-center gap-4">
            <div className="w-8 flex justify-center">
              {getRankIcon(index)}
            </div>
            <PlayerCard
              name={player.name}
              avatar={player.avatar}
              score={player.totalScore}
              className={`flex-1 ${index === 0 ? 'border-yellow-400 bg-yellow-50 ring-4 ring-yellow-100' : ''}`}
            />
          </div>
        ))}

        {players.length === 0 && !loading && (
          <div className="text-center py-20 opacity-50">
            <p className="font-bold">No players yet.</p>
          </div>
        )}
      </div>

      <button
        onClick={() => router.push(`/lobby?roomCode=${roomCode}`)}
        className="w-full bg-indigo-600 text-white font-black py-5 rounded-2xl shadow-xl shadow-indigo-100 mt-8"
      >
        Back to Lobby
      </button>
    </main>
  );
}

export default function Leaderboard() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin w-10 h-10 text-indigo-600" /></div>}>
      <LeaderboardContent />
    </Suspense>
  );
}
