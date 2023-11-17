import { createActor, createMachine } from "xstate";

import { signalMachine, wireMachine, gateMachine } from "./machines";
import { generateMachineSpecFromInstructions } from "./generator";

import demoInstructions from "./instructions/demo";
import challengeInstructions from "./instructions/challenge";

const machineSpec = generateMachineSpecFromInstructions(demoInstructions)

const breadboardMachine = createMachine(machineSpec).provide({
  actors: {
    gateMachine,
    wireMachine,
    signalMachine,
  },
});

const actor = createActor(breadboardMachine);

actor.start();
