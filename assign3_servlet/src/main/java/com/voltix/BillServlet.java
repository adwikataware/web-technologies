package com.voltix;

import jakarta.servlet.annotation.WebInitParam;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.io.PrintWriter;
import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.YearMonth;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Optional;

/**
 * The whole application: renders the calculator on GET, validates and saves on
 * POST.
 *
 * <p>Mapped to two patterns. The empty string {@code ""} is the special
 * context-root pattern from the Servlet spec, so {@code /assign3_servlet/}
 * lands here while the container's default servlet still serves
 * {@code /assets/*}. {@code /bill} is the same page under a stable URL, which
 * is what the form posts to and what the month links point at.
 */
@WebServlet(
        name = "billServlet",
        urlPatterns = {"", "/bill"},
        initParams = @WebInitParam(
                name = "seedDemoData",
                value = "true",
                description = "Populate a few sample bills at startup so the dashboard is not empty."))
public class BillServlet extends HttpServlet {

    private static final long serialVersionUID = 1L;

    /** Where the store is published for anything else in the app to find. */
    static final String STORE_ATTRIBUTE = "voltix.billStore";

    private BillStore store;

    @Override
    public void init() {
        store = new BillStore();
        getServletContext().setAttribute(STORE_ATTRIBUTE, store);

        if (Boolean.parseBoolean(getInitParameter("seedDemoData"))) {
            DemoData.seed(store);
        }
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws IOException {
        Bill receipt = parseLong(request.getParameter("id"))
                .flatMap(store::byId)
                .orElse(null);

        // The month to show: an explicit ?month= wins, then the month of a bill
        // we have just saved, then the newest month holding data.
        YearMonth selected = parseMonth(request.getParameter("month"))
                .orElseGet(() -> receipt != null ? receipt.month() : newestMonth());

        render(request, response, FormData.blank(), List.of(), receipt, selected);
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws IOException {
        request.setCharacterEncoding(StandardCharsets.UTF_8.name());

        FormData form = FormData.from(request);
        List<String> errors = validate(form);

        if (!errors.isEmpty()) {
            // Re-render in place so the typed values and the messages survive.
            YearMonth selected = parseMonth(form.month()).orElseGet(this::newestMonth);
            render(request, response, form, errors, null, selected);
            return;
        }

        Bill saved = store.save(
                form.name(),
                form.address(),
                new BigDecimal(form.units()),
                YearMonth.parse(form.month()));

        // Post/Redirect/Get: refreshing the result page must not save the bill a
        // second time, so hand the browser a plain GET URL to land on. 303 rather
        // than sendRedirect's default 302 -- only 303 obliges the client to switch
        // to GET, which is the whole point of the pattern.
        response.setStatus(HttpServletResponse.SC_SEE_OTHER);
        response.setHeader("Location", request.getContextPath() + "/bill"
                + "?month=" + URLEncoder.encode(saved.month().toString(), StandardCharsets.UTF_8)
                + "&id=" + saved.id()
                + "#result");
    }

    /** Server-side checks. The HTML attributes are a convenience, not a guarantee. */
    private static List<String> validate(FormData form) {
        List<String> errors = new ArrayList<>();

        if (form.name().isEmpty()) {
            errors.add("Please enter a name.");
        }
        if (form.address().isEmpty()) {
            errors.add("Please enter an address.");
        }

        try {
            if (new BigDecimal(form.units()).signum() < 0) {
                errors.add("Units consumed cannot be negative.");
            }
        } catch (NumberFormatException e) {
            errors.add("Please enter a valid number of units.");
        }

        if (parseMonth(form.month()).isEmpty()) {
            errors.add("Please pick a billing month.");
        }
        return errors;
    }

    private void render(HttpServletRequest request, HttpServletResponse response,
                        FormData form, List<String> errors, Bill receipt, YearMonth selected)
            throws IOException {

        LinkedHashMap<YearMonth, Integer> months = store.monthsWithCounts();
        PageModel model = new PageModel(
                request.getContextPath(),
                form,
                errors,
                receipt,
                selected,
                months,
                store.statsFor(selected),
                store.forMonth(selected));

        response.setContentType("text/html");
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        try (PrintWriter out = response.getWriter()) {
            out.print(HtmlPage.render(model));
        }
    }

    /** Newest month holding bills, or the current one when the store is empty. */
    private YearMonth newestMonth() {
        return store.monthsWithCounts().keySet().stream().findFirst().orElseGet(YearMonth::now);
    }

    /** Parses the {@code YYYY-MM} value an {@code <input type="month">} submits. */
    private static Optional<YearMonth> parseMonth(String value) {
        if (value == null || value.isBlank()) {
            return Optional.empty();
        }
        try {
            return Optional.of(YearMonth.parse(value.trim()));
        } catch (DateTimeParseException e) {
            return Optional.empty();
        }
    }

    private static Optional<Long> parseLong(String value) {
        if (value == null || value.isBlank()) {
            return Optional.empty();
        }
        try {
            return Optional.of(Long.parseLong(value.trim()));
        } catch (NumberFormatException e) {
            return Optional.empty();
        }
    }
}
