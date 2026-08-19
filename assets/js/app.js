(function () {
  "use strict";

  var rows = Array.prototype.slice.call(document.querySelectorAll(".tree__row[href^='#']"));
  if (!rows.length) return;

  var targets = rows
    .map(function (row) {
      var el = document.getElementById(row.getAttribute("href").slice(1));
      return el ? { row: row, el: el } : null;
    })
    .filter(Boolean);

  if (!targets.length) return;

  var offset = 130;

  function sync() {
    var y = window.scrollY + offset;
    var current = targets[0];
    targets.forEach(function (t) {
      if (t.el.offsetTop <= y) current = t;
    });
    rows.forEach(function (row) {
      row.classList.toggle("is-active", row === current.row);
    });
  }

  var ticking = false;
  window.addEventListener(
    "scroll",
    function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        sync();
        ticking = false;
      });
    },
    { passive: true }
  );

  sync();
})();
