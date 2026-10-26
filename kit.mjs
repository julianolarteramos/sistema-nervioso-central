// Dónde está el kit de specimen (https://github.com/julianolarteramos/specimen). Orden: la variable SPECIMEN_HOME, una carpeta `specimen`
// hermana de este repositorio, y ~/code/experiments/specimen.
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const AQUI = dirname(fileURLToPath(import.meta.url));
const candidates = [process.env.SPECIMEN_HOME, join(AQUI, "..", "specimen"), join(homedir(), "code/experiments/specimen")];
export const SPECIMEN = candidates.find((p) => p && existsSync(join(p, "kit/blob.mjs")));
if (!SPECIMEN) throw new Error("No encuentro el kit de specimen: clónalo junto a este repositorio o define SPECIMEN_HOME (https://github.com/julianolarteramos/specimen)");
export const kit = (name) => import(join(SPECIMEN, "kit", name));
export const shared = () => import(join(SPECIMEN, "examples/shared/specimen.mjs"));
