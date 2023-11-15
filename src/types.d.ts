
export interface Signal {
  target: string;
  position: string;
  value: number;
}
type UnaryOperators = "NOT";
type BinaryOperators = "AND" | "OR" | "LEFTSHIFT" | "RIGHTSHIFT";
interface GateOutputBase {
  value?: number;
  position: string;
  target: string;
}
interface GateOutputWaiting extends GateOutputBase {
  value: undefined;
}
interface GateOutputResolved extends GateOutputBase {
  value: number;
}
interface BinaryGateBase {
  left?: number;
  right?: number;
  operator: BinaryOperators;
  output: GateOutputBase;
}
interface BinaryGateWaiting extends BinaryGateBase {
  output: GateOutputWaiting;
}
interface BinaryGateResolved extends BinaryGateBase {
  left: number;
  right: number;
  output: GateOutputResolved;
}

export type BinaryGateContext = BinaryGateWaiting | BinaryGateResolved;
