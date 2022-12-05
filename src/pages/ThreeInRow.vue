<script setup lang="ts">
import { computed, reactive } from "vue";
import GameScene from "@/components/ThreeInRowHtml/GameScene/GameScene.vue";
import { UiStates } from "@/models/ui.d";
import StartScene from "@/components/ThreeInRowHtml/StartScene.vue";
import BasePageTitle from "@/components/Base/BasePageTitle.vue";
import SettingScene from "@/components/ThreeInRowHtml/SettingScene.vue";

const state: {
  gameState: UiStates;
} = reactive({
  gameState: UiStates.START,
});

const isGameStarted = computed(() => {
  return state.gameState === UiStates.PLAY;
});

const isSettingsOpened = computed(() => {
  return state.gameState === UiStates.SETTINGS;
});

const isGameInitState = computed(() => {
  return state.gameState === UiStates.START;
});

function changeGameState(newState: UiStates) {
  state.gameState = newState;
}
</script>

<template>
  <base-page-title>Three in row (html version)</base-page-title>
  <start-scene v-if="isGameInitState" @update-game-scene="changeGameState" />
  <setting-scene v-if="isSettingsOpened" @update-game-scene="changeGameState" />
  <div v-if="isGameStarted" class="three-in-row-view">
    <game-scene />
  </div>
</template>

<style lang="scss" scoped>
.three-in-row-view {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
}
</style>
