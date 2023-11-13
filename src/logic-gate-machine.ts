import { createMachine } from "xstate";

interface Wire {
  name: string;
  value: number;
};

interface LogicGateSignal {
  type: "signal";
  value: number;
} // 16 bit unsigned integer

interface LogicGateUnary {
  type: "unary";
  operation: "NOT";
  input: Wire;
}
interface LogicGateBinary {
  type: "binary";
  operation: "AND" | "OR";
  inputs: [Wire, Wire];
}
interface LogicGateBinaryShift {
  type: "binary-shift";
  operation: "LEFTSHIFT" | "RIGHTSHIFT";
  inputs: [Wire, number];
}

type LogicGateContext =
  | LogicGateSignal
  | LogicGateUnary
  | LogicGateBinary
  | LogicGateBinaryShift;

export const logicGateMachine = createMachine({
  tsTypes: {} as import("./logic-gate-machine.typegen").Typegen0,
  schema: {
    context: {} as LogicGateContext,
  },
  id: "logicGate",
  initial: "Waiting",
  states: {
    Waiting: {
      always: [
        {
          target: "Done",
          cond: (context: LogicGateContext) => {
            switch (context.type) {
              case "signal": {
                if (context.value === undefined) return false;

                if (context.value < 0 || context.value > 65535)
                  throw new Error("Signal value must be between 0 and 65535");

                return true;
              }

              case "unary": {
                if (context.input.value === undefined) return false;

                if (context.input.value < 0 || context.input.value > 65535)
                  throw new Error(
                    "Unary input value must be between 0 and 65535"
                  );

                return true;
              }

              case "binary": {
                if (
                  context.inputs[0].value === undefined ||
                  context.inputs[1].value === undefined
                )
                  return false;

                if (
                  context.inputs[0].value < 0 ||
                  context.inputs[0].value > 65535
                )
                  throw new Error(
                    "Binary input 1 value must be between 0 and 65535"
                  );
                if (
                  context.inputs[1].value < 0 ||
                  context.inputs[1].value > 65535
                )
                  throw new Error(
                    "Binary input 2 value must be between 0 and 65535"
                  );

                return true;
              }

              case "binary-shift": {
                if (
                  context.inputs[0].value === undefined ||
                  context.inputs[1] === undefined
                )
                  return false;

                if (
                  context.inputs[0].value < 0 ||
                  context.inputs[0].value > 65535
                )
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
      ],
    },
    Done: {},
  },
});
