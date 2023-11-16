import { assign, createActor, createMachine, sendTo } from "xstate";

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
          value: 123,
        },
      },
    },
    signal456: {
      invoke: {
        src: "signalMachine",
        input: {
          wireOut: "y",
          value: 456,
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
          operator: string;
          wiresIn: any[];
          inputs: number[];
          wireOut: string;
        },
        entry: [
          assign({
            wiresIn: ({ event }) => event.input.wiresIn,
            operator: ({ event }) => event.input.operator,
            wireOut: ({ event }) => event.input.wireOut,
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
            ],
            on: {
              RESOLVE_SOURCE_TO_INPUT: {
                target: "Pending",
                actions: [
                  assign({
                    inputs: ({ context, event }) => {
                      const newInput = [...context.inputs || []];
                      newInput[event.position] = event.value;
                      return newInput;
                    },
                  }),
                ],
              },
            },
            always: [
              {
                target: "Done",
                guard: ({ context }) =>
                  context.inputs?.length === context.wiresIn?.length,
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
                  input: ({ event }) => event.value,
                }),
              ],
            },
          },
        },
        Done: {
          type: "final",
          entry: [
            ({ context, self }) => {
              context.connections.map((reply) => {
                reply.actor.send({ ...reply, value: context.input });
              });
            },
          ],
        },
      },
    }),
    signalMachine: createMachine({
      id: "signal",
      context: {} as {
        value: number;
        wireOut: string;
      },
      entry: [
        sendTo(
          ({ event, system }) => system.get(event.input.wireOut),
          ({ event, self }) => ({
            type: "INPUT",
            value: event.input.value,
            self,
          })
        ),
      ],
    }),
  },
});

const actor = createActor(parentMachine, { systemId: "parent" });

// Subscribe to updated snapshots (emitted state changes) from the actor
actor.subscribe((snapshot: any) => {
  // console.log("Value:", snapshot);
});

actor.start();
