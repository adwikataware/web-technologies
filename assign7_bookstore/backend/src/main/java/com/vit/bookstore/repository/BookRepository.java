package com.vit.bookstore.repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import com.vit.bookstore.model.Book;

public interface BookRepository extends MongoRepository<Book, String> {

    /** Case-insensitive match on either the title or the author. */
    @Query("{ $or: [ { 'title': { $regex: ?0, $options: 'i' } },"
         + "         { 'author': { $regex: ?0, $options: 'i' } } ] }")
    List<Book> search(String term);

    List<Book> findByGenre(String genre);

    boolean existsByIsbn(String isbn);
}
