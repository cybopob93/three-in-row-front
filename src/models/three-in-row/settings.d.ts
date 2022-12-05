export enum GameDifficulty {
  EASY,
  MEDIUM,
  HARD,
}

export interface Settings {
  difficulty: GameDifficulty;
  countRows: number;
  countColumns: number;
}

export function getGameFieldSize(difficulty: GameDifficulty): Pick<Settings, "countRows" | "countColumns"> {
  switch (difficulty) {
    case GameDifficulty.HARD:
      return {
        countRows: 7,
        countColumns: 7,
      };
    case GameDifficulty.MEDIUM:
      return {
        countRows: 6,
        countColumns: 6,
      };
    default:
      return {
        countRows: 5,
        countColumns: 5,
      };
  }
}
