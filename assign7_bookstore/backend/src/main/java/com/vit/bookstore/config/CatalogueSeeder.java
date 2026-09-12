package com.vit.bookstore.config;

import java.math.BigDecimal;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.vit.bookstore.model.Book;
import com.vit.bookstore.repository.BookRepository;

/**
 * Puts a catalogue in the database the first time the application starts, so
 * the store has something to show. It only writes titles whose ISBN is not
 * already stored, which means a restart against a real MongoDB leaves existing
 * data alone.
 */
@Configuration
public class CatalogueSeeder {

    private static final Logger log = LoggerFactory.getLogger(CatalogueSeeder.class);

    @Bean
    ApplicationRunner seedCatalogue(BookRepository books) {
        return args -> {
            List<Book> catalogue = List.of(
                    new Book("9780132350884", "Clean Code", "Robert C. Martin", "Programming",
                            new BigDecimal("549.00"), 4.6, 12, 2008,
                            "A handbook of agile software craftsmanship, and an argument that "
                            + "code is read far more often than it is written.", "#2f5fd0"),
                    new Book("9780201616224", "The Pragmatic Programmer", "Andrew Hunt", "Programming",
                            new BigDecimal("625.00"), 4.7, 8, 1999,
                            "From journeyman to master: the habits, tools and attitudes that "
                            + "separate working code from code that keeps working.", "#1f7a5a"),
                    new Book("9780134685991", "Effective Java", "Joshua Bloch", "Programming",
                            new BigDecimal("710.00"), 4.8, 5, 2018,
                            "Seventy-eight rules of thumb for the Java platform, each with the "
                            + "reasoning that produced it.", "#8a3ab0"),
                    new Book("9780596007126", "Head First Design Patterns", "Eric Freeman", "Programming",
                            new BigDecimal("480.00"), 4.4, 0, 2004,
                            "The Gang of Four patterns, taught through pictures, puzzles and "
                            + "worked examples rather than formal definitions.", "#c2561e"),
                    new Book("9780262033848", "Introduction to Algorithms", "Thomas H. Cormen", "Computer Science",
                            new BigDecimal("1250.00"), 4.5, 3, 2009,
                            "The standard reference: sorting, graphs, dynamic programming and "
                            + "NP-completeness, proved rather than asserted.", "#b4282d"),
                    new Book("9780132126953", "Computer Networks", "Andrew S. Tanenbaum", "Computer Science",
                            new BigDecimal("845.00"), 4.3, 6, 2010,
                            "The network stack from the physical layer upward, with the design "
                            + "arguments behind each layer.", "#0f6f8c"),
                    new Book("9780133594140", "Operating System Concepts", "Abraham Silberschatz", "Computer Science",
                            new BigDecimal("920.00"), 4.2, 4, 2012,
                            "Processes, scheduling, memory and file systems, the book most "
                            + "operating systems courses are built around.", "#4a5568"),
                    new Book("9788126518685", "Database System Concepts", "Henry F. Korth", "Computer Science",
                            new BigDecimal("780.00"), 4.1, 0, 2011,
                            "Relational design, transactions and recovery, from the normal "
                            + "forms up to distributed databases.", "#7a5c1e"),
                    new Book("9780143441700", "The Discovery of India", "Jawaharlal Nehru", "History",
                            new BigDecimal("399.00"), 4.5, 15, 1946,
                            "Written from a prison cell, a sweep through Indian history as an "
                            + "argument about what the country was about to become.", "#8c5a2b"),
                    new Book("9780140449136", "Meditations", "Marcus Aurelius", "Philosophy",
                            new BigDecimal("299.00"), 4.6, 20, 180,
                            "The private notebook of a Roman emperor, never written for "
                            + "publication and better for it.", "#3d5a3d"),
                    new Book("9780062316097", "Sapiens", "Yuval Noah Harari", "History",
                            new BigDecimal("499.00"), 4.4, 9, 2011,
                            "A brief history of humankind, from foraging bands to the "
                            + "industrial present, told as a sequence of shared fictions.", "#a03860"),
                    new Book("9780307887894", "The Lean Startup", "Eric Ries", "Business",
                            new BigDecimal("450.00"), 4.0, 7, 2011,
                            "Build, measure, learn: running a new venture as a series of "
                            + "experiments rather than one long bet.", "#1d6fa5"),
                    new Book("9780374533557", "Thinking, Fast and Slow", "Daniel Kahneman", "Psychology",
                            new BigDecimal("575.00"), 4.5, 11, 2011,
                            "Two systems of thought, and a career's worth of evidence that the "
                            + "fast one is confidently wrong more often than we notice.", "#5a4a8a"),
                    new Book("9789353025359", "Wings of Fire", "A. P. J. Abdul Kalam", "Biography",
                            new BigDecimal("250.00"), 4.7, 25, 1999,
                            "An autobiography that spends more time on the engineering than on "
                            + "the office it led to.", "#b06a1e"),
                    new Book("9780451524935", "Nineteen Eighty-Four", "George Orwell", "Fiction",
                            new BigDecimal("350.00"), 4.6, 18, 1949,
                            "A state that edits the past and polices the language available "
                            + "for thinking about the present.", "#2b2b3d"),
                    new Book("9780061120084", "To Kill a Mockingbird", "Harper Lee", "Fiction",
                            new BigDecimal("420.00"), 4.8, 0, 1960,
                            "A trial in a small Alabama town, seen by a child who does not yet "
                            + "know what she is watching.", "#6b7a2b"));

            long added = catalogue.stream()
                    .filter(book -> !books.existsByIsbn(book.getIsbn()))
                    .peek(books::save)
                    .count();

            if (added > 0) {
                log.info("Seeded {} of {} titles into the catalogue", added, catalogue.size());
            }
        };
    }
}
