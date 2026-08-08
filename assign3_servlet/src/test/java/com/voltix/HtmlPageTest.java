package com.voltix;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.LinkedHashMap;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/** The view is a pure function of the model, so it can be asserted without a container. */
class HtmlPageTest {

    private static final YearMonth JAN = YearMonth.of(2026, 1);

    private static PageModel model(FormData form, List<String> errors, Bill receipt, List<Bill> history) {
        LinkedHashMap<YearMonth, Integer> months = new LinkedHashMap<>();
        if (!history.isEmpty()) {
            months.put(JAN, history.size());
        }
        return new PageModel("/assign3_servlet", form, errors, receipt, JAN,
                months, MonthStats.EMPTY, history);
    }

    @Test
    void anythingTypedIntoTheFormIsEscapedOnTheWayOut() {
        String attack = "<script>alert('x')</script>";
        FormData form = new FormData(attack, "Pune", "10", "2026-01");

        String html = HtmlPage.render(model(form, List.of(), null, List.of()));

        assertFalse(html.contains("<script>alert"), "raw script tag must not reach the page");
        assertTrue(html.contains("&lt;script&gt;alert(&#39;x&#39;)&lt;/script&gt;"));
    }

    @Test
    void escapesAmpersandsFirstSoEntitiesAreNotDoubleEncoded() {
        assertEquals("Tom &amp; Jerry", HtmlPage.esc("Tom & Jerry"));
        assertEquals("&lt;b&gt;", HtmlPage.esc("<b>"));
        assertEquals("", HtmlPage.esc(null));
    }

    @Test
    void validationMessagesAreRendered() {
        String html = HtmlPage.render(
                model(FormData.blank(), List.of("Please enter a name."), null, List.of()));

        assertTrue(html.contains("class=\"errors\""));
        assertTrue(html.contains("Please enter a name."));
    }

    @Test
    void theResultBlockCarriesTheAmountAndEverySlabRow() {
        Bill bill = new Bill(1, "Asha", "Pune", new BigDecimal("340"), JAN,
                Tariff.amountFor(new BigDecimal("340")), LocalDateTime.of(2026, 1, 5, 10, 0));

        String html = HtmlPage.render(model(FormData.blank(), List.of(), bill, List.of(bill)));

        // 50 x 3.50 + 100 x 4.00 + 100 x 5.20 + 90 x 6.50 = 1680.00
        assertTrue(html.contains("data-value=\"1680.00\""), "count-up target");
        assertTrue(html.contains("data-units=\"340\""), "gauge reading");
        assertTrue(html.contains("Very high usage"));
        assertTrue(html.contains("Above 250 units"));
        assertTrue(html.contains("1,680.00"));
    }

    @Test
    void formActionAndAssetsAreBuiltFromTheContextPath() {
        String html = HtmlPage.render(model(FormData.blank(), List.of(), null, List.of()));

        assertTrue(html.contains("action=\"/assign3_servlet/bill\""));
        assertTrue(html.contains("href=\"/assign3_servlet/assets/app.css\""));
        assertTrue(html.contains("src=\"/assign3_servlet/assets/app.js\""));
        assertTrue(html.contains("/assign3_servlet/bill?month=2026-02"), "next-month arrow");
    }

    @Test
    void anEmptyMonthShowsAnExplanationInsteadOfATable() {
        String html = HtmlPage.render(model(FormData.blank(), List.of(), null, List.of()));

        assertTrue(html.contains("No bills for January 2026"));
        assertTrue(html.contains("No months yet"));
    }
}
