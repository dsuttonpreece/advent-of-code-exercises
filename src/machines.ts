import { assign, createMachine, sendTo } from "xstate";
import { logContext } from "./utils";

export const signalMachine = createMachine(
  {
    /** @xstate-layout N4IgpgJg5mDOIC5SwJZQHYEMA2A6ACmOhCulAMQDaADALqKgAOA9qgC4rPoMgAeiARgCsQ3ABYAbNQCcYgBwBmaQCYRy5QHYANCACegudVzKx06XNMCBy6RKEBfRzvTMIcHqgw4eLdp25IfIgAtBI6+gjBomYxsbFyEk4gnlh4hMSkUD6sKBxcPPwIYsrhghrSxkLU1RryYiLUQhpJKTi4ACJcYNl++YGFqkZCknIq1RJiCgJyQqUIwmLi8ULqGuXSjo5AA */
    id: "signal",
    schema: {
      context: {} as {
        wireOut: string;
        out: number;
      },
      event: {

      }as {}
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
);

export const wireMachine = createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QHcCWAnMA6ACmAdhKvlAMQCCAIpQPoDCA8gHJMCidAKgJLMDaADAF1EoAA4B7WKgAuqcfhEgAHogAsAJiz9tO3TvUAaEAE9EADgCMWAKy6L6gGzWLAZgeOAvh6NpMuAkQkpFxMOACqHALCSCASUrLyiioI6qr8WKoO-ACcbvwOqmYO2daqRqYIFtbZGQDsTsUu2Q4Wudle3iD44hBwir5ginEycgoxyQC01ljZs3Pzc7XZ5YgTDlp6m9q1Xj4Y2HiExFBDkiOJ4+aqNpsu6vxm2epmK5VmmiUurtZmzjnNuxAAywlHkgxiwwSY1AyRc1k0+VS2Xeqg06nRZRMiCqZiw9y+rVqtRccNU1g6HiAA */
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
});

export const gateMachine = createMachine(
  {
    tsTypes: {} as import("./machines.typegen").Typegen2,
    /** @xstate-layout N4IgpgJg5mDOIC5RQIYBcwDoAKYB2EAlnlAMQBKAogMoDyAMgGqUD6dAquQMKsAqtLAJIA5bO14BtAAwBdRKAAOAe1iE0hJXnkgAHogAsAJkxTTZ82YCM+gDQgAnokuGAHJn0BOLwHYArADYAZkNDAI8AX3C7VAwcfCISUmk5JBBlVXVNbT0EQMt-d0MPf18PfUCPAKlfO0cEQ39vd188qW9-KUsXD0tvSOj0LC4UABsAYwBXEfRiMmTtdLUNLVSc330mkv9DS0CSlu9axEN9fXd29e9vSylA-UtKyKiQPCUIOG0YsAWVJazVxAAWl8mC8YPB4Jc-iOCEBBQsCNM1n6IC+cQIsx+GWW2UQXkw3kCLkM1yCRn83RhIQ8oJaNxcnX0Uh6-n0KLRw3GUxmJCxfxWoBy90smF8ll8pV23kqgVuNQcx38BX0dK6t2cnhc7MGmAAIppvqlFpkBbpECUaaErt4QtUPETDFT7gTblIjAz9C57k9wkA */
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
              const [left, right] = context.wiresIn

              const isLeftResolved = !left || Number.isInteger(context.in[0])
              const isRightResolved = !right || Number.isInteger(context.in[1])

              return isLeftResolved && isRightResolved;
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
                      return new Uint16Array([~left])[0];
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
);
