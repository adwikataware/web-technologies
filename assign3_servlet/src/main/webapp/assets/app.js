/* Progressive enhancement only — the page is fully readable without this file.
   The servlet renders every number already; JavaScript just animates them. */

(function () {
    'use strict';

    // Count the bill amount up from zero.
    var amount = document.getElementById('amount');
    if (amount) {
        var target = parseFloat(amount.dataset.value) || 0;
        var duration = 900;
        var startedAt = null;

        var format = function (value) {
            return '₹' + value.toLocaleString('en-IN', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
        };

        var step = function (now) {
            if (startedAt === null) { startedAt = now; }
            var progress = Math.min((now - startedAt) / duration, 1);
            var eased = 1 - Math.pow(1 - progress, 3);      // easeOutCubic
            amount.textContent = format(target * eased);
            if (progress < 1) { requestAnimationFrame(step); }
        };
        requestAnimationFrame(step);
    }

    // Fill the usage gauge, mapping the reading onto a 0–300 kWh scale.
    var gauge = document.querySelector('.gauge');
    if (gauge) {
        var fill = gauge.querySelector('.fill');
        var units = parseFloat(gauge.dataset.units) || 0;
        var percent = Math.min(units / 300 * 100, 100);
        setTimeout(function () { fill.style.width = percent + '%'; }, 120);
    }

    // History rows expand to reveal that bill's slab breakdown.
    document.querySelectorAll('.history tr.main').forEach(function (row) {
        var toggle = function () {
            var detail = row.nextElementSibling;
            if (!detail || !detail.classList.contains('detail')) { return; }
            var open = row.classList.toggle('open');
            detail.classList.toggle('show', open);
            row.setAttribute('aria-expanded', open ? 'true' : 'false');
        };

        row.addEventListener('click', toggle);
        row.addEventListener('keydown', function (event) {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                toggle();
            }
        });
    });
})();
