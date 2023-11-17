import { createActor, createMachine } from "xstate";

import { signalMachine, wireMachine, gateMachine } from "./machines";
import { generateMachineSpecFromInstructions } from "./generator";

import demoInstructions from "./instructions/demo";
import challengeInstructions from "./instructions/challenge";

const test =`
123 -> a
234 -> b
b OR a -> c
c RSHIFT 2 -> d
b AND c -> e
`

const machineSpec = generateMachineSpecFromInstructions(test)
console.log(JSON.stringify(machineSpec, null, 2))

const breadboardMachine = createMachine(machineSpec).provide({
  actors: {
    gateMachine,
    wireMachine,
    signalMachine,
  },
});

const actor = createActor(breadboardMachine);

actor.start();
