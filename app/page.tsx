import React from 'react';
import Link from 'next/link';
import { Users, PlusCircle } from 'lucide-react';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex flex-col items-center justify-center p-6 text-white">
      <div className="w-full max-w-md text-center space-y-8 animate-in fade-in zoom-in duration-700">
        <div className="space-y-2">
          <h1 className="text-5xl font-black tracking-tight drop-shadow-xl">
            Family Trip<br />
            <span className="text-yellow-400">Games Hub</span>
          </h1>
          <p className="text-lg font-medium opacity-90">
            Private rooms for 15 family members.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <Link 
            href="/create-room"
            className="group relative flex items-center justify-center gap-3 bg-white text-purple-600 font-bold py-5 px-8 rounded-2xl shadow-xl transition-all hover:scale-105 active:scale-95"
          >
            <PlusCircle className="w-6 h-6" />
            <span className="text-xl">Create Trip Room</span>
          </Link>

          <Link 
            href="/join-room"
            className="group relative flex items-center justify-center gap-3 bg-white/20 border-2 border-white/30 backdrop-blur-md text-white font-bold py-5 px-8 rounded-2xl shadow-xl transition-all hover:bg-white/30 hover:scale-105 active:scale-95"
          >
            <Users className="w-6 h-6" />
            <span className="text-xl">Join with Code</span>
          </Link>
        </div>

        <div className="pt-8">
          <p className="text-xs opacity-60 uppercase tracking-widest font-bold">
            Realtime Leaderboard • 5 Fun Games
          </p>
        </div>
      </div>
    </main>
  );
}
