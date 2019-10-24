import * as Cluster from "@nebulario/core-cluster";

const handlers = {
  error: ({ entity: { type, file } }, error, cxt) =>
    cxt.operation.print(
      "warning",
      type + " " + file + "  " + error.toString(),
      cxt
    ),
  post: ({ entity: { type, file } }, result, cxt) =>
    cxt.operation.print("out", type + " " + file + " configured ", cxt)
};

export const start = async (operation, params, cxt) => {
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

  await Cluster.Tasks.Run.transform(
    folder,
    {},
    {
      handlers,
      instance,
      cluster
    },
    { ...cxt, operation }
  );

  operation.print("out", "Realm entities transformed...", cxt);
};
