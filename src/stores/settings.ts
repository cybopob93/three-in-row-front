import { defineStore } from "pinia";
import type { Settings } from "@/models/three-in-row/settings.d";
import { GameDifficulty, getGameFieldSize } from "@/models/three-in-row/settings.d";

interface IState {
  settings: Settings;
}

export const useSettingsStore = defineStore({
  id: "gameSettings",
  state: (): IState => ({
    settings: {
      difficulty: GameDifficulty.EASY,
      ...getGameFieldSize(GameDifficulty.EASY),
    },
  }),
  getters: {
    gameDifficulty: state => state.settings.difficulty,
  },
  actions: {
    updateGameDifficult(difficulty: GameDifficulty) {
      this.settings = {
        difficulty: difficulty,
        ...getGameFieldSize(difficulty),
      };
    },
  },
});
