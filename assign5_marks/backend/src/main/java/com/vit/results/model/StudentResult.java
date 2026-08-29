package com.vit.results.model;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

/** One semester result sheet, stored as a single document in the "results" collection. */
@Document(collection = "results")
public class StudentResult {

    @Id
    private String id;

    @Indexed(unique = true)
    @NotBlank(message = "PRN is required")
    @Pattern(regexp = "\\d{8,12}", message = "PRN must be 8 to 12 digits")
    private String prn;

    @NotBlank(message = "student name is required")
    private String name;

    @NotBlank(message = "branch is required")
    private String branch;

    @NotBlank(message = "division is required")
    private String division;

    @Valid
    @Size(min = 4, max = 4, message = "exactly four subjects are required")
    private List<SubjectMarks> subjects = new ArrayList<>();

    private Instant updatedAt;

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getPrn() {
        return prn;
    }

    public void setPrn(String prn) {
        this.prn = prn;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getBranch() {
        return branch;
    }

    public void setBranch(String branch) {
        this.branch = branch;
    }

    public String getDivision() {
        return division;
    }

    public void setDivision(String division) {
        this.division = division;
    }

    public List<SubjectMarks> getSubjects() {
        return subjects;
    }

    public void setSubjects(List<SubjectMarks> subjects) {
        this.subjects = subjects;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}
