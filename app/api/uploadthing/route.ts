import { createRouteHandler } from "uploadthing/next";

import { ourFileRouter } from "./core";

// Use Node.js runtime to avoid Edge Runtime limitations in development
export const runtime = "nodejs";

export const { GET, POST } = createRouteHandler({
  router: ourFileRouter,
});
