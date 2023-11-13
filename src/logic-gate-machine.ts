import { createMachine } from "xstate";

type WireName = string

interface Wire {
  name: WireName;
  value: number;
}

interface LogicGateSignal {
  type: "signal";
  value: number;
  target: WireName;
} // 16 bit unsigned integer

interface LogicGateUnary {
  type: "unary";
  operation: "NOT";
  input: Wire;
  target: WireName;
}
interface LogicGateBinary {
  type: "binary";
  operation: "AND" | "OR";
  inputs: [Wire, Wire];
  target: WireName;
}
interface LogicGateBinaryShift {
  type: "binary-shift";
  operation: "LEFTSHIFT" | "RIGHTSHIFT";
  inputs: [Wire, number];
  target: WireName;
}

export type LogicGate =
  | LogicGateSignal
  | LogicGateUnary
  | LogicGateBinary
  | LogicGateBinaryShift;

export const logicGateMachine = createMachine(
  {
    tsTypes: {} as import("./logic-gate-machine.typegen").Typegen0,
    schema: {
      context: {} as LogicGate,
    },
    id: "logicGate",
    initial: "Waiting",
    states: {
      Waiting: {
        always: [
          {
            target: "Done",
            guard: "validateContext",
          },
        ],
      },
      Done: {},
    },
  },
  {
    guards: {
      validateContext: ({event}) => {
        const data = event.input

        console.log(data);
        
        switch (data.type) {
          case "signal": {
            if (data.value === undefined) return false;

            if (data.value < 0 || data.value > 65535)
              throw new Error("Signal value must be between 0 and 65535");

            return true;
          }

          case "unary": {
            if (data.input.value === undefined) return false;

            if (data.input.value < 0 || data.input.value > 65535)
              throw new Error("Unary input value must be between 0 and 65535");

            return true;
          }

          case "binary": {
            if (
              data.inputs[0].value === undefined ||
              data.inputs[1].value === undefined
            )
              return false;

            if (data.inputs[0].value < 0 || data.inputs[0].value > 65535)
              throw new Error(
                "Binary input 1 value must be between 0 and 65535"
              );
            if (data.inputs[1].value < 0 || data.inputs[1].value > 65535)
              throw new Error(
                "Binary input 2 value must be between 0 and 65535"
              );

            return true;
          }

          case "binary-shift": {
            if (
              data.inputs[0].value === undefined ||
              data.inputs[1] === undefined
            )
              return false;

            if (data.inputs[0].value < 0 || data.inputs[0].value > 65535)
              throw new Error(
                "Binary input 1 value must be between 0 and 65535"
              );

            return true;
          }

          default: {
            return false;
          }
        }
      },
    },
  }
);
