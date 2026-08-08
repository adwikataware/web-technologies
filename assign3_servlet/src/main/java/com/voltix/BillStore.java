package com.voltix;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.Comparator;
import java.util.Deque;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentLinkedDeque;
import java.util.concurrent.atomic.AtomicLong;

/**
 * In-memory stand-in for assignment 1's MySQL table.
 *
 * <p>One instance is created in {@link BillServlet#init()} and published to the
 * {@code ServletContext}, so every request served by the running app sees the
 * same data. A servlet container handles requests on many threads at once, so
 * the backing collection and the id counter are both concurrent.
 *
 * <p>Records live only as long as the container does -- that is the price of a
 * demo that needs no database setup.
 */
public final class BillStore {

    /** Newest first, which is the order the history table wants. */
    private final Deque<Bill> bills = new ConcurrentLinkedDeque<>();
    private final AtomicLong nextId = new AtomicLong(1);

    public Bill save(String name, String address, BigDecimal units, YearMonth month) {
        return save(name, address, units, month, LocalDateTime.now());
    }

    /** Overload that lets the demo seeder backdate its sample rows. */
    Bill save(String name, String address, BigDecimal units, YearMonth month, LocalDateTime createdAt) {
        Bill bill = new Bill(nextId.getAndIncrement(), name, address, units, month,
                Tariff.amountFor(units), createdAt);
        bills.addFirst(bill);
        return bill;
    }

    public Optional<Bill> byId(long id) {
        return bills.stream().filter(b -> b.id() == id).findFirst();
    }

    /** Months that actually hold bills, newest first, each with its bill count. */
    public LinkedHashMap<YearMonth, Integer> monthsWithCounts() {
        Map<YearMonth, Integer> counts = new HashMap<>();
        for (Bill bill : bills) {
            counts.merge(bill.month(), 1, Integer::sum);
        }
        LinkedHashMap<YearMonth, Integer> ordered = new LinkedHashMap<>();
        counts.keySet().stream()
                .sorted(Comparator.reverseOrder())
                .forEach(month -> ordered.put(month, counts.get(month)));
        return ordered;
    }

    public List<Bill> forMonth(YearMonth month) {
        return bills.stream().filter(bill -> bill.month().equals(month)).toList();
    }

    public MonthStats statsFor(YearMonth month) {
        List<Bill> monthly = forMonth(month);
        if (monthly.isEmpty()) {
            return MonthStats.EMPTY;
        }

        BigDecimal units = BigDecimal.ZERO;
        BigDecimal revenue = BigDecimal.ZERO;
        BigDecimal highest = BigDecimal.ZERO;

        for (Bill bill : monthly) {
            units = units.add(bill.units());
            revenue = revenue.add(bill.amount());
            highest = highest.max(bill.amount());
        }
        BigDecimal average = revenue.divide(BigDecimal.valueOf(monthly.size()), 2, RoundingMode.HALF_UP);

        return new MonthStats(monthly.size(), units, average, highest, revenue);
    }
}
