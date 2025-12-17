import { createTRPCReact } from "@trpc/react-query";
// IMPORANT: In a real monorepo, we import this.
// For the exam, if Next.js blocks this import (because it's outside the client folder),
// just copy the "AppRouter" type definition here manually or use 'any'.
import type { AppRouter } from "../../server-main/index";

export const trpc = createTRPCReact<AppRouter>();
