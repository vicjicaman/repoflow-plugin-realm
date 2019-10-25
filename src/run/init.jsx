import _ from "lodash";
import fs from "fs";
import path from "path";
import * as Remote from "@nebulario/core-remote";

export const getRemotePath = (
  pluginid,
  {
    config: {
      cluster: { instanceid }
    }
  }
) => path.join("${HOME}/repoflow/instances", instanceid, "plugins", pluginid);

export const start = async (operation, params, cxt) => {
  const {
    plugins,
    config: { cluster }
  } = params;

  for (const plugin of plugins) {
    const { pluginid } = plugin;
    const remotePath = getRemotePath(pluginid, params);

    operation.print("info", "Installing " + pluginid + "...", cxt);
    const remps = await Remote.context(
      cluster.node,
      [{ path: plugin.home, type: "folder" }],
      async ([folder], cxt) => {
        const cmds = [
          "rm -Rf " + remotePath,
          "mkdir -p " + remotePath,
          "cp -rf " + path.join(folder, "*") + " " + remotePath
        ];
        return cmds.join(";");
      },
      {
        spawn: operation.spawn
      },
      cxt
    );

    await remps.promise;
    operation.print("info", pluginid + " initialized!", cxt);
  }
};
