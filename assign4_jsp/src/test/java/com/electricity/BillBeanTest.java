package com.electricity;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/** The bean the JSP binds to, exercised the way jsp:setProperty would fill it. */
class BillBeanTest {

    private static BillBean bean(String name, String address, String units) {
        BillBean bill = new BillBean();
        bill.setName(name);
        bill.setAddress(address);
        bill.setUnits(units);
        return bill;
    }

    @Test
    void aGoodFormValidatesAndCalculates() {
        BillBean bill = bean("Asha", "Pune", "180");

        assertTrue(bill.isValid());
        assertEquals(new BigDecimal("731.00"), bill.getTotal());
        assertEquals(3, bill.getSlabs().size());
        assertEquals("High usage", bill.getUsageTier());
    }

    @Test
    void everyMissingFieldGetsItsOwnMessage() {
        BillBean bill = bean("", "", "");

        assertFalse(bill.isValid());
        assertEquals(3, bill.getErrors().size());
    }

    @Test
    void nonNumericUnitsAreRejectedRatherThanThrowing() {
        BillBean bill = bean("Asha", "Pune", "abc");

        assertFalse(bill.isValid());
        assertTrue(bill.getErrors().contains("Please enter a valid number of units."));
        assertEquals(BigDecimal.ZERO, bill.getUnitsValue());
    }

    @Test
    void negativeUnitsAreRejected() {
        BillBean bill = bean("Asha", "Pune", "-5");

        assertFalse(bill.isValid());
        assertTrue(bill.getErrors().contains("Units consumed cannot be negative."));
    }

    @Test
    void inputIsTrimmedOnTheWayIn() {
        BillBean bill = bean("  Asha  ", "  Pune  ", "  180  ");

        assertEquals("Asha", bill.getName());
        assertEquals("Pune", bill.getAddress());
        assertTrue(bill.isValid());
    }

    @Test
    void theGaugeIsCappedAtFullScale() {
        assertEquals(0, bean("A", "P", "0").getGaugePercent());
        assertEquals(50, bean("A", "P", "150").getGaugePercent());
        assertEquals(100, bean("A", "P", "300").getGaugePercent());
        assertEquals(100, bean("A", "P", "9000").getGaugePercent());
    }
}
