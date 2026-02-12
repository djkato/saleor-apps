import type { APL, AplConfiguredResult, AplReadyResult, AuthData } from "@saleor/app-sdk/APL";
import Redis from "ioredis";

import { createLogger } from "./logger";

const logger = createLogger("saleor-app");

export type RedisAPLClientArgs = {
  client: Redis;
  appApiBaseUrl: string;
};
export type RedisAPLUrlArgs = {
  redisUrl: string;
  appApiBaseUrl: string;
};
/**
 * Redis APL
 * @param redisUrl - in format redis[s]://[[username][:password]@][host][:port][/db-number],
 * so for example redis://alice:foobared@awesome.redis.server:6380
 * For saleor-platform, thats: `redis://redis:6379/2`
 */
export class RedisAPL implements APL {
  private client;

  private appApiBaseUrl;

  constructor(args: RedisAPLClientArgs | RedisAPLUrlArgs) {
    if (!args.appApiBaseUrl)
      throw new Error("The RedisAPL requires to know the app api url beforehand");
    this.appApiBaseUrl = args.appApiBaseUrl;

    if ("client" in args && args.client) {
      this.client = args.client;
    } else if ("redisUrl" in args && args.redisUrl) {
      this.client = new Redis(args.redisUrl, { lazyConnect: true });
    } else {
      throw new Error("RedisAPL: No redis url or client defined");
    }
    this.isConfigured().then((v) => logger.debug("REDIS: CONFIGURED TEST: ", v));
  }

  private prepareKey(saleorApiUrl: string) {
    return `${this.appApiBaseUrl}:${saleorApiUrl}`;
  }

  async get(saleorApiUrl: string): Promise<AuthData | undefined> {
    const res = await this.client.get(this.prepareKey(saleorApiUrl));

    logger.debug(
      `REDIS: GET FOR ${this.prepareKey(saleorApiUrl)} (is ${res ? "truthy" : "falsy"}):`,
    );
    if (res) {
      const data = JSON.parse(res) as AuthData;

      logger.debug(data, { depth: null });
      return data;
    }
  }

  async set(authData: AuthData): Promise<void> {
    const res = await this.client.set(
      this.prepareKey(authData.saleorApiUrl),
      JSON.stringify(authData),
    );

    logger.debug(`REDIS: SET FOR ${this.prepareKey(authData.saleorApiUrl)}: `, res);
  }

  async delete(saleorApiUrl: string): Promise<void> {
    const val = await this.client.getdel(this.prepareKey(saleorApiUrl));

    logger.debug("REDIS: DEL: ", val);
  }

  async getAll(): Promise<AuthData[]> {
    throw new Error("redisAPL does not support getAll method");
  }

  async isReady(): Promise<AplReadyResult> {
    const ready = !!(await this.client.info());

    logger.debug("REDIS: IS READY: ", ready);
    return { ready: ready } as AplReadyResult;
  }

  async isConfigured(): Promise<AplConfiguredResult> {
    const ready = !!(await this.client.info());

    logger.debug("REDIS: IS CONF: ", ready);
    return { configured: ready } as AplConfiguredResult;
  }
}
