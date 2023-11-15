import { assign, createMachine } from "xstate";

import type { BinaryGateContext, Signal } from "./types";

export const binaryGateMachine = createMachine(
  {
    // @ts-ignore
    tsTypes: {} as import("./binaryGateMachine.typegen").Typegen0,
    id: "binary-gate",
    initial: "Waiting",
    schema: {
      context: {} as BinaryGateContext,
      events: {} as {
        SIGNAL: Signal & {
          type: "SIGNAL";
        };
      },
    },
    states: {
      Waiting: {
        entry: ["initContextOnSpawn"],
        on: {
          SIGNAL: {
            target: "Waiting",
            actions: ["setInputValue"],
          },
        },
        always: [
          {
            target: "Calculate",
            guard: "isReadyToCalculateResult",
          },
        ],
      },
      Calculate: {
        always: [
          {
            target: "Done",
            actions: ["calculateOutputValue"],
          },
        ],
      },
      Done: {
        entry: [
          ({ context }) => {
            console.log("Done", context);
          },
          // sendTo(
          //   ({ system }) => system.get("parent"),
          //   ({ context, self }) => ({
          //     type: "SIGNAL",
          //     value: context.result,
          //     position: context.position,
          //     origin: self,
          //   })
          // ),
        ],
        type: "final",
      },
    },
  },
  {
    guards: {
      isReadyToCalculateResult: ({ context }) => {
        if (!context.output.position)
          throw new Error("Gate - init without output position");
        if (!context.output.target)
          throw new Error("Gate - init without output target");
        if (context.operator === undefined)
          throw new Error("Gate - init without operator");

        if (!Number.isInteger(context.left) || !Number.isInteger(context.right))
          return false;

        return true;
      },
    },
    actions: {
      initContextOnSpawn: assign(({ event }) => ({
        left: event.input.left,
        right: event.input.right,
        operator: event.input.operator,
        output: {
          position: event.input.output.position,
          target: event.input.output.target,
        },
      })),
      setInputValue: assign(({ event }) => {
        return {
          [event.position]: event.value,
        };
      }),
      calculateOutputValue: assign({
        output: ({ context }) => {
          let value;
          switch (context.operator) {
            case "AND":
              value = context.left & context.right;
              break;

            case "OR":
              value = context.left | context.right;
              break;
          }

          return {
            ...context.output,
            value,
          };
        },
      }),
    },
  }
);
