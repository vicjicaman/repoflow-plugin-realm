import * as Config from "@nebulario/core-config";

export const start = async (operation, params, cxt) => {
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
