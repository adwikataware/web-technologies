package com.voltix;

import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * Renders the page. Pure function of a {@link PageModel} -- no servlet types
 * reach this far, which keeps the markup in one readable place and lets the
 * output be asserted in a plain unit test.
 *
 * <p>Everything non-ASCII is written as an HTML entity so the page cannot be
 * broken by a source- or console-encoding mismatch on the way out.
 */
public final class HtmlPage {

    private static final String RUPEE = "&#8377;";
    private static final String DOT = " &middot; ";

    private static final Locale IN = Locale.forLanguageTag("en-IN");
    private static final DateTimeFormatter MONTH_LONG = DateTimeFormatter.ofPattern("MMMM yyyy", Locale.ENGLISH);
    private static final DateTimeFormatter MONTH_SHORT = DateTimeFormatter.ofPattern("MMM yyyy", Locale.ENGLISH);
    private static final DateTimeFormatter STAMP_SHORT = DateTimeFormatter.ofPattern("dd MMM, HH:mm", Locale.ENGLISH);
    private static final DateTimeFormatter STAMP_LONG = DateTimeFormatter.ofPattern("dd MMM yyyy, HH:mm", Locale.ENGLISH);

    private static final String[] TIPS = {
        "LED bulbs use <b>75% less</b> energy than incandescent",
        "Every 1&deg;C on your AC adds <b>~6%</b> to cooling cost",
        "Standby devices can be <b>10%</b> of your bill",
        "Solar can offset <b>40&ndash;60%</b> of usage",
    };

    private HtmlPage() {
    }

    public static String render(PageModel model) {
        StringBuilder out = new StringBuilder(16_384);
        String ctx = model.contextPath();

        out.append("""
                <!DOCTYPE html>
                <html lang="en">
                <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Electricity Bill Calculator &middot; Java Servlet</title>
                """);
        out.append("<link rel=\"stylesheet\" href=\"").append(ctx).append("/assets/app.css\">\n");
        out.append("""
                </head>
                <body>
                <main class="shell">

                <header class="topbar">
                <div class="brandmark">
                <span class="dot">&#9889;</span>
                Electricity Billing <span class="sub">&middot; Web Technologies</span>
                </div>
                <div class="badges">
                <span class="badge on">Java Servlet</span>
                <span class="badge">Jakarta Servlet 6</span>
                <span class="badge">doGet / doPost</span>
                </div>
                </header>

                <div class="hero">
                <h1>Electricity bill calculator</h1>
                <p>Enter a meter reading and get a slab-wise breakdown of what you owe &mdash; every
                band priced separately, so you can see where each rupee came from.</p>
                <div class="tariff">
                <div class="band"><div class="rng">First 50 units</div><div class="amt">&#8377;3.50 <small>/unit</small></div></div>
                <div class="band"><div class="rng">Next 100 units</div><div class="amt">&#8377;4.00 <small>/unit</small></div></div>
                <div class="band"><div class="rng">Next 100 units</div><div class="amt">&#8377;5.20 <small>/unit</small></div></div>
                <div class="band"><div class="rng">Above 250 units</div><div class="amt">&#8377;6.50 <small>/unit</small></div></div>
                </div>
                </div>

                <div class="layout">
                <div class="col-main">
                """);

        formCard(out, model, ctx);

        out.append("</div>\n<aside class=\"col-side\">\n");
        overviewCard(out, model, ctx);
        out.append("</aside>\n</div>\n");

        historyCard(out, model);

        out.append("""
                <footer class="foot">
                <span>Assignment 3 &middot; Electricity Bill Calculator</span>
                <span>Java Servlet &middot; in-memory store, no database</span>
                </footer>
                </main>
                """);
        out.append("<script src=\"").append(ctx).append("/assets/app.js\"></script>\n");
        out.append("""
                </body>
                </html>
                """);

        return out.toString();
    }

    // ---- Meter details + result ------------------------------------------

    private static void formCard(StringBuilder out, PageModel model, String ctx) {
        FormData form = model.form();

        out.append("<section class=\"card\" id=\"calculator\">\n");
        out.append("<div class=\"label-row\">Meter details</div>\n");

        if (!model.errors().isEmpty()) {
            out.append("<div class=\"errors\" role=\"alert\"><ul>\n");
            for (String error : model.errors()) {
                out.append("<li>").append(esc(error)).append("</li>\n");
            }
            out.append("</ul></div>\n");
        }

        out.append("<form method=\"post\" action=\"").append(ctx).append("/bill\">\n");
        field(out, "name", "text", "Full name", "e.g. Adwika Taware", form.name(), "");
        field(out, "address", "text", "Address", "e.g. Pune, Maharashtra", form.address(), "");
        out.append("<div class=\"field-row\">\n");
        field(out, "units", "number", "Units consumed (kWh)", "e.g. 180", form.units(),
                " step=\"any\" min=\"0\" inputmode=\"decimal\"");
        field(out, "month", "month", "Billing month", "", form.month(), "");
        out.append("</div>\n");
        out.append("<button type=\"submit\" class=\"btn\">Calculate bill <span class=\"arrow\">&rarr;</span></button>\n");
        out.append("</form>\n");

        if (model.receipt() != null) {
            receipt(out, model.receipt());
        }
        out.append("</section>\n");
    }

    private static void field(StringBuilder out, String id, String type, String label,
                              String placeholder, String value, String extraAttrs) {
        out.append("<div class=\"field\">\n")
           .append("<label for=\"").append(id).append("\">").append(esc(label)).append("</label>\n")
           .append("<input type=\"").append(type).append("\" id=\"").append(id)
           .append("\" name=\"").append(id).append("\" required");
        if (!placeholder.isEmpty()) {
            out.append(" placeholder=\"").append(esc(placeholder)).append('"');
        }
        out.append(extraAttrs)
           .append(" value=\"").append(esc(value)).append("\">\n")
           .append("</div>\n");
    }

    private static void receipt(StringBuilder out, Bill bill) {
        out.append("<div class=\"result\" id=\"result\">\n");

        out.append("<div class=\"top\">\n<div class=\"who\">\n")
           .append("<b>").append(esc(bill.name())).append("</b>\n")
           .append("<span>").append(esc(bill.address())).append(DOT)
           .append(units(bill.units())).append(" kWh").append(DOT)
           .append(bill.month().atDay(1).format(MONTH_LONG)).append("</span>\n")
           .append("</div>\n")
           .append("<div class=\"amount\" id=\"amount\" data-value=\"").append(bill.amount().toPlainString())
           .append("\">").append(RUPEE).append("0.00</div>\n")
           .append("</div>\n");

        out.append("<div class=\"gauge\" data-units=\"").append(bill.units().toPlainString()).append("\">\n")
           .append("<div class=\"bar\"><div class=\"fill\"></div></div>\n")
           .append("<div class=\"labels\"><span>0</span><span>150</span><span>300+ kWh</span></div>\n")
           .append("<span class=\"tier-chip\">").append(esc(Tariff.usageTier(bill.units()))).append("</span>\n")
           .append("</div>\n");

        slabTable(out, bill.slabs());
        out.append("</div>\n");
    }

    private static void slabTable(StringBuilder out, List<Slab> slabs) {
        // The wrapper lets a four-column table scroll inside itself on a very
        // narrow phone instead of widening the whole page.
        out.append("""
                <div class="table-wrap">
                <table>
                <thead><tr><th>Slab</th><th class="num">Units</th><th class="num">Rate</th><th class="num">Amount</th></tr></thead>
                <tbody>
                """);
        for (Slab slab : slabs) {
            out.append("<tr><td>").append(esc(slab.label())).append("</td>")
               .append("<td class=\"num\">").append(units(slab.units())).append("</td>")
               .append("<td class=\"num\">").append(RUPEE).append(money(slab.rate())).append("</td>")
               .append("<td class=\"num\">").append(RUPEE).append(money(slab.amount())).append("</td></tr>\n");
        }
        out.append("</tbody>\n</table>\n</div>\n");
    }

    // ---- Month navigator, stats, ticker ----------------------------------

    private static void overviewCard(StringBuilder out, PageModel model, String ctx) {
        YearMonth selected = model.selectedMonth();
        String label = selected.atDay(1).format(MONTH_LONG);

        out.append("<section class=\"card\">\n")
           .append("<div class=\"label-row\">Overview &middot; <span class=\"hint\">")
           .append(esc(label)).append("</span></div>\n");

        // Calendar strip: arrows step one month, chips jump to a month with data.
        out.append("<div class=\"monthnav\">\n")
           .append(monthArrow(ctx, selected.minusMonths(1), "&lsaquo;", "Previous month"))
           .append("<div class=\"mn-scroll\">\n");

        if (model.months().isEmpty()) {
            out.append("<span class=\"mn-empty\">No months yet &mdash; save a bill to begin.</span>\n");
        } else {
            for (Map.Entry<YearMonth, Integer> entry : model.months().entrySet()) {
                YearMonth month = entry.getKey();
                int count = entry.getValue();
                out.append("<a class=\"mn-chip").append(month.equals(selected) ? " active" : "")
                   .append("\" href=\"").append(ctx).append("/bill?month=").append(month).append("\">")
                   .append("<span class=\"mn-m\">").append(month.atDay(1).format(MONTH_SHORT)).append("</span>")
                   .append("<span class=\"mn-c\">").append(count).append(" bill").append(count == 1 ? "" : "s")
                   .append("</span></a>\n");
            }
        }

        out.append("</div>\n")
           .append(monthArrow(ctx, selected.plusMonths(1), "&rsaquo;", "Next month"))
           .append("</div>\n");

        MonthStats stats = model.stats();
        out.append("<div class=\"stats\">\n");
        stat(out, "Bills", String.valueOf(stats.bills()));
        stat(out, "Total units", units(stats.totalUnits()));
        stat(out, "Avg bill", RUPEE + rounded(stats.averageBill()));
        stat(out, "Highest", RUPEE + rounded(stats.highestBill()));
        out.append("</div>\n");

        // Marquee: the tips are emitted twice so the -50% scroll loops seamlessly.
        out.append("<div class=\"ticker\" aria-hidden=\"true\">\n<div class=\"track\">\n");
        for (int pass = 0; pass < 2; pass++) {
            for (String tip : TIPS) {
                out.append("<span>").append(tip).append("</span>\n");
            }
        }
        out.append("</div>\n</div>\n</section>\n");
    }

    private static String monthArrow(String ctx, YearMonth target, String glyph, String title) {
        return "<a class=\"mn-arrow\" href=\"" + ctx + "/bill?month=" + target
                + "\" title=\"" + title + "\" aria-label=\"" + title + "\">" + glyph + "</a>\n";
    }

    private static void stat(StringBuilder out, String key, String value) {
        out.append("<div class=\"stat\"><div class=\"k\">").append(esc(key)).append("</div>")
           .append("<div class=\"v\">").append(value).append("</div></div>\n");
    }

    // ---- History ----------------------------------------------------------

    private static void historyCard(StringBuilder out, PageModel model) {
        String label = model.selectedMonth().atDay(1).format(MONTH_LONG);

        out.append("<section class=\"card history\">\n")
           .append("<div class=\"label-row\">Bills in ").append(esc(label))
           .append(" <span class=\"hint\">&mdash; tap a row for the breakdown</span></div>\n");

        if (model.history().isEmpty()) {
            out.append("<p class=\"history-empty\">No bills for ").append(esc(label))
               .append(". Pick another month above, or calculate a new bill.</p>\n</section>\n");
            return;
        }

        out.append("""
                <div class="table-wrap">
                <table>
                <thead><tr><th>Name</th><th class="num">Units</th><th class="num">Bill</th><th class="num">Date</th></tr></thead>
                <tbody>
                """);

        for (Bill bill : model.history()) {
            out.append("<tr class=\"main\" tabindex=\"0\" role=\"button\" aria-expanded=\"false\">")
               .append("<td>").append(esc(bill.name())).append("</td>")
               .append("<td class=\"num\">").append(units(bill.units())).append("</td>")
               .append("<td class=\"num\">").append(RUPEE).append(money(bill.amount())).append("</td>")
               .append("<td class=\"num\">").append(stamp(bill.createdAt(), STAMP_SHORT)).append("</td></tr>\n");

            out.append("<tr class=\"detail\"><td colspan=\"4\"><div class=\"detail-box\">\n")
               .append("<div class=\"addr\">&#128205; ").append(esc(bill.address())).append(DOT)
               .append(stamp(bill.createdAt(), STAMP_LONG)).append("</div>\n");
            slabTable(out, bill.slabs());
            out.append("</div></td></tr>\n");
        }

        out.append("</tbody>\n</table>\n</div>\n</section>\n");
    }

    // ---- Formatting -------------------------------------------------------

    /** 1234.5 -> "1,234.50". A fresh formatter each call: NumberFormat is not thread-safe. */
    private static String money(BigDecimal value) {
        NumberFormat format = NumberFormat.getNumberInstance(IN);
        format.setMinimumFractionDigits(2);
        format.setMaximumFractionDigits(2);
        return format.format(value);
    }

    /** 1234.5 -> "1,235". Used where the stat tiles need to stay compact. */
    private static String rounded(BigDecimal value) {
        NumberFormat format = NumberFormat.getNumberInstance(IN);
        format.setMaximumFractionDigits(0);
        return format.format(value);
    }

    private static String units(BigDecimal value) {
        return money(value);
    }

    private static String stamp(LocalDateTime when, DateTimeFormatter format) {
        return when.format(format);
    }

    /** Escapes anything user-supplied. Nothing typed into the form reaches the page raw. */
    static String esc(String value) {
        if (value == null) {
            return "";
        }
        return value.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }
}
