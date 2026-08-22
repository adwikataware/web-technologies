package com.electricity;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

/** Checks the slab arithmetic against hand-worked figures from the problem statement. */
class TariffTest {

    @ParameterizedTest(name = "{0} units -> Rs {1}")
    @CsvSource({
            "0,      0.00",     // nothing consumed
            "1,      3.50",     // inside slab 1
            "50,   175.00",     // slab 1 exactly            50 x 3.50
            "51,   179.00",     // first unit of slab 2
            "150,  575.00",     // slab 2 exactly            175 + 100 x 4.00
            "180,  731.00",     // part-way through slab 3   575 + 30 x 5.20
            "250, 1095.00",     // slab 3 exactly            575 + 100 x 5.20
            "251, 1101.50",     // first unit of slab 4
            "300, 1420.00",     // 1095 + 50 x 6.50
            "1000, 5970.00",    // 1095 + 750 x 6.50
    })
    void chargesTheRightAmount(String units, String expected) {
        assertEquals(new BigDecimal(expected), Tariff.amountFor(new BigDecimal(units)));
    }

    @Test
    @DisplayName("a reading below 50 units is itemised as a single slab")
    void lowReadingHasOneSlab() {
        List<Slab> slabs = Tariff.breakdown(new BigDecimal("30"));

        assertEquals(1, slabs.size());
        assertEquals("0 - 50 units", slabs.get(0).getLabel());
        assertEquals(new BigDecimal("105.00"), slabs.get(0).getAmount());
    }

    @Test
    @DisplayName("a high reading is itemised across all four slabs")
    void highReadingSpansEverySlab() {
        List<Slab> slabs = Tariff.breakdown(new BigDecimal("340"));

        assertEquals(4, slabs.size());
        assertEquals(new BigDecimal("50"), slabs.get(0).getUnits());
        assertEquals(new BigDecimal("100"), slabs.get(1).getUnits());
        assertEquals(new BigDecimal("100"), slabs.get(2).getUnits());
        assertEquals(new BigDecimal("90"), slabs.get(3).getUnits());
        assertEquals("Above 250 units", slabs.get(3).getLabel());

        // The itemised rows must add up to the headline figure.
        assertEquals(Tariff.amountFor(new BigDecimal("340")), Tariff.total(slabs));
    }

    @Test
    @DisplayName("a fractional reading keeps its paise")
    void fractionalReading() {
        // 50 x 3.50 + 100 x 4.00 + 5.5 x 5.20 = 175 + 400 + 28.60
        assertEquals(new BigDecimal("603.60"), Tariff.amountFor(new BigDecimal("155.5")));
    }

    @Test
    void usageTiersFollowTheSlabBoundaries() {
        assertEquals("Low usage", Tariff.usageTier(new BigDecimal("50")));
        assertEquals("Moderate usage", Tariff.usageTier(new BigDecimal("150")));
        assertEquals("High usage", Tariff.usageTier(new BigDecimal("250")));
        assertEquals("Very high usage", Tariff.usageTier(new BigDecimal("251")));
    }
}
