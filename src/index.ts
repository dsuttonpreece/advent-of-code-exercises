import { createActor, createMachine } from "xstate";

import { LogicGate, logicGateMachine } from "./logic-gate-machine";

const machine = createMachine({
  tsTypes: {} as import("./index.typegen").Typegen0,
  schema: {
    context: {
      gates: [],
    } as { gates: LogicGate[] },
  },
    id: "machine",
    
});

const actor = createActor(logicGateMachine, {
  input: {
    type: "signal",
    value: 1,
    target: "a",
  },
});

// Subscribe to updated snapshots (emitted state changes) from the actor
actor.subscribe((snapshot: any) => {
  console.log("Value:", snapshot.value);
});

actor.start();
