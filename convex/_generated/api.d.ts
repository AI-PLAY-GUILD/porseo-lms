/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin from "../admin.js";
import type * as ai from "../ai.js";
import type * as dashboard from "../dashboard.js";
import type * as discord from "../discord.js";
import type * as internal_ from "../internal.js";
import type * as rag from "../rag.js";
import type * as ragDb from "../ragDb.js";
import type * as tags from "../tags.js";
import type * as users from "../users.js";
import type * as videoProgress from "../videoProgress.js";
import type * as videos from "../videos.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  admin: typeof admin;
  ai: typeof ai;
  dashboard: typeof dashboard;
  discord: typeof discord;
  internal: typeof internal_;
  rag: typeof rag;
  ragDb: typeof ragDb;
  tags: typeof tags;
  users: typeof users;
  videoProgress: typeof videoProgress;
  videos: typeof videos;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
