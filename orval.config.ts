import { defineConfig } from "orval";

export default defineConfig({
  packflow: {
    input: "http://localhost:8080/v3/api-docs",
    output: {
      target: "./lib/api/generated/index.ts",
      client: "fetch",
      baseUrl: "/backend",
    },
  },
});
