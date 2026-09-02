import { betterAuth } from "better-auth";
import { magicLink, organization, admin } from "better-auth/plugins";
import type { BetterAuthOptions } from "better-auth";

export function getBetterAuth(
  additionalOptions: BetterAuthOptions,
): ReturnType<typeof betterAuth> {
  const defaultOptions: BetterAuthOptions = {
    plugins: [
      magicLink({
        sendMagicLink: async ({ email, token, url }, request) => {
          console.log(request);
          try {
            // await sender(email, 'sign in', 'token: ' + token + ' -- url: ' + url);
            console.log(
              email,
              "sign in",
              "token: " + token + " -- url: " + url,
            );
          } catch (error) {
            console.error(error);
            throw error;
          }
        },
      }),
      organization(),
      admin(),
    ],
  };

  const options = {
    ...defaultOptions,
    ...additionalOptions,
  };

  return betterAuth(options);
}
