<script lang="ts" setup>
import BaseButton from "@/components/Base/BaseButton.vue";
import { UiStates } from "@/models/ui.d";
import { computed, ref } from "vue";
import { GameDifficulty } from "@/models/three-in-row/settings.d";
import { useSettingsStore } from "@/stores/settings";

const gameDifficultyVariants: Array<{ value: GameDifficulty; name: string }> = [
  {
    value: GameDifficulty.EASY,
    name: "Easy",
  },
  {
    value: GameDifficulty.MEDIUM,
    name: "Medium",
  },
  {
    value: GameDifficulty.HARD,
    name: "Hard",
  },
];

const settingsStore = useSettingsStore();
const gameDifficulty = ref<GameDifficulty>(settingsStore.settings.difficulty);

const emit = defineEmits<{
  (e: "updateGameScene", value: UiStates): void;
}>();

const uiStatuses = computed(() => UiStates);

const saveSettings = () => {
  settingsStore.updateGameDifficult(gameDifficulty.value);
  emit("updateGameScene", UiStates.START);
};
</script>

<template>
  <div class="setting-scene">
    <div>
      <h2>Game difficult:</h2>
      <div v-for="variant in gameDifficultyVariants" :key="variant.name">
        <label :for="variant.name">{{ variant.name }}</label>
        <input
          :id="variant.name"
          type="radio"
          :value="variant.value"
          :checked="gameDifficulty === variant.value"
          @change="gameDifficulty = variant.value"
        />
      </div>
    </div>
    <base-button @click="saveSettings">Save settings</base-button>
    <a href="#" @click="$emit('updateGameScene', uiStatuses.START)">Back to menu</a>
  </div>
</template>

<style scoped lang="scss">
.setting-scene {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
}
</style>
