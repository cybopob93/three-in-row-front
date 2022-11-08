import type { Settings } from "@/models/three-in-row/settings";
import type { GameField, Color } from "@/models/three-in-row/gameModels";
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

  constructor(settings: Settings) {
    this._settings = settings;
    this._items = reactive(this.generateGameItems());
    this.isFullyDisabled = computed(() => {
      return this._items.filter((i) => i.isPicked).length >= 2;
    });
  }

  get randomColor(): Color {
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

  get items() {
    return this._items.map((i) => ({
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
    const [firstItem, secondItem] = this._items.filter((i) => i.isPicked);
    if (!firstItem || !secondItem) {
      throw new WrongChoiceError();
    }

    if (
      firstItem.position.x !== secondItem.position.x &&
      firstItem.position.y !== secondItem.position.y
    ) {
      throw new WrongChoiceError();
    }

    if (firstItem.color === secondItem.color) {
      throw new WrongChoiceError();
    }

    return [firstItem, secondItem];
  }

  generateGameItems() {
    const result = [];
    for (let y = 0; y < this.settings.countRows; y++) {
      for (let x = 0; x < this.settings.countColumns; x++) {
        result.push({
          id: x * 50 + "_" + y * 50,
          position: {
            x: x * 50,
            y: y * 50,
          },
          color: this.randomColor,
          isErrorState: false,
          isPicked: false,
          isMoveState: false,
          isReadyToClear: false,
          isDrop: false,
          moveTo: {
            x: x * 50,
            y: y * 50,
          },
        });
      }
    }
    return result;
  }

  async delay(sec = 1): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, sec * 1000);
    });
  }

  getItem(id: string): IGameField {
    return this._items.find((i) => i.id === id) || this._items[0];
  }

  resetGameFieldStates() {
    this._items.forEach((item) => {
      item.isPicked = false;
      item.isErrorState = false;
      item.isMoveState = false;
      item.isReadyToClear = false;
      item.isDrop = false;
    });
  }

  async swapFields() {
    const [firstItem, secondItem] = this.pickedItems;
    const firstPosition = { ...firstItem.position };
    const secondPosition = { ...secondItem.position };
    firstItem.moveTo = { ...secondPosition };
    secondItem.moveTo = { ...firstPosition };
    firstItem.isMoveState = true;
    secondItem.isMoveState = true;
    await this.delay(0.5);
    // TODO: save previousPosition
    firstItem.position = { ...secondPosition };
    secondItem.position = { ...firstPosition };
  }

  async itemPick(id: string) {
    const item = this.getItem(id);
    item.isPicked = true;
    if (!this.isFullyDisabled.value) {
      return;
    }

    try {
      await this.swapFields();
    } catch {
      this._items.forEach((el) => {
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
    const { position: startPosition } =
      this._items.find((i) => i.id === id) || this._items[0];
    this._items.forEach((i) => {
      if (i.position.x === startPosition.x && i.position.y <= startPosition.y) {
        i.position.y -= 50;
        i.isMoveState = true;
      }
    });
    await this.delay(0.5);
    this._items.forEach((i) => {
      if (i.isMoveState) {
        i.position.y = i.moveTo.y;
        i.isMoveState = false;
      }
    });
  }
}

export default ThreeInRow;
