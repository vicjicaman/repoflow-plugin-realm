import { Utils as ConfigPluginUtils } from "@nebulario/repoflow-plugin-config";

export const start = async (operation, params, cxt) => {
  const {
    payload,
    module: mod,
    performer,
    performer: {
      performerid,
      type,
      code: {
        paths: {
          absolute: { folder }
        }
      },
      dependents,
      module: { dependencies }
    },
    performers,
    task: { taskid }
  } = params;

  if (type === "instanced") {
    await ConfigPluginUtils.init(
      operation,
      {
        performer,
        performers,
        folders: {
          code: folder
        }
      },
      cxt
    );
  }
};
