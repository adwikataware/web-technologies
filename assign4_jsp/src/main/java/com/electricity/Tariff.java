package com.electricity;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;

/**
 * The slab tariff from the problem statement:
 *
 * <pre>
 *   first 50 units    Rs 3.50 / unit      (   0 -  50 )
 *   next 100 units    Rs 4.00 / unit      (  51 - 150 )
 *   next 100 units    Rs 5.20 / unit      ( 151 - 250 )
 *   above 250 units   Rs 6.50 / unit
 * </pre>
 *
 * Money is handled with {@link BigDecimal} so the rounding is exact — a double
 * would drift on rates like 5.20.
 */
public final class Tariff {

    /** A band of the tariff. A {@code null} ceiling means "everything above". */
    private record Band(String label, BigDecimal ceiling, BigDecimal rate) {}

    private static final List<Band> BANDS = List.of(
            new Band("0 - 50 units",    new BigDecimal("50"),  new BigDecimal("3.50")),
            new Band("51 - 150 units",  new BigDecimal("150"), new BigDecimal("4.00")),
            new Band("151 - 250 units", new BigDecimal("250"), new BigDecimal("5.20")),
            new Band("Above 250 units", null,                  new BigDecimal("6.50")));

    private Tariff() {
    }

    /**
     * Splits a reading into the slabs that actually carry units, so the bill can
     * be shown itemised. The first band is always present (a 0-unit reading
     * still gets one row) and the walk stops at the first empty band above it.
     */
    public static List<Slab> breakdown(BigDecimal units) {
        List<Slab> slabs = new ArrayList<>();
        BigDecimal consumed = BigDecimal.ZERO;

        for (Band band : BANDS) {
            BigDecimal ceiling = band.ceiling() == null ? units : band.ceiling().min(units);
            BigDecimal inBand = ceiling.subtract(consumed);

            if (inBand.signum() <= 0 && !slabs.isEmpty()) {
                break;
            }
            slabs.add(new Slab(band.label(), inBand.max(BigDecimal.ZERO), band.rate()));
            consumed = ceiling;
        }
        return slabs;
    }

    /** Sum of an itemised breakdown. */
    public static BigDecimal total(List<Slab> slabs) {
        return slabs.stream()
                .map(Slab::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);
    }

    /** The payable amount for a reading. */
    public static BigDecimal amountFor(BigDecimal units) {
        return total(breakdown(units));
    }

    /** A plain-English band for the usage gauge. */
    public static String usageTier(BigDecimal units) {
        double u = units.doubleValue();
        if (u <= 50) {
            return "Low usage";
        }
        if (u <= 150) {
            return "Moderate usage";
        }
        if (u <= 250) {
            return "High usage";
        }
        return "Very high usage";
    }
}
