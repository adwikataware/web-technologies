package com.vit.results.service;

/**
 * VIT ten point grading scale. The bands are checked from the top down, so the
 * first band whose minimum a total clears is the grade awarded.
 *
 * <p>The constant names carry the "+" spelt out because a Java identifier
 * cannot contain one; {@link #getSymbol()} is what the marksheet shows.
 */
public enum Grade {

    A_PLUS("A+", "Outstanding", 90, 10),
    A("A", "Excellent", 80, 9),
    B_PLUS("B+", "Very Good", 70, 8),
    B("B", "Good", 60, 7),
    C_PLUS("C+", "Average", 50, 6),
    C("C", "Satisfactory", 45, 5),
    D("D", "Pass", 40, 4),
    F("F", "Fail", 0, 0);

    private final String symbol;
    private final String label;
    private final int minTotal;
    private final int points;

    Grade(String symbol, String label, int minTotal, int points) {
        this.symbol = symbol;
        this.label = label;
        this.minTotal = minTotal;
        this.points = points;
    }

    public static Grade forTotal(int total) {
        for (Grade grade : values()) {
            if (total >= grade.minTotal) {
                return grade;
            }
        }
        return F;
    }

    public String getSymbol() {
        return symbol;
    }

    public String getLabel() {
        return label;
    }

    public int getMinTotal() {
        return minTotal;
    }

    public int getPoints() {
        return points;
    }

    public boolean isPass() {
        return this != F;
    }
}
