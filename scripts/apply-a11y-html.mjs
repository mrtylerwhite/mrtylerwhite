import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

function walk(dir, files = []) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    if (name === "node_modules" || name === "wp-content" || name === "wp-includes") continue;
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p, files);
    else if (name.endsWith(".html")) files.push(p);
  }
  return files;
}

const A11Y_SCRIPT =
  '<script type="text/javascript" src="/assets/js/mobile-menu-a11y.js" id="mobile-menu-a11y-js"></script>';

function patch(html) {
  let s = html;

  s = s.replace(
    /<meta name="viewport" content="width=device-width, initial-scale=1\.0, maximum-scale=1\.0, user-scalable=0" \/>/g,
    '<meta name="viewport" content="width=device-width, initial-scale=1" />'
  );

  if (!s.includes('class="skip-link"')) {
    s = s.replace(
      /(<body[^>]*>)/,
      '$1\n\t<a class="skip-link" href="#main-content">Skip to main content</a>'
    );
  }

  if (!s.includes('role="main"')) {
    const mainOpen = ["<", 'motion.div id="main-content" role="main">'].join("").replace("motion.", "");
    s = s.replace(/<div id="main-content">/g, mainOpen);
  }

  s = s.replace(
    /<span class="mobile_menu_bar mobile_menu_bar_toggle"><\/span>/g,
    '<button type="button" class="mobile_menu_bar mobile_menu_bar_toggle" aria-label="Open menu" aria-controls="mobile_menu" aria-expanded="false"></button>'
  );

  s = s.replace(
    /<a href="https:\/\/twitter\.com\/mrtylerwhite" class="icon">/g,
    '<a href="https://twitter.com/mrtylerwhite" class="icon" aria-label="X">'
  );
  s = s.replace(
    /<a href="https:\/\/www\.instagram\.com\/mrtylerwhite\/" class="icon">/g,
    '<a href="https://www.instagram.com/mrtylerwhite/" class="icon" aria-label="Instagram">'
  );

  s = s.replace(
    /<a target="_blank" href="/g,
    '<a target="_blank" rel="noopener noreferrer" href="'
  );
  s = s.replace(/rel="noopener noreferrer" rel="noopener noreferrer"/g, 'rel="noopener noreferrer"');

  if (!s.includes("mobile-menu-a11y-js")) {
    if (s.includes('id="custom-hamburger-menus-js"')) {
      s = s.replace(
        /(<script type="text\/javascript" src="\/wp-content\/plugins\/divi-100-hamburger-menu\/assets\/js\/scripts\.js" id="custom-hamburger-menus-js"><\/script>)/,
        `$1\n${A11Y_SCRIPT}`
      );
    } else if (s.includes("</body>")) {
      s = s.replace("</body>", `${A11Y_SCRIPT}\n</body>`);
    }
  }

  return s;
}

const files = walk(root);
let changed = 0;
for (const file of files) {
  const raw = fs.readFileSync(file, "utf8");
  const next = patch(raw);
  if (next !== raw) {
    fs.writeFileSync(file, next);
    changed += 1;
    console.log("updated", path.relative(root, file));
  }
}

console.log("done", changed, "files");
