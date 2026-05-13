"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { signInAnonymously } from 'firebase/auth';
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { generateRoomCode } from '@/lib/roomCodeGenerator';
import { AVATARS } from '@/lib/gameConstants';
import { AvatarSelector } from '@/components/AvatarSelector';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function CreateRoom() {
  const router = useRouter();
  const [tripName, setTripName] = useState('');
  const [hostName, setHostName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0]);
  const [loading, setLoading] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tripName || !hostName || loading) return;

    setLoading(true);
    try {
      // 1. Anon Auth
      const userCredential = await signInAnonymously(auth);
      const hostId = userCredential.user.uid;

      // 2. Generate Code
      const roomCode = generateRoomCode();

      // 3. Create Trip
      const tripRef = doc(db, "trips", roomCode);
      await setDoc(tripRef, {
        tripName,
        roomCode,
        hostId,
        status: 'lobby',
        createdAt: serverTimestamp(),
      });

      // 4. Create Host Player
      const playerRef = doc(db, "players", hostId);
      await setDoc(playerRef, {
        playerId: hostId,
        tripId: roomCode,
        name: hostName,
        avatar: selectedAvatar,
        isHost: true,
        totalScore: 0,
        joinedAt: serverTimestamp(),
      });

      router.push(`/lobby?roomCode=${roomCode}`);
    } catch (error) {
      console.error("Error creating room:", error);
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 p-6 flex flex-col max-w-md mx-auto">
      <Link href="/" className="mb-6 flex items-center gap-2 text-slate-500 font-bold hover:text-indigo-600 transition-colors">
        <ArrowLeft className="w-5 h-5" /> Back
      </Link>

      <h1 className="text-3xl font-black text-slate-900 mb-8">Start a Trip</h1>

      <form onSubmit={handleCreate} className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">Trip Name</label>
          <input
            required
            type="text"
            placeholder="e.g. Summer Vacation 2024"
            className="w-full p-4 bg-white border-2 border-slate-200 rounded-2xl focus:border-indigo-500 outline-none transition-all font-medium text-lg text-slate-900 placeholder:text-slate-400"
            value={tripName}
            onChange={(e) => setTripName(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">Your Name</label>
          <input
            required
            type="text"
            placeholder="e.g. Dad, Uncle Raj"
            className="w-full p-4 bg-white border-2 border-slate-200 rounded-2xl focus:border-indigo-500 outline-none transition-all font-medium text-lg text-slate-900 placeholder:text-slate-400"
            value={hostName}
            onChange={(e) => setHostName(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">Pick Your Avatar</label>
          <AvatarSelector selectedAvatar={selectedAvatar} onSelect={setSelectedAvatar} />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 text-white font-black py-5 rounded-2xl shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 text-xl"
        >
          {loading ? <Loader2 className="animate-spin" /> : 'Create Room'}
        </button>
      </form>
    </main>
  );
}
