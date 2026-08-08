package com.voltix;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.YearMonth;

/**
 * A handful of sample bills so the dashboard, month strip and history table have
 * something to show the first time the app starts. Switch it off with the
 * {@code seedDemoData} init-param in {@link BillServlet} (or in web.xml).
 */
final class DemoData {

    private DemoData() {
    }

    static void seed(BillStore store) {
        YearMonth thisMonth = YearMonth.now();
        YearMonth lastMonth = thisMonth.minusMonths(1);

        // Seeded oldest-first so the newest row ends up on top of the history.
        add(store, "Rohan Deshpande", "Kothrud, Pune", "96", lastMonth, 4, 9, 40);
        add(store, "Meera Iyer", "Baner, Pune", "212", lastMonth, 11, 18, 5);
        add(store, "Sanjay Kulkarni", "Shivajinagar, Pune", "48", lastMonth, 19, 11, 20);

        add(store, "Aarti Joshi", "Aundh, Pune", "340", thisMonth, 2, 10, 15);
        add(store, "Nikhil Rane", "Hadapsar, Pune", "155.5", thisMonth, 6, 16, 30);
    }

    private static void add(BillStore store, String name, String address, String units,
                            YearMonth month, int day, int hour, int minute) {
        // Early in a month the sample days can still be in the future, which would
        // read as a bill dated tomorrow -- pin those to the current time instead.
        LocalDateTime when = month.atDay(day).atTime(hour, minute);
        LocalDateTime now = LocalDateTime.now();
        store.save(name, address, new BigDecimal(units), month, when.isAfter(now) ? now : when);
    }
}
