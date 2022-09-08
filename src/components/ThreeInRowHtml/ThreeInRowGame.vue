<script setup lang="ts">
import { computed, onBeforeMount, reactive } from "vue";
import type { Settings } from "@/models/three-in-row/settings";
import type { Color, GameField } from "@/models/three-in-row/gameModels";

const state: {
  useTimer: boolean,
  gameField: Array<Array<GameField>>,
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

const isChoiceCompleted = computed(() => {
  let countPicked = 0;
  for (const row of state.gameField) {
    countPicked += row.filter(el => el.isPicked).length;
  }

  return countPicked >= 2
});

onBeforeMount(() => {
  state.gameField = new Array(settings.countLines)
  for (let row = 0; row < settings.countLines; row++) {
    state.gameField[row] = new Array(settings.countRows);
    for (let column = 0; column < settings.countRows; column++) {
      do {
        state.gameField[row][column] = {
          position: {
            x: row,
            y: column,
          },
          color: getRandomColor(),
          isErrorState: false,
          isPicked: false,
          isMoveState: false,
          moveTo: {
            x: "0px",
            y: "0px",
          },
        };
      } while (checkState(row, column))
    }
  }
});

function getRandomColor(): Color {
  const colors = [
    "--vt-c-indigo-mute",
    "--vt-c-dark",
    "--vt-c-indigo",
    "--vt-c-red-dark",
    "--vt-c-orange",
  ];
  const randomIndex = Math.floor(Math.random()*colors.length)
  return colors[randomIndex] as Color;
}

function checkState(row: number, column: number): boolean {
  return checkHorizontal(row, column) || checkVertical(row, column);
}

function checkHorizontal(row: number, column: number): boolean {
  let countOfSameColors = 1;
  let currentColor = state.gameField[row][column].color
  for (let cN = column - 1; cN >= 0; cN--) {
    if (currentColor === state.gameField[row][cN].color) {
      countOfSameColors++;
    } else {
      currentColor = state.gameField[row][cN].color;
      countOfSameColors = 1;
    }
    if (countOfSameColors > 2) {
      break;
    }
  }

  return countOfSameColors > 2;
}

function checkVertical(row: number, column: number): boolean {
  let countOfSameColors = 1;
  let currentColor = state.gameField[row][column].color;
  for (let rN = row - 1; rN >= 0; rN--) {
    if (currentColor === state.gameField[rN][column].color) {
      countOfSameColors++;
    } else {
      currentColor = state.gameField[rN][column].color;
      countOfSameColors = 1;
    }
    if (countOfSameColors > 2) {
      break;
    }
  }

  return countOfSameColors > 2;
}

async function pickBlock(element: GameField) {
  if (isChoiceCompleted.value) {
    return;
  }
  // pick on same element
  if (element.isPicked) {
    element.isPicked = false;
    return;
  }

  element.isPicked = true;

  if (!isChoiceCompleted.value) {
    return;
  }

  const fields: GameField[] = [];
  for (const row of state.gameField) {
    row.filter(el => el.isPicked).forEach(el => fields.push(el));
  }
  const [el1, el2] = fields;

  const hasErrorPick = await checkErrorPick(el1, el2);
  if (hasErrorPick) {
    return;
  }

  if (el1.position.x === el2.position.x) {
    el1.moveTo.y = "0px";
    el2.moveTo.y = "0px";
  } else if (el1.position.x > el2.position.x) {
    el1.moveTo.y = "-52px";
    el2.moveTo.y = "52px";
  } else if (el1.position.x < el2.position.x) {
    el1.moveTo.y = "52px";
    el2.moveTo.y = "-52px";
  }

  if (el1.position.y === el2.position.y) {
    el1.moveTo.x = "0px";
    el2.moveTo.x = "0px";
  } else if (el1.position.y > el2.position.y) {
    el1.moveTo.x = "-52px";
    el2.moveTo.x = "52px";
  } else if (el1.position.y < el2.position.y) {
    el1.moveTo.x = "52px";
    el2.moveTo.x = "-52px";
  }

  el1.isMoveState = true;
  el2.isMoveState = true;

  setTimeout(() => {
    let tmpColor = el1.color;
    el1.isMoveState = false;
    el1.isPicked = false;
    el2.isPicked = false;
    el2.isMoveState = false;
    el1.color = el2.color;
    el2.color = tmpColor;
  }, 1000);
}

async function checkErrorPick(el1: GameField, el2: GameField) {
  return new Promise(resolve => {
    if (
      el1.position.x === el2.position.x || el2.position.y === el1.position.y
    ) {
      resolve(false)
    } else {
      el1.isErrorState = true;
      el2.isErrorState = true;
      setTimeout(() => {
        el1.isErrorState = false;
        el2.isErrorState = false;
        el1.isPicked = false;
        el2.isPicked = false;
        resolve(true);
      }, 1100)
    }
  });
}
</script>

<template>
  <section class="game">
    <div v-for="(line, row) in state.gameField" :key="`line-${row}`" class="game--line">
      <div
        v-for="(element, column) in line"
        :key="`row-${column}`"
        class="game--row game__field"
        :class="{
          '--active': element.isPicked,
          '--error': element.isErrorState,
          '--move': element.isMoveState,
        }"
        :style="[
          `background: var(${element.color})`,
          `--move-to-x: ${element.moveTo.x}`,
          `--move-to-y: ${element.moveTo.y}`
        ]"
        :disabled="isChoiceCompleted"
        @click="pickBlock(element)"
      >
        {{ element.position.x }} - {{ element.position.y }}
      </div>
    </div>
  </section>
</template>

<style lang="scss" scoped>
@keyframes shuffleError {
  25% {transform: translateX(5%);}
  50% {transform: translateX(-5%);}
}

@keyframes swapFields {
  //100% { transform: translateX(var(--move-to-x)); }
  100% { transform: translate(var(--move-to-x), var(--move-to-y)); }
}

.game {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;

  &__field {
    transition: transform 0.3s;
    cursor: pointer;
    border: none;
  }

  &--line {
    display: flex;
    flex-direction: row;
    min-height: 20px;
  }

  &--row {
    height: 40px;
    width: 40px;
    margin: 6px;
  }

  & .--active {
    border-radius: 4px;
    border: 2px solid blueviolet;
    transform: scale(1.2);
  }

  .--active.--error {
    animation-name: shuffleError;
    animation-duration: 0.2s;
    animation-fill-mode: forwards;
    animation-iteration-count: 5;
  }

  .--active.--move {
    animation-name: swapFields;
    animation-duration: 0.7s;
    animation-fill-mode: forwards;
    animation-iteration-count: 1;
  }
}
</style>