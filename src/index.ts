import { assign, createActor, createMachine, sendTo } from "xstate";

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

type BinaryGateContext = BinaryGateWaiting | BinaryGateResolved;

const binaryGateMachine = createMachine(
  {
    tsTypes: {} as import("./index.typegen").Typegen0,
    id: "binary-gate",
    initial: "Waiting",
    schema: {
      context: {} as BinaryGateContext,
      events: {},
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
