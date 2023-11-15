import { assign, createMachine, sendTo } from "xstate";

import type { Signal } from "./types";

export const signalMachine = createMachine(
  {
    // @ts-ignore
    tsTypes: {} as import("./signalMachine.typegen").Typegen0,
    id: "signal",
    schema: {
      context: {} as Signal,
      events: {},
    },
    initial: "Init",
    states: {
      Init: {
        entry: ["initContextOnSpawn"],
        always: "Done",
      },
      Done: {
        entry: ["sendValueToGate"],
        type: "final",
      },
    },
  },
  {
    actions: {
      initContextOnSpawn: assign({
        target: ({ event }) => event.input.target,
        position: ({ event }) => event.input.position,
        value: ({ event }) => event.input.value,
      }),
      sendValueToGate: sendTo(
        ({ context, system }) => system.get(context.target || ""),
        ({ context, self }) => ({
          type: "SIGNAL",
          value: context.value,
          position: context.position,
          origin: self,
        })
      ),
    },
  }
);
