package com.voltix;

import jakarta.servlet.http.HttpServletRequest;

import java.time.YearMonth;

/**
 * The raw, unparsed contents of the meter-details form.
 *
 * <p>Kept as strings on purpose: when validation fails the page is re-rendered
 * with exactly what the user typed still in the inputs, rather than a value
 * mangled by a half-successful parse.
 */
public record FormData(String name, String address, String units, String month) {

    /** Blank form, with the billing month pre-set to the current one. */
    public static FormData blank() {
        return new FormData("", "", "", YearMonth.now().toString());
    }

    public static FormData from(HttpServletRequest request) {
        return new FormData(
                trim(request.getParameter("name")),
                trim(request.getParameter("address")),
                trim(request.getParameter("units")),
                trim(request.getParameter("month")));
    }

    private static String trim(String value) {
        return value == null ? "" : value.trim();
    }
}
