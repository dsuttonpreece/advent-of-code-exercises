
  // This file was automatically generated. Edits will be overwritten

  export interface Typegen0 {
        '@@xstate/typegen': true;
        internalEvents: {
          "xstate.init": { type: "xstate.init" };
        };
        invokeSrcNameMap: {
          "gateMachine": "done.invoke.parent.gateNotX:invocation[0]";
"signalMachine": "done.invoke.parent.signal123:invocation[0]" | "done.invoke.parent.signal456:invocation[0]";
"wireMachine": "done.invoke.parent.wireX:invocation[0]" | "done.invoke.parent.wireY:invocation[0]";
        };
        missingImplementations: {
          actions: never;
          delays: never;
          guards: never;
          services: "gateMachine" | "signalMachine" | "wireMachine";
        };
        eventsCausingActions: {
          
        };
        eventsCausingDelays: {
          
        };
        eventsCausingGuards: {
          
        };
        eventsCausingServices: {
          "gateMachine": "xstate.init";
"signalMachine": "xstate.init";
"wireMachine": "xstate.init";
        };
        matchesStates: "gateNotX" | "signal123" | "signal456" | "wireX" | "wireY";
        tags: never;
      }
  