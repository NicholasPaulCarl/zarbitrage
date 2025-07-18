import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    specPattern: ["client/src/tests/**/*.spec.ts", "tests/**/*.cy.ts"],
    baseUrl: "http://localhost:3000",
  },
});
