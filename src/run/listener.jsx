import { Tasks } from "@nebulario/core-cluster";

export const listener = async (evt, cxt) => {
  await Tasks.Run.listen(cxt.operation, evt, {}, cxt);
};
