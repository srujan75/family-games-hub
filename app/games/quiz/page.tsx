"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { doc, onSnapshot, updateDoc, collection, query, where, getDocs, setDoc, serverTimestamp } from 'firebase/firestore';
import { GK_QUIZ_QUESTIONS } from '@/data/sampleQuestions';
import { QuestionCard } from '@/components/QuestionCard';
import { Timer } from '@/components/Timer';
import { addPoints } from '@/lib/scoring';
import { Loader2, ArrowLeft, Trophy } from 'lucide-react';
import confetti from 'canvas-confetti';

function GeneralKnowledgeQuizContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomCode = searchParams.get('roomCode');
  
  const [trip, setTrip] = useState<any>(null);
  const [gameState, setGameState] = useState<any>(null);
  const [players, setPlayers] = useState<any[]>([]);
  const [isHost, setIsHost] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  useEffect(() => {
    if (!roomCode) return;

    // 1. Listen to Trip
    const unsubTrip = onSnapshot(doc(db, "trips", roomCode), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setTrip(data);
        setIsHost(data.hostId === auth.currentUser?.uid);
      }
    });

    // 2. Listen to Game State (Shared for all players)
    const unsubGame = onSnapshot(doc(db, "games", `${roomCode}_quiz`), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setGameState(data);
        if (data.status === 'ended') {
          confetti();
        }
      } else if (isHost) {
        // Initialize game if host
        setDoc(doc(db, "games", `${roomCode}_quiz`), {
          tripId: roomCode,
          gameType: 'quiz',
          status: 'in-progress',
          currentRound: 0,
          startedAt: serverTimestamp()
        });
      }
    });

    // 3. Listen to Players
    const unsubPlayers = onSnapshot(query(collection(db, "players"), where("tripId", "==", roomCode)), (snap) => {
      setPlayers(snap.docs.map(d => d.data()));
    });

    setLoading(false);
    return () => {
      unsubTrip();
      unsubGame();
      unsubPlayers();
    };
  }, [roomCode, isHost]);

  useEffect(() => {
    setHasSubmitted(false);
    setSelectedAnswer(null);
  }, [gameState?.currentRound]);

  const currentQuestion = GK_QUIZ_QUESTIONS[gameState?.currentRound || 0];
  const options = currentQuestion?.options || [];

  const handleSelect = async (answer: string) => {
    if (hasSubmitted || !gameState) return;
    setSelectedAnswer(answer);
    setHasSubmitted(true);

    // Save answer to Firestore
    const answerId = `${roomCode}_quiz_${gameState.currentRound}_${auth.currentUser?.uid}`;
    await setDoc(doc(db, "answers", answerId), {
      gameId: `${roomCode}_quiz`,
      questionId: gameState.currentRound,
      playerId: auth.currentUser?.uid,
      selectedAnswer: answer,
      isCorrect: answer === currentQuestion.correctAnswer,
      submittedAt: serverTimestamp()
    });

    if (answer === currentQuestion.correctAnswer) {
      await addPoints(roomCode as string, auth.currentUser?.uid as string, 10, "Correct Answer in GK Quiz");
    }
  };

  const nextQuestion = async () => {
    if (!isHost || !gameState) return;
    
    if (gameState.currentRound < GK_QUIZ_QUESTIONS.length - 1) {
      await updateDoc(doc(db, "games", `${roomCode}_quiz`), {
        currentRound: gameState.currentRound + 1
      });
      setHasSubmitted(false);
      setSelectedAnswer(null);
    } else {
      await updateDoc(doc(db, "games", `${roomCode}_quiz`), {
        status: 'ended'
      });
      await updateDoc(doc(db, "trips", roomCode as string), {
        status: 'lobby'
      });
    }
  };

  if (loading || !gameState) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin w-10 h-10 text-indigo-600" /></div>;

  if (gameState.status === 'ended') {
    return (
      <main className="min-h-screen bg-slate-50 p-6 flex flex-col items-center justify-center max-w-md mx-auto text-center">
        <Trophy className="w-20 h-20 text-yellow-500 mb-4" />
        <h1 className="text-4xl font-black text-slate-900 mb-2">Quiz Finished!</h1>
        <p className="text-slate-500 mb-8 font-medium">Great job everyone. Check the leaderboard for total scores!</p>
        <button 
          onClick={() => router.push(`/leaderboard?roomCode=${roomCode}`)}
          className="w-full bg-indigo-600 text-white font-black py-5 rounded-2xl shadow-xl shadow-indigo-100"
        >
          See Leaderboard
        </button>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6 flex flex-col max-w-md mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <span className="text-xs font-black bg-slate-200 text-slate-600 px-3 py-1 rounded-full uppercase">
            Round {gameState.currentRound + 1}
          </span>
        </div>
        <Timer seconds={15} onEnd={() => {}} key={gameState.currentRound} />
      </div>

      <div className="flex-1">
        <QuestionCard
          question={currentQuestion.text}
          options={options}
          onSelect={handleSelect}
          selectedAnswer={selectedAnswer || undefined}
          disabled={hasSubmitted}
          correctAnswer={currentQuestion.correctAnswer}
          showResults={hasSubmitted}
        />
        
        {hasSubmitted && !isHost && (
          <div className="mt-8 text-center animate-pulse">
            <p className="font-bold text-slate-400">Waiting for others...</p>
          </div>
        )}
      </div>

      {isHost && (
        <button
          onClick={nextQuestion}
          className="w-full bg-emerald-600 text-white font-black py-5 rounded-2xl shadow-xl shadow-emerald-200 mt-8"
        >
          {gameState.currentRound < GK_QUIZ_QUESTIONS.length - 1 ? 'Next Question' : 'Finish Quiz'}
        </button>
      )}
    </main>
  );
}

export default function FamilyQuiz() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin w-10 h-10 text-indigo-600" /></div>}>
      <GeneralKnowledgeQuizContent />
    </Suspense>
  );
}
