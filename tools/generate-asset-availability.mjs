#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, "..");

const DEFAULT_INPUT = path.join(REPO_ROOT, "_includes", "metadata", "works.json");
const DEFAULT_OUTPUT = path.join(REPO_ROOT, "_includes", "metadata", "asset-availability.json");

const DATA_BASE = "https://data.josqu.in/";
const PDF_BACKUP_BASE = "https://cdn.jsdelivr.net/gh/benory/jrp-scores-backup@main/";
const GITHUB_RAW_BASE = "https://raw.githubusercontent.com/josquin-research-project/";

const DEFAULT_CONCURRENCY = 10;
const DEFAULT_TIMEOUT_MS = 12000;

function usage() {
	console.log(`Usage: node tools/generate-asset-availability.mjs [options]

Options:
  --input PATH          Metadata input path (default: _includes/metadata/works.json)
  --output PATH         Availability output path (default: _includes/metadata/asset-availability.json)
  --ids ID[,ID...]      Limit checks to one or more work/base IDs
  --limit N             Limit checks to the first N base works
  --concurrency N       Number of simultaneous network checks (default: ${DEFAULT_CONCURRENCY})
  --timeout-ms N        Per-request timeout in milliseconds (default: ${DEFAULT_TIMEOUT_MS})
  --pretty             Pretty-print JSON output (default)
  --compact            Compact JSON output
  --help               Show this help
`);
}

function parseArgs(argv) {
	const options = {
		input: DEFAULT_INPUT,
		output: DEFAULT_OUTPUT,
		ids: [],
		limit: null,
		concurrency: DEFAULT_CONCURRENCY,
		timeoutMs: DEFAULT_TIMEOUT_MS,
		pretty: true
	};

	for (let i = 0; i < argv.length; i++) {
		const arg = argv[i];
		const readValue = () => {
			if (arg.includes("=")) {
				return arg.split("=").slice(1).join("=");
			}
			i++;
			return argv[i];
		};

		if (arg === "--help" || arg === "-h") {
			usage();
			process.exit(0);
		} else if (arg === "--input" || arg.startsWith("--input=")) {
			options.input = path.resolve(process.cwd(), readValue());
		} else if (arg === "--output" || arg.startsWith("--output=")) {
			options.output = path.resolve(process.cwd(), readValue());
		} else if (arg === "--ids" || arg.startsWith("--ids=")) {
			options.ids.push(...readValue().split(",").map((id) => id.trim()).filter(Boolean));
		} else if (arg === "--limit" || arg.startsWith("--limit=")) {
			options.limit = Number.parseInt(readValue(), 10);
		} else if (arg === "--concurrency" || arg.startsWith("--concurrency=")) {
			options.concurrency = Number.parseInt(readValue(), 10);
		} else if (arg === "--timeout-ms" || arg.startsWith("--timeout-ms=")) {
			options.timeoutMs = Number.parseInt(readValue(), 10);
		} else if (arg === "--pretty") {
			options.pretty = true;
		} else if (arg === "--compact") {
			options.pretty = false;
		} else {
			throw new Error(`Unknown option: ${arg}`);
		}
	}

	if (!Number.isFinite(options.concurrency) || options.concurrency < 1) {
		throw new Error("--concurrency must be a positive integer.");
	}
	if (!Number.isFinite(options.timeoutMs) || options.timeoutMs < 1000) {
		throw new Error("--timeout-ms must be at least 1000.");
	}
	if (options.limit !== null && (!Number.isFinite(options.limit) || options.limit < 1)) {
		throw new Error("--limit must be a positive integer.");
	}

	return options;
}

function createLimiter(max) {
	let active = 0;
	const queue = [];

	function runNext() {
		if (active >= max || queue.length === 0) {
			return;
		}
		const job = queue.shift();
		active++;
		Promise.resolve()
			.then(job.fn)
			.then(job.resolve, job.reject)
			.finally(() => {
				active--;
				runNext();
			});
	}

	return function limit(fn) {
		return new Promise((resolve, reject) => {
			queue.push({ fn, resolve, reject });
			runNext();
		});
	};
}

function baseWorkId(jrpid) {
	const match = String(jrpid || "").match(/^([A-Z][a-z][a-z]\d{4}(?:\.\d+)?)(?:[a-z](?:\.[A-Za-z0-9]+)?|\.[A-Za-z])?$/);
	return match ? match[1] : jrpid;
}

function composerId(jrpid) {
	const match = String(jrpid || "").match(/^([A-Z][a-z][a-z])/);
	return match ? match[1] : "";
}

function dataUrl(jrpid, suffix) {
	return `${DATA_BASE}${jrpid}${suffix}`;
}

function backupPdfUrl(jrpid, version) {
	return `${PDF_BACKUP_BASE.replace(/\/+$/, "")}/scores/${composerId(jrpid)}/${jrpid}-${version}.pdf`;
}

function githubHumdrumUrl(filename) {
	if (!filename) {
		return "";
	}
	const match = filename.match(/^([A-Z][a-z][a-z])/);
	if (!match) {
		return "";
	}
	return `${GITHUB_RAW_BASE}${match[1]}/main/${filename.split("/").map(encodeURIComponent).join("/")}`;
}

function hasHtmlContentType(contentType) {
	return /\btext\/html\b/i.test(contentType || "");
}

function textLooksLikeHtml(text) {
	return /^\s*<!doctype html/i.test(text || "") || /^\s*<html[\s>]/i.test(text || "");
}

async function fetchWithTimeout(url, init, timeoutMs) {
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), timeoutMs);
	try {
		return await fetch(url, {
			redirect: "follow",
			...init,
			signal: controller.signal
		});
	} finally {
		clearTimeout(timer);
	}
}

async function headCheck(url, timeoutMs, validator) {
	if (!url) {
		return false;
	}
	try {
		const response = await fetchWithTimeout(url, { method: "HEAD", cache: "no-store" }, timeoutMs);
		if (!response.ok) {
			return false;
		}
		const headers = {
			contentLength: response.headers.get("content-length") || "",
			contentType: response.headers.get("content-type") || ""
		};
		return validator(headers);
	} catch (_error) {
		return false;
	}
}

async function sampleCheck(url, timeoutMs, validator, byteLimit = 4096) {
	if (!url) {
		return false;
	}
	try {
		const response = await fetchWithTimeout(url, {
			method: "GET",
			cache: "no-store",
			headers: { Range: `bytes=0-${byteLimit - 1}` }
		}, timeoutMs);
		if (!response.ok) {
			return false;
		}
		const contentType = response.headers.get("content-type") || "";
		const buffer = Buffer.from(await response.arrayBuffer());
		const text = buffer.toString("utf8");
		return validator({ contentType, buffer, text });
	} catch (_error) {
		return false;
	}
}

function validateNonHtmlHead(headers) {
	return !hasHtmlContentType(headers.contentType) && headers.contentLength !== "0";
}

function validateImageHead(expectedSubtype) {
	return (headers) => {
		const type = headers.contentType || "";
		return type.includes(expectedSubtype) && headers.contentLength !== "0";
	};
}

function validateAudioHead(headers) {
	const type = headers.contentType || "";
	return /^(audio\/|application\/octet-stream\b)/i.test(type) && headers.contentLength !== "0";
}

function validatePdfHead(headers) {
	const type = headers.contentType || "";
	return /\bapplication\/pdf\b/i.test(type) && headers.contentLength !== "0";
}

function validateJsonHead(headers) {
	const type = headers.contentType || "";
	return !hasHtmlContentType(type) && headers.contentLength !== "0";
}

function validateHumdrumSample({ contentType, text }) {
	if (hasHtmlContentType(contentType) || textLooksLikeHtml(text)) {
		return false;
	}
	return /\*\*kern/.test(text);
}

function validateMidiHead(headers) {
	const type = headers.contentType || "";
	return !hasHtmlContentType(type) && headers.contentLength !== "0";
}

function validateSvgHead(headers) {
	const type = headers.contentType || "";
	return /image\/svg\+xml/i.test(type) && headers.contentLength !== "0";
}

function groupWorks(rows) {
	const groups = new Map();
	for (const row of rows) {
		const id = row.WORK_ID;
		if (!id) {
			continue;
		}
		const baseId = baseWorkId(id);
		if (!groups.has(baseId)) {
			groups.set(baseId, {
				baseId,
				title: row.Title || "",
				composer: row.Composer || "",
				composerId: row.COMPOSER_ID || composerId(id),
				genre: row.Genre || "",
				sections: []
			});
		}
		groups.get(baseId).sections.push({
			id,
			subtitle: row.Subtitle || "",
			filename: row.Filename || ""
		});
	}
	return groups;
}

function selectGroups(groups, options) {
	let selected = Array.from(groups.values());
	if (options.ids.length) {
		const wanted = new Set(options.ids.flatMap((id) => [id, baseWorkId(id)]));
		selected = selected.filter((group) => {
			return wanted.has(group.baseId) || group.sections.some((section) => wanted.has(section.id));
		});
	}
	if (options.limit !== null) {
		selected = selected.slice(0, options.limit);
	}
	return selected;
}

function summarizeBoolean(sectionAssets, key, mode) {
	if (!sectionAssets.length) {
		return false;
	}
	if (mode === "all") {
		return sectionAssets.every((asset) => !!asset[key]);
	}
	return sectionAssets.some((asset) => !!asset[key]);
}

async function main() {
	const options = parseArgs(process.argv.slice(2));
	const limit = createLimiter(options.concurrency);
	const checkCache = new Map();

	function cached(key, url, checker) {
		const cacheKey = `${key}:${url}`;
		if (!checkCache.has(cacheKey)) {
			checkCache.set(cacheKey, limit(() => checker(url)));
		}
		return checkCache.get(cacheKey);
	}

	const works = JSON.parse(await fs.readFile(options.input, "utf8"));
	const groups = groupWorks(works);
	const selectedGroups = selectGroups(groups, options);
	const selectedSections = selectedGroups.flatMap((group) => group.sections);
	const assets = {};

	console.error(`Checking ${selectedSections.length} section(s) in ${selectedGroups.length} work group(s)...`);

	let completed = 0;
	await Promise.all(selectedSections.map(async (section) => {
		const id = section.id;
		const filename = section.filename || "";
		const githubUrl = githubHumdrumUrl(filename);
		const humdrumDataPromise = cached("humdrum", dataUrl(id, ".krn"), (url) => sampleCheck(url, options.timeoutMs, validateHumdrumSample));

		const [
			pdfScore,
			pdfEdited,
			mei,
			musedata,
			musicxml,
			midi,
			mp3,
			incipit,
			rangeAttack,
			rangeDuration,
			activityMerged,
			activitySeparate,
			timemap
		] = await Promise.all([
			cached("pdf", backupPdfUrl(id, "no_edit"), (url) => headCheck(url, options.timeoutMs, validatePdfHead)),
			cached("pdf", backupPdfUrl(id, "edit"), (url) => headCheck(url, options.timeoutMs, validatePdfHead)),
			cached("mei", dataUrl(id, ".mei"), (url) => headCheck(url, options.timeoutMs, validateNonHtmlHead)),
			cached("musedata", dataUrl(id, ".mds"), (url) => headCheck(url, options.timeoutMs, validateNonHtmlHead)),
			cached("musicxml", dataUrl(id, ".musicxml"), (url) => headCheck(url, options.timeoutMs, validateNonHtmlHead)),
			cached("midi", dataUrl(id, ".mid"), (url) => headCheck(url, options.timeoutMs, validateMidiHead)),
			cached("mp3", dataUrl(id, ".mp3"), (url) => headCheck(url, options.timeoutMs, validateAudioHead)),
			cached("svg", dataUrl(id, "-incipit.svg"), (url) => headCheck(url, options.timeoutMs, validateSvgHead)),
			cached("svg", dataUrl(id, "-prange-attack.svg"), (url) => headCheck(url, options.timeoutMs, validateSvgHead)),
			cached("svg", dataUrl(id, "-prange-duration.svg"), (url) => headCheck(url, options.timeoutMs, validateSvgHead)),
			cached("png", dataUrl(id, "-activity-merged.png"), (url) => headCheck(url, options.timeoutMs, validateImageHead("image/png"))),
			cached("png", dataUrl(id, "-activity-separate.png"), (url) => headCheck(url, options.timeoutMs, validateImageHead("image/png"))),
			cached("json", dataUrl(id, "-timemap.json"), (url) => headCheck(url, options.timeoutMs, validateJsonHead))
		]);
		const humdrumData = await humdrumDataPromise;
		const humdrumGithub = humdrumData
			? false
			: await cached("humdrum", githubUrl, (url) => sampleCheck(url, options.timeoutMs, validateHumdrumSample));

		assets[id] = {
			type: "section",
			baseId: baseWorkId(id),
			filename,
			pdfScore,
			pdfEdited,
			humdrum: humdrumData || humdrumGithub,
			humdrumData,
			humdrumGithub,
			mei,
			musedata,
			musicxml,
			midi,
			mp3,
			incipit,
			rangeAttack,
			rangeDuration,
			range: rangeAttack || rangeDuration,
			activityMerged,
			activitySeparate,
			activity: activityMerged || activitySeparate,
			timemap
		};

		completed++;
		if (completed % 50 === 0 || completed === selectedSections.length) {
			console.error(`Checked ${completed}/${selectedSections.length} section(s)...`);
		}
	}));

	await Promise.all(selectedGroups.map(async (group) => {
		const sectionAssets = group.sections.map((section) => assets[section.id]).filter(Boolean);
		const isSingleDirectSection = group.sections.length === 1 && group.sections[0].id === group.baseId;

		if (isSingleDirectSection) {
			assets[group.baseId] = {
				...assets[group.baseId],
				type: "work",
				multiSection: false,
				sections: [group.baseId],
				title: group.title,
				composer: group.composer,
				composerId: group.composerId,
				genre: group.genre
			};
			return;
		}

		const [pdfScore, pdfEdited, mp3] = await Promise.all([
			cached("pdf", backupPdfUrl(group.baseId, "no_edit"), (url) => headCheck(url, options.timeoutMs, validatePdfHead)),
			cached("pdf", backupPdfUrl(group.baseId, "edit"), (url) => headCheck(url, options.timeoutMs, validatePdfHead)),
			cached("mp3", dataUrl(group.baseId, ".mp3"), (url) => headCheck(url, options.timeoutMs, validateAudioHead))
		]);

		assets[group.baseId] = {
			type: "work",
			multiSection: true,
			sections: group.sections.map((section) => section.id),
			title: group.title,
			composer: group.composer,
			composerId: group.composerId,
			genre: group.genre,
			pdfScore,
			pdfEdited,
			mp3,
			completeHumdrum: summarizeBoolean(sectionAssets, "humdrum", "all"),
			anyHumdrum: summarizeBoolean(sectionAssets, "humdrum", "any"),
			allHumdrum: summarizeBoolean(sectionAssets, "humdrum", "all"),
			anyRange: summarizeBoolean(sectionAssets, "range", "any"),
			allRanges: summarizeBoolean(sectionAssets, "range", "all"),
			anyActivity: summarizeBoolean(sectionAssets, "activity", "any"),
			allActivity: summarizeBoolean(sectionAssets, "activity", "all"),
			anyMp3: summarizeBoolean(sectionAssets, "mp3", "any"),
			allMp3: summarizeBoolean(sectionAssets, "mp3", "all")
		};
	}));

	const output = {
		generatedAt: new Date().toISOString(),
		generator: "tools/generate-asset-availability.mjs",
		sources: {
			metadata: path.relative(REPO_ROOT, options.input),
			data: DATA_BASE,
			pdfBackup: PDF_BACKUP_BASE,
			githubRaw: GITHUB_RAW_BASE
		},
		totals: {
			metadataRows: works.length,
			checkedWorks: selectedGroups.length,
			checkedSections: selectedSections.length,
			assetEntries: Object.keys(assets).length
		},
		assets
	};

	await fs.mkdir(path.dirname(options.output), { recursive: true });
	await fs.writeFile(options.output, JSON.stringify(output, null, options.pretty ? "\t" : 0) + "\n");
	console.error(`Wrote ${path.relative(REPO_ROOT, options.output)}`);
}

main().catch((error) => {
	console.error(error && error.stack ? error.stack : String(error));
	process.exit(1);
});
