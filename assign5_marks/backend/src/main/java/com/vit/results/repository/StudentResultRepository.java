package com.vit.results.repository;

import com.vit.results.model.StudentResult;
import java.util.List;
import java.util.Optional;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface StudentResultRepository extends MongoRepository<StudentResult, String> {

    Optional<StudentResult> findByPrn(String prn);

    boolean existsByPrn(String prn);

    List<StudentResult> findAllByOrderByNameAsc();
}
