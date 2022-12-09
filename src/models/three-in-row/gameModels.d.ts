export enum FieldType {
  SQUARE = "square",
  CIRCLE = "circle",
  DIAMOND = "diamond",
  TRIANGLE = "triangle",
  STAR = "star",
  PENTAGON = "pentagon",
  HEXAGON = "hexagon",
  OCTAGON = "octagon",
  RABBET = "rabbet",
}

export interface GameFieldPosition {
  x: number;
  y: number;
}

export interface GameField {
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
