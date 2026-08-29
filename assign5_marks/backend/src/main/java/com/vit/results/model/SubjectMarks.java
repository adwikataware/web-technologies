package com.vit.results.model;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * Marks a student scored in one subject. MSE is out of 30 and ESE out of 70,
 * so the two together already carry the 30% / 70% weightage of the 100 mark
 * head. Only raw marks are stored - grade and points are derived on read.
 */
public class SubjectMarks {

    public static final int MSE_MAX = 30;
    public static final int ESE_MAX = 70;

    @NotBlank(message = "subject code is required")
    private String code;

    @NotBlank(message = "subject name is required")
    private String name;

    @Min(value = 1, message = "credits must be at least 1")
    @Max(value = 6, message = "credits must be at most 6")
    private int credits;

    @NotNull(message = "MSE marks are required")
    @Min(value = 0, message = "MSE marks cannot be negative")
    @Max(value = SubjectMarks.MSE_MAX, message = "MSE marks cannot exceed " + SubjectMarks.MSE_MAX)
    private Integer mse;

    @NotNull(message = "ESE marks are required")
    @Min(value = 0, message = "ESE marks cannot be negative")
    @Max(value = SubjectMarks.ESE_MAX, message = "ESE marks cannot exceed " + SubjectMarks.ESE_MAX)
    private Integer ese;

    public SubjectMarks() {
    }

    public SubjectMarks(String code, String name, int credits, Integer mse, Integer ese) {
        this.code = code;
        this.name = name;
        this.credits = credits;
        this.mse = mse;
        this.ese = ese;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public int getCredits() {
        return credits;
    }

    public void setCredits(int credits) {
        this.credits = credits;
    }

    public Integer getMse() {
        return mse;
    }

    public void setMse(Integer mse) {
        this.mse = mse;
    }

    public Integer getEse() {
        return ese;
    }

    public void setEse(Integer ese) {
        this.ese = ese;
    }
}
