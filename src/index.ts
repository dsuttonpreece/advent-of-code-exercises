import { createActor, createMachine } from "xstate";

import { signalMachine, wireMachine, gateMachine } from "./machines";

const demoInstructions = `
123 -> x
456 -> y
x AND y -> d
x OR y -> e
x LSHIFT 2 -> f
y RSHIFT 2 -> g
NOT x -> h
NOT y -> i
`;

const operators = ["AND", "OR", "LSHIFT", "RSHIFT", "NOT"] as const;

const buildSignalMachine = (initialContext: {
  wireOut: string;
  out: number;
}) => {
  const { wireOut, out } = initialContext;

  return {
    [`signal.${out}`]: {
      invoke: {
        src: "signalMachine",
        input: {
          wireOut,
          out,
        },
      },
    },
  };
};

const buildWireMachine = (id) => {
  return {
    [`wire.${id}`]: {
      invoke: {
        src: "wireMachine",
        systemId: id,
      },
    },
  };
};

const buildGateMachine = (initialContext: {
  wiresIn: string[];
  operator: (typeof operators)[number];
  wireOut: string;
}) => {
  const { wiresIn, operator, wireOut } = initialContext;
  const [, right] = wiresIn;

  let valuesIn: number[] = [];

  // If the right side is a number, we don't need to wire it in (only for LSHIFT, RSHIFT)
  if (right?.match(/^\d+$/)) {
    valuesIn[1] = parseInt(right);
  } else {
    wiresIn[1] = right;
  }

  return {
    [`gate.${[wiresIn[0], operator, wiresIn[1]].filter(Boolean).join(".")}`]: {
      src: "gateMachine",
      input: {
        wiresIn,
        in: valuesIn,
        operator,
        wireOut,
      },
    },
  };
};

function parseInstructions(instructions: string) {
  const lines = instructions.split("\n").filter(Boolean);

  const definitions = lines.reduce(
    (acc, line): any => {
      const [gateDefinition, wireOut] = line.split(" -> ");

      const pieces = gateDefinition.split(" ");

      switch (pieces.length) {
        case 1:
          return {
            ...acc,
            wires: [...acc.wires, buildWireMachine(wireOut)],
            signals: [
              ...acc.signals,
              buildSignalMachine({
                wireOut,
                out: parseInt(pieces[0]),
              }),
            ],
          };
        case 2:
          return {
            ...acc,
            wires: [
              ...acc.wires,
              buildWireMachine(pieces[1]),
              buildWireMachine(wireOut),
            ],
            gates: [
              ...acc.gates,
              buildGateMachine({
                wiresIn: [pieces[1]],
                operator: pieces[0] as (typeof operators)[number],
                wireOut,
              }),
            ],
          };
        case 3:
          return {
            ...acc,
            wires: [
              ...acc.wires,
              buildWireMachine(pieces[0]),
              buildWireMachine(pieces[2]),
              buildWireMachine(wireOut),
            ],
            gates: [
              ...acc.gates,
              buildGateMachine({
                wiresIn: [pieces[0], pieces[2]],
                operator: pieces[1] as (typeof operators)[number],
                wireOut,
              }),
            ],
          };
      }
    },
    { signals: [], wires: [], gates: [] }
  );

  return definitions;
}

console.log(parseInstructions(demoInstructions));

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
    gateMachine,
    wireMachine,
    signalMachine,
  },
});

const actor = createActor(parentMachine, { systemId: "parent" });

// Subscribe to updated snapshots (emitted state changes) from the actor
actor.subscribe((snapshot: any) => {
  // console.log("Value:", snapshot);
});

// actor.start();
