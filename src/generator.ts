const operators = ["AND", "OR", "LSHIFT", "RSHIFT", "NOT", 'NOOP'] as const;

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
        input: {
          id,
        },
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
  const [left, right] = wiresIn;

  let valuesIn: (number | undefined)[] = [undefined, undefined];

  if (left?.match(/^\d+$/)) {
    valuesIn[0] = parseInt(left);
  } else {
    wiresIn[0] = left;
  }

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
      },
    },
  };
};

export function generateMachineSpecFromInstructions(instructionsRaw: string) {
  const instructions = instructionsRaw.split("\n").filter(Boolean);

  const invocationStates = instructions.reduce(
    (acc, line): any => {
      const [gateDefinition, wireOut] = line.split(" -> ");

      const pieces = gateDefinition.split(" ");

      switch (pieces.length) {
        case 1:
          if (pieces[0].match(/^\d+$/)) {
            // Signal
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
          } else {
            // Passthrough
            return {
              ...acc,
              wires: [
                ...acc.wires,
                buildWireInvocation(pieces[0]),
                buildWireInvocation(wireOut),
              ],
              gates: [
                ...acc.gates,
                buildGateInvocation({
                  wiresIn: [pieces[0]],
                  operator: "NOOP",
                  wireOut,
                }),
              ],
            };
          }

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
      ...Object.assign({}, ...invocationStates.signals),
    },
  };
}
