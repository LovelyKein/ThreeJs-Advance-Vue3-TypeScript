import { RouteMeta } from "vue-router";

export interface menuItem {
  path: string;
  meta: RouteMeta | undefined;
}