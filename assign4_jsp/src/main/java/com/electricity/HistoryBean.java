package com.electricity;

import java.io.Serializable;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Locale;

/**
 * Every bill calculated in one browser session.
 *
 * <p>Held in {@code session} scope by {@code <jsp:useBean scope="session">}, so
 * each visitor gets their own list and nothing is shared between browsers.
 * There is no database — close the browser and the history is gone.
 */
public class HistoryBean implements Serializable {

    private static final long serialVersionUID = 1L;

    /** One recorded calculation. A JavaBean so the JSP can read {@code ${e.total}}. */
    public static class Entry implements Serializable {

        private static final long serialVersionUID = 1L;

        private final String name;
        private final String address;
        private final BigDecimal units;
        private final BigDecimal total;
        private final LocalDateTime at;

        Entry(String name, String address, BigDecimal units, BigDecimal total, LocalDateTime at) {
            this.name = name;
            this.address = address;
            this.units = units;
            this.total = total;
            this.at = at;
        }

        public String getName() {
            return name;
        }

        public String getAddress() {
            return address;
        }

        public BigDecimal getUnits() {
            return units;
        }

        public BigDecimal getTotal() {
            return total;
        }

        public LocalDateTime getAt() {
            return at;
        }

        /**
         * Preformatted for the page. {@code <fmt:formatDate>} only understands
         * {@code java.util.Date}, so a {@code LocalDateTime} has to arrive at the
         * JSP already rendered.
         */
        public String getFormattedAt() {
            return at.format(DateTimeFormatter.ofPattern("dd MMM, HH:mm", Locale.ENGLISH));
        }

        public List<Slab> getSlabs() {
            return Tariff.breakdown(units);
        }
    }

    private final List<Entry> entries = new ArrayList<>();

    /** Newest first, and unmodifiable so the page cannot corrupt it. */
    public List<Entry> getEntries() {
        return Collections.unmodifiableList(entries);
    }

    public void add(BillBean bill) {
        entries.add(0, new Entry(bill.getName(), bill.getAddress(),
                bill.getUnitsValue(), bill.getTotal(), LocalDateTime.now()));
    }

    public void clear() {
        entries.clear();
    }

    public boolean isEmpty() {
        return entries.isEmpty();
    }

    public int getCount() {
        return entries.size();
    }

    public BigDecimal getTotalUnits() {
        return entries.stream()
                .map(Entry::getUnits)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    public BigDecimal getTotalAmount() {
        return entries.stream()
                .map(Entry::getTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);
    }

    public BigDecimal getAverageAmount() {
        if (entries.isEmpty()) {
            return BigDecimal.ZERO;
        }
        return getTotalAmount().divide(new BigDecimal(entries.size()), 2, RoundingMode.HALF_UP);
    }

    public BigDecimal getHighestAmount() {
        return entries.stream()
                .map(Entry::getTotal)
                .max(BigDecimal::compareTo)
                .orElse(BigDecimal.ZERO);
    }
}
