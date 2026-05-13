"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { doc, onSnapshot, collection, query, where, updateDoc } from 'firebase/firestore';
import { PlayerCard } from '@/components/PlayerCard';
import { MAX_PLAYERS, MIN_PLAYERS } from '@/lib/gameConstants';
import { Loader2, Play, Users, Trophy } from 'lucide-react';

export default function Lobby() {
  const { roomCode } = useParams();
  const router = useRouter();
  const [trip, setTrip] = useState<any>(null);
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isHost, setIsHost] = useState(false);

  useEffect(() => {
    if (!roomCode) return;

    // 1. Listen to Trip
    const unsubTrip = onSnapshot(doc(db, "trips", roomCode as string), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setTrip(data);
        setIsHost(data.hostId === auth.currentUser?.uid);
        
        // If status changes from lobby, redirect based on status
        if (data.status === 'game-selection') {
          router.push(`/games?roomCode=${roomCode}`);
        } else if (data.status !== 'lobby') {
           // Handle other redirects if needed
        }
      } else {
        router.push('/');
      }
      setLoading(false);
    });

    // 2. Listen to Players
    const q = query(collection(db, "players"), where("tripId", "==", roomCode));
    const unsubPlayers = onSnapshot(q, (snapshot) => {
      const playersList = snapshot.docs.map(doc => doc.data());
      setPlayers(playersList);
    });

    return () => {
      unsubTrip();
      unsubPlayers();
    };
  }, [roomCode, router]);

  const handleStart = async () => {
    if (!isHost) return;
    await updateDoc(doc(db, "trips", roomCode as string), {
      status: 'game-selection'
    });
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin w-10 h-10 text-indigo-600" /></div>;

  return (
    <main className="min-h-screen bg-slate-50 p-6 flex flex-col max-w-md mx-auto">
      <div className="bg-indigo-600 rounded-3xl p-6 text-white shadow-xl shadow-indigo-100 mb-8 relative overflow-hidden">
        <div className="relative z-10">
          <p className="text-indigo-100 font-bold uppercase tracking-widest text-xs mb-1">Room Code</p>
          <h1 className="text-4xl font-black mb-4">{roomCode}</h1>
          <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md rounded-xl p-3">
            <Users className="w-5 h-5" />
            <span className="font-bold">{players.length} / {MAX_PLAYERS} Players</span>
          </div>
        </div>
        <div className="absolute -right-4 -bottom-4 text-white/10 rotate-12">
          <Users className="w-32 h-32" />
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto mb-8">
        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2 px-1">Family Members</h2>
        {players.sort((a, b) => b.joinedAt - a.joinedAt).map((player) => (
          <PlayerCard 
            key={player.playerId} 
            name={player.name} 
            avatar={player.avatar} 
            isHost={player.isHost} 
          />
        ))}
      </div>

      <div className="space-y-4">
        {isHost ? (
          <button
            onClick={handleStart}
            disabled={players.length < MIN_PLAYERS}
            className="w-full bg-emerald-600 text-white font-black py-5 rounded-2xl shadow-xl shadow-emerald-200 hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 text-xl disabled:opacity-50 disabled:grayscale"
          >
            <Play className="w-6 h-6 fill-current" />
            Start Trip Hub
          </button>
        ) : (
          <div className="bg-white p-4 rounded-2xl border-2 border-slate-100 text-center animate-pulse">
            <p className="font-bold text-slate-600">Waiting for the host to start...</p>
          </div>
        )}
        
        <button
          onClick={() => router.push(`/leaderboard/${roomCode}`)}
          className="w-full bg-white text-slate-700 font-bold py-4 rounded-2xl border-2 border-slate-200 hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
        >
          <Trophy className="w-5 h-5 text-yellow-500" />
          View Leaderboard
        </button>
      </div>
    </main>
  );
}
