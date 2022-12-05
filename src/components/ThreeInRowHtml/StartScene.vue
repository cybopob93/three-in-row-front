<script lang="ts">
import BaseButton from "@/components/Base/BaseButton.vue";
import { UiStates } from "@/core/ThreeInRowHTML/models/ui.d";

export default {
  components: { BaseButton },
  emits: ["updateGameScene"],
  computed: {
    UiStates() {
      return UiStates;
    },
  },
};
</script>

<template>
  <div class="start-scene">
    <BaseButton @click="$emit('updateGameScene', UiStates.PLAY)">Start game</BaseButton>
    <a href="#" @click="$emit('updateGameScene', UiStates.SETTINGS)">Settings</a>
  </div>
</template>

<style scoped lang="scss">
.start-scene {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
}
</style>
