package com.electricity;

import java.io.Serializable;
import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * One tariff slab as it applies to a particular meter reading.
 *
 * <p>Written as a JavaBean with {@code getX()} accessors rather than as a
 * record, because Expression Language in a JSP resolves {@code ${slab.amount}}
 * by looking for {@code getAmount()} — a record's {@code amount()} accessor
 * would not be found.
 */
public class Slab implements Serializable {

    private static final long serialVersionUID = 1L;

    private final String label;
    private final BigDecimal units;
    private final BigDecimal rate;

    public Slab(String label, BigDecimal units, BigDecimal rate) {
        this.label = label;
        this.units = units;
        this.rate = rate;
    }

    public String getLabel() {
        return label;
    }

    public BigDecimal getUnits() {
        return units;
    }

    public BigDecimal getRate() {
        return rate;
    }

    /** What this slab contributes to the bill, rounded to paise. */
    public BigDecimal getAmount() {
        return units.multiply(rate).setScale(2, RoundingMode.HALF_UP);
    }
}
