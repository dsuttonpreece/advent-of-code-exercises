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

const buildSignalInvocation = (initialContext: {
  wireOut: string;
  out: number;
}) => {
  const { wireOut, out } = initialContext;

  return {
    [`signal_${out}`]: {
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

const buildWireInvocation = (id) => {
  return {
    [`wire_${id}`]: {
      invoke: {
        src: "wireMachine",
        systemId: id,
      },
    },
  };
};

const buildGateInvocation = (initialContext: {
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
    [`gate_${[wiresIn[0], operator, wiresIn[1]].filter(Boolean).join("_")}`]: {
      invoke: {
        src: "gateMachine",
        input: {
          wiresIn,
          in: valuesIn,
          operator,
          wireOut,
        },
      }
    },
  };
};

function parseInstructions(instructions: string) {
  const lines = instructions.split("\n").filter(Boolean);

  const invocationStates = lines.reduce(
    (acc, line): any => {
      const [gateDefinition, wireOut] = line.split(" -> ");

      const pieces = gateDefinition.split(" ");

      switch (pieces.length) {
        case 1:
          return {
            ...acc,
            wires: [...acc.wires, buildWireInvocation(wireOut)],
            signals: [
              ...acc.signals,
              buildSignalInvocation({
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
              buildWireInvocation(pieces[1]),
              buildWireInvocation(wireOut),
            ],
            gates: [
              ...acc.gates,
              buildGateInvocation({
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
              buildWireInvocation(pieces[0]),
              buildWireInvocation(pieces[2]),
              buildWireInvocation(wireOut),
            ],
            gates: [
              ...acc.gates,
              buildGateInvocation({
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


  
  return {
    id: "breadboard",
    type: "parallel",
    states: {
      // Wires
      ...Object.assign({}, ...invocationStates.wires),
  
      // Gates
      ...Object.assign({}, ...invocationStates.gates),
  
      // Signals
      ...Object.assign({}, ...invocationStates.signals)
    },
  }
}

const demoMachineSpec = parseInstructions(demoInstructions)

const parentMachine = createMachine(demoMachineSpec).provide({
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

actor.start();
