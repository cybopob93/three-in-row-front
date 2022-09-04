<script setup lang="ts">
import { onBeforeMount, reactive } from "vue";
import type { Settings } from "@/models/three-in-row/settings";

const state: {
  useTimer: boolean,
  gameField: Array<Array<string>>
} = reactive({
  useTimer: false,
  gameField: [],
});

const settings: Settings = reactive({
  value: 5,
  name: "Easy",
  countRows: 5,
  countLines: 5,
});

onBeforeMount(() => {
  const colors = ["red", "aqua", "forestgreen", "bisque", "cornflowerblue"];
  for (let line = 0; line < settings.countLines; line++) {
    const lineItem = [];
    for (let row = 0; row < settings.countRows; row++) {
      lineItem.push(colors[Math.floor(Math.random()*colors.length)])
    }
    state.gameField.push(lineItem);
  }
});
</script>

<template>
  <section class="game">
    <div v-for="(line, lineNumber) in state.gameField" :key="`line-${lineNumber}`" class="game--line">
      <div
        v-for="(color, rowNumber) in line"
        :key="`row-${rowNumber}`"
        class="game--row"
        :style="{background: color}"
      >
        {{ lineNumber }} - {{ rowNumber }}
      </div>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.game {
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;

  &--line {
    display: flex;
    flex-direction: column;
    min-height: 20px;
  }

  &--row {
    height: 40px;
    width: 40px;
    margin: 2px;
    border: 1px solid;
  }
}
</style>