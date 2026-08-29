package com.vit.results.service;

import com.vit.results.model.StudentResult;
import com.vit.results.model.SubjectMarks;
import com.vit.results.repository.StudentResultRepository;
import com.vit.results.web.ResultCard;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;

/**
 * Stores marks and prepares the result. Grades, percentage and SGPA are never
 * written to MongoDB - they are recomputed from the raw marks on every read, so
 * a change to the grading scale applies to results that already exist.
 */
@Service
public class ResultService {

    private final StudentResultRepository repository;

    public ResultService(StudentResultRepository repository) {
        this.repository = repository;
    }

    public List<ResultCard> findAll() {
        return repository.findAllByOrderByNameAsc().stream().map(ResultService::prepare).toList();
    }

    public ResultCard findByPrn(String prn) {
        return repository.findByPrn(prn).map(ResultService::prepare)
                .orElseThrow(() -> new ResultNotFoundException(prn));
    }

    /** Creates a new sheet, or overwrites the one already filed under this PRN. */
    public ResultCard save(StudentResult submitted) {
        StudentResult toStore = repository.findByPrn(submitted.getPrn()).orElseGet(StudentResult::new);
        toStore.setPrn(submitted.getPrn());
        toStore.setName(submitted.getName().trim());
        toStore.setBranch(submitted.getBranch().trim());
        toStore.setDivision(submitted.getDivision().trim());
        toStore.setSubjects(submitted.getSubjects());
        toStore.setUpdatedAt(Instant.now());
        try {
            return prepare(repository.save(toStore));
        } catch (DuplicateKeyException e) {
            // Two requests raced on the same new PRN; the loser retries against the winner.
            return save(submitted);
        }
    }

    public void deleteByPrn(String prn) {
        StudentResult stored = repository.findByPrn(prn).orElseThrow(() -> new ResultNotFoundException(prn));
        repository.delete(stored);
    }

    /** Turns stored marks into a full marksheet. */
    public static ResultCard prepare(StudentResult stored) {
        List<ResultCard.SubjectScore> scores = new ArrayList<>();
        int totalMarks = 0;
        int totalCredits = 0;
        int weightedPoints = 0;
        int backlogs = 0;

        for (SubjectMarks subject : stored.getSubjects()) {
            int total = subject.getMse() + subject.getEse();
            Grade grade = Grade.forTotal(total);
            int credits = subject.getCredits();

            scores.add(new ResultCard.SubjectScore(
                    subject.getCode(), subject.getName(), credits,
                    subject.getMse(), subject.getEse(), total,
                    grade.name(), grade.getLabel(), grade.getPoints(), grade.isPass()));

            totalMarks += total;
            totalCredits += credits;
            weightedPoints += credits * grade.getPoints();
            if (!grade.isPass()) {
                backlogs++;
            }
        }

        int maxMarks = stored.getSubjects().size() * (SubjectMarks.MSE_MAX + SubjectMarks.ESE_MAX);
        double percentage = maxMarks == 0 ? 0 : round2(totalMarks * 100.0 / maxMarks);
        double sgpa = totalCredits == 0 ? 0 : round2((double) weightedPoints / totalCredits);

        return new ResultCard(
                stored.getId(), stored.getPrn(), stored.getName(), stored.getBranch(), stored.getDivision(),
                scores, totalMarks, maxMarks, percentage, totalCredits, sgpa, backlogs,
                backlogs == 0 ? "PASS" : "FAIL",
                stored.getUpdatedAt() == null ? null : stored.getUpdatedAt().toString());
    }

    private static double round2(double value) {
        return Math.round(value * 100.0) / 100.0;
    }
}
