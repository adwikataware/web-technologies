package com.electricity;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/** The session-scoped history the JSP reads with c:forEach. */
class HistoryBeanTest {

    private final HistoryBean history = new HistoryBean();

    private void record(String name, String units) {
        BillBean bill = new BillBean();
        bill.setName(name);
        bill.setAddress("Pune");
        bill.setUnits(units);
        history.add(bill);
    }

    @Test
    void startsEmpty() {
        assertTrue(history.isEmpty());
        assertEquals(0, history.getCount());
        assertEquals(BigDecimal.ZERO, history.getAverageAmount());
        assertEquals(BigDecimal.ZERO, history.getHighestAmount());
    }

    @Test
    void newestEntryComesFirst() {
        record("Older", "10");
        record("Newer", "20");

        List<HistoryBean.Entry> entries = history.getEntries();
        assertEquals("Newer", entries.get(0).getName());
        assertEquals("Older", entries.get(1).getName());
    }

    @Test
    void aggregatesAcrossTheSession() {
        record("A", "100");   // 175 + 50 x 4.00 = 375.00
        record("B", "300");   // 1420.00

        assertEquals(2, history.getCount());
        assertEquals(new BigDecimal("400"), history.getTotalUnits());
        assertEquals(new BigDecimal("1795.00"), history.getTotalAmount());
        assertEquals(new BigDecimal("897.50"), history.getAverageAmount());
        assertEquals(new BigDecimal("1420.00"), history.getHighestAmount());
    }

    @Test
    void clearEmptiesIt() {
        record("A", "100");
        history.clear();
        assertTrue(history.isEmpty());
    }

    @Test
    void theListHandedToThePageCannotBeMutated() {
        record("A", "100");
        assertThrows(UnsupportedOperationException.class, () -> history.getEntries().clear());
    }
}
