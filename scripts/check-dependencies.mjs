import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const allowedDependencies = new Map([
  ["@template/model", new Set()],
  ["@template/usecase", new Set(["@template/model"])],
  [
    "@template/dummy-gateway",
    new Set(["@template/model", "@template/usecase"]),
  ],
  ["@template/presentation", new Set(["@template/model", "@template/usecase"])],
  [
    "@template/app",
    new Set([
      "@template/model",
      "@template/usecase",
      "@template/dummy-gateway",
      "@template/presentation",
    ]),
  ],
]);

const packageDirectories = [
  "src/domain/model",
  "src/domain/usecase",
  "src/gateway/dummy-gateway",
  "src/presentation",
  ".",
];

const violations = [];
for (const directory of packageDirectories) {
  const manifest = JSON.parse(
    await readFile(resolve(directory, "package.json"), "utf8"),
  );
  const workspaceDependencies = Object.keys(manifest.dependencies ?? {}).filter(
    (name) => name.startsWith("@template/"),
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
