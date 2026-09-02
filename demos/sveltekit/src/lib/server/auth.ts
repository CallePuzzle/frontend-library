import db from "./db";
// import sender from './sender';
import { getBetterAuth } from "@callepuzzle/auth/server";
import { prismaAdapter } from "better-auth/adapters/prisma";
import type { BetterAuthOptions } from "better-auth";

const database = prismaAdapter(db, {
  provider: "sqlite",
});

const additionalOptions: BetterAuthOptions = {
  database: database,
};

export const auth = getBetterAuth(additionalOptions);
