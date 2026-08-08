package com.voltix;

import java.math.BigDecimal;

/** Aggregates for one billing month, shown in the overview strip. */
public record MonthStats(int bills,
                         BigDecimal totalUnits,
                         BigDecimal averageBill,
                         BigDecimal highestBill,
                         BigDecimal totalRevenue) {

    public static final MonthStats EMPTY = new MonthStats(
            0, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO);
}
