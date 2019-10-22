import path from "path";
import { wait } from "@nebulario/core-process";
import * as Cluster from "@nebulario/core-cluster";

export const start = async (operation, params, cxt) => {
  Cluster.Tasks.Monitor.exec(operation, params, {}, cxt);

  while (operation.status !== "stop") {
    await wait(10);
  }
};
