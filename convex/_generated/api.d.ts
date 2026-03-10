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
import type * as courses from "../courses.js";
import type * as dashboard from "../dashboard.js";
import type * as internal_ from "../internal.js";
import type * as lib_requireSecret from "../lib/requireSecret.js";
import type * as lib_safeCompare from "../lib/safeCompare.js";
import type * as rag from "../rag.js";
import type * as ragDb from "../ragDb.js";
import type * as stripe from "../stripe.js";
import type * as tags from "../tags.js";
import type * as users from "../users.js";
import type * as videoProgress from "../videoProgress.js";
import type * as videoSecurity from "../videoSecurity.js";
import type * as videoSecurityDb from "../videoSecurityDb.js";
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
  courses: typeof courses;
  dashboard: typeof dashboard;
  internal: typeof internal_;
  "lib/requireSecret": typeof lib_requireSecret;
  "lib/safeCompare": typeof lib_safeCompare;
  rag: typeof rag;
  ragDb: typeof ragDb;
  stripe: typeof stripe;
  tags: typeof tags;
  users: typeof users;
  videoProgress: typeof videoProgress;
  videoSecurity: typeof videoSecurity;
  videoSecurityDb: typeof videoSecurityDb;
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
