export const AVATARS = [
  '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵'
];

export const MAX_PLAYERS = 15;
export const MIN_PLAYERS = 2;

export const GAME_TYPES = {
  QUIZ: 'quiz',
  POLL: 'poll',
  TRUTH_DARE: 'truth-dare',
  SPIN_WHEEL: 'spin-wheel',
  MEMORY: 'memory'
} as const;

export const GAME_STATUS = {
  LOBBY: 'lobby',
  STARTING: 'starting',
  IN_PROGRESS: 'in-progress',
  ENDED: 'ended'
} as const;
