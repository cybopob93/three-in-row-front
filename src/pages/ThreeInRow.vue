<script setup lang="ts">
import { computed, reactive, nextTick } from "vue";
import type { Settings } from "@/models/three-in-row/settings";
import ThreeInRowGame from "@/components/ThreeInRowHtml/ThreeInRowGame.vue";
import BaseButton from "@/components/Base/BaseButton.vue";

const gameDifficulty: Array<Settings> = [
  {
    value: 5,
    name: "Easy",
    countRows: 5,
    countLines: 5,
  },
  {
    value: 7,
    name: "Medium",
    countRows: 7,
    countLines: 7,
  },
  {
    value: 10,
    name: "Hard",
    countRows: 10,
    countLines: 10,
  },
];

const state: {
  gameState: string,
  settings: Settings,
  useTimer: boolean,
} = reactive({
  gameState: "idle",
  settings: {
    value: 5,
    name: "Easy",
    countRows: 5,
    countLines: 5,
  },
  useTimer: false,
});

const isGameStarted = computed(() => {
  return state.gameState === "play";
})

const isSettingsOpened = computed(() => {
  return state.gameState === "settings";
})

const isGameInitState = computed(() => {
  return state.gameState === "idle";
})

function pickGameDifficulty(difficulty: Settings) {
  state.settings = difficulty;
}

async function reset() {
  state.gameState= 'idle';
  await nextTick();
  state.gameState= 'play';
}
</script>

<template>
  <h1 class="page-title page-title--h1">Three in row (html version)</h1>
  <section class="three-in-row-view">
    <BaseButton @click="reset">Reset</BaseButton>
    <div v-if="isGameInitState" class="three-in-row-view--init">
      <BaseButton @click="state.gameState='play'">Start game</BaseButton>
      <a href="#" @click="state.gameState='settings'">Settings</a>
    </div>
    <div v-if="isSettingsOpened">
      <button @click="state.gameState = 'idle'">Back to menu</button>
      <div>
        <div>
          <label for="setTimer">Run timer (if is on, results will be saved in lead table)</label>
          <input type="checkbox" id="setTimer" v-model="state.useTimer">
        </div>
        <h2>Game difficult:</h2>
        <div v-for="variant in gameDifficulty" :key="variant.name">
          <label :for="variant.name">{{ variant.name }}</label>
          <input type="radio" :id="variant.name" :checked="variant.value === state.settings.value" @input="pickGameDifficulty(variant)">
        </div>
      </div>
    </div>
    <three-in-row-game v-if="isGameStarted"></three-in-row-game>
  </section>
</template>

<style lang="scss" scoped>
.three-in-row-view {
  &--init {
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
  }
}
</style>