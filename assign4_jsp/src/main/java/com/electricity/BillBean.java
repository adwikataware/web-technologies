package com.electricity;

import java.io.Serializable;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/**
 * The form-backing JavaBean.
 *
 * <p>The JSP creates it with {@code <jsp:useBean>} and fills it in one line with
 * {@code <jsp:setProperty name="bill" property="*"/>}, which copies every
 * request parameter onto the matching setter by name.
 *
 * <p>Every property is a {@code String}. That is deliberate: {@code property="*"}
 * would throw on a non-numeric value if {@code units} were a number, and the
 * page could not then redisplay what the user actually typed. Parsing and
 * validation happen here instead, where they can produce a readable message.
 */
public class BillBean implements Serializable {

    private static final long serialVersionUID = 1L;

    private String name = "";
    private String address = "";
    private String units = "";

    // ---- properties, populated by <jsp:setProperty property="*"> ----------

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = trim(name);
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = trim(address);
    }

    public String getUnits() {
        return units;
    }

    public void setUnits(String units) {
        this.units = trim(units);
    }

    private static String trim(String value) {
        return value == null ? "" : value.trim();
    }

    // ---- derived, read from the page as ${bill.xxx} -----------------------

    /**
     * Validation messages, empty when the form is good. Server-side on purpose —
     * the HTML {@code required}/{@code min} attributes are a convenience, never
     * the guarantee.
     */
    public List<String> getErrors() {
        List<String> errors = new ArrayList<>();

        if (name.isEmpty()) {
            errors.add("Please enter a name.");
        }
        if (address.isEmpty()) {
            errors.add("Please enter an address.");
        }
        try {
            if (new BigDecimal(units).signum() < 0) {
                errors.add("Units consumed cannot be negative.");
            }
        } catch (NumberFormatException e) {
            errors.add("Please enter a valid number of units.");
        }
        return errors;
    }

    /** {@code ${bill.valid}} in the page. */
    public boolean isValid() {
        return getErrors().isEmpty();
    }

    /** The reading as a number. Zero when the input is not usable. */
    public BigDecimal getUnitsValue() {
        try {
            return new BigDecimal(units);
        } catch (NumberFormatException e) {
            return BigDecimal.ZERO;
        }
    }

    /** Itemised slabs, iterated in the page with {@code <c:forEach>}. */
    public List<Slab> getSlabs() {
        return Tariff.breakdown(getUnitsValue());
    }

    public BigDecimal getTotal() {
        return Tariff.amountFor(getUnitsValue());
    }

    public String getUsageTier() {
        return Tariff.usageTier(getUnitsValue());
    }

    /** Reading mapped onto the gauge's 0–300 kWh scale, capped at 100. */
    public int getGaugePercent() {
        double percent = getUnitsValue().doubleValue() / 300 * 100;
        return (int) Math.min(Math.round(percent), 100);
    }
}
