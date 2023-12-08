import type { Settings } from "@/models/three-in-row/settings";
import type { GameField, GameFieldPosition } from "@/models/three-in-row/gameModels.d";
import type { ComputedRef, Ref, UnwrapRef } from "vue";
import { computed, reactive, ref } from "vue";
import type { ReactiveVariable } from "vue/macros";
import WrongChoiceError from "@/core/errors/WrongChoiceError";
import ItemNotFoundError from "@/core/errors/ItemNotFoundError";
import { FieldType } from "@/models/three-in-row/gameModels.d";

type CheckFields = null | false | GameField;

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
      const res = await this.checkAvailabilityToMove();
      if (!res) {
        alert("no more movies");
      }
      this.isActionOn.value = false;
    }
  }

  checkAvailabilityToMove(): boolean {
    for (let x = 0; x < this.columnSize - ThreeInRow.FIELD_SIZE; x += ThreeInRow.FIELD_SIZE) {
      for (let y = 0; y < this.rowSize - ThreeInRow.FIELD_SIZE; y += ThreeInRow.FIELD_SIZE) {
        const checkedItem = this.getItemByPosition({ x, y });
        const forwardItems = this.getForwardItemsToCheck(checkedItem.position);
        if (forwardItems === null) {
          continue;
        }
        switch (true) {
          case checkedItem.fieldType === forwardItems[0].fieldType: {
            // TODO: check around forwardItems[1] to have same field type as checkedItem exclude position forwardItems[0]
            break;
          }
          case checkedItem.fieldType === forwardItems[1].fieldType: {
            // TODO: check around forwardItems[0] to have same field type as checkedItem exclude position forwardItems[1]
            break;
          }
        }
      }
    }
    return false;
  }

  getForwardItemsToCheck(startPosition: GameFieldPosition): [GameField, GameField] | null {
    if (
      startPosition.x + ThreeInRow.FIELD_SIZE >= this.columnSize ||
      startPosition.y + ThreeInRow.FIELD_SIZE >= this.rowSize ||
      startPosition.x + ThreeInRow.FIELD_SIZE * 2 >= this.columnSize ||
      startPosition.y + ThreeInRow.FIELD_SIZE * 2 >= this.rowSize
    ) {
      return null;
    }
    return [
      this.getItemByPosition({
        x: startPosition.x + ThreeInRow.FIELD_SIZE,
        y: startPosition.y,
      }),
      this.getItemByPosition({
        x: startPosition.x + ThreeInRow.FIELD_SIZE * 2,
        y: startPosition.y,
      }),
    ];
  }

  getAroundFieldTypes(x: number, y: number, isHorizontal = true): [FieldType | null, FieldType | null] {
    let firstFieldType: null | FieldType = null;
    let secondFieldType: null | FieldType = null;
    if (isHorizontal) {
      if (x > 0) {
        firstFieldType = this.getItemByPosition({ x: x - ThreeInRow.FIELD_SIZE, y }).fieldType;
      }
      if (x < this.columnSize - ThreeInRow.FIELD_SIZE) {
        secondFieldType = this.getItemByPosition({ x: x + ThreeInRow.FIELD_SIZE, y }).fieldType;
      }
    } else {
      if (y > 0) {
        firstFieldType = this.getItemByPosition({ x, y: y - ThreeInRow.FIELD_SIZE }).fieldType;
      }
      if (y < this.rowSize - ThreeInRow.FIELD_SIZE) {
        secondFieldType = this.getItemByPosition({ x, y: y + ThreeInRow.FIELD_SIZE }).fieldType;
      }
    }
    return [firstFieldType, secondFieldType];
  }

  checkCycleCondition(value: number, isReverse: boolean, maxSize: number): boolean {
    return isReverse ? value > 0 : value < maxSize;
  }

  availabilityToMoveVertical(isReverse = false): boolean {
    const coefficient = ThreeInRow.FIELD_SIZE * (isReverse ? -1 : 1);
    for (
      let x = isReverse ? this.columnSize - ThreeInRow.FIELD_SIZE : 0;
      this.checkCycleCondition(x, isReverse, this.columnSize);
      x += coefficient
    ) {
      let alreadySkipped = false;
      let startY = isReverse ? this.rowSize + coefficient : 0;
      let fieldType = this.getItemByPosition({ x, y: startY }).fieldType;
      let sameColorsCombo = 1;
      for (let y = startY + coefficient; this.checkCycleCondition(y, isReverse, this.rowSize); y += coefficient) {
        const nextFieldType = this.getItemByPosition({ x, y }).fieldType;
        if (fieldType === nextFieldType) {
          sameColorsCombo++;
          continue;
        }

        if (alreadySkipped && sameColorsCombo >= 3) {
          return true;
        }

        // left and right check on same color
        if (!alreadySkipped) {
          const [leftFieldType, rightFieldType] = this.getAroundFieldTypes(x, y);
          (leftFieldType === fieldType || rightFieldType === fieldType) && sameColorsCombo++;
          alreadySkipped = true;
          continue;
        }

        alreadySkipped = false;
        sameColorsCombo = 1;
        startY += coefficient;
        fieldType = this.getItemByPosition({ x, y: startY }).fieldType;
      }
    }
    return false;
  }

  availabilityToMoveHorizontal(isReverse = false): boolean {
    const coefficient = ThreeInRow.FIELD_SIZE * (isReverse ? -1 : 1);
    for (
      let y = isReverse ? this.rowSize - ThreeInRow.FIELD_SIZE : 0;
      this.checkCycleCondition(y, isReverse, this.rowSize);
      y += coefficient
    ) {
      let alreadySkipped = false;
      let startX = isReverse ? this.rowSize + coefficient : 0;
      let fieldType = this.getItemByPosition({ x: startX, y }).fieldType;
      let sameColorsCombo = 1;
      for (let x = startX + coefficient; this.checkCycleCondition(x, isReverse, this.columnSize); x += coefficient) {
        const nextFieldType = this.getItemByPosition({ x, y }).fieldType;
        if (fieldType === nextFieldType) {
          sameColorsCombo++;
          continue;
        }

        if (alreadySkipped && sameColorsCombo >= 3) {
          return true;
        }

        // top and bottom check on same color
        if (!alreadySkipped) {
          const [topFieldType, bottomFieldType] = this.getAroundFieldTypes(x, y, false);
          (topFieldType === fieldType || bottomFieldType === fieldType) && sameColorsCombo++;
          alreadySkipped = true;
          continue;
        }

        alreadySkipped = false;
        sameColorsCombo = 1;
        startX += coefficient;
        fieldType = this.getItemByPosition({ x: startX, y }).fieldType;
      }
    }
    return false;
  }
}

export default ThreeInRow;
