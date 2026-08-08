package com.voltix;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * One tariff slab as it applies to a particular meter reading -- the label of
 * the band, how many of the customer's units fell inside it, and the rate.
 */
public record Slab(String label, BigDecimal units, BigDecimal rate) {

    /** What this slab contributes to the bill, rounded to paise. */
    public BigDecimal amount() {
        return units.multiply(rate).setScale(2, RoundingMode.HALF_UP);
    }
}
