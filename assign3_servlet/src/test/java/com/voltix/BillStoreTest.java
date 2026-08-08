package com.voltix;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.YearMonth;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/** The in-memory store standing in for assignment 1's MySQL table. */
class BillStoreTest {

    private static final YearMonth JAN = YearMonth.of(2026, 1);
    private static final YearMonth FEB = YearMonth.of(2026, 2);

    private final BillStore store = new BillStore();

    @Test
    void savingComputesTheAmountAndHandsBackTheRecord() {
        Bill bill = store.save("Asha", "Pune", new BigDecimal("180"), JAN);

        assertEquals(new BigDecimal("731.00"), bill.amount());
        assertEquals(JAN, bill.month());
        assertEquals(bill, store.byId(bill.id()).orElseThrow());
    }

    @Test
    void idsAreUniqueAndUnknownIdsResolveToNothing() {
        long first = store.save("A", "Pune", new BigDecimal("10"), JAN).id();
        long second = store.save("B", "Pune", new BigDecimal("10"), JAN).id();

        assertTrue(first != second);
        assertTrue(store.byId(9999).isEmpty());
    }

    @Test
    void historyIsScopedToOneMonthAndNewestFirst() {
        store.save("Older", "Pune", new BigDecimal("10"), JAN);
        store.save("Newer", "Pune", new BigDecimal("20"), JAN);
        store.save("Other month", "Pune", new BigDecimal("30"), FEB);

        List<Bill> january = store.forMonth(JAN);

        assertEquals(2, january.size());
        assertEquals("Newer", january.get(0).name());
        assertEquals("Older", january.get(1).name());
    }

    @Test
    void monthsAreListedNewestFirstWithCounts() {
        store.save("A", "Pune", new BigDecimal("10"), JAN);
        store.save("B", "Pune", new BigDecimal("10"), FEB);
        store.save("C", "Pune", new BigDecimal("10"), FEB);

        var months = store.monthsWithCounts();

        assertEquals(List.of(FEB, JAN), List.copyOf(months.keySet()));
        assertEquals(2, months.get(FEB));
        assertEquals(1, months.get(JAN));
    }

    @Test
    void statsAggregateTheSelectedMonthOnly() {
        store.save("A", "Pune", new BigDecimal("100"), JAN);   // 175 + 50 x 4.00 = 375.00
        store.save("B", "Pune", new BigDecimal("300"), JAN);   // 1420.00
        store.save("C", "Pune", new BigDecimal("500"), FEB);   // ignored

        MonthStats stats = store.statsFor(JAN);

        assertEquals(2, stats.bills());
        assertEquals(new BigDecimal("400"), stats.totalUnits());
        assertEquals(new BigDecimal("1795.00"), stats.totalRevenue());
        assertEquals(new BigDecimal("897.50"), stats.averageBill());
        assertEquals(new BigDecimal("1420.00"), stats.highestBill());
    }

    @Test
    void anEmptyMonthReportsZeroesRatherThanFailing() {
        assertEquals(MonthStats.EMPTY, store.statsFor(JAN));
        assertTrue(store.forMonth(JAN).isEmpty());
        assertTrue(store.monthsWithCounts().isEmpty());
    }
}
