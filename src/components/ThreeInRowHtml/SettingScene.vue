<script lang="ts" setup>
import BaseButton from "@/components/Base/BaseButton.vue";
import { UiStates } from "@/models/ui.d";
import { computed } from "vue";
import { Settings } from "@/models/three-in-row/settings";

const gameDifficulty: Array<Settings> = [
  {
    value: 5,
    name: "Easy",
    countRows: 5,
    countColumns: 5,
  },
  {
    value: 7,
    name: "Medium",
    countRows: 7,
    countColumns: 7,
  },
  {
    value: 10,
    name: "Hard",
    countRows: 10,
    countColumns: 10,
  },
];

const emit = defineEmits<{
  (e: "updateGameScene", value: UiStates): void;
}>();

const uiStatuses = computed(() => UiStates);

const saveSettings = () => {
  console.log("setup settings to store");
  emit("updateGameScene", UiStates.START);
};
</script>

<template>
  <div class="setting-scene">
    <div>
      <h2>Game difficult:</h2>
      <div v-for="variant in gameDifficulty" :key="variant.name">
        <label :for="variant.name">{{ variant.name }}</label>
        <input :id="variant.name" type="radio" />
      </div>
    </div>
    <base-button @click="saveSettings">Save settings</base-button>
    <button @click="$emit('updateGameScene', uiStatuses.START)">Back to menu</button>
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
