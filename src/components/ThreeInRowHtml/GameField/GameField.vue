<script lang="ts" setup>
import ThreeInRow from "@/core/ThreeInRowHTML/ThreeInRow";
import { Color, GameFieldPosition } from "@/models/three-in-row/gameModels";

interface IProps {
  id: string;
  position: GameFieldPosition;
  color: Color;
  isErrorState: boolean;
  isPicked: boolean;
  isMoveState: boolean;
  isReadyToClear: boolean;
  isDrop: boolean;
  moveTo: GameFieldPosition;
}

defineProps<IProps>();
const gameFieldSize = ThreeInRow.FIELD_SIZE;
const emit = defineEmits<{
  (e: "pick", id: IProps["id"]): void;
}>();
</script>

<template>
  <button
    class="game-field"
    :class="{
      '--active': isPicked,
      '--error': isErrorState,
      '--move': isMoveState,
      '--clear': isReadyToClear,
    }"
    :style="{
      background: `var(${color})`,
      left: position.x,
      top: position.y,
      '--move-to-x': moveTo.x,
      '--move-to-y': moveTo.y,
      '--field-size': gameFieldSize - 10 + 'px',
    }"
    @click="emit('pick', id)"
  ></button>
</template>

<style scoped lang="scss">
@import "GameField";
</style>
