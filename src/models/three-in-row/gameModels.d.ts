import Colors from "@/models/three-in-row/colors";

export type Color = keyof typeof Colors;

export interface GameFieldPosition {
  x: number;
  y: number;
}

export interface GameField {
  position: GameFieldPosition;
  color: Color;
  isErrorState: boolean;
  isPicked: boolean;
  isMoveState: boolean;
  isReadyToClear: boolean;
  moveTo: {
    x: string;
    y: string;
  }
}