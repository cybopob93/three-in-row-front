import type { Settings } from "@/models/three-in-row/settings";
import type { GameField, Color, GameFieldPosition } from "@/models/three-in-row/gameModels";
import { computed, reactive } from "vue";
import type { ComputedRef } from "vue";
import type { ReactiveVariable } from "vue/macros";
import WrongChoiceError from "@/core/errors/WrongChoiceError";

interface IGameField extends GameField {
  id: string;
}

class ThreeInRow {
  private readonly _settings: Settings;
  private readonly _items: ReactiveVariable<IGameField[]>;
  readonly isFullyDisabled: ComputedRef;
  private firstPickedItem: IGameField | null = null;
  private secondPickedItem: IGameField | null = null;
  static FIELD_SIZE = 100;

  constructor(settings: Settings) {
    this._settings = settings;
    this._items = reactive(this.generateGameItems());
    this.isFullyDisabled = computed(() => {
      return this._items.filter(i => i.isPicked).length >= 2;
    });
  }

  get gameFieldSize(): { height: string; width: string } {
    return {
      height: this.settings.countRows * ThreeInRow.FIELD_SIZE + "px",
      width: this.settings.countColumns * ThreeInRow.FIELD_SIZE + "px",
    };
  }

  get randomColor(): Color {
    const colors = ["--vt-c-indigo-mute", "--vt-c-dark", "--vt-c-indigo", "--vt-c-red-dark", "--vt-c-orange"];
    const randomIndex = Math.floor(
      Math.random() * (colors.length < this.settings.value ? colors.length : this.settings.value),
    );
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

  getItemByPosition(searchPosition: GameFieldPosition): IGameField | undefined {
    return this._items.find(({ position }) => position.x === searchPosition.x && position.y === searchPosition.y);
  }

  generateIdByPosition(position: GameFieldPosition): string {
    return position.x + "_" + position.y;
  }

  generateGameItems() {
    const result = [];
    for (let y = 0; y < this.settings.countRows * ThreeInRow.FIELD_SIZE; y += ThreeInRow.FIELD_SIZE) {
      for (let x = 0; x < this.settings.countColumns * ThreeInRow.FIELD_SIZE; x += ThreeInRow.FIELD_SIZE) {
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
    return this._items.find(i => i.id === id) || this._items[0];
  }

  resetGameFieldStates() {
    this._items.forEach(item => {
      item.isPicked = false;
      item.isErrorState = false;
      item.isMoveState = false;
      item.isReadyToClear = false;
      item.isDrop = false;
    });
    this.firstPickedItem = null;
    this.secondPickedItem = null;
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

  modifyItemsToDrop(itemsToDrop: IGameField[], currentItem?: IGameField, nextItem?: IGameField): IGameField[] {
    if (!nextItem || !currentItem) {
      return [];
    }
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
    for (let y = 0; y < this.settings.countRows * ThreeInRow.FIELD_SIZE; y += ThreeInRow.FIELD_SIZE) {
      let itemsToDrop: IGameField[] = [];
      for (
        let x = 0;
        x < this.settings.countColumns * ThreeInRow.FIELD_SIZE - ThreeInRow.FIELD_SIZE;
        x += ThreeInRow.FIELD_SIZE
      ) {
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
    for (let x = 0; x < this.settings.countColumns * ThreeInRow.FIELD_SIZE; x += ThreeInRow.FIELD_SIZE) {
      let itemsToDrop: IGameField[] = [];
      for (
        let y = 0;
        y < this.settings.countRows * ThreeInRow.FIELD_SIZE - ThreeInRow.FIELD_SIZE;
        y += ThreeInRow.FIELD_SIZE
      ) {
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

  getNextColor(x: number, y: number, currentColor: Color): Color {
    let searchedY = y - ThreeInRow.FIELD_SIZE;
    while (searchedY >= 0) {
      const itemToDrop = this.getItemByPosition({ x, y: searchedY });
      if (!itemToDrop) {
        return this.randomColor;
      }
      if (currentColor !== itemToDrop.color) {
        return itemToDrop.color;
      }
      searchedY -= ThreeInRow.FIELD_SIZE;
    }

    return this.randomColor;
  }

  //TODO: has bug when items stays under over item
  async dropItems() {
    const calculatedIds = new Set<string>([]);
    const sortedItemsToDelete = this._items.filter(i => i.isDrop).sort((a, b) => b.position.y - a.position.y);
    console.log(
      "Before make Drop:",
      sortedItemsToDelete.map(i => JSON.parse(JSON.stringify(i))),
    );
    for (const item of sortedItemsToDelete) {
      if (calculatedIds.has(item.id)) {
        continue;
      }
      let lastY = item.position.y;
      const coefficientToUp = sortedItemsToDelete.filter(i => i.position.x === item.position.x).length;
      for (let y = item.position.y; y >= 0; y -= ThreeInRow.FIELD_SIZE) {
        const itemToDrop = this.getItemByPosition({ x: item.position.x, y });
        if (!itemToDrop) {
          continue;
        }
        itemToDrop.color = this.getNextColor(item.position.x, lastY, itemToDrop.color);
        itemToDrop.moveTo.y = itemToDrop.position.y;
        itemToDrop.position.y = y - ThreeInRow.FIELD_SIZE * coefficientToUp;
        itemToDrop.isDrop = true;
        itemToDrop.isReadyToClear = false;
        lastY = itemToDrop.position.y;
        calculatedIds.add(itemToDrop.id);
      }
    }
    console.log("ids to drop:", [...calculatedIds]);
    console.log(
      "state after marks:",
      this._items.filter(i => i.isDrop).map(i => JSON.parse(JSON.stringify(i))),
    );
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
    await this.delay(0.1);
  }

  async markToDrop() {
    await Promise.all([this.horizontalMarkDrop(), this.verticalMarkDrop()]);
    const itemsToDropLength = this._items.filter(i => i.isDrop).length;
    if (itemsToDropLength === 0) {
      this.markPickedItemsAsError();
      await this.delay(0.3);
      await this.swapFields(this.secondPickedItem?.position, this.firstPickedItem?.position);
      throw new Error("No fields to remove.");
    }
    this._items.forEach(item => {
      if (item.isDrop) {
        item.isReadyToClear = true;
      }
      item.isPicked = false;
    });
    await this.delay(0.4);
    await this.dropItems();
  }

  async itemPick(id: string) {
    const item = this.getItem(id);
    item.isPicked = !item.isPicked;
    if (!this.isFullyDisabled.value) {
      return;
    }

    try {
      const [firstItem, secondItem] = this.pickedItems;
      this.firstPickedItem = JSON.parse(JSON.stringify(firstItem)) as IGameField;
      this.secondPickedItem = JSON.parse(JSON.stringify(secondItem)) as IGameField;
      await this.swapFields(this.firstPickedItem.position, this.secondPickedItem.position);
      await this.markToDrop();
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
    }
  }
}

export default ThreeInRow;
