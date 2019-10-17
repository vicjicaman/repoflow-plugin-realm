import * as Cluster from "@nebulario/core-cluster";

const handlers = {
  error: ({ operation, entity: { type, file } }, error, cxt) =>
    operation.print(
      "warning",
      type + " " + file + "  " + error.toString(),
      cxt
    ),
  post: ({ operation, entity: { type, file } }, result, cxt) =>
    operation.print("out", type + " " + file + " configured ", cxt)
};

export const start = async (operation, params, cxt) => {
  await Cluster.Tasks.Run.transform(
    operation,
    {},
    {
      handlers
    },
    cxt
  );

  operation.print("out", "Realm entities transformed...", cxt);
};
