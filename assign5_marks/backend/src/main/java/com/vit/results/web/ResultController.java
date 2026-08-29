package com.vit.results.web;

import com.vit.results.model.StudentResult;
import com.vit.results.service.Grade;
import com.vit.results.service.ResultService;
import com.vit.results.service.SubjectCatalog;
import jakarta.validation.Valid;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class ResultController {

    private final ResultService service;

    public ResultController(ResultService service) {
        this.service = service;
    }

    /**
     * Everything the marks form needs: the four subjects, the mark ceilings and
     * the grading scale. Shipping the scale keeps the live preview in the browser
     * honest without the React app hard coding a second copy of it.
     */
    @GetMapping("/syllabus")
    public Map<String, Object> syllabus() {
        List<Map<String, Object>> grades = Arrays.stream(Grade.values())
                .map(grade -> Map.<String, Object>of(
                        "code", grade.name(),
                        "label", grade.getLabel(),
                        "minTotal", grade.getMinTotal(),
                        "points", grade.getPoints()))
                .toList();

        return Map.of(
                "subjects", SubjectCatalog.SUBJECTS,
                "mseMax", SubjectCatalog.MSE_MAX,
                "eseMax", SubjectCatalog.ESE_MAX,
                "grades", grades);
    }

    @GetMapping("/results")
    public List<ResultCard> all() {
        return service.findAll();
    }

    @GetMapping("/results/{prn}")
    public ResultCard byPrn(@PathVariable String prn) {
        return service.findByPrn(prn);
    }

    @PostMapping("/results")
    public ResponseEntity<ResultCard> save(@Valid @RequestBody StudentResult submitted) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.save(submitted));
    }

    @DeleteMapping("/results/{prn}")
    public ResponseEntity<Void> delete(@PathVariable String prn) {
        service.deleteByPrn(prn);
        return ResponseEntity.noContent().build();
    }
}
