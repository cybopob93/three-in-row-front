<script setup lang="ts">
import { computed, onBeforeMount, reactive } from "vue";
import type { Settings } from "@/models/three-in-row/settings";
import type { Color, GameField } from "@/models/three-in-row/gameModels";

const state: {
  useTimer: boolean;
  gameField: Array<Array<GameField>>;
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
    countPicked += row.filter((el) => el.isPicked).length;
  }

  return countPicked >= 2;
});

onBeforeMount(() => {
  state.gameField = new Array(settings.countLines);
  for (let row = 0; row < settings.countLines; row++) {
    state.gameField[row] = new Array(settings.countRows);
    for (let column = 0; column < settings.countRows; column++) {
      state.gameField[row][column] = {
        position: {
          x: row,
          y: column,
        },
        color: getRandomColor(),
        isErrorState: false,
        isPicked: false,
        isMoveState: false,
        isReadyToClear: false,
        isDrop: false,
        moveTo: {
          x: "0px",
          y: "0px",
        },
      };
    }
  }
  reset();
});

function getRandomColor(): Color {
  const colors = [
    "--vt-c-indigo-mute",
    "--vt-c-dark",
    "--vt-c-indigo",
    "--vt-c-red-dark",
    "--vt-c-orange",
  ];
  const randomIndex = Math.floor(Math.random() * colors.length);
  return colors[randomIndex] as Color;
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
    row.filter((el) => el.isPicked).forEach((el) => fields.push(el));
  }
  const [el1, el2] = fields;

  const hasErrorPick = await checkErrorPick(el1, el2);
  if (hasErrorPick) {
    el1.isPicked = false;
    el2.isPicked = false;
    return;
  }

  calcMovies(el1, el2);

  await makeMove(el1, el2);
  const itemsToRemove1 = checkAround(el1);
  const itemsToRemove2 = checkAround(el2);

  if (itemsToRemove1.length === 0 && itemsToRemove2.length === 0) {
    await makeError(el1, el2);
    calcMovies(el2, el1);
    await makeMove(el2, el1);
    await delay(0.55);
  } else {
    state.gameField.forEach((r) =>
      r.forEach((el) => {
        el.isPicked = false;
      })
    );
    await makeDrop();
  }
  await reset();
}

async function delay(sec = 1): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, sec * 1000);
  });
}

async function makeDrop(): Promise<void> {
  const promises = [];
  for (let y = 0; y < settings.countRows; y++) {
    promises.push(dropColumn(y));
  }
  await Promise.all(promises);
}

async function dropColumn(y: number): Promise<void> {
  const fields = [];
  const ids: Set<string> = new Set();
  const coefMatrix = {};
  for (let x = 0; x < settings.countLines; x++) {
    const el = state.gameField[x][y];
  }
  for (let x = 0; x < settings.countLines; x++) {
    const el = state.gameField[x][y];
    if (el.isReadyToClear) {
      // el.moveTo.y = "-52px";
      el.moveTo.x = "0px";
      el.color = x > 0 ? state.gameField[x - 1][y].color : getRandomColor();
      // el.isDrop = true;
      // el.isReadyToClear = false;
      if (!ids.has(`${el.position.x}-${el.position.y}`)) {
        fields.push(el);
        ids.add(`${el.position.x}-${el.position.y}`);
      }
      for (let tmpX = x - 1; tmpX >= 0; tmpX--) {
        const el2 = state.gameField[tmpX][y];
        // el2.moveTo.y = "-52px";
        el2.moveTo.x = "0px";
        state.gameField[tmpX][y].color =
          tmpX > 0 ? state.gameField[tmpX - 1][y].color : getRandomColor();
        // state.gameField[tmpX][y].isDrop = true;
        if (!ids.has(`${el2.position.x}-${el2.position.y}`)) {
          fields.push(el2);
          ids.add(`${el2.position.x}-${el2.position.y}`);
        }
      }
      // await delay(0.2);
      // for (let tmpX = x; tmpX >= 0; tmpX--) {
      //   state.gameField[tmpX][y].isDrop = false;
      //   state.gameField[tmpX][y].isPicked = false;
      // }
      // await delay(0.1);
    }
  }
  console.log(
    JSON.stringify(fields.sort((a, b) => b.position.x - a.position.x))
  );
  fields
    .sort((a, b) => b.position.x - a.position.x)
    .forEach((el) => {
      el.moveTo.y = `-${52 * (5 - el.position.x)}px`;
      el.isReadyToClear = false;
      el.isDrop = true;
    });
  await delay(10);
  fields.forEach((el) => {
    el.isDrop = false;
    el.isPicked = false;
  });
}

async function reset(): Promise<void> {
  state.gameField.forEach((r) =>
    r.forEach((el) => {
      el.isPicked = false;
      el.isReadyToClear = false;
      el.isErrorState = false;
      el.isMoveState = false;
      el.isDrop = false;
    })
  );
  let needShuffle = true;
  do {
    const elsToMove = new Set<string>();
    for (let y = 0; y < settings.countLines; y++) {
      for (let x = 0; x < settings.countRows; x++) {
        const el = state.gameField[y][x];
        const elsToRemove = checkAround(el);
        elsToRemove.forEach((elem) => {
          elsToMove.add(`${elem.position.x}-${elem.position.y}`);
        });
      }
    }
    if (elsToMove.size > 0) {
      await makeDrop();
    } else {
      needShuffle = false;
    }
  } while (needShuffle);
}

function calcMovies(el1: GameField, el2: GameField): void {
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
}

async function checkErrorPick(
  el1: GameField,
  el2: GameField
): Promise<boolean> {
  if (
    (el1.position.x === el2.position.x || el2.position.y === el1.position.y) &&
    el1.color !== el2.color
  ) {
    return false;
  }
  await makeError(el1, el2);
  return true;
}

async function makeError(el1: GameField, el2: GameField): Promise<unknown> {
  return new Promise((resolve) => {
    el1.isErrorState = true;
    el2.isErrorState = true;
    setTimeout(() => {
      el1.isErrorState = false;
      el2.isErrorState = false;
      resolve(true);
    }, 500);
  });
}

async function makeMove(el1: GameField, el2: GameField): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const tmpColor = el1.color;
      el1.isMoveState = false;
      el2.isMoveState = false;
      el1.color = el2.color;
      el2.color = tmpColor;
      resolve();
    }, 550);
  });
}

function checkVertical2(el: GameField): GameField[] {
  const result: GameField[] = [el];
  for (let x = el.position.x + 1; x < settings.countRows; x++) {
    if (el.color !== state.gameField[x][el.position.y].color) {
      break;
    }
    result.push(state.gameField[x][el.position.y]);
  }
  for (let x = el.position.x - 1; x >= 0; x--) {
    if (el.color !== state.gameField[x][el.position.y].color) {
      break;
    }
    result.push(state.gameField[x][el.position.y]);
  }
  return result.length >= 3 ? result : [];
}

function checkHorizontal2(el: GameField): GameField[] {
  const result: GameField[] = [el];
  for (let y = el.position.y + 1; y < settings.countRows; y++) {
    if (el.color !== state.gameField[el.position.x][y].color) {
      break;
    }
    result.push(state.gameField[el.position.x][y]);
  }
  for (let y = el.position.y - 1; y >= 0; y--) {
    if (el.color !== state.gameField[el.position.x][y].color) {
      break;
    }
    result.push(state.gameField[el.position.x][y]);
  }
  return result.length >= 3 ? result : [];
}

function checkAround(el: GameField): GameField[] {
  const result: GameField[] = [...checkVertical2(el), ...checkHorizontal2(el)];
  if (result.length === 0) {
    return [];
  }
  result.forEach((elem) => {
    elem.isReadyToClear = true;
    elem.isPicked = true;
  });
  return result;
}
</script>

<template>
  <section class="game">
    <div
      v-for="(line, row) in state.gameField"
      :key="`line-${row}`"
      class="game--line"
    >
      <div
        v-for="(element, column) in line"
        :key="`row-${column}`"
        class="game--row game__field"
        :class="{
          '--active': element.isPicked,
          '--error': element.isErrorState,
          '--move': element.isMoveState,
          '--clear': element.isReadyToClear,
          '--drop': element.isDrop,
        }"
        :style="[
          `background: var(${element.color})`,
          `--move-to-x: ${element.moveTo.x}`,
          `--move-to-y: ${element.moveTo.y}`,
        ]"
        :disabled="isChoiceCompleted"
        @click="pickBlock(element)"
      ></div>
    </div>
  </section>
</template>

<style lang="scss" scoped>
@keyframes shuffleError {
  25% {
    transform: translateX(5%);
  }
  50% {
    transform: translateX(-5%);
  }
}

@keyframes shuffleBoom {
  25% {
    transform: translate(5%, 5%);
  }
  50% {
    transform: translate(-5%, -5%);
  }
}

@keyframes swapFields {
  100% {
    transform: translate(var(--move-to-x), var(--move-to-y));
  }
}

@keyframes resetPosition {
  100% {
    transform: translate(0px, 0px);
  }
}

.game {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  overflow: hidden;

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
    animation-duration: 0.18s;
    animation-fill-mode: forwards;
    animation-iteration-count: 5;
  }

  .--active.--move {
    animation-name: swapFields;
    animation-duration: 0.5s;
    animation-fill-mode: forwards;
    animation-iteration-count: 1;
  }

  .--clear {
    animation-name: shuffleError;
    animation-duration: 0.2s;
    animation-fill-mode: forwards;
    animation-iteration-count: infinite;
  }

  .--drop {
    transform: translate(var(--move-to-x), var(--move-to-y));
    animation-name: resetPosition;
    animation-duration: 8s;
    animation-fill-mode: forwards;
    animation-iteration-count: 1;
  }
}
</style>
