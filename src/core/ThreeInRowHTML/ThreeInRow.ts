import type { Settings } from "@/models/three-in-row/settings";
import type { GameField, GameFieldPosition } from "@/models/three-in-row/gameModels.d";
import type { ComputedRef, Ref, UnwrapRef } from "vue";
import { computed, reactive, ref } from "vue";
import type { ReactiveVariable } from "vue/macros";
import WrongChoiceError from "@/core/errors/WrongChoiceError";
import ItemNotFoundError from "@/core/errors/ItemNotFoundError";
import { FieldType } from "@/models/three-in-row/gameModels.d";

enum EDirections {
  TOP,
  BOTTOM,
  LEFT,
  RIGHT,
}

class ThreeInRow {
  private readonly _settings: Settings;
  private readonly _items: ReactiveVariable<GameField[]>;
  readonly isFullyDisabled: ComputedRef;
  private isActionOn: Ref<UnwrapRef<boolean>>;
  static FIELD_SIZE = 100;

  constructor(settings: Settings) {
    this._settings = JSON.parse(JSON.stringify(settings));
    this._items = reactive(this.generateGameItems());
    this.isActionOn = ref(true);
    this.isFullyDisabled = computed(() => {
      return this.isActionOn.value || this._items.filter(i => i.isPicked).length >= 2;
    });
    this.delay(0.5)
      .then(() => {
        return this.dropNecessaryFields(false);
      })
      .then(() => {
        this.isActionOn.value = false;
      });
  }

  get rowSize(): number {
    return ThreeInRow.FIELD_SIZE * this._settings.countRows;
  }

  get columnSize(): number {
    return ThreeInRow.FIELD_SIZE * this._settings.countColumns;
  }

  get gameFieldSize(): { height: string; width: string } {
    return {
      height: this.rowSize + "px",
      width: this.columnSize + "px",
    };
  }

  get randomFieldType(): FieldType {
    const types = Object.keys(FieldType) as Array<keyof typeof FieldType>;
    const randomIndex = Math.floor(Math.random() * types.length);
    const randomEnumKey = types[randomIndex];
    return FieldType[randomEnumKey];
  }

  get items() {
    return this._items.map(i => ({
      ...i,
      position: {
        x: i.position.x + "px",
        y: i.position.y + "px",
      },
      moveTo: {
        x: i.moveTo.x + "px",
        y: i.moveTo.y + "px",
      },
    }));
  }

  get settings() {
    return this._settings;
  }

  get pickedItems(): [GameField, GameField] {
    const [firstItem, secondItem] = this._items.filter(i => i.isPicked);
    if (!firstItem || !secondItem) {
      throw new WrongChoiceError();
    }

    if (firstItem.position.x !== secondItem.position.x && firstItem.position.y !== secondItem.position.y) {
      throw new WrongChoiceError();
    }

    if (firstItem.fieldType === secondItem.fieldType) {
      throw new WrongChoiceError();
    }

    return [firstItem, secondItem];
  }

  get countItemsToDelete(): number {
    return this._items.filter(i => i.isDrop).length;
  }

  getItemByPosition(searchPosition: GameFieldPosition): GameField {
    const item = this._items.find(({ position }) => position.x === searchPosition.x && position.y === searchPosition.y);
    if (!item) {
      throw new Error(`Can't find items by coords[${searchPosition.x}, ${searchPosition.y}]`);
    }
    return item;
  }

  getItemByMoveTo(searchPosition: GameFieldPosition): GameField | undefined {
    return this._items.find(({ moveTo }) => moveTo.x === searchPosition.x && moveTo.y === searchPosition.y);
  }

  generateIdByPosition(position: GameFieldPosition): string {
    return position.x + "_" + position.y;
  }

  generateGameItems() {
    const result = [];
    for (let y = 0; y < this.rowSize; y += ThreeInRow.FIELD_SIZE) {
      for (let x = 0; x < this.columnSize; x += ThreeInRow.FIELD_SIZE) {
        result.push({
          id: this.generateIdByPosition({ x, y }),
          position: {
            x: x,
            y: y,
          },
          fieldType: this.randomFieldType,
          isErrorState: false,
          isPicked: false,
          isMoveState: false,
          isReadyToClear: false,
          isDrop: false,
          moveTo: {
            x: x,
            y: y,
          },
        });
      }
    }
    return result;
  }

  async delay(sec = 1): Promise<void> {
    return new Promise(resolve => {
      setTimeout(resolve, sec * 1000);
    });
  }

  getItem(id: string): GameField {
    const item = this._items.find(i => i.id === id);
    if (!item) {
      throw new ItemNotFoundError();
    }
    return item;
  }

  resetGameFieldStates() {
    this._items.forEach(item => {
      item.isPicked = false;
      item.isErrorState = false;
      item.isMoveState = false;
      item.isReadyToClear = false;
      item.isDrop = false;
    });
  }

  async swapFields(fPosition: GameFieldPosition, sPosition: GameFieldPosition) {
    const [firstItem, secondItem] = this.pickedItems;
    firstItem.moveTo = { x: sPosition.x, y: sPosition.y };
    secondItem.moveTo = { x: fPosition.x, y: fPosition.y };
    firstItem.isMoveState = true;
    secondItem.isMoveState = true;
    await this.delay(0.5);
    firstItem.position = { x: sPosition.x, y: sPosition.y };
    secondItem.position = { x: fPosition.x, y: fPosition.y };
    firstItem.isMoveState = false;
    secondItem.isMoveState = false;
  }

  modifyItemsToDrop(itemsToDrop: GameField[], currentItem: GameField, nextItem: GameField): GameField[] {
    if (currentItem.fieldType === nextItem.fieldType) {
      const itsAlreadyAdded = itemsToDrop.find(i => i.id === currentItem.id);
      if (!itsAlreadyAdded) {
        itemsToDrop.push(currentItem);
      }
      itemsToDrop.push(nextItem);
    } else if (itemsToDrop.length < 3) {
      itemsToDrop = [];
    } else {
      itemsToDrop.forEach(item => {
        item.isDrop = true;
      });
      itemsToDrop = [];
    }
    return itemsToDrop;
  }

  async horizontalMarkDrop() {
    for (let y = 0; y < this.rowSize; y += ThreeInRow.FIELD_SIZE) {
      let itemsToDrop: GameField[] = [];
      for (let x = 0; x < this.columnSize - ThreeInRow.FIELD_SIZE; x += ThreeInRow.FIELD_SIZE) {
        const currentItem = this.getItemByPosition({ x, y });
        const nextItem = this.getItemByPosition({ x: x + ThreeInRow.FIELD_SIZE, y });
        itemsToDrop = this.modifyItemsToDrop(itemsToDrop, currentItem, nextItem);
      }
      if (itemsToDrop.length >= 3) {
        itemsToDrop.forEach(item => {
          item.isDrop = true;
        });
      }
    }
  }

  async verticalMarkDrop() {
    for (let x = 0; x < this.columnSize; x += ThreeInRow.FIELD_SIZE) {
      let itemsToDrop: GameField[] = [];
      for (let y = 0; y < this.rowSize - ThreeInRow.FIELD_SIZE; y += ThreeInRow.FIELD_SIZE) {
        const currentItem = this.getItemByPosition({ x, y });
        const nextItem = this.getItemByPosition({ y: y + ThreeInRow.FIELD_SIZE, x });
        itemsToDrop = this.modifyItemsToDrop(itemsToDrop, currentItem, nextItem);
      }
      if (itemsToDrop.length >= 3) {
        itemsToDrop.forEach(item => {
          item.isDrop = true;
        });
      }
    }
  }

  markPickedItemsAsError() {
    this._items.forEach(el => {
      if (!el.isPicked) {
        return;
      }
      el.isErrorState = true;
    });
  }

  sortInColumnDesc(a: GameField, b: GameField): number {
    return b.position.y - a.position.y;
  }

  async dropItems() {
    this._items.forEach(item => {
      if (item.isDrop) {
        item.isReadyToClear = true;
      }
      item.isPicked = false;
    });
    await this.delay(0.4);
    const calculatedIds = new Set<string>([]);
    const sortedItemsToDelete = this._items.filter(i => i.isDrop).sort(this.sortInColumnDesc);
    for (const item of sortedItemsToDelete) {
      if (calculatedIds.has(item.id)) {
        continue;
      }
      const columnWhereDropFields = this._items
        .filter(i => i.position.x === item.position.x && i.position.y <= item.position.y && !i.isDrop)
        .sort(this.sortInColumnDesc)
        .map(i => i.fieldType);

      const coefficientToUp = sortedItemsToDelete.filter(i => i.position.x === item.position.x).length;
      for (let y = item.position.y; y >= 0; y -= ThreeInRow.FIELD_SIZE) {
        const itemToDrop = this.getItemByMoveTo({ x: item.position.x, y });
        if (!itemToDrop) {
          continue;
        }
        itemToDrop.fieldType = columnWhereDropFields.shift() || this.randomFieldType;
        itemToDrop.moveTo.y = itemToDrop.position.y;
        itemToDrop.position.y = y - ThreeInRow.FIELD_SIZE * coefficientToUp;
        itemToDrop.isDrop = true;
        itemToDrop.isReadyToClear = false;
        calculatedIds.add(itemToDrop.id);
      }
    }
    await this.delay(0.2);
    this._items.forEach(item => {
      if (item.isDrop) {
        item.isErrorState = false;
        item.isMoveState = true;
      }
    });
    await this.delay(0.5);
    this._items.forEach(item => {
      item.position.y = item.moveTo.y;
    });
  }

  async markToDrop() {
    await Promise.all([this.horizontalMarkDrop(), this.verticalMarkDrop()]);
  }

  async dropNecessaryFields(generateErrorOnFirstTry = true) {
    let firsAndError = generateErrorOnFirstTry;
    let itemsToDropCount = 0;
    do {
      await this.markToDrop();
      itemsToDropCount = this.countItemsToDelete;
      if (itemsToDropCount === 0 && firsAndError) {
        this.markPickedItemsAsError();
        await this.delay(0.3);
        const [firstItem, secondItem] = this.pickedItems;
        await this.swapFields(firstItem.position, secondItem.position);
        throw new Error("No fields to remove.");
      } else if (itemsToDropCount > 0) {
        await this.dropItems();
        this.resetGameFieldStates();
      }
      firsAndError = false;
    } while (itemsToDropCount > 0);
  }

  async itemPick(id: string) {
    const item = this.getItem(id);
    item.isPicked = !item.isPicked;
    if (!this.isFullyDisabled.value) {
      return;
    }

    try {
      this.isActionOn.value = true;
      const [firstItem, secondItem] = this.pickedItems;
      await this.swapFields(firstItem.position, secondItem.position);
      await this.dropNecessaryFields(true);
    } catch (e) {
      if (e instanceof WrongChoiceError) {
        this.markPickedItemsAsError();
        await this.delay(0.5);
      }
      if (e instanceof Error) {
        console.warn(e.message);
      }
    } finally {
      this.resetGameFieldStates();
      const res = this.checkAvailabilityToMove2();
      if (res.size === 0) {
        console.error("no more movies");
        alert("no more movies");
      }
      this.isActionOn.value = false;
    }
  }

  checkAvailabilityToMove2(): Set<string> {
    const availableItemsToMove: Set<string> = new Set<string>();
    for (let y = 0; y < this.rowSize; y += ThreeInRow.FIELD_SIZE) {
      for (let x = 0; x < this.columnSize; x += ThreeInRow.FIELD_SIZE) {
        const checkedItem = this.getItemByPosition({ x, y });
        this.checkFieldsAround(checkedItem.position, checkedItem.fieldType).forEach(fieldId => {
          availableItemsToMove.add(fieldId);
        });
      }
    }
    return availableItemsToMove;
  }

  checkFieldsAround(startPosition: GameFieldPosition, fieldType: FieldType) {
    return [
      ...this.checkTopDirection(startPosition, fieldType),
      ...this.checkBottomDirection(startPosition, fieldType),
      ...this.checkLeftDirection(startPosition, fieldType),
      ...this.checkRightDirection(startPosition, fieldType),
    ];
  }

  checkTopDirection(startPosition: GameFieldPosition, fieldType: FieldType): string[] {
    const result: string[] = [];
    const nextTopField = this.getNextExistDirectionFiled(startPosition, EDirections.TOP);
    if (nextTopField === null) {
      return result;
    }
    const topItem = this.getNextExistDirectionFiled(nextTopField.position, EDirections.TOP);
    const bottomItem = this.getNextExistDirectionFiled(startPosition, EDirections.BOTTOM);
    if (nextTopField.fieldType !== fieldType) {
      if (bottomItem?.fieldType === fieldType) {
        this.findSameFieldsByDirections(nextTopField.position, fieldType, [
          EDirections.LEFT,
          EDirections.TOP,
          EDirections.RIGHT,
        ]).forEach(fieldId => result.push(fieldId));
      }

      if (topItem?.fieldType === fieldType) {
        this.findSameFieldsByDirections(nextTopField.position, fieldType, [
          EDirections.LEFT,
          EDirections.RIGHT,
        ]).forEach(fieldId => result.push(fieldId));
      }
    } else {
      if (topItem !== null) {
        this.findSameFieldsByDirections(topItem.position, fieldType, [
          EDirections.LEFT,
          EDirections.TOP,
          EDirections.RIGHT,
        ]).forEach(fieldId => result.push(fieldId));
      }
      if (bottomItem !== null) {
        this.findSameFieldsByDirections(bottomItem.position, fieldType, [
          EDirections.LEFT,
          EDirections.RIGHT,
          EDirections.BOTTOM,
        ]).forEach(fieldId => result.push(fieldId));
      }
    }

    return result;
  }

  checkBottomDirection(startPosition: GameFieldPosition, fieldType: FieldType): string[] {
    const result: string[] = [];
    const nextBottomField = this.getNextExistDirectionFiled(startPosition, EDirections.BOTTOM);
    if (nextBottomField === null) {
      return result;
    }
    const topItem = this.getNextExistDirectionFiled(startPosition, EDirections.TOP);
    const bottomItem = this.getNextExistDirectionFiled(nextBottomField.position, EDirections.BOTTOM);
    if (nextBottomField.fieldType !== fieldType) {
      if (bottomItem?.fieldType === fieldType) {
        this.findSameFieldsByDirections(nextBottomField.position, fieldType, [
          EDirections.LEFT,
          EDirections.RIGHT,
        ]).forEach(fieldId => result.push(fieldId));
      }

      if (topItem?.fieldType === fieldType) {
        this.findSameFieldsByDirections(nextBottomField.position, fieldType, [
          EDirections.LEFT,
          EDirections.RIGHT,
          EDirections.BOTTOM,
        ]).forEach(fieldId => result.push(fieldId));
      }
    } else {
      if (topItem !== null) {
        this.findSameFieldsByDirections(topItem.position, fieldType, [
          EDirections.LEFT,
          EDirections.TOP,
          EDirections.RIGHT,
        ]).forEach(fieldId => result.push(fieldId));
      }
      if (bottomItem !== null) {
        this.findSameFieldsByDirections(bottomItem.position, fieldType, [
          EDirections.LEFT,
          EDirections.RIGHT,
          EDirections.BOTTOM,
        ]).forEach(fieldId => result.push(fieldId));
      }
    }

    return result;
  }

  checkLeftDirection(startPosition: GameFieldPosition, fieldType: FieldType): string[] {
    const result: string[] = [];
    const nextLeftField = this.getNextExistDirectionFiled(startPosition, EDirections.LEFT);
    if (nextLeftField === null) {
      return result;
    }
    const rightItem = this.getNextExistDirectionFiled(startPosition, EDirections.RIGHT);
    const leftItem = this.getNextExistDirectionFiled(nextLeftField.position, EDirections.LEFT);
    if (nextLeftField.fieldType !== fieldType) {
      if (rightItem?.fieldType === fieldType) {
        this.findSameFieldsByDirections(nextLeftField.position, fieldType, [
          EDirections.LEFT,
          EDirections.TOP,
          EDirections.BOTTOM,
        ]).forEach(fieldId => result.push(fieldId));
      }

      if (leftItem?.fieldType === fieldType) {
        this.findSameFieldsByDirections(nextLeftField.position, fieldType, [
          EDirections.TOP,
          EDirections.BOTTOM,
        ]).forEach(fieldId => result.push(fieldId));
      }
    } else {
      if (leftItem !== null) {
        this.findSameFieldsByDirections(leftItem.position, fieldType, [
          EDirections.LEFT,
          EDirections.TOP,
          EDirections.BOTTOM,
        ]).forEach(fieldId => result.push(fieldId));
      }
      if (rightItem !== null) {
        this.findSameFieldsByDirections(rightItem.position, fieldType, [
          EDirections.TOP,
          EDirections.RIGHT,
          EDirections.BOTTOM,
        ]).forEach(fieldId => result.push(fieldId));
      }
    }

    return result;
  }

  checkRightDirection(startPosition: GameFieldPosition, fieldType: FieldType): string[] {
    const result: string[] = [];
    const nextRightField = this.getNextExistDirectionFiled(startPosition, EDirections.RIGHT);
    if (nextRightField === null) {
      return result;
    }
    const rightItem = this.getNextExistDirectionFiled(nextRightField.position, EDirections.RIGHT);
    const leftItem = this.getNextExistDirectionFiled(startPosition, EDirections.LEFT);
    if (nextRightField.fieldType !== fieldType) {
      if (rightItem?.fieldType === fieldType) {
        this.findSameFieldsByDirections(nextRightField.position, fieldType, [
          EDirections.TOP,
          EDirections.BOTTOM,
        ]).forEach(fieldId => result.push(fieldId));
      }

      if (leftItem?.fieldType === fieldType) {
        this.findSameFieldsByDirections(nextRightField.position, fieldType, [
          EDirections.TOP,
          EDirections.RIGHT,
          EDirections.BOTTOM,
        ]).forEach(fieldId => result.push(fieldId));
      }
    } else {
      if (leftItem !== null) {
        this.findSameFieldsByDirections(leftItem.position, fieldType, [
          EDirections.BOTTOM,
          EDirections.LEFT,
          EDirections.TOP,
        ]).forEach(fieldId => result.push(fieldId));
      }
      if (rightItem !== null) {
        this.findSameFieldsByDirections(rightItem.position, fieldType, [
          EDirections.TOP,
          EDirections.RIGHT,
          EDirections.BOTTOM,
        ]).forEach(fieldId => result.push(fieldId));
      }
    }

    return result;
  }

  // test(startPosition: GameFieldPosition, fieldType: FieldType, mainDirectionType: EDirections) {
  //   const result: string[] = [];
  //   const nextField = this.getNextExistDirectionFiled(startPosition, mainDirectionType);
  //   if (nextField === null) {
  //     return result;
  //   }
  //   const mainDirection = this.getNextExistDirectionFiled(nextField.position, mainDirectionType);
  //   const oppositeDirection = this.getNextExistDirectionFiled(
  //     startPosition,
  //     this.getOppositeDirection(mainDirectionType),
  //   );
  // }

  // getOppositeDirection(direction: EDirections): EDirections {
  //   switch (direction) {
  //     case EDirections.BOTTOM:
  //       return EDirections.TOP;
  //     case EDirections.TOP:
  //       return EDirections.BOTTOM;
  //     case EDirections.LEFT:
  //       return EDirections.RIGHT;
  //     case EDirections.RIGHT:
  //       return EDirections.LEFT;
  //   }
  // }

  getNextExistDirectionFiled(startPosition: GameFieldPosition, direction: EDirections): GameField | null {
    const position: GameFieldPosition = {
      x: startPosition.x,
      y: startPosition.y,
    };
    switch (direction) {
      case EDirections.TOP: {
        position.y += ThreeInRow.FIELD_SIZE;
        break;
      }
      case EDirections.BOTTOM: {
        position.y -= ThreeInRow.FIELD_SIZE;
        break;
      }
      case EDirections.LEFT: {
        position.x -= ThreeInRow.FIELD_SIZE;
        break;
      }
      case EDirections.RIGHT: {
        position.x += ThreeInRow.FIELD_SIZE;
      }
    }
    if (position.x >= this.columnSize || position.x < 0 || position.y >= this.rowSize || position.y < 0) {
      return null;
    }
    return this.getItemByPosition(position);
  }

  findSameFieldsByDirections(
    startPosition: GameFieldPosition,
    fieldType: FieldType,
    directions: EDirections[],
  ): string[] {
    const result: string[] = [];
    for (const direction of directions) {
      const field = this.getNextExistDirectionFiled(startPosition, direction);
      if (field !== null && field.fieldType === fieldType) {
        result.push(field.id);
      }
    }
    return result;
  }
}

export default ThreeInRow;
