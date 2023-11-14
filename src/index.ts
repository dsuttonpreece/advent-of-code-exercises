import { assign, createActor, createMachine, sendTo } from "xstate";

const binaryGateMachine = createMachine({
  tsTypes: {} as import("./index.typegen").Typegen0,
  id: "binary-gate",
  on: {
    SIGNAL: {
      actions: ({ event }) => {
        console.log("received");
      },
    },
  },
  // initial: "Waiting",
  // context: {
  //   left: undefined,
  //   right: undefined,
  //   operator: undefined,
  // },
  // states: {
  //   Waiting: {
  //     entry: [
  //       assign({
  //         left: ({ event }) => event.input.left,
  //         right: ({ event }) => event.input.right,
  //         operator: ({ event }) => event.input.operator,
  //       }),
  //     ],
  //     on: {
  //       SIGNAL: [
  //         {
  //           target: "Done",
  //           guard: ({ context, event }) => {
  //             const { left, right, operator } = context;

  //             if (operator === undefined)
  //               throw new Error("BinaryGate - init without operator");

  //             if (left || right) return false;
  //             return true;
  //           },
  //         },
  //       ],
  //     },
  //   },
  //   Done: {
  //     type: "final",
  //   },
  // },
});

const signalMachine = createMachine({
  tsTypes: {} as import("./index.typegen").Typegen1,
  id: "signal",
  initial: "Waiting",
  context: {
    target: undefined,
    value: undefined,
  },
  states: {
    Waiting: {
      entry: [
        assign({
          target: ({ event }) => event.input.target,
          value: ({ event }) => event.input.value,
        }),
      ],
      always: "Done",
    },
    Done: {
      entry: [
        sendTo(
          ({ context, system }) => system.get(context.target || ""),
          ({ context, self }) => ({
            type: 'SIGNAL',
            value: context.value,
            origin: self,
          })
        ),
      ],
      type: "final",
    },
  },
});

const parentMachine = createMachine({
  tsTypes: {} as import("./index.typegen").Typegen2,
  id: "parent",
  context: {},
  entry: [
    assign({
      gateRefs: ({ spawn }) => [
        spawn("binaryGate", {
          systemId: "a",
          input: {
            operator: "AND",
          },
        }),
      ],
      signalRefs: ({ spawn }) => [
        spawn("signal", {
          input: { target: "a", value: 0 },
        }),
        spawn("signal", {
          input: { target: "a", value: 1 },
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
