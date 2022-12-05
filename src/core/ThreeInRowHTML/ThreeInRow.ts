import type { Settings } from "@/models/three-in-row/settings";
import type { Color, GameField, GameFieldPosition } from "@/models/three-in-row/gameModels";
import type { ComputedRef, Ref, UnwrapRef } from "vue";
import { computed, reactive, ref } from "vue";
import type { ReactiveVariable } from "vue/macros";
import WrongChoiceError from "@/core/errors/WrongChoiceError";
import ItemNotFoundError from "@/core/errors/ItemNotFoundError";

interface IGameField extends GameField {
  id: string;
}

class ThreeInRow {
  private readonly _settings: Settings;
  private readonly _items: ReactiveVariable<IGameField[]>;
  readonly isFullyDisabled: ComputedRef;
  private firstPickedItem: IGameField | null = null;
  private secondPickedItem: IGameField | null = null;
  private isActionOn: Ref<UnwrapRef<boolean>>;
  static FIELD_SIZE = 100;

  constructor(settings: Settings, gameFields?: IGameField[]) {
    this._settings = JSON.parse(JSON.stringify(settings));
    this._items = reactive(gameFields || this.generateGameItems());
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

  get randomColor(): Color {
    const colors = ["--vt-c-indigo-mute", "--vt-c-dark", "--vt-c-indigo", "--vt-c-red-dark", "--vt-c-orange"];
    const randomIndex = Math.floor(Math.random() * colors.length);
    return colors[randomIndex] as Color;
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

  get pickedItems(): [IGameField, IGameField] {
    const [firstItem, secondItem] = this._items.filter(i => i.isPicked);
    if (!firstItem || !secondItem) {
      throw new WrongChoiceError();
    }

    if (firstItem.position.x !== secondItem.position.x && firstItem.position.y !== secondItem.position.y) {
      throw new WrongChoiceError();
    }

    if (firstItem.color === secondItem.color) {
      throw new WrongChoiceError();
    }

    return [firstItem, secondItem];
  }

  get countItemsToDelete(): number {
    return this._items.filter(i => i.isDrop).length;
  }

  getItemByPosition(searchPosition: GameFieldPosition): IGameField {
    const item = this._items.find(({ position }) => position.x === searchPosition.x && position.y === searchPosition.y);
    if (!item) {
      throw new Error(`Can't find items by coords[${searchPosition.x}, ${searchPosition.y}]`);
    }
    return item;
  }

  getItemByMoveTo(searchPosition: GameFieldPosition): IGameField | undefined {
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
          color: this.randomColor,
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

  getItem(id: string): IGameField {
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

  async swapFields(fPosition?: GameFieldPosition, sPosition?: GameFieldPosition) {
    if (!fPosition || !sPosition) {
      throw new WrongChoiceError();
    }
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

  modifyItemsToDrop(itemsToDrop: IGameField[], currentItem: IGameField, nextItem: IGameField): IGameField[] {
    if (currentItem.color === nextItem.color) {
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
      let itemsToDrop: IGameField[] = [];
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
      let itemsToDrop: IGameField[] = [];
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

  sortInColumnDesc(a: IGameField, b: IGameField): number {
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
      const columnWhereDropColors = this._items
        .filter(i => i.position.x === item.position.x && i.position.y <= item.position.y && !i.isDrop)
        .sort(this.sortInColumnDesc)
        .map(i => i.color);

      const coefficientToUp = sortedItemsToDelete.filter(i => i.position.x === item.position.x).length;
      for (let y = item.position.y; y >= 0; y -= ThreeInRow.FIELD_SIZE) {
        const itemToDrop = this.getItemByMoveTo({ x: item.position.x, y });
        if (!itemToDrop) {
          continue;
        }
        itemToDrop.color = columnWhereDropColors.shift() || this.randomColor;
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
        await this.swapFields(this.secondPickedItem?.position, this.firstPickedItem?.position);
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
      this.firstPickedItem = JSON.parse(JSON.stringify(firstItem)) as IGameField;
      this.secondPickedItem = JSON.parse(JSON.stringify(secondItem)) as IGameField;
      await this.swapFields(this.firstPickedItem.position, this.secondPickedItem.position);
      await this.dropNecessaryFields();
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
      this.firstPickedItem = null;
      this.secondPickedItem = null;
      const res = await this.checkAvailabilityToMove();
      if (!res) {
        alert("no more movies");
      }
      this.isActionOn.value = false;
    }
  }
  async checkAvailabilityToMove(): Promise<boolean> {
    const [verticalCheck, horizontalCheck] = await Promise.all([
      this.availabilityToMoveVertical(),
      this.availabilityToMoveHorizontal(),
    ]);

    return horizontalCheck || verticalCheck;
  }

  async availabilityToMoveVertical(): Promise<boolean> {
    for (let x = 0; x < this.columnSize; x += ThreeInRow.FIELD_SIZE) {
      const startItem = this.getItemByPosition({ x, y: 0 });
      let color = startItem.color;
      let skippedItems = 0;
      let index = 1;
      let sameColorsCombo = 1;
      for (let y = ThreeInRow.FIELD_SIZE; y < this.rowSize; y += ThreeInRow.FIELD_SIZE) {
        const nextItem = this.getItemByPosition({ x, y });
        if (color === nextItem.color) {
          sameColorsCombo++;
          if (skippedItems === 1 && sameColorsCombo >= 3) {
            return true;
          }
          continue;
        }

        if (skippedItems === 0) {
          if (x > 0) {
            const leftItem = this.getItemByPosition({ x: x - ThreeInRow.FIELD_SIZE, y });
            leftItem.color === color && sameColorsCombo++;
          }
          if (x < this.columnSize - ThreeInRow.FIELD_SIZE) {
            const rightItem = this.getItemByPosition({ x: x + ThreeInRow.FIELD_SIZE, y });
            rightItem.color === color && sameColorsCombo++;
          }
          if (sameColorsCombo >= 3) {
            return true;
          }
          skippedItems++;
          continue;
        }

        skippedItems = 0;
        sameColorsCombo = 1;
        index++;
        const newItemToStartCheck = this.getItemByPosition({ x, y: ThreeInRow.FIELD_SIZE * index });
        color = newItemToStartCheck.color;
      }
    }
    return false;
  }

  async availabilityToMoveHorizontal(): Promise<boolean> {
    for (let y = 0; y < this.rowSize; y += ThreeInRow.FIELD_SIZE) {
      const startItem = this.getItemByPosition({ x: 0, y });
      let color = startItem.color;
      let skippedItems = 0;
      let index = 1;
      let sameColorsCombo = 1;
      for (let x = ThreeInRow.FIELD_SIZE; x < this.columnSize; x += ThreeInRow.FIELD_SIZE) {
        const nextItem = this.getItemByPosition({ x, y });
        if (color === nextItem.color) {
          sameColorsCombo++;
          if (skippedItems === 1 && sameColorsCombo >= 3) {
            return true;
          }
          continue;
        }

        if (skippedItems === 0) {
          if (y > 0) {
            const topItem = this.getItemByPosition({ x, y: y - ThreeInRow.FIELD_SIZE });
            topItem.color === color && sameColorsCombo++;
          }
          if (y < this.rowSize - ThreeInRow.FIELD_SIZE) {
            const bottomItem = this.getItemByPosition({ x, y: y + ThreeInRow.FIELD_SIZE });
            bottomItem.color === color && sameColorsCombo++;
          }
          if (sameColorsCombo >= 3) {
            return true;
          }
          skippedItems++;
          continue;
        }

        skippedItems = 0;
        sameColorsCombo = 1;
        index++;
        const newItemToStartCheck = this.getItemByPosition({ x: ThreeInRow.FIELD_SIZE * index, y });
        color = newItemToStartCheck.color;
      }
    }
    return false;
  }
}

export default ThreeInRow;
