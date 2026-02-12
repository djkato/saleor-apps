import { SALEOR_API_URL_HEADER, SALEOR_AUTHORIZATION_BEARER_HEADER } from "@saleor/app-sdk/headers";
import { inferAsyncReturnType } from "@trpc/server";
import * as trpcNext from "@trpc/server/adapters/next";

import { createLogger } from "@/logger";

const logger = createLogger("trpc context");

export const createTrpcContext = async ({ res, req }: trpcNext.CreateNextContextOptions) => {
  const ctx = {
    token: req.headers[SALEOR_AUTHORIZATION_BEARER_HEADER] as string | undefined,
    saleorApiUrl: req.headers[SALEOR_API_URL_HEADER] as string | undefined,
    appId: undefined as undefined | string,
    ssr: undefined as undefined | boolean,
  };

  logger.debug("trpc context: {}", ctx);

  console.log(ctx);

  return ctx;
};

export type TrpcContext = inferAsyncReturnType<typeof createTrpcContext>;
