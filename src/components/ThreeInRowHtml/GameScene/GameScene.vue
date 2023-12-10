<script lang="ts">
import ThreeInRow from "@/core/ThreeInRowHTML/ThreeInRow";
import { useSettingsStore } from "@/stores/settings";
import GameField from "@/components/ThreeInRowHtml/GameField/GameField.vue";
import BaseButton from "@/components/Base/BaseButton.vue";

export default {
  components: { BaseButton, GameField },
  setup() {
    const settingsStore = useSettingsStore();
    const game = new ThreeInRow(settingsStore.settings);

    return {
      game,
      isDisabled: game.isFullyDisabled,
      gameFieldSize: ThreeInRow.FIELD_SIZE,
    };
  },
};
</script>

<template>
  <section
    class="game"
    :class="{ game__disabled: isDisabled }"
    :style="{
      ...game.gameFieldSize,
    }"
  >
    <game-field v-for="item in game.items" :key="item.id" v-bind="item" @pick="id => game.itemPick(id)" />
  </section>
</template>

<style lang="scss" scoped>
@import "GameScene";
</style>
