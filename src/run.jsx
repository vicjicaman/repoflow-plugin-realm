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

const commonTaskHooks = cxt => ({
  error: async ({ type, file }, { error }, cxt) =>
    IO.print("warning", type + " " + file + "  " + error.toString(), cxt),
  post: async ({ type, file }, { result }, cxt) => {
    if (result) {
      IO.print("info", type + " " + file, cxt);
      result.output && IO.print("out", result.output, cxt);
      result.warning && IO.print("warning", result.warning, cxt);
    }
  }
});

export const clear = async (params, cxt) => {
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

  const res = await Cluster.Tasks.Run.clear(
    folder,
    {
      general: {
        hooks: commonTaskHooks(cxt),
        params: {}
      }
    },
    {},
    cxt
  );
  IO.print("done", "Realm cleared...", cxt);
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

  const res = await Cluster.Tasks.Run.transform(
    folder,
    {
      general: {
        hooks: commonTaskHooks(cxt),
        params: {}
      }
    },
    {},
    cxt
  );
  IO.print("out", "Realm up to date...", cxt);
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
        hooks: commonTaskHooks(cxt),
        params: {}
      }
    },
    {},
    cxt
  );
  IO.print("done", "Realm up to date...", cxt);
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
    IO.print("out", "Setting realm config...", cxt);

    const res = await Cluster.Tasks.Run.exec(
      folder,
      {
        general: {
          hooks: commonTaskHooks(cxt),
          params: {}
        },
        entities: {
          ingress: {
            hooks: {
              post: async ({ file }, params, cxt) => {
                IO.print("out", "Set local ingress domains", cxt);

                const content = JsonUtils.load(
                  path.join(params.phase.paths.tmp, file),
                  true
                );

                for (const rule of content.spec.rules) {
                  const { host } = rule;

                  IO.print(
                    "info",
                    "Add " + host + " namespace to local /etc/hosts...",
                    cxt
                  );

                  await Cluster.Control.exec(
                    [],
                    async ([], innerClusterContext, cxt) => {
                      const line = "$(minikube ip) " + host;
                      const file = "/etc/hosts";

                      return await innerClusterContext(
                        `grep -qF -- "${line}" "${file}" || echo "${line}" >> "${file}"`,
                        {},
                        cxt
                      );
                    },
                    {},
                    cxt
                  );
                }
              }
            }
          }
        }
      },
      {},
      cxt
    );

    IO.print("done", "Realm up to date...", cxt);

    while (operation.status !== "stopping") {
      await wait(100);
    }
  };

  return {
    promise: startOp,
    process: null
  };
};
