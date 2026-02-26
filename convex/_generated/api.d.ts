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
import type * as debug_user from "../debug_user.js";
import type * as discord from "../discord.js";
import type * as internal_ from "../internal.js";
import type * as lib_safeCompare from "../lib/safeCompare.js";
import type * as migration_action from "../migration_action.js";
import type * as migrations from "../migrations.js";
import type * as rag from "../rag.js";
import type * as ragDb from "../ragDb.js";
import type * as stripe from "../stripe.js";
import type * as tags from "../tags.js";
import type * as users from "../users.js";
import type * as videoProgress from "../videoProgress.js";
import type * as videos from "../videos.js";
import type * as zoom from "../zoom.js";
import type * as zoomActions from "../zoomActions.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  admin: typeof admin;
  ai: typeof ai;
  dashboard: typeof dashboard;
  debug_user: typeof debug_user;
  discord: typeof discord;
  internal: typeof internal_;
  "lib/safeCompare": typeof lib_safeCompare;
  migration_action: typeof migration_action;
  migrations: typeof migrations;
  rag: typeof rag;
  ragDb: typeof ragDb;
  stripe: typeof stripe;
  tags: typeof tags;
  users: typeof users;
  videoProgress: typeof videoProgress;
  videos: typeof videos;
  zoom: typeof zoom;
  zoomActions: typeof zoomActions;
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
