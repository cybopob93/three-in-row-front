import type { Settings } from "@/models/three-in-row/settings";
import type { GameField, Color } from "@/models/three-in-row/gameModels";
import { reactive } from "vue";
import type { ReactiveVariable } from "vue/macros";

interface IGameField extends GameField {
  id: string;
}

class ThreeInRow {
  private readonly _settings: Settings;
  private readonly _items: ReactiveVariable<IGameField[]>;

  constructor(settings: Settings) {
    this._settings = settings;
    this._items = reactive(this.generateGameItems());
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

  async itemClick(id: string) {
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
