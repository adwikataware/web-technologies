package com.vit.results.service;

/**
 * VIT ten point grading scale. The bands are checked from the top down, so the
 * first band whose minimum a total clears is the grade awarded.
 */
public enum Grade {

    AA("Outstanding", 90, 10),
    AB("Excellent", 80, 9),
    BB("Very Good", 70, 8),
    BC("Good", 60, 7),
    CC("Average", 50, 6),
    CD("Satisfactory", 45, 5),
    DD("Pass", 40, 4),
    FF("Fail", 0, 0);

    private final String label;
    private final int minTotal;
    private final int points;

    Grade(String label, int minTotal, int points) {
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
        return FF;
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
        return this != FF;
    }
}
