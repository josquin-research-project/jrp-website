#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, "..");
const DEFAULT_MANIFEST = path.join(REPO_ROOT, "_includes", "metadata", "asset-availability.json");
const GENERATOR = path.join(SCRIPT_DIR, "generate-asset-availability.mjs");
const DEFAULT_MAX_AGE_DAYS = 30;

function usage() {
	console.log(`Usage: node tools/run-asset-availability-monthly.mjs [options] -- [generator args]

Options:
  --max-age-days N   Run only when the manifest is at least N days old (default: ${DEFAULT_MAX_AGE_DAYS})
  --manifest PATH    Manifest path to inspect (default: _includes/metadata/asset-availability.json)
  --help             Show this help

Any arguments after -- are forwarded to generate-asset-availability.mjs when a scan is needed.
`);
}

function parseArgs(argv) {
	const options = {
		manifest: DEFAULT_MANIFEST,
		maxAgeDays: DEFAULT_MAX_AGE_DAYS,
		generatorArgs: []
	};

	let passthrough = false;
	for (let i = 0; i < argv.length; i++) {
		const arg = argv[i];
		if (passthrough) {
			options.generatorArgs.push(arg);
			continue;
		}
		const readValue = () => {
			if (arg.includes("=")) {
				return arg.split("=").slice(1).join("=");
			}
			i++;
			return argv[i];
		};

		if (arg === "--") {
			passthrough = true;
		} else if (arg === "--help" || arg === "-h") {
			usage();
			process.exit(0);
		} else if (arg === "--manifest" || arg.startsWith("--manifest=")) {
			options.manifest = path.resolve(process.cwd(), readValue());
		} else if (arg === "--max-age-days" || arg.startsWith("--max-age-days=")) {
			options.maxAgeDays = Number.parseFloat(readValue());
		} else {
			throw new Error(`Unknown option: ${arg}`);
		}
	}

	if (!Number.isFinite(options.maxAgeDays) || options.maxAgeDays <= 0) {
		throw new Error("--max-age-days must be a positive number.");
	}

	return options;
}

async function getManifestAgeDays(manifestPath) {
	const data = JSON.parse(await fs.readFile(manifestPath, "utf8"));
	if (!data.generatedAt) {
		throw new Error("missing generatedAt");
	}
	const timestamp = Date.parse(data.generatedAt);
	if (!Number.isFinite(timestamp)) {
		throw new Error("invalid generatedAt");
	}
	return (Date.now() - timestamp) / (1000 * 60 * 60 * 24);
}

async function main() {
	const options = parseArgs(process.argv.slice(2));
	let shouldRun = false;
	let reason = "";

	try {
		const ageDays = await getManifestAgeDays(options.manifest);
		if (ageDays >= options.maxAgeDays) {
			shouldRun = true;
			reason = `${ageDays.toFixed(1)} days old`;
		} else {
			const relative = path.relative(REPO_ROOT, options.manifest);
			console.log(`${relative} is ${ageDays.toFixed(1)} days old; skipping availability scan.`);
			return;
		}
	} catch (error) {
		shouldRun = true;
		reason = error && error.message ? error.message : "unreadable manifest";
	}

	if (!shouldRun) {
		return;
	}

	console.log(`Running availability scan: manifest is ${reason}.`);
	const result = spawnSync(process.execPath, [GENERATOR, ...options.generatorArgs], {
		cwd: REPO_ROOT,
		stdio: "inherit"
	});

	if (result.error) {
		throw result.error;
	}
	process.exit(result.status === null ? 1 : result.status);
}

main().catch((error) => {
	console.error(error && error.stack ? error.stack : String(error));
	process.exit(1);
});
