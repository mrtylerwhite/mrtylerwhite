// Generates the dotted world map used by bento/illustration blocks.
// Run: node scripts/build-dotted-map.mjs  → assets/images/ds/dotted-map.svg
// Drawn as one path of round-capped zero-length strokes (tiny file); used as a
// CSS mask so the dot colour follows the theme in light and dark sections.
import DottedMap from "dotted-map";
import fs from "fs";
const map = new DottedMap({ height: 60, grid: "diagonal" });
const pts = map.getPoints();
const w = Math.ceil(Math.max(...pts.map((p) => p.x))) + 1, h = Math.ceil(Math.max(...pts.map((p) => p.y))) + 1;
const d = pts.map((p) => `M${+p.x.toFixed(2)} ${+p.y.toFixed(2)}h0`).join("");
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}"><path d="${d}" stroke="#000" stroke-width=".44" stroke-linecap="round" fill="none"/></svg>`;
fs.writeFileSync("assets/images/ds/dotted-map.svg", svg);
console.log("wrote assets/images/ds/dotted-map.svg", (svg.length / 1024).toFixed(0) + "KB", pts.length, "dots", w + "x" + h);
