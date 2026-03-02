export interface RewardState {
  totalPoints: number;
  chaptersCompletedToday: number;
  lastActivityDate: string;
}

export interface RewardEvent {
  type: 'points_earned' | 'milestone' | 'break_time';
  points?: number;
  message: string;
  encouragement?: string;
}

const POINTS_PER_CHAPTER = 10;
const MILESTONE_BONUS = 25;
const MILESTONE_THRESHOLD = 2;

const encouragements = [
  "You're doing amazing! Keep it up!",
  "Excellent work! Your dedication is inspiring!",
  "Fantastic progress! You're on fire today!",
  "Great job! Every chapter brings you closer to success!",
  "Wonderful effort! Your hard work will pay off!",
  "Superb! You're mastering this material!",
  "Outstanding! Keep pushing forward!",
  "Brilliant work! Stay focused and keep going!",
];

const breakMessages = [
  "You've earned a break! Take 10-15 minutes to rest your mind.",
  "Great milestone! Time for a short break - stretch, hydrate, and relax!",
  "Amazing progress! Reward yourself with a quick break.",
  "Well done! Take a breather - you've earned it!",
  "Excellent work! Step away for a few minutes to recharge.",
];

const milestoneRewards = [
  "Grab a healthy snack!",
  "Take a walk outside!",
  "Listen to your favorite song!",
  "Do some stretches!",
  "Get some fresh air!",
  "Have a refreshing drink!",
];

export function getRandomEncouragement(): string {
  return encouragements[Math.floor(Math.random() * encouragements.length)];
}

export function getRandomBreakMessage(): string {
  return breakMessages[Math.floor(Math.random() * breakMessages.length)];
}

export function getRandomReward(): string {
  return milestoneRewards[Math.floor(Math.random() * milestoneRewards.length)];
}

export function calculateReward(
  currentState: RewardState,
  taskCompleted: boolean
): { newState: RewardState; event: RewardEvent | null } {
  const today = new Date().toISOString().split('T')[0];
  const isNewDay = currentState.lastActivityDate !== today;

  let chaptersToday = isNewDay ? 0 : currentState.chaptersCompletedToday;
  let totalPoints = currentState.totalPoints;
  let event: RewardEvent | null = null;

  if (taskCompleted) {
    chaptersToday += 1;
    totalPoints += POINTS_PER_CHAPTER;

    if (chaptersToday === MILESTONE_THRESHOLD || chaptersToday === 3) {
      totalPoints += MILESTONE_BONUS;
      event = {
        type: 'break_time',
        points: POINTS_PER_CHAPTER + MILESTONE_BONUS,
        message: getRandomBreakMessage(),
        encouragement: `+${POINTS_PER_CHAPTER + MILESTONE_BONUS} points! ${getRandomReward()}`,
      };
    } else {
      event = {
        type: 'points_earned',
        points: POINTS_PER_CHAPTER,
        message: getRandomEncouragement(),
      };
    }
  }

  return {
    newState: {
      totalPoints,
      chaptersCompletedToday: chaptersToday,
      lastActivityDate: today,
    },
    event,
  };
}
