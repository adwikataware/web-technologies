package com.vit.results.service;

import com.vit.results.model.SubjectMarks;
import java.util.List;

/**
 * The four subjects this semester is prepared for. The frontend reads this so
 * the marks form and the stored documents never drift apart.
 */
public final class SubjectCatalog {

    public record Subject(String code, String name, int credits) {
    }

    public static final List<Subject> SUBJECTS = List.of(
            new Subject("CS3001", "Web Technologies", 4),
            new Subject("CS3002", "Database Management Systems", 4),
            new Subject("CS3003", "Computer Networks", 3),
            new Subject("CS3004", "Software Engineering", 3));

    public static final int MSE_MAX = SubjectMarks.MSE_MAX;
    public static final int ESE_MAX = SubjectMarks.ESE_MAX;

    private SubjectCatalog() {
    }
}
