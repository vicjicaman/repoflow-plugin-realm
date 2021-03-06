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
    const configFile = path.join(folder, "config.json");
    const entitiesPath = path.join(folder, "entities");

    operation.print("out", "Watching config changes for " + configFile, cxt);

    await builder(operation, params, cxt);

    const watcher = chokidar
      .watch([configFile, entitiesPath], {
        ignoreInitial: true
      })
      .on("all", (event, path) => {
        operation.print(
          "warning",
          path.replace(folder, "") + " changed...",
          cxt
        );

        operation
          .reset()
          .then(() => builder(operation, params, cxt))
          .catch(e => operation.print("warning", e.toString(), cxt));
      });

    while (operation.status !== "stop") {
      await wait(10);
    }

    operation.print("out", "Stop watchers...", cxt);
    watcher.close();
  }
};

const builder = async (operation, params, cxt) => {
  const {
    performer: {
      type,
      code: {
        paths: {
          absolute: { folder }
        }
      }
    },
    instance,
    config: { cluster }
  } = params;

  operation.print("out", "Start building config...", cxt);
  Config.build(folder);
  const values = Config.load(folder);

  operation.print("out", "Config loaded...", cxt);

  await Cluster.Tasks.Build.exec(
    folder,
    { values },
    {
      instance,
      cluster,
      handlers: {
        error: ({ entity: { type, file } }, error, cxt) =>
          operation.print(
            "warning",
            type + " " + file + "  " + error.toString(),
            cxt
          ),
        post: ({ entity: { type, file } }, result, cxt) =>
          operation.print("out", type + " " + file + " configured ", cxt)
      }
    },
    { ...cxt, operation }
  );

  operation.print("out", "Realm entities build!", cxt);
  operation.event("done");
};
