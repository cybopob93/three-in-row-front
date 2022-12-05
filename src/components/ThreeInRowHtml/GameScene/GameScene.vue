<script lang="ts">
import ThreeInRow from "@/core/ThreeInRowHTML/ThreeInRow";
import { useSettingsStore } from "@/stores/settings";

export default {
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
    <button
      v-for="item in game.items"
      :key="item.id"
      class="game__field"
      :class="{
        '--active': item.isPicked,
        '--error': item.isErrorState,
        '--move': item.isMoveState,
        '--clear': item.isReadyToClear,
      }"
      :style="{
        background: `var(${item.color})`,
        left: item.position.x,
        top: item.position.y,
        '--move-to-x': item.moveTo.x,
        '--move-to-y': item.moveTo.y,
        '--field-size': gameFieldSize - 10 + 'px',
      }"
      @click="game.itemPick(item.id)"
    ></button>
  </section>
</template>

<style lang="scss" scoped>
@import "GameScene";
</style>
