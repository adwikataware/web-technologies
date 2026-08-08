package com.voltix;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.List;

/** A saved bill. Immutable -- the store hands these straight to the view. */
public record Bill(long id,
                   String name,
                   String address,
                   BigDecimal units,
                   YearMonth month,
                   BigDecimal amount,
                   LocalDateTime createdAt) {

    /** Recomputed on demand for the expandable history rows. */
    public List<Slab> slabs() {
        return Tariff.breakdown(units);
    }
}
