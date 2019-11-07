import { Tasks } from "@nebulario/core-cluster";

export const list = async (params, cxt) => {
  return Tasks.Run.actions(params, {}, cxt);
};
