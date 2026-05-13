import { db } from "./firebase";
import { doc, updateDoc, increment, collection, addDoc, serverTimestamp } from "firebase/firestore";

export const addPoints = async (tripId: string, playerId: string, points: number, reason: string) => {
  try {
    // Update player's total score
    const playerRef = doc(db, `players`, playerId);
    await updateDoc(playerRef, {
      totalScore: increment(points)
    });

    // Log the score entry
    await addDoc(collection(db, "scores"), {
      tripId,
      playerId,
      points,
      reason,
      createdAt: serverTimestamp()
    });
  } catch (error) {
    console.error("Error adding points:", error);
  }
};
