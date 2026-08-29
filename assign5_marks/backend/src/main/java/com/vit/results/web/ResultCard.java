package com.vit.results.web;

import java.util.List;

/** The prepared result sheet returned to the client. */
public record ResultCard(
        String id,
        String prn,
        String name,
        String branch,
        String division,
        List<SubjectScore> subjects,
        int totalMarks,
        int maxMarks,
        double percentage,
        int totalCredits,
        double sgpa,
        int backlogs,
        String status,
        String updatedAt) {

    /** One row of the marksheet: raw marks plus everything derived from them. */
    public record SubjectScore(
            String code,
            String name,
            int credits,
            int mse,
            int ese,
            int total,
            String grade,
            String gradeLabel,
            int gradePoints,
            boolean passed) {
    }
}
