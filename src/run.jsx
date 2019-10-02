import _ from "lodash";
import fs from "fs-extra";
import path from "path";
import YAML from "yamljs";
import { spawn, wait, exec } from "@nebulario/core-process";
import { execSync } from "child_process";
import { IO } from "@nebulario/core-plugin-request";
import * as JsonUtils from "@nebulario/core-json";
import * as Cluster from "@nebulario/core-cluster";
const uuidv4 = require("uuid/v4");

/*const handlers = {
  onError: async ({ type, file }, e, cxt) => {
    IO.print("warning", type + " " + file + "  " + e.toString(), cxt);
  },
  onCompleted: async ({ type, file }, res, cxt) => {
    IO.print("info", type + " " + file + " completed", cxt);
    IO.print("out", res.stdout, cxt);
    IO.print("warning", res.strerr, cxt);
  }
};*/

export const clear = async (params, cxt) => {
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
};

export const listen = async (params, cxt) => {
  const {
    performerid, // TRIGGER DEP
    operation: {
      params: opParams,
      params: {
        performer: servicePerf,
        performer: { type },
        performers,
        instance: { instanceid }
      }
    }
  } = params;

  if (type === "instanced") {
    const triggerPerf = _.find(performers, p => p.performerid === performerid);

    if (triggerPerf) {
      console.log("UPDATE DEPEN: " + performerid);
      await Cluster.Performers.Service.update(
        triggerPerf,
        opParams,
        {
          hooks: {
            post: async (servPerf, triggerPerf, cxt) => {
              IO.print(
                "out",
                triggerPerf.performerid +
                  " updated for " +
                  servPerf.performerid,
                cxt
              );
            }
          }
        },
        cxt
      );
    }
  }
};

export const transform = async (params, cxt) => {
  const {
    performers,
    performer: servicePerf,
    performer: {
      code: {
        paths: {
          absolute: { folder }
        }
      }
    },
    instance: { instanceid }
  } = params;

  const res = await Cluster.Tasks.Run.transform(folder, {}, {}, cxt);
  IO.print("out", "Cronjob up to date...", cxt);
};

export const init = async (params, cxt) => {
  const {
    performers,
    performer: servicePerf,
    performer: {
      code: {
        paths: {
          absolute: { folder }
        }
      }
    },
    instance: { instanceid }
  } = params;

  const res = await Cluster.Tasks.Run.init(
    folder,
    {
      general: {
        hooks: {
          error: async ({ type, file }, { error }, cxt) =>
            IO.print(
              "warning",
              type + " " + file + "  " + error.toString(),
              cxt
            ),
          post: async ({ type, file }, { result }, cxt) => {
            IO.print("out", type + " " + file + "  init!", cxt);
          }
        },
        params: {}
      }
    },
    {},
    cxt
  );
  IO.print("done", "Cronjob up to date...", cxt);
};

export const start = (params, cxt) => {
  const {
    init,
    performers,
    performer: servicePerf,
    performer: {
      type,
      code: {
        paths: {
          absolute: { folder }
        }
      },
      dependents,
      module: { dependencies }
    },
    instance: { instanceid },
    plugins
  } = params;

  const startOp = async (operation, cxt) => {
    IO.print("out", "Setting cronjob config...", cxt);

    const res = await Cluster.Tasks.Run.exec(
      folder,
      {
        general: {
          hooks: {
            error: async ({ type, file }, { error }, cxt) =>
              IO.print(
                "warning",
                type + " " + file + "  " + error.toString(),
                cxt
              ),
            post: async ({ type, file }, { result }, cxt) => {
              IO.print("out", type + " " + file + "  " + result.stdout, cxt);
            }
          },
          params: {}
        }
      },
      {},
      cxt
    );

    IO.print("done", "Cronjob up to date...", cxt);

    while (operation.status !== "stopping") {
      await wait(100);
    }
  };

  return {
    promise: startOp,
    process: null
  };
};
