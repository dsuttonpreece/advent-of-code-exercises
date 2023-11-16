import { assign, createActor, createMachine, raise, sendTo } from "xstate";

import { logContext } from "./utils";

const parentMachine = createMachine({
  // @ts-ignore
  tsTypes: {} as import("./index.typegen").Typegen0,
  id: "parent",
  context: {},
  type: "parallel",
  states: {
    // Wires
    wireX: {
      invoke: {
        src: "wireMachine",
        systemId: "x",
      },
    },
    wireY: {
      invoke: {
        src: "wireMachine",
        systemId: "y",
      },
    },

    // Gates
    gateXandY: {
      invoke: {
        src: "gateMachine",
        input: {
          wiresIn: ["x", "y"],
          operator: "AND",
          wireOut: "d",
        },
      },
    },
    gateXorY: {
      invoke: {
        src: "gateMachine",
        input: {
          wiresIn: ["x", "y"],
          operator: "OR",
          wireOut: "e",
        },
      },
    },
    gateLShiftX2: {
      invoke: {
        src: "gateMachine",
        input: {
          wiresIn: ["x"],
          in: [undefined, 2],
          operator: "LSHIFT",
          wireOut: "f",
        },
      },
    },
    gateRShiftY2: {
      invoke: {
        src: "gateMachine",
        input: {
          wiresIn: ["y"],
          in: [undefined, 2],
          operator: "RSHIFT",
          wireOut: "g",
        },
      },
    },
    gateNotX: {
      invoke: {
        src: "gateMachine",
        input: {
          wiresIn: ["x"],
          operator: "NOT",
          wireOut: "h",
        },
      },
    },

    // Signals
    signal123: {
      invoke: {
        src: "signalMachine",
        input: {
          wireOut: "x",
          out: 123,
        },
      },
    },
    signal456: {
      invoke: {
        src: "signalMachine",
        input: {
          wireOut: "y",
          out: 456,
        },
      },
    },
  },
}).provide({
  actors: {
    gateMachine: createMachine(
      {
        id: "gate",
        initial: "Pending",
        context: {} as {
          wiresIn: any[];
          wireOut: string;
          operator: string;
          in: any[];
          out?: number;
        },
        entry: [
          assign({
            wiresIn: ({ event }) => event.input.wiresIn,
            wireOut: ({ event }) => event.input.wireOut,
            operator: ({ event }) => event.input.operator,
            in: ({ event }) => event.input.in,
          }),
        ],
        states: {
          Pending: {
            entry: [
              sendTo(
                ({ context, system }) => system.get(context.wiresIn[0]),
                ({ self }) => ({
                  type: "ADD_CONNECTION",
                  reply: {
                    type: "RESOLVE_SOURCE_TO_INPUT",
                    position: 0,
                    actor: self,
                  },
                })
              ),
              sendTo(
                ({ context, system }) => system.get(context.wiresIn[1]),
                ({ self }) => ({
                  type: "ADD_CONNECTION",
                  reply: {
                    type: "RESOLVE_SOURCE_TO_INPUT",
                    position: 1,
                    actor: self,
                  },
                })
              ),
            ],
            on: {
              RESOLVE_SOURCE_TO_INPUT: {
                reenter: true,
                target: "Pending",
                actions: [
                  assign({
                    in: ({ context, event }) => {
                      const newInput = [...(context.in || [])];
                      newInput[event.position] = event.out;
                      return newInput;
                    },
                  }),
                ],
              },
            },
            always: [
              {
                target: "Calculating",
                guard: ({ context }) => {
                  const areAllInputsNumbers = context.in
                    ?.map((value) => Number.isInteger(value))
                    .every(Boolean);

                  const areThereMoreInputsThanWires =
                    context.in?.length >= context.wiresIn.length;

                  return areAllInputsNumbers && areThereMoreInputsThanWires;
                },
              },
            ],
          },
          Calculating: {
            always: [
              {
                target: "Done",
                actions: [
                  assign({
                    out: ({ context }) => {
                      const [left, right] = context.in;

                      switch (context.operator) {
                        case "NOT":
                          return new Uint16Array([~left])[0]
                        case "AND":
                          return left & right;
                        case "OR":
                          return left | right;
                        case "LSHIFT":
                          return left << right;
                        case "RSHIFT":
                          return left >> right;
                        default:
                          return undefined;
                      }
                    },
                  }),
                ],
              },
            ],
          },
          Done: {
            type: "final",
            entry: ["logContext"],
          },
        },
      },
      {
        actions: {
          logContext,
        },
      }
    ),
    wireMachine: createMachine({
      id: "wire",
      initial: "Pending",
      context: { connections: [] } as {
        input?: number;
        connections: any[];
      },
      states: {
        Pending: {
          on: {
            ADD_CONNECTION: {
              reenter: true,
              target: "Pending",
              actions: [
                assign({
                  connections: ({ context, event }) => [
                    ...context.connections,
                    event.reply,
                  ],
                }),
              ],
            },
            INPUT: {
              target: "Done",
              actions: [
                assign({
                  input: ({ event }) => event.out,
                }),
              ],
            },
          },
        },
        Done: {
          type: "final",
          entry: [
            ({ context }) => {
              context.connections.map((reply) => {
                reply.actor.send({ ...reply, out: context.input });
              });
            },
          ],
        },
      },
    }),
    signalMachine: createMachine(
      {
        /** @xstate-layout N4IgpgJg5mDOIC5SwJZQHYEMA2A6ACmOhCulAMQDaADALqKgAOA9qgC4rPoMgAeiARgCsQ3ABYAbNQCcYgBwBmaQCYRy5QHYANCACegudVzKx06XNMCBy6RKEBfRzvTMIcHqgw4eLdp25IfIgAtBI6+gjBomYxsbFyEk4gnlh4hMSkUD6sKBxcPPwIYsrhghrSxkLU1RryYiLUQhpJKTi4ACJcYNl++YGFqkZCknIq1RJiCgJyQqUIwmLi8ULqGuXSjo5AA */
        id: "signal",
        context: {} as {
          wireOut: string;
          out: number;
        },
        initial: "Pending",
        entry: [
          assign({
            wireOut: ({ event }) => event.input.wireOut,
            out: ({ event }) => event.input.out,
          }),
        ],
        states: {
          Pending: {
            always: [
              {
                target: "Done",
                guard: ({ context }) => typeof context.out == "number",
              },
            ],
          },
          Done: {
            type: "final",
            entry: [
              "logContext",

              sendTo(
                ({ context, system }) => system.get(context.wireOut),
                ({ context }) => ({
                  type: "INPUT",
                  out: context.out,
                })
              ),
            ],
          },
        },
      },
      {
        actions: {
          logContext,
        },
      }
    ),
  },
});

const actor = createActor(parentMachine, { systemId: "parent" });

// Subscribe to updated snapshots (emitted state changes) from the actor
actor.subscribe((snapshot: any) => {
  // console.log("Value:", snapshot);
});

actor.start();
