package com.voltix;

import java.time.YearMonth;
import java.util.LinkedHashMap;
import java.util.List;

/**
 * Everything one render of the page needs. The servlet assembles it; the view
 * only reads from it. Nothing here touches the request or response.
 *
 * @param contextPath   where the app is deployed, for building URLs
 * @param form          values to put back into the form inputs
 * @param errors        validation messages, empty when there is nothing to say
 * @param receipt       the bill to show as a result, or {@code null} for none
 * @param selectedMonth the month the overview and history are showing
 * @param months        every month that holds bills, newest first, with counts
 * @param stats         aggregates for {@code selectedMonth}
 * @param history       bills in {@code selectedMonth}, newest first
 */
public record PageModel(String contextPath,
                        FormData form,
                        List<String> errors,
                        Bill receipt,
                        YearMonth selectedMonth,
                        LinkedHashMap<YearMonth, Integer> months,
                        MonthStats stats,
                        List<Bill> history) {
}
