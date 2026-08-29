package com.vit.results.config;

import com.vit.results.model.StudentResult;
import com.vit.results.model.SubjectMarks;
import com.vit.results.repository.StudentResultRepository;
import com.vit.results.service.SubjectCatalog;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

/**
 * The embedded MongoDB starts empty every run, so give the demo something to
 * show. A real database is never touched by this.
 */
@Configuration
@Profile("embedded")
public class DemoDataSeeder {

    @Bean
    CommandLineRunner seed(StudentResultRepository repository) {
        return args -> {
            if (repository.count() > 0) {
                return;
            }
            repository.saveAll(List.of(
                    student("20221001", "Aarav Deshmukh", "A", 26, 61, 24, 58, 22, 49, 27, 64),
                    student("20221002", "Isha Kulkarni", "A", 29, 66, 28, 63, 27, 60, 28, 65),
                    student("20221003", "Rohan Patil", "B", 18, 34, 21, 41, 12, 22, 19, 38)));
        };
    }

    /** Marks are passed MSE/ESE per subject, in catalog order. */
    private static StudentResult student(String prn, String name, String division, int... marks) {
        List<SubjectMarks> subjects = new ArrayList<>();
        for (int i = 0; i < SubjectCatalog.SUBJECTS.size(); i++) {
            SubjectCatalog.Subject subject = SubjectCatalog.SUBJECTS.get(i);
            subjects.add(new SubjectMarks(
                    subject.code(), subject.name(), subject.credits(), marks[i * 2], marks[i * 2 + 1]));
        }
        StudentResult result = new StudentResult();
        result.setPrn(prn);
        result.setName(name);
        result.setBranch("Computer Engineering");
        result.setDivision(division);
        result.setSubjects(subjects);
        result.setUpdatedAt(Instant.now());
        return result;
    }
}
