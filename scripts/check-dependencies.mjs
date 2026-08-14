import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const allowedDependencies = new Map([
  ["@omische/model", new Set()],
  ["@omische/usecase", new Set(["@omische/model"])],
  [
    "@omische/browser-calendar",
    new Set(["@omische/model", "@omische/usecase"]),
  ],
  ["@omische/presentation", new Set(["@omische/model", "@omische/usecase"])],
  [
    "@omische/app",
    new Set([
      "@omische/model",
      "@omische/usecase",
      "@omische/browser-calendar",
      "@omische/presentation",
    ]),
  ],
]);

const packageDirectories = [
  "src/domain/model",
  "src/domain/usecase",
  "src/gateway/browser-calendar",
  "src/presentation",
  ".",
];

const violations = [];
for (const directory of packageDirectories) {
  const manifest = JSON.parse(
    await readFile(resolve(directory, "package.json"), "utf8"),
  );
  const workspaceDependencies = Object.keys(manifest.dependencies ?? {}).filter(
    (name) => name.startsWith("@omische/"),
  );
  const allowed = allowedDependencies.get(manifest.name);
  for (const dependency of workspaceDependencies) {
    if (!allowed?.has(dependency)) {
      violations.push(`${manifest.name} -> ${dependency}`);
    }
  }
}

if (violations.length > 0) {
  throw new Error(`許可されていないPackage依存:\n${violations.join("\n")}`);
}

console.log("Package dependencies are valid.");
