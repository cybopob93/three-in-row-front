<script lang="ts" setup>
import ThreeInRow from "@/core/ThreeInRowHTML/ThreeInRow";
import { FieldType, GameFieldPosition } from "@/models/three-in-row/gameModels.d";

interface IProps {
  id: string;
  position: GameFieldPosition;
  fieldType: FieldType;
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
/**
 <style scoped lang="scss" src="GameField.scss">
 @import "GameField";
  </style>
 */
</script>

<template>
  <button
    class="game-field"
    :class="[
      {
        '--active': isPicked,
        '--error': isErrorState,
        '--move': isMoveState,
        '--clear': isReadyToClear,
      },
      fieldType,
    ]"
    :style="{
      left: position.x,
      top: position.y,
      '--move-to-x': moveTo.x,
      '--move-to-y': moveTo.y,
      '--field-size': gameFieldSize - 15 + 'px',
    }"
    @click="emit('pick', id)"
  >
    {{ id }}
  </button>
</template>

<style scoped lang="scss" src="GameField.scss"></style>
