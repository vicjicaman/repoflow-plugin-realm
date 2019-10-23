import { Tasks } from "@nebulario/core-cluster";

export const listener = async (evt, cxt) => {
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

  await Tasks.Run.listen(
    folder,
    evt,
    { instance, cluster },
    { ...cxt, operation }
  );
};
