import { createActor, createMachine } from "xstate";

import { signalMachine, wireMachine, gateMachine } from "./machines";

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

actor.start();
