"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { signInAnonymously } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { AVATARS, MAX_PLAYERS } from '@/lib/gameConstants';
import { AvatarSelector } from '@/components/AvatarSelector';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function JoinRoom() {
  const router = useRouter();
  const [roomCode, setRoomCode] = useState('');
  const [name, setName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[1]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomCode || !name || loading) return;
    setError('');
    setLoading(true);

    try {
      const code = roomCode.toUpperCase();
      
      // 1. Check if Trip exists
      const tripRef = doc(db, "trips", code);
      const tripSnap = await getDoc(tripRef);

      if (!tripSnap.exists()) {
        setError("Invalid Room Code! Please check with the host.");
        setLoading(false);
        return;
      }

      // 2. Check Player Count
      const playersQuery = query(collection(db, "players"), where("tripId", "==", code));
      const playersSnap = await getDocs(playersQuery);
      
      if (playersSnap.size >= MAX_PLAYERS) {
        setError(`Room is full! Max ${MAX_PLAYERS} players allowed.`);
        setLoading(false);
        return;
      }

      // 3. Check for Duplicate Name
      const duplicate = playersSnap.docs.find(doc => doc.data().name.toLowerCase() === name.toLowerCase());
      if (duplicate) {
        setError("This name is already taken in this room.");
        setLoading(false);
        return;
      }

      // 4. Join
      const userCredential = await signInAnonymously(auth);
      const playerId = userCredential.user.uid;

      await setDoc(doc(db, "players", playerId), {
        playerId,
        tripId: code,
        name,
        avatar: selectedAvatar,
        isHost: false,
        totalScore: 0,
        joinedAt: serverTimestamp(),
      });

      router.push(`/lobby/${code}`);
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 p-6 flex flex-col max-w-md mx-auto">
      <Link href="/" className="mb-6 flex items-center gap-2 text-slate-500 font-bold hover:text-indigo-600 transition-colors">
        <ArrowLeft className="w-5 h-5" /> Back
      </Link>

      <h1 className="text-3xl font-black text-slate-900 mb-8">Join the Fun</h1>

      <form onSubmit={handleJoin} className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">Room Code</label>
          <input
            required
            type="text"
            placeholder="Enter 6-digit code"
            maxLength={6}
            className="w-full p-4 bg-white border-2 border-slate-200 rounded-2xl focus:border-indigo-500 outline-none transition-all font-black text-2xl tracking-[0.5em] text-center uppercase text-slate-900 placeholder:text-slate-400"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">Your Name</label>
          <input
            required
            type="text"
            placeholder="e.g. Grandma, Junior"
            className="w-full p-4 bg-white border-2 border-slate-200 rounded-2xl focus:border-indigo-500 outline-none transition-all font-medium text-lg text-slate-900 placeholder:text-slate-400"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">Pick Your Avatar</label>
          <AvatarSelector selectedAvatar={selectedAvatar} onSelect={setSelectedAvatar} />
        </div>

        {error && (
          <div className="flex items-center gap-2 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-bold border border-red-100">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-emerald-600 text-white font-black py-5 rounded-2xl shadow-xl shadow-emerald-200 hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 text-xl"
        >
          {loading ? <Loader2 className="animate-spin" /> : 'Join Room'}
        </button>
      </form>
    </main>
  );
}
