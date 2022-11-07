<script lang="ts">
import ThreeInRow from "@/core/ThreeInRowHTML/ThreeInRow";

export default {
  setup() {
    const game = new ThreeInRow({
      value: 5,
      name: "Easy",
      countRows: 15,
      countColumns: 15,
    });

    return {
      game,
    };
  },
};
</script>

<template>
  <section
    class="game"
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
      @click="game.itemClick(item.id)"
    ></button>
  </section>
</template>

<style lang="scss" scoped>
@import "./ThreeInRowGame2.scss";
</style>
