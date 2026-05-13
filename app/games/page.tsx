"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { GameCard } from '@/components/GameCard';
import { GAME_TYPES } from '@/lib/gameConstants';
import { 
  HelpCircle, 
  Vote, 
  ShieldQuestion, 
  RotateCw, 
  Brain,
  ArrowLeft,
  Loader2
} from 'lucide-react';

const GAMES = [
  {
    id: GAME_TYPES.QUIZ,
    title: 'Family Quiz',
    description: '10 Questions about the family.',
    icon: HelpCircle,
    color: 'bg-blue-600',
    path: '/games/quiz'
  },
  {
    id: GAME_TYPES.POLL,
    title: 'Family Poll',
    description: 'Vote for the best/worst habits.',
    icon: Vote,
    color: 'bg-purple-600',
    path: '/games/poll'
  },
  {
    id: GAME_TYPES.TRUTH_DARE,
    title: 'Truth or Dare',
    description: 'Family-safe tasks and secrets.',
    icon: ShieldQuestion,
    color: 'bg-pink-600',
    path: '/games/truth-dare'
  },
  {
    id: GAME_TYPES.SPIN_WHEEL,
    title: 'Spin Wheel',
    description: 'Random challenges and rewards.',
    icon: RotateCw,
    color: 'bg-orange-600',
    path: '/games/spin-wheel'
  },
  {
    id: GAME_TYPES.MEMORY,
    title: 'Memory Match',
    description: 'Remember 10 items in 20 seconds.',
    icon: Brain,
    color: 'bg-teal-600',
    path: '/games/memory'
  }
];

function GamesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomCode = searchParams.get('roomCode');
  const [trip, setTrip] = useState<any>(null);
  const [isHost, setIsHost] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!roomCode) return;

    const unsub = onSnapshot(doc(db, "trips", roomCode), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setTrip(data);
        setIsHost(data.hostId === auth.currentUser?.uid);

        // If the trip status is set to a specific game by the host, redirect all players
        if (data.status.startsWith('playing-')) {
          const gameType = data.status.replace('playing-', '');
          router.push(`/games/${gameType}?roomCode=${roomCode}`);
        }
      }
      setLoading(false);
    });

    return () => unsub();
  }, [roomCode, router]);

  const handleSelectGame = async (gameId: string, path: string) => {
    if (!isHost) return;
    
    // Update trip status to the selected game
    await updateDoc(doc(db, "trips", roomCode as string), {
      status: `playing-${gameId}`,
      currentGameId: gameId,
      gameStartedAt: new Date().toISOString()
    });
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin w-10 h-10 text-indigo-600" /></div>;

  return (
    <main className="min-h-screen bg-slate-50 p-6 flex flex-col max-w-md mx-auto">
      <div className="flex items-center justify-between mb-8">
        <button onClick={() => router.push(`/lobby?roomCode=${roomCode}`)} className="p-2 -ml-2 text-slate-500">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-2xl font-black text-slate-900">Select Game</h1>
        <div className="w-10" />
      </div>

      {!isHost && (
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-2xl mb-6 flex items-center gap-3">
          <div className="animate-bounce">👑</div>
          <p className="text-sm font-bold text-yellow-800 leading-tight">
            The Host is picking a game for everyone...
          </p>
        </div>
      )}

      <div className="flex-1 space-y-4">
        {GAMES.map((game) => (
          <GameCard
            key={game.id}
            {...game}
            disabled={!isHost}
            onClick={() => handleSelectGame(game.id, game.path)}
          />
        ))}
      </div>

      <div className="mt-8 text-center">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
          {trip?.tripName}
        </p>
      </div>
    </main>
  );
}

export default function GamesSelection() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin w-10 h-10 text-indigo-600" /></div>}>
      <GamesContent />
    </Suspense>
  );
}
