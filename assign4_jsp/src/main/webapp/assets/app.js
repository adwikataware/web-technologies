/* Progressive enhancement only.

   Unlike the servlet build, this page needs almost no JavaScript: the amount is
   printed by <fmt:formatNumber> and the gauge width is written by a JSP
   declaration, both server-side. All that is left is expanding a history row. */

(function () {
    'use strict';

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
