import { assign, createActor, createMachine } from "xstate";

import { signalMachine } from "./signalMachine";
import { binaryGateMachine } from "./binaryGateMachine";

const parentMachine = createMachine({
    // @ts-ignore
  tsTypes: {} as import("./index.typegen").Typegen0,
  id: "parent",
  context: {},
  systemId: "parent",
  on: {
    CREATE_SIGNAL: {
      actions: [
        assign({
          signalRefs: ({ context, event, spawn }) => [
            ...context.signalRefs,
            spawn("signal", {
              input: {
                target: event.target,
                position: event.position,
                value: event.value,
              },
            }),
          ],
        }),
      ],
    },
  },
  entry: [
    assign({
      gateRefs: ({ spawn }) => [
        spawn("binaryGate", {
          systemId: "a",
          input: {
            operator: "AND",
            output: { target: "b", position: "left" },
          },
        }),
      ],
      signalRefs: ({ spawn }) => [
        spawn("signal", {
          input: { target: "a", position: "left", value: 0 },
        }),
        spawn("signal", {
          input: { target: "a", position: "right", value: 1 },
        }),
      ],
    }),
  ],
}).provide({
  actors: {
    signal: signalMachine,
    binaryGate: binaryGateMachine,
  },
});

const actor = createActor(parentMachine);

// Subscribe to updated snapshots (emitted state changes) from the actor
actor.subscribe((snapshot: any) => {
  // console.log("Value:", snapshot);
});

actor.start();
