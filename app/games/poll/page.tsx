"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { doc, onSnapshot, updateDoc, collection, query, where, getDocs, setDoc, serverTimestamp } from 'firebase/firestore';
import { FAMILY_POLLS } from '@/data/samplePolls';
import { ArrowLeft, Loader2, BarChart3 } from 'lucide-react';
import { addPoints } from '@/lib/scoring';

function PollGameContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomCode = searchParams.get('roomCode');
  const [isHost, setIsHost] = useState(false);
  const [gameState, setGameState] = useState<any>(null);
  const [players, setPlayers] = useState<any[]>([]);
  const [hasVoted, setHasVoted] = useState(false);
  const [results, setResults] = useState<{name: string, votes: number}[]>([]);

  useEffect(() => {
    if (!roomCode) return;
    
    const unsubTrip = onSnapshot(doc(db, "trips", roomCode), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setIsHost(data.hostId === auth.currentUser?.uid);
      }
    });

    const unsubGame = onSnapshot(doc(db, "games", `${roomCode}_poll`), async (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setGameState(data);
        
        // Calculate results if showResults is true
        if (data.showResults) {
          const answersSnap = await getDocs(query(collection(db, "answers"), where("gameId", "==", `${roomCode}_poll_${data.currentRound}`)));
          const voteCounts: Record<string, number> = {};
          answersSnap.docs.forEach(d => {
            const vote = d.data().selectedAnswer;
            voteCounts[vote] = (voteCounts[vote] || 0) + 1;
          });
          
          const sortedResults = Object.keys(voteCounts).map(name => ({
            name,
            votes: voteCounts[name]
          })).sort((a, b) => b.votes - a.votes);
          
          setResults(sortedResults);
        }
      } else if (isHost) {
        setDoc(doc(db, "games", `${roomCode}_poll`), {
          currentRound: 0,
          showResults: false
        });
      }
    });

    const unsubPlayers = onSnapshot(query(collection(db, "players"), where("tripId", "==", roomCode)), (snap) => {
      setPlayers(snap.docs.map(d => d.data()));
    });

    return () => {
      unsubTrip();
      unsubGame();
      unsubPlayers();
    };
  }, [roomCode, isHost]);

  useEffect(() => {
    setHasVoted(false);
    setResults([]);
  }, [gameState?.currentRound]);

  const handleVote = async (name: string) => {
    if (hasVoted) return;
    setHasVoted(true);
    
    await setDoc(doc(db, "answers", `${roomCode}_poll_${gameState.currentRound}_${auth.currentUser?.uid}`), {
      gameId: `${roomCode}_poll_${gameState.currentRound}`,
      selectedAnswer: name,
      submittedAt: serverTimestamp()
    });
  };

  const nextRound = async () => {
    if (!isHost) return;
    await updateDoc(doc(db, "games", `${roomCode}_poll`), {
      currentRound: gameState.currentRound + 1,
      showResults: false
    });
  };

  const showPollResults = async () => {
    if (!isHost) return;
    await updateDoc(doc(db, "games", `${roomCode}_poll`), {
      showResults: true
    });
  };

  if (!gameState || players.length === 0) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin w-10 h-10 text-indigo-600" /></div>;

  const currentPoll = FAMILY_POLLS[gameState.currentRound % FAMILY_POLLS.length];

  return (
    <main className="min-h-screen bg-slate-50 p-6 flex flex-col items-center max-w-md mx-auto text-center">
      <div className="w-full flex items-center justify-between mb-8">
        <button onClick={() => router.push(`/games?roomCode=${roomCode}`)} className="p-2 -ml-2 text-slate-500">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-2xl font-black text-slate-900">Family Poll</h1>
        <div className="w-10" />
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 w-full mb-8">
        <h2 className="text-2xl font-black text-slate-800 leading-tight">
          {currentPoll}
        </h2>
      </div>

      {gameState.showResults ? (
        <div className="w-full flex-1 flex flex-col gap-3">
          <h3 className="font-bold text-slate-400 uppercase tracking-widest text-sm mb-2 flex items-center justify-center gap-2">
            <BarChart3 className="w-4 h-4" /> Results
          </h3>
          {results.map((r, i) => (
            <div key={r.name} className="bg-white p-4 rounded-2xl flex items-center justify-between shadow-sm border-2 border-slate-50">
              <span className="font-bold text-lg flex items-center gap-2">
                {i === 0 && <span className="text-2xl">👑</span>} {r.name}
              </span>
              <span className="bg-indigo-100 text-indigo-700 font-black px-3 py-1 rounded-lg">
                {r.votes} {r.votes === 1 ? 'vote' : 'votes'}
              </span>
            </div>
          ))}
          {results.length === 0 && <p className="text-slate-400 font-medium">No one voted!</p>}
        </div>
      ) : (
        <div className="w-full flex-1 flex flex-col gap-3">
          {players.map(p => (
            <button
              key={p.playerId}
              disabled={hasVoted}
              onClick={() => handleVote(p.name)}
              className={`w-full p-4 rounded-2xl font-bold text-lg transition-all ${
                hasVoted 
                  ? 'bg-slate-100 text-slate-400' 
                  : 'bg-white text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 border-2 border-slate-100'
              }`}
            >
              {p.name}
            </button>
          ))}
          {hasVoted && <p className="text-indigo-600 font-bold mt-4 animate-pulse">Waiting for others...</p>}
        </div>
      )}

      {isHost && (
        <div className="w-full mt-8 flex flex-col gap-3">
          {!gameState.showResults ? (
            <button onClick={showPollResults} className="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl">
              Show Results
            </button>
          ) : (
            <button onClick={nextRound} className="w-full bg-emerald-600 text-white font-black py-4 rounded-2xl">
              Next Poll
            </button>
          )}
        </div>
      )}
    </main>
  );
}

export default function PollGame() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin w-10 h-10 text-indigo-600" /></div>}>
      <PollGameContent />
    </Suspense>
  );
}
