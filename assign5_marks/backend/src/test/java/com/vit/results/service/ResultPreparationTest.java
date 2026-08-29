package com.vit.results.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.vit.results.model.StudentResult;
import com.vit.results.model.SubjectMarks;
import com.vit.results.web.ResultCard;
import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.Test;

class ResultPreparationTest {

    @Test
    void addsMseAndEseIntoAHundredMarkTotal() {
        ResultCard card = prepare(26, 61, 24, 58, 22, 49, 27, 64);

        assertThat(card.subjects().get(0).total()).isEqualTo(87);
        assertThat(card.maxMarks()).isEqualTo(400);
        assertThat(card.totalMarks()).isEqualTo(331);
        assertThat(card.percentage()).isEqualTo(82.75);
    }

    @Test
    void awardsGradesFromTheTotal() {
        assertThat(Grade.forTotal(100)).isEqualTo(Grade.AA);
        assertThat(Grade.forTotal(90)).isEqualTo(Grade.AA);
        assertThat(Grade.forTotal(89)).isEqualTo(Grade.AB);
        assertThat(Grade.forTotal(45)).isEqualTo(Grade.CD);
        assertThat(Grade.forTotal(40)).isEqualTo(Grade.DD);
        assertThat(Grade.forTotal(39)).isEqualTo(Grade.FF);
        assertThat(Grade.forTotal(0)).isEqualTo(Grade.FF);
    }

    @Test
    void weightsSgpaByCredits() {
        // 87 AB(9)x4 + 82 AB(9)x4 + 71 BB(8)x3 + 91 AA(10)x3 = 126 points / 14 credits.
        ResultCard card = prepare(26, 61, 24, 58, 22, 49, 27, 64);

        assertThat(card.totalCredits()).isEqualTo(14);
        assertThat(card.sgpa()).isEqualTo(9.0);
        assertThat(card.status()).isEqualTo("PASS");
        assertThat(card.backlogs()).isZero();
    }

    @Test
    void failsTheSemesterWhenAnySubjectIsBelowForty() {
        ResultCard card = prepare(26, 61, 24, 58, 12, 22, 27, 64);

        assertThat(card.backlogs()).isEqualTo(1);
        assertThat(card.status()).isEqualTo("FAIL");
        assertThat(card.subjects().get(2).grade()).isEqualTo("FF");
        assertThat(card.subjects().get(2).gradePoints()).isZero();
    }

    private static ResultCard prepare(int... marks) {
        List<SubjectMarks> subjects = new ArrayList<>();
        for (int i = 0; i < SubjectCatalog.SUBJECTS.size(); i++) {
            SubjectCatalog.Subject subject = SubjectCatalog.SUBJECTS.get(i);
            subjects.add(new SubjectMarks(
                    subject.code(), subject.name(), subject.credits(), marks[i * 2], marks[i * 2 + 1]));
        }
        StudentResult stored = new StudentResult();
        stored.setPrn("20221001");
        stored.setName("Aarav Deshmukh");
        stored.setBranch("Computer Engineering");
        stored.setDivision("A");
        stored.setSubjects(subjects);
        return ResultService.prepare(stored);
    }
}
