import { assign, createActor, createMachine, sendTo } from "xstate";

const binaryGateMachine = createMachine({
  tsTypes: {} as import("./index.typegen").Typegen0,
  id: "binary-gate",

  initial: "Waiting",
  context: {
    left: undefined,
    right: undefined,
    operator: undefined,
  },
  states: {
    Waiting: {
      entry: [
        assign({
          left: ({ event }) => event.input.left,
          right: ({ event }) => event.input.right,
          operator: ({ event }) => event.input.operator,
        }),
      ],
      on: {
        SIGNAL: {
          target: "Waiting",
          actions: [
            assign(({ event }) => {
              return {
                [event.position]: event.value,
              };
            }),
          ],
        },
      },
      always: [
        {
          target: "Done",
          guard: ({ context }) => {
            const { left, right, operator } = context;

            if (operator === undefined)
              throw new Error("BinaryGate - init without operator");

            if (!Number.isInteger(left) || !Number.isInteger(right)) return false;

            return true;
          },
        },
      ],
    },
    Done: {
      // TODO: spanw output signal
      type: "final",
    },
  },
});

const signalMachine = createMachine({
  tsTypes: {} as import("./index.typegen").Typegen1,
  id: "signal",
  initial: "Waiting",
  context: {
    target: undefined,
    position: undefined,
    value: undefined,
  },
  states: {
    Waiting: {
      entry: [
        assign({
          target: ({ event }) => event.input.target,
          position: ({ event }) => event.input.position,
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
            type: "SIGNAL",
            value: context.value,
            position: context.position,
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
