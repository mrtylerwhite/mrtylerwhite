/* ROI of design calculator (Letters). Starts from the bet: weeks x people x cost per
   person-week. Then the change the work should cause, converted to year-one value.
   ROI = (value - cost) / cost. Verdict follows the "cut scope, don't stretch time" rule. */
(function () {
  var root = document.querySelector("[data-roi-calc]");
  if (!root) return;
  var form = root.querySelector("form");
  var tabs = root.querySelectorAll("[data-lever]");
  var groups = root.querySelectorAll("[data-lever-fields]");
  var lever = "cost";
  var tracked = false;
  // Each lever gets its own default bet length, so the starting view matches the examples.
  var defaultWeeks = { cost: 1, revenue: 2, retention: 2 };
  var touchedWeeks = false;

  function n(name) {
    var el = form.elements[name];
    var v = el ? parseFloat(el.value) : NaN;
    return isFinite(v) && v > 0 ? v : 0;
  }
  function money(v) {
    var sign = v < 0 ? "−" : "";
    return sign + "$" + Math.round(Math.abs(v)).toLocaleString("en-US");
  }
  function pct(v) {
    if (!isFinite(v)) return "—";
    var r = Math.round(v * 100);
    return (r < 0 ? "−" : r > 0 ? "+" : "") + Math.abs(r).toLocaleString("en-US") + "%";
  }
  function out(key, text) {
    var el = root.querySelector('[data-out="' + key + '"]');
    if (el) el.textContent = text;
  }
  function plural(v, one, many) { return v === 1 ? one : many; }

  function calc() {
    var weekly = n("people") * n("rate");
    var cost = n("weeks") * weekly;
    var value = 0, label = "";
    if (lever === "cost") {
      var monthly = (n("tickets") * n("minutes")) / 60 * n("support");
      value = monthly * (Math.min(n("cut"), 100) / 100) * 12;
      label = "Saved in year one";
    } else if (lever === "revenue") {
      var extra = n("trials") * Math.max(n("convTo") - n("convFrom"), 0) / 100;
      value = extra * n("acvR") * 12;
      label = "New ARR in year one";
    } else {
      var kept = n("customers") * Math.max(n("churnFrom") - n("churnTo"), 0) / 100;
      value = kept * n("acvC") * 12;
      label = "ARR kept in year one";
    }
    var roi = cost > 0 ? (value - cost) / cost : NaN;
    var maxWeeks = weekly > 0 ? value / weekly : 0;
    var paybackMonths = value > 0 ? cost / (value / 12) : Infinity;

    out("value", money(value));
    out("valueLabel", label);
    out("roiChip", pct(roi) + " ROI");
    out("cost", money(cost));
    var mw = maxWeeks >= 10 ? Math.round(maxWeeks) : Math.round(maxWeeks * 10) / 10;
    out("maxWeeks", mw.toLocaleString("en-US") + " " + plural(mw, "wk", "wks"));
    if (!isFinite(paybackMonths)) out("payback", "Never");
    else if (paybackMonths < 1) out("payback", "Under a month");
    else { var pm = Math.round(paybackMonths); out("payback", pm + " " + plural(pm, "month", "months")); }

    var verdict;
    if (!(value > 0)) verdict = "No change, no return. Pick a number this work should actually move.";
    else if (!(cost > 0)) verdict = "Add the bet. ROI without the cost side is a press release.";
    else if (roi >= 1) verdict = "Easy bet. Lock the scope and protect the time box.";
    else if (roi >= 0) verdict = "Worth the bet, with less room than it looks. Keep the scope tight.";
    else verdict = "Doesn’t pay back this year. Cut scope until it fits the bet.";
    out("verdict", verdict);
    root.classList.toggle("is-negative", isFinite(roi) && roi < 0);
  }

  function setLever(next) {
    lever = next;
    Array.prototype.forEach.call(tabs, function (t) { t.setAttribute("aria-selected", t.getAttribute("data-lever") === next ? "true" : "false"); });
    Array.prototype.forEach.call(groups, function (g) { g.hidden = g.getAttribute("data-lever-fields") !== next; });
    if (!touchedWeeks) form.elements.weeks.value = defaultWeeks[next];
    calc();
  }

  Array.prototype.forEach.call(tabs, function (t) {
    t.addEventListener("click", function () { setLever(t.getAttribute("data-lever")); });
  });
  function fit(el) { el.style.width = Math.max(String(el.value).length, 1) + 1 + "ch"; }
  Array.prototype.forEach.call(form.querySelectorAll("input"), fit);
  form.addEventListener("input", function (e) {
    if (e.target && e.target.tagName === "INPUT") fit(e.target);
    if (e.target && e.target.name === "weeks") touchedWeeks = true;
    calc();
    if (!tracked && typeof window.trackEvent === "function") {
      tracked = true;
      window.trackEvent("roi_calculator_used", { lever: lever, page: "roi-of-design" });
    }
  });
  calc();
})();
