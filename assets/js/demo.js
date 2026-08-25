/* Interactive WhySlow demo. Everything is fake data rendered in the browser —
   no Unity, no project, nothing installed. The window reproduces the real tool's
   tabs, actions and wording. */

(function () {
  "use strict";

  var D = window.WS_DATA;
  var root = document.getElementById("ws-demo");
  if (!root || !D) return;

  var TABS = ["Checkup", "Project Assets", "Build X-Ray", "Performance Hunter", "Compile Time"];

  var state = {
    tab: 0,
    toasts: [],
    checkup: { view: 0, profile: "Mobile", fixed: [], expanded: [], scanned: false, wizard: null },
    assets: { view: 0, deadScanned: false, dupScanned: false, importScanned: false, quarantined: [], ignored: [], importFixed: [], importSkipped: [] },
    build: { view: 0, made: false, tile: 0, fixed: [] },
    hunter: { phase: "idle", frames: [], elapsed: 0 },
    compile: { analyzed: false, removed: [], ignored: [] }
  };

  var timers = { hunt: null };
  var toastSeq = 0;

  /* ---------------- helpers ---------------- */

  function esc(text) {
    return String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function has(list, value) {
    return list.indexOf(value) !== -1;
  }

  function withValue(list, value) {
    return has(list, value) ? list : list.concat([value]);
  }

  function without(list, value) {
    return list.filter(function (item) { return item !== value; });
  }

  function bytes(value) {
    if (value >= 1024 * 1024 * 1024) return (value / 1024 / 1024 / 1024).toFixed(1) + " GB";
    if (value >= 1024 * 1024) return (value / 1024 / 1024).toFixed(1) + " MB";
    if (value >= 1024) return (value / 1024).toFixed(1) + " KB";
    return Math.round(value) + " B";
  }

  function toast(message) {
    toastSeq += 1;
    var entry = { id: toastSeq, message: message };
    var others = state.toasts.filter(function (item) { return item.message !== message; });
    state.toasts = others.concat([entry]).slice(-2);
    render();
    window.setTimeout(function () {
      state.toasts = state.toasts.filter(function (item) { return item.id !== entry.id; });
      render();
    }, 4000);
  }

  function button(action, label, extra, attrs) {
    return '<button class="ws-btn ' + (extra || "") + '" data-act="' + action + '"' + (attrs || "") + ">" + esc(label) + "</button>";
  }

  /* ---------------- checkup: scene ---------------- */

  function visibleIssues() {
    return D.SCENE_ISSUES.filter(function (issue) {
      return !issue.profiles || has(issue.profiles, state.checkup.profile);
    });
  }

  function severityOf(issue) {
    return has(state.checkup.fixed, issue.id) ? "pass" : issue.severity;
  }

  function healthScore() {
    var score = 100;
    visibleIssues().forEach(function (issue) {
      var severity = severityOf(issue);
      if (severity === "crit") score -= 12;
      if (severity === "warn") score -= 4;
    });
    return Math.max(5, Math.min(100, score));
  }

  function safeFixCount() {
    return visibleIssues().filter(function (issue) {
      return issue.safe && issue.fix && !has(state.checkup.fixed, issue.id);
    }).length;
  }

  function issueCard(issue) {
    var severity = severityOf(issue);
    var fixed = severity === "pass";
    var expanded = has(state.checkup.expanded, issue.id);
    var cls = severity === "crit" ? "ws-issue--crit" : severity === "warn" ? "ws-issue--warn" : "ws-issue--pass";
    var title = fixed ? issue.passedTitle : issue.title;

    var html = '<div class="ws-issue ' + cls + (fixed ? " is-fixed" : "") + '">';
    html += '<div class="ws-issue__title"><span>●</span><span>' + esc(title) + "</span></div>";
    if (!fixed) html += '<div class="ws-issue__why">' + esc(issue.why) + "</div>";

    html += '<div class="ws-row-btns">';
    if (!fixed && issue.targets > 0) {
      html += button("select", "Select", "", ' data-id="' + issue.id + '"');
    }
    if (!fixed && issue.fix) {
      html += button("fix", issue.fix, "ws-btn--accent", ' data-id="' + issue.id + '"');
    }
    if (!fixed && issue.scene) {
      html += button("scene", "Show in Scene", "", ' data-id="' + issue.id + '"');
    }
    html += button("details", expanded ? "Hide details" : "Learn more", "", ' data-id="' + issue.id + '"');
    html += "</div>";

    if (expanded) {
      html += '<div class="ws-issue__more"><h5>What to do</h5><p>' + esc(issue.learnMore) + "</p>";
      html += '<a class="ws-btn" href="' + esc(issue.docs) + '" target="_blank" rel="noopener">Open Unity documentation</a></div>';
    }

    html += "</div>";
    return html;
  }

  function renderSceneCheckup() {
    var issues = visibleIssues();
    var score = healthScore();
    var critical = issues.filter(function (i) { return severityOf(i) === "crit"; });
    var warnings = issues.filter(function (i) { return severityOf(i) === "warn"; });
    var passed = issues.filter(function (i) { return severityOf(i) === "pass"; });
    var safe = safeFixCount();

    var html = '<div class="ws-bar">';
    html += '<span class="ws-muted">Profile</span>';
    html += '<select class="ws-select" data-act="profile">';
    ["Mobile", "Desktop", "WebGL"].forEach(function (name) {
      html += '<option' + (state.checkup.profile === name ? " selected" : "") + ">" + name + "</option>";
    });
    html += "</select>";
    html += '<span class="ws-score"><span class="ws-score__fill" style="width:' + score + '%"></span>';
    html += '<span class="ws-score__label">Health Score: ' + score + "/100</span></span>";
    html += "</div>";

    html += '<div class="ws-bar">';
    html += button("fixall", "Fix all safe issues (" + safe + ")", "", safe === 0 ? " disabled" : "");
    html += button("wizard", "Optimization Wizard");
    html += button("recheck", "Check Again");
    html += "</div>";

    html += '<div class="ws-summary">';
    html += '<span class="dot-crit">● <b>' + critical.length + "</b> critical</span>";
    html += '<span class="dot-warn">● <b>' + warnings.length + "</b> warnings</span>";
    html += '<span class="dot-pass">● <b>' + (passed.length + D.PASSED_ISSUES.length) + "</b> passed</span>";
    html += "</div>";

    critical.concat(warnings).forEach(function (issue) { html += issueCard(issue); });

    if (passed.length) {
      html += '<div class="ws-title">Fixed in this session</div>';
      passed.forEach(function (issue) { html += issueCard(issue); });
    }

    html += '<div class="ws-title">Passed</div>';
    html += '<div class="ws-card ws-card--flat">';
    D.PASSED_ISSUES.forEach(function (text) {
      html += '<div class="dot-pass" style="font-size:11.5px">● <span style="color:var(--cream)">' + esc(text) + "</span></div>";
    });
    html += "</div>";

    return html;
  }

  /* ---------------- checkup: code ---------------- */

  function renderCodeScan() {
    var html = '<div class="ws-title">Allocation patterns in your code</div>';
    html += '<div class="ws-desc">Finds allocation patterns by reading your scripts. No Play Mode, no build — it works on a project you just opened.</div>';

    if (!state.checkup.scanned) {
      html += '<div class="ws-bar">' + button("codescan", "Scan code", "ws-btn--primary") + "</div>";
      html += '<div class="ws-card ws-card--flat ws-muted">Your own code only: everything under Assets, plus any package you keep in the project yourself. Unity\'s own packages are left out.</div>';
      return html;
    }

    var files = {};
    D.CODE_FINDINGS.forEach(function (f) { files[f.file] = true; });

    html += '<div class="ws-bar">' + button("codescan", "Scan code") + button("copy", "Copy findings") + "</div>";
    html += '<div class="ws-muted" style="margin:4px 2px 8px">' + D.CODE_FINDINGS.length + " findings in " + Object.keys(files).length + " files</div>";

    D.CODE_FINDINGS.forEach(function (f) {
      var cls = f.severity === "crit" ? "ws-issue--crit" : "ws-issue--warn";
      html += '<div class="ws-issue ' + cls + '">';
      html += '<div class="ws-issue__title"><span>●</span><span>' + esc(f.pattern) + "</span>";
      if (f.confidence) html += ' <span class="ws-badge ws-badge--guard">' + esc(f.confidence) + "</span>";
      html += "</div>";
      html += '<div class="ws-muted ws-mono" style="margin-top:2px">' + esc(f.file) + ":" + f.line + "  ·  in " + esc(f.method) + "()</div>";
      html += '<div class="ws-stack" style="color:var(--cream)">' + esc(f.source) + "</div>";
      html += '<div class="ws-advice">' + esc(f.advice) + "</div>";
      html += '<div class="ws-row-btns">' + button("open", "Open source line", "", ' data-id="' + esc(f.file) + ":" + f.line + '"') + "</div>";
      html += "</div>";
    });

    return html;
  }

  function renderCheckup() {
    var html = subTabs(["Scene", "Code"], state.checkup.view, "checkup-view");
    html += state.checkup.view === 0 ? renderSceneCheckup() : renderCodeScan();
    return html;
  }

  /* ---------------- project assets ---------------- */

  function renderDeadAssets() {
    var html = '<div class="ws-title">Dead Asset Stripper</div>';
    html += '<div class="ws-desc">Scripts, assemblies, native libraries, shader includes and documentation are never listed. The first step is always a dry run: nothing moves until you ask for it.</div>';

    if (!state.assets.deadScanned) {
      html += '<div class="ws-bar">' + button("deadscan", "Scan project (dry run)", "ws-btn--primary") + "</div>";
      html += '<div class="ws-card ws-card--flat ws-muted">Make a version-control commit before moving any assets.</div>';
      return html;
    }

    var remaining = D.DEAD_ASSETS.filter(function (g) {
      return !has(state.assets.quarantined, g.folder) && !has(state.assets.ignored, g.folder);
    });
    var total = remaining.reduce(function (sum, g) { return sum + g.files.length + g.more; }, 0);

    html += '<div class="ws-bar">' + button("deadscan", "Scan project (dry run)") + "</div>";
    html += '<div class="ws-card ws-card--flat ws-muted">Protected 214 roots: 12 scenes in Build Settings (ticked or not), 63 assets in Resources/StreamingAssets/Editor/Gizmos, 139 addressable entries. Dry run complete: ' + total + " candidates. Nothing was moved.</div>";
    html += '<div class="ws-muted" style="margin:8px 2px">Grouped by folder. A folder where almost everything is unused was probably abandoned; one stray file among live ones is a different question.</div>';

    if (!remaining.length) {
      html += '<div class="ws-card">Nothing left to review in this run.</div>';
    }

    remaining.forEach(function (group) {
      html += '<div class="ws-card">';
      html += '<div style="font-weight:700;color:var(--amber)">' + esc(group.folder) + "</div>";
      html += '<div class="ws-muted">' + esc(group.summary) + "</div>";
      html += '<div class="ws-stack">' + group.files.map(esc).join("\n") + "\n… and " + group.more + " more</div>";
      html += '<div class="ws-row-btns">';
      html += button("quarantine", "Quarantine", "ws-btn--accent", ' data-id="' + esc(group.folder) + '"');
      html += button("ignore-folder", "Ignore folder", "", ' data-id="' + esc(group.folder) + '"');
      html += "</div></div>";
    });

    if (state.assets.quarantined.length) {
      html += '<div class="ws-title">Quarantine recovery available</div>';
      html += '<div class="ws-card">';
      html += '<div class="ws-muted">Quarantine is not deletion. Each file and its .meta is moved out of Assets into a WhySlow_StrippedAssets folder beside it, and a backup .unitypackage is exported first.</div>';
      html += '<div class="ws-stack">' + state.assets.quarantined.map(esc).join("\n") + "</div>";
      html += '<div class="ws-row-btns">' + button("restore-dead", "Restore All", "ws-btn--accent") + "</div>";
      html += "</div>";
    }

    return html;
  }

  function renderDuplicates() {
    var html = '<div class="ws-title">Duplicates</div>';
    html += '<div class="ws-desc">Byte-identical files, and materials that differ only by name. Both ship twice.</div>';

    if (!state.assets.dupScanned) {
      html += '<div class="ws-bar">' + button("dupscan", "Find file and material duplicates", "ws-btn--primary") + "</div>";
      return html;
    }

    html += '<div class="ws-bar">' + button("dupscan", "Find file and material duplicates") + "</div>";
    html += '<div class="ws-title">Exact duplicate files</div>';
    D.DUPLICATE_FILES.forEach(function (group) {
      html += '<div class="ws-card"><div style="font-weight:700">' + esc(group.title) + "</div>";
      html += '<div class="ws-stack">' + group.files.map(esc).join("\n") + "</div>";
      html += '<div class="ws-row-btns">' + button("select-dup", "Select", "", ' data-id="' + esc(group.title) + '"') + "</div></div>";
    });

    html += '<div class="ws-title">Equivalent materials</div>';
    D.DUPLICATE_MATERIALS.forEach(function (group) {
      html += '<div class="ws-card"><div style="font-weight:700">' + esc(group.title) + "</div>";
      html += '<div class="ws-stack">' + group.files.map(esc).join("\n") + "</div>";
      html += '<div class="ws-row-btns">' + button("select-dup", "Select", "", ' data-id="' + esc(group.title) + '"') + "</div></div>";
    });

    return html;
  }

  function renderImportSettings() {
    var html = '<div class="ws-title">Import settings that cost memory for nothing</div>';
    html += '<div class="ws-desc">Scans every mesh, texture and animation clip in the project for import settings that spend memory or CPU on data nothing uses. Each group below is judged separately, so a safe batch fix is never mixed with one that needs your call.</div>';

    if (!state.assets.importScanned) {
      html += '<div class="ws-bar">' + button("importscan", "Scan project assets", "ws-btn--primary") + "</div>";
      return html;
    }

    html += '<div class="ws-bar">' + button("importscan", "Scan project assets") + button("restore-import", "Restore import settings") + "</div>";

    D.IMPORT_GROUPS.forEach(function (group) {
      var open = group.items.filter(function (item) {
        return !has(state.assets.importFixed, item.path + group.id) && !has(state.assets.importSkipped, item.path + group.id);
      });

      html += '<div class="ws-title">' + esc(group.title) + "</div>";
      html += '<div class="ws-desc">' + esc(group.description) + "</div>";

      if (group.blocked) {
        html += '<div class="ws-card ws-card--flat ws-muted">' + esc(group.blocked) + "</div>";
      }

      html += '<div class="ws-bar">';
      html += button("fix-import-all", "Fix All", "ws-btn--accent", (group.fixAll && open.length ? "" : " disabled") + ' data-id="' + group.id + '"');
      html += '<span class="ws-muted">' + open.length + " " + (open.length === 1 ? "asset" : "assets") + " flagged</span>";
      html += "</div>";

      if (!open.length) {
        html += '<div class="ws-card ws-card--flat ws-muted">Everything found is fixed or skipped.</div>';
        return;
      }

      open.forEach(function (item) {
        html += '<div class="ws-card"><div class="ws-mono" style="font-size:11px">' + esc(item.path) + "</div>";
        html += '<div class="ws-muted">' + esc(item.reason) + "</div>";
        html += '<div class="ws-row-btns">';
        if (group.fixAll) {
          html += button("fix-import", "Fix", "ws-btn--accent", ' data-id="' + esc(item.path + group.id) + '"');
        }
        html += button("skip-import", "Skip", "", ' data-id="' + esc(item.path + group.id) + '"');
        html += "</div></div>";
      });
    });

    return html;
  }

  function renderProjectAssets() {
    var html = subTabs(["Dead Assets", "Duplicates", "Import Settings"], state.assets.view, "assets-view");
    if (state.assets.view === 0) html += renderDeadAssets();
    else if (state.assets.view === 1) html += renderDuplicates();
    else html += renderImportSettings();
    return html;
  }

  /* ---------------- build x-ray ---------------- */

  /** Squarified treemap: keeps tiles close to square so small groups stay readable. */
  function squarify(items, width, height) {
    var total = items.reduce(function (sum, item) { return sum + item.bytes; }, 0);
    var scale = (width * height) / total;
    var queue = items.map(function (item) { return { item: item, area: item.bytes * scale }; });
    var out = [];
    var x = 0, y = 0, w = width, h = height;

    while (queue.length) {
      var vertical = w >= h;
      var side = vertical ? h : w;
      var row = [queue.shift()];
      var rowArea = row[0].area;

      while (queue.length) {
        var nextArea = rowArea + queue[0].area;
        if (worst(row, rowArea, side) <= worst(row.concat([queue[0]]), nextArea, side)) break;
        row.push(queue.shift());
        rowArea = nextArea;
      }

      var thickness = rowArea / side;
      var offset = 0;
      row.forEach(function (entry) {
        var length = entry.area / thickness;
        out.push({
          item: entry.item,
          x: vertical ? x : x + offset,
          y: vertical ? y + offset : y,
          w: vertical ? thickness : length,
          h: vertical ? length : thickness
        });
        offset += length;
      });

      if (vertical) { x += thickness; w -= thickness; } else { y += thickness; h -= thickness; }
    }

    return out;
  }

  function worst(row, rowArea, side) {
    var thickness = rowArea / side;
    var ratios = row.map(function (entry) {
      var length = entry.area / thickness;
      return Math.max(thickness / length, length / thickness);
    });
    return Math.max.apply(null, ratios);
  }

  function buildTotal() {
    var saved = state.build.fixed.reduce(function (sum, path) {
      var asset = D.BUILD.assets.filter(function (a) { return a.path === path; })[0];
      return sum + (asset ? parseFloat(asset.saving) * 1024 * 1024 : 0);
    }, 0);
    return D.BUILD.totalBytes - saved;
  }

  function renderBuildOverview() {
    if (!state.build.made) {
      var html = '<div class="ws-empty"><h4>No build data yet</h4>';
      html += "<p>After a build, WhySlow will show where the megabytes went.</p>";
      html += button("makebuild", "Make a build to see the X-Ray", "ws-btn--primary") + "</div>";
      return html;
    }

    var total = buildTotal();
    var out = '<div class="ws-card ws-card--flat">';
    out += '<div class="ws-mono" style="font-size:11.5px">Platform: ' + D.BUILD.platform + "<br>Built: " + D.BUILD.date;
    out += "<br>Total size: <b style='color:var(--amber)'>" + bytes(total) + "</b>";
    out += "<br>Change from previous build: " + D.BUILD.delta;
    out += "<br>Output: " + esc(D.BUILD.output) + "</div></div>";

    out += '<div class="ws-title">Where the build size went</div>';
    out += '<div class="ws-desc">Click any tile to inspect its contents. Tile area shows its share of the assets WhySlow could attribute to the build.</div>';

    var tiles = squarify(D.BUILD.groups, 100, 100);
    out += '<div class="ws-treemap">';
    tiles.forEach(function (tile, index) {
      var group = tile.item;
      var pct = Math.round((group.bytes / D.BUILD.totalBytes) * 100);
      out += '<button class="ws-tile' + (state.build.tile === index ? " is-on" : "") + '" data-act="tile" data-id="' + index + '"';
      out += ' style="left:' + tile.x + "%;top:" + tile.y + "%;width:" + tile.w + "%;height:" + tile.h + "%;background:" + group.color + '">';
      out += '<span class="ws-tile__name">' + esc(group.name) + "</span><br>";
      out += '<span class="ws-tile__meta">' + bytes(group.bytes) + " · " + pct + "% of build</span>";
      out += "</button>";
    });
    out += "</div>";

    var selected = D.BUILD.groups[state.build.tile];
    if (selected) {
      out += '<div class="ws-card"><div style="font-weight:700;color:var(--amber)">' + esc(selected.name) + "</div>";
      out += '<div class="ws-muted">' + Math.round((selected.bytes / D.BUILD.totalBytes) * 100) + "% of the full build · " + selected.count + " assets · " + bytes(selected.bytes) + "</div>";
      out += '<div class="ws-stack">' + tileContents(selected).map(esc).join("\n") + "</div></div>";
    }

    out += '<div class="ws-title">Top assets by size</div>';
    out += '<div class="ws-desc">Packed size is recorded in the last build. It can differ from the source file size and the texture memory shown in the Inspector.</div>';
    out += '<div class="ws-scroll"><table class="ws-table"><thead><tr>';
    out += "<th>Asset</th><th>Type</th><th class='num'>Packed size</th><th class='num'>% of build</th><th class='act'>Fix</th>";
    out += "</tr></thead><tbody>";

    D.BUILD.assets.forEach(function (asset) {
      var fixed = has(state.build.fixed, asset.path);
      out += "<tr><td class='ws-mono' style='font-size:11px'>" + esc(asset.path) + "</td>";
      out += "<td class='ws-muted'>" + esc(asset.type) + "</td>";
      out += "<td class='num'>" + bytes(asset.bytes) + "</td>";
      out += "<td class='num ws-muted'>" + ((asset.bytes / D.BUILD.totalBytes) * 100).toFixed(1) + "%</td>";
      out += "<td class='act'>";
      if (fixed) {
        out += "<span class='ws-applied'>Applied · rebuild</span>";
      } else if (asset.fix === "texture") {
        out += button("fixasset", "Compress texture", "ws-btn--accent", ' data-id="' + esc(asset.path) + '"');
      } else if (asset.fix === "audio") {
        out += button("fixasset", "Stream as Vorbis (about -" + asset.saving + ")", "ws-btn--accent", ' data-id="' + esc(asset.path) + '"');
      } else if (asset.fix === "mesh") {
        out += button("fixasset", "Compress mesh (about -" + asset.saving + ")", "ws-btn--accent", ' data-id="' + esc(asset.path) + '"');
      } else {
        out += "<span class='ws-muted'>—</span>";
      }
      out += "</td></tr>";
    });

    out += "</tbody></table></div>";

    if (state.build.fixed.length) {
      out += '<div class="ws-card ws-card--flat ws-muted">Import settings changed. Packed sizes still describe the last build; make a new build to measure the build-size change. Estimated saving so far: <b style="color:var(--green)">−' + bytes(D.BUILD.totalBytes - buildTotal()) + "</b>.</div>";
    }

    return out;
  }

  function groupOf(asset) {
    if (asset.type.indexOf("Texture") !== -1) return "Textures";
    if (asset.type.indexOf("Audio") !== -1) return "Audio";
    if (asset.type.indexOf("Mesh") !== -1) return "Meshes";
    if (asset.type.indexOf("Font") !== -1) return "Fonts";
    return "Other";
  }

  /** Code and Shaders have no per-asset rows: one is a single binary, the other is
      counted by variant. Saying so beats an empty box under the tile. */
  function tileContents(group) {
    if (group.rows) return group.rows;
    return D.BUILD.assets
      .filter(function (asset) { return groupOf(asset) === group.name; })
      .slice(0, 5)
      .map(function (asset) { return asset.path + "  —  " + bytes(asset.bytes); });
  }

  function renderBuildDiff() {
    if (!state.build.made) {
      return '<div class="ws-empty"><h4>No build data yet</h4><p>Two captured builds are needed before they can be compared.</p>' +
        button("makebuild", "Make a build to see the X-Ray", "ws-btn--primary") + "</div>";
    }

    var diff = D.BUILD_DIFF;
    var html = '<div class="ws-bar"><span class="ws-muted">Before</span><select class="ws-select"><option>' + esc(diff.before) + "</option></select>";
    html += '<span class="ws-muted">After</span><select class="ws-select"><option>' + esc(diff.after) + "</option></select></div>";
    html += '<div class="ws-verdict is-warn">' + esc(diff.summary) + "</div>";

    [["Grown", diff.grown], ["Added", diff.added], ["Shrunk", diff.shrunk], ["Removed", diff.removed]].forEach(function (section) {
      html += '<div class="ws-title">' + section[0] + "</div>";
      section[1].forEach(function (row) {
        html += '<div class="ws-card"><div class="ws-mono" style="font-size:11px">' + esc(row.path) + "</div>";
        html += '<div class="ws-muted">' + esc(row.row) + "</div></div>";
      });
    });

    return html;
  }

  function renderBuildXRay() {
    var html = subTabs(["Overview", "Build Diff"], state.build.view, "build-view");
    html += state.build.view === 0 ? renderBuildOverview() : renderBuildDiff();
    return html;
  }

  /* ---------------- performance hunter ---------------- */

  function huntBytesPerFrame() {
    var visible = visibleOffenders();
    return visible.reduce(function (sum, o) { return sum + o.bytesPerFrame; }, 0);
  }

  function visibleOffenders() {
    if (state.hunter.phase === "idle") return [];
    var unlocked = state.hunter.phase === "done" ? D.HUNT_OFFENDERS.length : Math.min(D.HUNT_OFFENDERS.length, Math.floor(state.hunter.elapsed / 0.7) + 1);
    return D.HUNT_OFFENDERS.slice(0, unlocked);
  }

  /** The headline rate is the average of the recorded frames, not the sum of the
      offender list: the graph, the tiles and the verdict then all describe the same
      series, instead of an average that reads higher than the total above it. */
  function frameAverage() {
    var frames = state.hunter.frames;
    if (!frames.length) return huntBytesPerFrame();
    return frames.reduce(function (a, b) { return a + b; }, 0) / frames.length;
  }

  function huntLiveHTML() {
    var frames = state.hunter.frames;
    var recording = state.hunter.phase === "recording";
    var peak = frames.length ? Math.max.apply(null, frames) : 0;

    var out = '<div><div class="ws-live__k">' + (recording ? "Recording" : "Recorded") + '</div><div class="ws-live__v">' + frames.length + " frames</div></div>";
    out += '<div><div class="ws-live__k">From your scripts</div><div class="ws-live__v is-hot">' + bytes(frameAverage()) + " / frame</div></div>";
    out += '<div><div class="ws-live__k">Peak</div><div class="ws-live__v">' + bytes(peak) + " in one frame</div></div>";
    out += '<div><div class="ws-live__k">Traced</div><div class="ws-live__v">94%</div></div>';
    return out;
  }

  /** Ceiling follows the 90th percentile, not the worst frame: one 20x spike
      otherwise flattens every other bar to nothing. Frames above it are drawn
      full height in red, the way the tool makes clipping visible. */
  function huntGraphHTML() {
    var frames = state.hunter.frames;
    var base = Math.max(huntBytesPerFrame(), 1);
    var sorted = frames.slice().sort(function (a, b) { return a - b; });
    var percentile = sorted.length ? sorted[Math.floor(sorted.length * 0.9)] : base;
    var ceiling = Math.max(percentile, base * 1.4) * 1.15;

    var out = '<span class="ws-graph__top">top ' + bytes(ceiling) + "</span>";
    frames.slice(-140).forEach(function (value) {
      var over = value > ceiling;
      var height = over ? 100 : Math.max(2, Math.round((value / ceiling) * 100));
      out += '<span class="ws-graph__bar' + (over ? " is-over" : "") + '" style="height:' + height + '%"></span>';
    });
    return out;
  }

  function renderHunter() {
    if (state.hunter.phase === "idle") {
      var html = '<div class="ws-empty"><h4>See what your game costs while you play</h4>';
      html += "<p>Performance Hunter traces allocations back to your own scripts and shows what the renderer is being asked to draw.</p>";
      html += button("hunt-start", "Start Hunt", "ws-btn--primary") + "</div>";
      html += '<div class="ws-card ws-card--flat ws-muted">In Unity this needs Play Mode. Here it runs on a recording of a fake session — press Start Hunt and let it run for a few seconds.</div>';
      return html;
    }

    var recording = state.hunter.phase === "recording";

    var out = '<div class="ws-bar">';
    out += recording ? button("hunt-stop", "Stop Hunt", "ws-btn--primary") : button("hunt-start", "Start Hunt", "ws-btn--primary");
    out += button("hunt-clear", "Clear");
    out += button("hunt-reset", "Reset demo");
    out += "</div>";

    out += '<div class="ws-live" id="ws-live">' + huntLiveHTML() + "</div>";
    out += '<div class="ws-graph" id="ws-graph">' + huntGraphHTML() + "</div>";

    if (recording) {
      out += '<div class="ws-card ws-card--flat ws-muted">Recording frames. Play your game, then stop the hunt to see allocations traced to project code.</div>';
    } else {
      var perFrameRate = frameAverage();
      var perSecond = perFrameRate * 60;
      var verdictClass = perFrameRate > 1500 ? "is-crit" : perFrameRate > 400 ? "is-warn" : "is-ok";
      var verdictText = perFrameRate > 1500
        ? bytes(perFrameRate) + " per frame — about " + bytes(perSecond) + " per second. Expect regular hitches."
        : perFrameRate > 400
          ? bytes(perFrameRate) + " per frame — about " + bytes(perSecond) + " per second. Collections will interrupt longer sessions."
          : bytes(perFrameRate) + " per frame — about " + bytes(perSecond) + " per second. Not worth chasing.";
      out += '<div class="ws-verdict ' + verdictClass + '"><b>' + esc(verdictText) + "</b>";
      out += '<div class="ws-muted" style="margin-top:6px">The collector ran 7 times in 12.4 s — about every 1.8 s — costing 4.1 ms on average, worst 9.7 ms. Those are the hitches you feel.</div>';
      out += '<div class="ws-muted" style="margin-top:4px">Previous hunt: 214 KB per second. Now ' + bytes(perSecond) + " per second — up 18%.</div>";
      out += "</div>";
    }

    out += '<div class="ws-title">' + (recording ? "Caught so far" : "Allocation offenders") + "</div>";

    var offenders = visibleOffenders();
    if (!offenders.length) {
      out += '<div class="ws-card ws-card--flat ws-muted">No allocation traced to your scripts yet. Keep playing.</div>';
    }

    offenders.forEach(function (o) {
      var badge = o.behaviour === "Every frame" ? "ws-badge--every" : o.behaviour === "Spikes" ? "ws-badge--spikes" : "ws-badge--occasional";
      out += '<div class="ws-issue ws-issue--warn">';
      out += '<div class="ws-issue__title"><span>●</span><span>' + esc(o.site) + '</span> <span class="ws-badge ' + badge + '">' + o.behaviour + "</span></div>";
      out += '<div class="ws-muted ws-mono" style="margin-top:2px">' + esc(o.file) + ":" + o.line + "</div>";
      out += '<div class="ws-issue__why" style="margin-top:4px">' + esc(o.pattern) + " — " + bytes(o.bytesPerFrame) + " / frame</div>";
      out += '<div class="ws-muted" style="font-size:11px">' + o.share + "% of traced garbage · " + o.frames + "% of frames · " + o.calls + " calls / frame</div>";
      if (!recording) {
        out += '<div class="ws-stack">Call stack\n' + esc(o.stack) + "</div>";
        out += '<div class="ws-advice">' + esc(o.advice) + "</div>";
        out += '<div class="ws-row-btns">' + button("open", "Open source line", "", ' data-id="' + esc(o.file) + ":" + o.line + '"') + "</div>";
      }
      out += "</div>";
    });

    if (!recording) {
      out += '<div class="ws-title">Worst frames</div>';
      out += '<div class="ws-desc">The frames that allocated most, and the call site responsible for the bulk of each.</div>';
      D.PEAK_FRAMES.forEach(function (p) {
        out += '<div class="ws-card"><b class="ws-mono">frame ' + p.frame + " · " + p.bytes + "</b>";
        out += '<div class="ws-muted">' + esc(p.cause) + " — " + p.causeBytes + " of it</div></div>";
      });

      out += '<div class="ws-title">Heavy allocations</div>';
      out += '<div class="ws-desc">Single allocations of 64 KB or more. One oversized array or list resize can cost more than a whole second of small churn.</div>';
      D.HEAVY_ALLOCATIONS.forEach(function (h) {
        out += '<div class="ws-card"><b>' + esc(h.site) + '</b><div class="ws-muted ws-mono">' + esc(h.row) + "</div></div>";
      });

      out += '<div class="ws-title">What the renderer is being asked to draw</div>';
      out += '<div class="ws-live">';
      out += '<div><div class="ws-live__k">Batches</div><div class="ws-live__v">' + D.RENDER_STATS.batches + '</div><div class="ws-muted ws-mono" style="font-size:10px">peak ' + D.RENDER_STATS.batchesPeak + "</div></div>";
      out += '<div><div class="ws-live__k">SetPass calls</div><div class="ws-live__v is-hot">' + D.RENDER_STATS.setPass + '</div><div class="ws-muted ws-mono" style="font-size:10px">peak ' + D.RENDER_STATS.setPassPeak + "</div></div>";
      out += '<div><div class="ws-live__k">Triangles</div><div class="ws-live__v">' + D.RENDER_STATS.triangles + '</div><div class="ws-muted ws-mono" style="font-size:10px">peak ' + D.RENDER_STATS.trianglesPeak + "</div></div>";
      out += "</div>";
      out += '<div class="ws-card ws-card--flat ws-muted">SetPass calls are the expensive part: each one is a shader and material state change. Objects sharing one material batch together; objects with their own material cannot.</div>';
    }

    return out;
  }

  /* ---------------- compile time ---------------- */

  function renderCompile() {
    var html = '<div class="ws-title">What your edit-compile loop costs</div>';
    html += '<div class="ws-desc">Every script edit costs a compile and a domain reload. This prices each assembly by what has to rebuild when you touch it, using timings measured in this project.</div>';

    if (!state.compile.analyzed) {
      html += '<div class="ws-bar">' + button("analyze", "Analyze assemblies", "ws-btn--primary") + "</div>";
      return html;
    }

    html += '<div class="ws-bar">' + button("analyze", "Analyze assemblies") + "</div>";
    html += '<div class="ws-card ws-card--flat ws-muted">6 assemblies in the graph. 5 assemblies have been edited at least once across 128 recorded compilations, so the wait they cause has been measured. Every compile is followed by a domain reload, which takes about 2.4 s here.</div>';

    html += '<div class="ws-title">Findings</div>';
    D.COMPILE_FINDINGS.forEach(function (f) {
      if (has(state.compile.removed, f.id)) return;
      var cls = f.severity === "crit" ? "ws-issue--crit" : "ws-issue--warn";
      html += '<div class="ws-issue ' + cls + '">';
      html += '<div class="ws-issue__title"><span>●</span><span>' + esc(f.title) + "</span></div>";
      html += '<div class="ws-issue__why">' + esc(f.detail) + "</div>";
      if (f.action) {
        html += '<div class="ws-row-btns">' + button("remove-ref", f.action, "ws-btn--accent", ' data-id="' + f.id + '"') + "</div>";
      }
      html += "</div>";
    });

    if (state.compile.removed.length) {
      html += '<div class="ws-card ws-card--flat"><b>References removed by WhySlow (' + state.compile.removed.length + ")</b>";
      html += '<div class="ws-muted">Game.Audio, removed from Game.UI</div>';
      html += '<div class="ws-row-btns">' + button("restore-ref", "Put it back") + "</div></div>";
    }

    html += '<div class="ws-title">Cost to touch</div>';
    html += '<div class="ws-desc">What rebuilds when you edit each assembly: itself plus everything that depends on it. Times are the wait measured across whole compilations.</div>';

    D.COMPILE_COSTS.forEach(function (row) {
      if (has(state.compile.ignored, row.name)) return;
      html += '<div class="ws-card">';
      html += '<div style="display:flex;justify-content:space-between;gap:10px;align-items:baseline">';
      html += "<b>" + esc(row.name) + '</b><span class="ws-mono" style="color:var(--amber)">' + esc(row.cost) + "</span></div>";
      html += '<div class="ws-score" style="height:5px;margin:4px 0"><span class="ws-score__fill" style="width:' + row.pct + '%"></span></div>';
      html += '<div class="ws-muted">' + esc(row.blast) + "</div>";
      html += '<div class="ws-row-btns">' + button("not-mine", "Not mine", "", ' data-id="' + esc(row.name) + '"') + "</div>";
      html += "</div>";
    });

    if (state.compile.ignored.length) {
      html += '<div class="ws-card ws-card--flat"><b>Marked as not yours (' + state.compile.ignored.length + ")</b>";
      html += '<div class="ws-stack">' + state.compile.ignored.map(esc).join("\n") + "</div>";
      html += '<div class="ws-row-btns">' + button("unignore-asm", "Undo") + "</div></div>";
    }

    return html;
  }

  /* ---------------- wizard ---------------- */

  function wizardQueue() {
    return visibleIssues().filter(function (issue) {
      return issue.severity !== "pass" && !has(state.checkup.fixed, issue.id);
    });
  }

  function renderWizard() {
    var wizard = state.checkup.wizard;
    if (!wizard) return "";

    var queue = wizard.queue;
    var issue = queue[wizard.index];

    var html = '<div class="ws-modal"><div class="ws-modal__box">';
    if (!issue) {
      html += '<div class="ws-modal__step">Optimization complete</div>';
      html += "<h4>Optimization Wizard</h4>";
      html += '<div class="ws-mono" style="white-space:pre-line;margin:8px 0">Health Score: ' + wizard.startScore + " → " + healthScore() +
        "\nFixed: " + wizard.fixed + "\nSkipped: " + wizard.skipped + "</div>";
      html += '<div class="ws-row-btns">' + button("wizard-close", "Close wizard", "ws-btn--primary") + "</div>";
    } else {
      html += '<div class="ws-modal__step">' + (issue.severity === "crit" ? "Critical issue" : "Warning") + " · " + (wizard.index + 1) + " of " + queue.length + "</div>";
      html += "<h4>" + esc(issue.title) + "</h4>";
      html += '<div class="ws-muted">' + esc(issue.why) + "</div>";
      html += '<div class="ws-row-btns">';
      if (issue.fix) html += button("wizard-fix", "Fix this issue", "ws-btn--primary");
      html += button("wizard-skip", "Skip");
      html += button("wizard-close", "Close wizard");
      html += "</div>";
    }
    html += "</div></div>";
    return html;
  }

  /* ---------------- shell ---------------- */

  function subTabs(labels, active, act) {
    var html = '<div class="ws-tabs ws-tabs--sub">';
    labels.forEach(function (label, index) {
      html += '<button class="ws-tab' + (index === active ? " is-on" : "") + '" data-act="' + act + '" data-id="' + index + '">' + esc(label) + "</button>";
    });
    return html + "</div>";
  }

  function render() {
    var html = '<div class="ws__titlebar"><span class="ws__titletab"><svg><use href="#i-bolt"/></svg> WhySlow</span>';
    html += '<span class="ws__spacer"></span><span class="ws__hint">demo · fake project · nothing is installed</span></div>';

    html += '<div class="ws__body">';
    html += '<div class="ws-tabs">';
    TABS.forEach(function (label, index) {
      html += '<button class="ws-tab' + (index === state.tab ? " is-on" : "") + '" data-act="tab" data-id="' + index + '">' + esc(label) + "</button>";
    });
    html += "</div>";

    if (state.tab === 0) html += renderCheckup();
    else if (state.tab === 1) html += renderProjectAssets();
    else if (state.tab === 2) html += renderBuildXRay();
    else if (state.tab === 3) html += renderHunter();
    else html += renderCompile();

    html += "</div>";

    html += renderWizard();

    if (state.toasts.length) {
      html += '<div class="ws-toasts">';
      state.toasts.forEach(function (entry) {
        html += '<div class="ws-toast">' + esc(entry.message) + "</div>";
      });
      html += "</div>";
    }

    root.innerHTML = html;
  }

  /* ---------------- actions ---------------- */

  function issueById(id) {
    return D.SCENE_ISSUES.filter(function (issue) { return issue.id === id; })[0];
  }

  var ACTIONS = {
    tab: function (id) { state.tab = Number(id); },
    "checkup-view": function (id) { state.checkup.view = Number(id); },
    "assets-view": function (id) { state.assets.view = Number(id); },
    "build-view": function (id) { state.build.view = Number(id); },
    profile: function (_, element) {
      state.checkup.profile = element.value;
      toast("Profile set to " + element.value + ". Rules that only apply to this target are re-evaluated.");
    },
    details: function (id) {
      state.checkup.expanded = has(state.checkup.expanded, id)
        ? without(state.checkup.expanded, id)
        : withValue(state.checkup.expanded, id);
    },
    select: function (id) {
      var issue = issueById(id);
      toast("Selected " + issue.targets + " objects in the Hierarchy. In the editor they are pinged and highlighted.");
    },
    scene: function () {
      toast("The offending objects are outlined in the Scene view until you press Hide in Scene.");
    },
    fix: function (id) {
      var issue = issueById(id);
      state.checkup.fixed = withValue(state.checkup.fixed, id);
      toast(issue.fix.replace(/^Fix: /, "Applied: ") + ". Ctrl+Z reverts it.");
    },
    fixall: function () {
      var safe = visibleIssues().filter(function (issue) {
        return issue.safe && issue.fix && !has(state.checkup.fixed, issue.id);
      });
      state.checkup.fixed = state.checkup.fixed.concat(safe.map(function (issue) { return issue.id; }));
      toast("Fixed " + safe.length + " issues. Ctrl+Z reverts everything.");
    },
    recheck: function () {
      state.checkup.fixed = [];
      state.checkup.expanded = [];
      toast("Scene and project settings checked again — the demo project is back to its original state.");
    },
    codescan: function () {
      state.checkup.scanned = true;
      toast("Scanned 428 scripts in 1.2 s.");
    },
    copy: function () {
      toast("Copied " + D.CODE_FINDINGS.length + " findings to the clipboard.");
    },
    open: function (id) {
      toast("In Unity this opens " + id + " in your IDE, on that line.");
    },

    wizard: function () {
      state.checkup.wizard = { queue: wizardQueue(), index: 0, fixed: 0, skipped: 0, startScore: healthScore() };
    },
    "wizard-fix": function () {
      var wizard = state.checkup.wizard;
      var issue = wizard.queue[wizard.index];
      state.checkup.fixed = withValue(state.checkup.fixed, issue.id);
      state.checkup.wizard = Object.assign({}, wizard, { index: wizard.index + 1, fixed: wizard.fixed + 1 });
    },
    "wizard-skip": function () {
      var wizard = state.checkup.wizard;
      state.checkup.wizard = Object.assign({}, wizard, { index: wizard.index + 1, skipped: wizard.skipped + 1 });
    },
    "wizard-close": function () {
      state.checkup.wizard = null;
    },

    deadscan: function () {
      state.assets.deadScanned = true;
      state.assets.quarantined = [];
      state.assets.ignored = [];
      toast("Dry run complete: 71 candidates. Nothing was moved.");
    },
    quarantine: function (id) {
      state.assets.quarantined = withValue(state.assets.quarantined, id);
      toast("Moved the files under " + id + " out of Assets. A backup .unitypackage was exported first; Restore All brings them back.");
    },
    "ignore-folder": function (id) {
      state.assets.ignored = withValue(state.assets.ignored, id);
      toast("Ignored " + id + ". Options ▾ clears the ignore list.");
    },
    "restore-dead": function () {
      state.assets.quarantined = [];
      toast("Restored the quarantined assets; all hashes match.");
    },
    dupscan: function () {
      state.assets.dupScanned = true;
      toast("Hashed 4,812 files and compared 611 materials.");
    },
    "select-dup": function () {
      toast("Selected the duplicate group in the Project window.");
    },
    importscan: function () {
      state.assets.importScanned = true;
      state.assets.importFixed = [];
      state.assets.importSkipped = [];
      toast("Scanned every mesh, texture and animation clip in the project.");
    },
    "fix-import": function (id) {
      state.assets.importFixed = withValue(state.assets.importFixed, id);
      toast("Import setting changed and the asset reimported. The original settings are saved — Restore import settings puts them back.");
    },
    "skip-import": function (id) {
      state.assets.importSkipped = withValue(state.assets.importSkipped, id);
    },
    "fix-import-all": function (id) {
      var group = D.IMPORT_GROUPS.filter(function (g) { return g.id === id; })[0];
      var keys = group.items.map(function (item) { return item.path + group.id; });
      state.assets.importFixed = state.assets.importFixed.concat(keys);
      toast("Fixed " + keys.length + " assets. Restore reverts the batch.");
    },
    "restore-import": function () {
      state.assets.importFixed = [];
      state.assets.importSkipped = [];
      toast("Import settings restored from the backup WhySlow wrote before the fix.");
    },

    makebuild: function () {
      state.build.made = true;
      toast("Build captured. WhySlow records the report after every build automatically — this is the last one.");
    },
    tile: function (id) {
      state.build.tile = Number(id);
    },
    fixasset: function (id) {
      state.build.fixed = withValue(state.build.fixed, id);
      var asset = D.BUILD.assets.filter(function (a) { return a.path === id; })[0];
      toast("Applied. Estimated saving " + asset.saving + " — make a build to measure the real change.");
    },

    "hunt-start": function () {
      state.hunter = { phase: "recording", frames: [], elapsed: 0 };
      startHunt();
    },
    "hunt-stop": function () {
      stopHunt();
      state.hunter.phase = "done";
      // A hunt stopped after two seconds — or throttled by a background tab — leaves a
      // series shorter than the offender list it is summarised against, and a peak below
      // the per-frame average reads as a bug. Fill it out at the full rate instead.
      state.hunter.frames = padFrames(state.hunter.frames, 60);
      toast("Hunt stopped. " + state.hunter.frames.length + " frames analyzed.");
    },
    "hunt-clear": function () {
      state.hunter.frames = [];
      toast("Forgot everything caught so far and kept recording.");
    },
    "hunt-reset": function () {
      stopHunt();
      state.hunter = { phase: "idle", frames: [], elapsed: 0 };
    },

    analyze: function () {
      state.compile.analyzed = true;
      state.compile.removed = [];
      state.compile.ignored = [];
      toast("Read the assembly graph: 6 assemblies, 128 recorded compilations.");
    },
    "remove-ref": function (id) {
      state.compile.removed = withValue(state.compile.removed, id);
      toast("Removed the reference from the asmdef. Put it back restores it.");
    },
    "restore-ref": function () {
      state.compile.removed = [];
      toast("Reference restored.");
    },
    "not-mine": function (id) {
      state.compile.ignored = withValue(state.compile.ignored, id);
    },
    "unignore-asm": function () {
      state.compile.ignored = [];
    }
  };

  function frameSample(base) {
    var spike = Math.random() < 0.07 ? 2 + Math.random() * 3.5 : 1;
    var jitter = 0.8 + Math.random() * 0.4;
    return Math.round(base * jitter * spike);
  }

  function padFrames(frames, minimum) {
    var base = Math.max(huntBytesPerFrame(), 1);
    var padded = frames.slice();
    while (padded.length < minimum) {
      padded.push(frameSample(base));
    }
    return padded;
  }

  function startHunt() {
    stopHunt();
    var lastOffenders = visibleOffenders().length;
    timers.hunt = window.setInterval(function () {
      state.hunter.elapsed += 0.12;
      state.hunter.frames = state.hunter.frames
        .concat([frameSample(Math.max(huntBytesPerFrame(), 1))])
        .slice(-600);

      if (state.hunter.elapsed > 30) {
        ACTIONS["hunt-stop"]();
        render();
        return;
      }

      var offenders = visibleOffenders().length;
      if (offenders !== lastOffenders) {
        lastOffenders = offenders;
        render();
        return;
      }

      var live = document.getElementById("ws-live");
      var graph = document.getElementById("ws-graph");
      if (!live || !graph) {
        render();
        return;
      }
      live.innerHTML = huntLiveHTML();
      graph.innerHTML = huntGraphHTML();
    }, 120);
  }

  function stopHunt() {
    if (timers.hunt) window.clearInterval(timers.hunt);
    timers.hunt = null;
  }

  function run(action, id, element) {
    var handler = ACTIONS[action];
    if (!handler) return;
    handler(id, element);
    render();
  }

  root.addEventListener("click", function (event) {
    var target = event.target.closest("[data-act]");
    if (!target || target.tagName === "SELECT") return;
    if (target.tagName === "A") return;
    event.preventDefault();
    run(target.getAttribute("data-act"), target.getAttribute("data-id"), target);
  });

  root.addEventListener("change", function (event) {
    var target = event.target.closest("[data-act]");
    if (!target || target.tagName !== "SELECT") return;
    run(target.getAttribute("data-act"), target.getAttribute("data-id"), target);
  });

  render();
})();
