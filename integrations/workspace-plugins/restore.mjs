import { existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, renameSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const output = resolve(process.argv[2] ?? fileURLToPath(new URL("./dist", import.meta.url)));
const localPlugins = join(resolve(process.argv[3] ?? homedir()), ".paperclip", "plugins", "node_modules");
const readPackage = directory => JSON.parse(readFileSync(join(directory, "package.json"), "utf8"));
const readManifest = file => readFileSync(file, "utf8").replace(/\r\n/g, "\n")
  .replace(/^\/\/# sourceMappingURL=.*$\n?/gm, "").trimEnd();

function syncFiles(source, destination) {
  let changed = 0;
  if (existsSync(destination) && !lstatSync(destination).isDirectory()) {
    throw new Error(`Cannot restore into a non-directory: ${destination}`);
  }
  mkdirSync(destination, { recursive: true });
  for (const entry of readdirSync(source, { withFileTypes: true })) {
    const from = join(source, entry.name);
    const to = join(destination, entry.name);
    if (entry.isDirectory()) {
      changed += syncFiles(from, to);
    } else if (entry.isFile()) {
      const contents = readFileSync(from);
      if (existsSync(to) && contents.equals(readFileSync(to))) continue;
      const temporary = `${to}.paperclip-restore-${process.pid}`;
      writeFileSync(temporary, contents);
      renameSync(temporary, to);
      changed++;
    }
  }
  return changed;
}

for (const [directory, name] of [["agent-pixels", "@tomartec/pixel-agent"], ["telegram", "paperclip-plugin-telegram"]]) {
  const bundle = join(output, directory);
  const installed = join(localPlugins, ...name.split("/"));
  if (!existsSync(join(installed, "package.json"))) continue;
  if (lstatSync(installed).isSymbolicLink()) continue;
  const current = readPackage(installed);
  const expected = readPackage(bundle);
  const manifest = expected.paperclipPlugin.manifest;
  if (current.name !== name || expected.name !== name || current.version !== expected.version ||
      current.paperclipPlugin?.manifest !== manifest || !existsSync(join(installed, manifest)) ||
      readManifest(join(installed, manifest)) !== readManifest(join(bundle, manifest))) {
    console.log(`Leaving ${name} unchanged. Install the repository bundle to switch to the saved version.`);
    continue;
  }
  const changed = syncFiles(join(bundle, "dist"), join(installed, "dist"));
  if (changed) console.log(`Restored ${name} from the repository (${changed} files).`);
}
