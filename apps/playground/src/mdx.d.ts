declare module "*.mdx" {
  import type { ComponentType } from "react";
  const component: ComponentType<{ components?: object }>;
  export default component;
}
