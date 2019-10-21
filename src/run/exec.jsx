import path from "path";
import { wait } from "@nebulario/core-process";
import * as Config from "@nebulario/core-config";
import * as Cluster from "@nebulario/core-cluster";
import chokidar from "chokidar";

export const start = async (operation, params, cxt) => {
  const {
    performer: {
      dependents,
      type,
      code: {
        paths: {
          absolute: { folder }
        }
      }
    }
  } = params;

  if (type === "instanced") {
    await runner(operation, params, cxt);

    while (operation.status !== "stop") {
      await wait(10);
    }


  }
};

const runner = async (operation, params, cxt) => {
  const {
    performer: {
      type,
      code: {
        paths: {
          absolute: { folder }
        }
      }
    }
  } = params;

  operation.print("warning", "Entities updated in transform phase...", cxt);
  operation.event("done");
};
