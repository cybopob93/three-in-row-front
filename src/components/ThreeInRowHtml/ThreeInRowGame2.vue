<script lang="ts">
import ThreeInRow from "@/core/ThreeInRowHTML/ThreeInRow";

export default {
  setup() {
    const game = new ThreeInRow({
      value: 5,
      name: "Easy",
      countRows: 5,
      countColumns: 5,
    });

    return {
      game,
      isDisabled: game.isFullyDisabled,
    };
  },
};
</script>

<template>
  <section
    class="game"
    :class="{ game__disabled: isDisabled }"
    :style="{
      height: game.settings.countRows * 50 + 'px',
      width: game.settings.countColumns * 50 + 'px',
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
        '--drop': item.isDrop,
      }"
      :style="{
        background: `var(${item.color})`,
        left: item.position.x,
        top: item.position.y,
        '--move-to-x': item.moveTo.x,
        '--move-to-y': item.moveTo.y,
      }"
      @click="game.itemPick(item.id)"
    ></button>
  </section>
</template>

<style lang="scss" scoped>
@import "./ThreeInRowGame2.scss";
</style>
