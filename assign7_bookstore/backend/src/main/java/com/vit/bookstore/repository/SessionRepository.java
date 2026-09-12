package com.vit.bookstore.repository;

import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.vit.bookstore.model.Session;

public interface SessionRepository extends MongoRepository<Session, String> {

    Optional<Session> findByToken(String token);

    void deleteByToken(String token);
}
