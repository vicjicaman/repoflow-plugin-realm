import path from "path";
import { wait } from "@nebulario/core-process";
import * as Cluster from "@nebulario/core-cluster";

export const start = async (operation, params, cxt) => {
  const {
    params: {
      performer: {
        code: {
          paths: {
            absolute: { folder }
          }
        }
      },
      instance,
      config: { cluster }
    }
  } = operation;

  Cluster.Tasks.Monitor.exec(
    folder,
    params,
    { instance, cluster },
    { ...cxt, operation }
  );

  while (operation.status !== "stop") {
    await wait(10);
  }
};
