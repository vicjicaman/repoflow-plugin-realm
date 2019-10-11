import _ from "lodash";
import fs from "fs-extra";
import path from "path";
import YAML from "yamljs";
import { exec, spawn, wait } from "@nebulario/core-process";
import { Operation, IO } from "@nebulario/core-plugin-request";
import * as Config from "@nebulario/core-config";
import * as Cluster from "@nebulario/core-cluster";
import * as JsonUtils from "@nebulario/core-json";
import * as Performer from "@nebulario/core-performer";
import chokidar from "chokidar";

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

  if (type === "instanced") {
    await Config.clear(folder);
  }
};

export const init = async (params, cxt) => {
  const {
    performers,
    performer,
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
    IO.print("out", "Initialize config...", cxt);
    const lperfs = Performer.linked(performer, performers).filter(
      ({ module: { type } }) => type === "config"
    );

    if (lperfs.length === 0) {
      IO.print("info", "No linked config dependencies...", cxt);
    } else {
      lperfs.forEach(({ performerid }) => {
        IO.print("info", performerid + " config linked!", cxt);
        Config.link(folder, performerid);
      });
    }

    await Config.init(folder);
    IO.print("out", "Initialized!", cxt);
  }
};

export const start = (params, cxt) => {
  const {
    performers,
    performer,
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

  const configPath = path.join(folder, "config.json");
  const entitiesPath = path.join(folder, "entities");

  if (type === "instanced") {
    const startOp = async (operation, cxt) => {
      await build(params, cxt);

      const watcher = chokidar
        .watch([configPath, entitiesPath], {
          ignoreInitial: true
        })
        .on("all", (event, path) => {
          IO.print("warning", path.replace(folder, "") + " changed...", cxt);
          build(params, cxt);
        });

      while (operation.status !== "stopping") {
        await wait(10);
      }

      watcher.close();
    };

    return {
      promise: startOp,
      process: null
    };
  }
};

const build = async (params, cxt) => {
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

  try {
    IO.print("out", "Start building config...", cxt);
    Config.build(folder);
    const values = Config.load(folder);

    IO.print("out", "Config loaded...", cxt);
    await Cluster.Tasks.Build.exec(
      folder,
      {
        general: {
          hooks: {
            error: ({ type, file }, { error }) =>
              IO.print(
                "warning",
                type + " " + file + "  " + error.toString(),
                cxt
              ),
            pre: e => e,
            post: ({ type, file }) =>
              IO.print("out", type + " " + file + " configured ", cxt)
          },
          params: { values }
        }
      },
      {},
      cxt
    );

    IO.print("done", "Realm entities build!", cxt);
  } catch (e) {
    IO.print("error", e.toString(), cxt);
  }
};
