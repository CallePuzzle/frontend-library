import { defineConfig } from "tsup";

export default defineConfig((options) => {
  const isWatch = options.watch;

  return {
    entry: ["src/client.ts", "src/server.ts", "src/hooks.ts", "src/sender.ts"],
    format: ["esm"],
    dts: isWatch
      ? false
      : {
          compilerOptions: {
            skipLibCheck: true,
            declaration: true,
            emitDeclarationOnly: false,
          },
          exclude: ["src/app.d.ts", "src/**/*.test.ts", "src/**/*.spec.ts"],
        },
    clean: true,
    outDir: "dist",
    splitting: false,
    sourcemap: true,
    external: ["@sveltejs/kit", "better-auth", "nodemailer"],
    ignoreWatch: ["src/app.d.ts", "dist/**"],
  };
});
