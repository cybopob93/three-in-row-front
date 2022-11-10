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
  static FIELD_SIZE = 90;

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

  getItemByPosition(searchPosition: GameFieldPosition): IGameField {
    return (
      this._items.find(({ position }) => position.x === searchPosition.x && position.y === searchPosition.y) ||
      this._items[0]
    );
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

  async swapFields({ x: fX, y: fY }: GameFieldPosition, { x: sX, y: sY }: GameFieldPosition) {
    const [firstItem, secondItem] = this.pickedItems;
    firstItem.moveTo = { x: sX, y: sY };
    secondItem.moveTo = { x: fX, y: fY };
    firstItem.isMoveState = true;
    secondItem.isMoveState = true;
    await this.delay(0.5);
    firstItem.position = { x: sX, y: sY };
    secondItem.position = { x: fX, y: fY };
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
      }
      if (itemsToDrop.length >= 3) {
        itemsToDrop.forEach(item => {
          item.isDrop = true;
        });
      }
    }
  }

  async markToDrop() {
    await Promise.all([this.horizontalMarkDrop()]);
    console.log(this._items.filter(i => i.isDrop));
  }

  async itemPick(id: string) {
    const item = this.getItem(id);
    item.isPicked = true;
    if (!this.isFullyDisabled.value) {
      return;
    }

    try {
      const [firstItem, secondItem] = this.pickedItems;
      this.firstPickedItem = {
        ...firstItem,
        position: { ...firstItem.position },
        moveTo: { ...firstItem.moveTo },
      };
      this.secondPickedItem = {
        ...secondItem,
        position: { ...secondItem.position },
        moveTo: { ...secondItem.moveTo },
      };
      await this.swapFields(this.firstPickedItem.position, this.secondPickedItem.position);
      await this.markToDrop();
    } catch {
      this._items.forEach(el => {
        if (!el.isPicked) {
          return;
        }
        el.isErrorState = true;
      });
      await this.delay(0.5);
    } finally {
      this.resetGameFieldStates();
    }
  }

  async itemClick2(id: string) {
    const { position: startPosition } = this._items.find(i => i.id === id) || this._items[0];
    this._items.forEach(i => {
      if (i.position.x === startPosition.x && i.position.y <= startPosition.y) {
        i.position.y -= 50;
        i.isMoveState = true;
      }
    });
    await this.delay(0.5);
    this._items.forEach(i => {
      if (i.isMoveState) {
        i.position.y = i.moveTo.y;
        i.isMoveState = false;
      }
    });
  }
}

export default ThreeInRow;
