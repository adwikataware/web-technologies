package com.vit.bookstore.service;

import java.math.BigDecimal;
import java.util.Comparator;
import java.util.List;

import org.springframework.stereotype.Service;

import com.vit.bookstore.model.Book;
import com.vit.bookstore.repository.BookRepository;

/**
 * Reads the catalogue. The text search is pushed down to Mongo as a regex
 * query; the remaining narrowing is done here, which keeps the filter rules in
 * one readable place and is fine at this catalogue's size.
 */
@Service
public class CatalogueService {

    /** The order the Sort by control offers. */
    public enum SortOrder {
        TITLE, PRICE_LOW_HIGH, PRICE_HIGH_LOW, RATING, NEWEST;

        public static SortOrder parse(String value) {
            if (value == null || value.isBlank()) {
                return TITLE;
            }
            try {
                return valueOf(value.trim().toUpperCase().replace('-', '_'));
            } catch (IllegalArgumentException ignored) {
                return TITLE;
            }
        }
    }

    private final BookRepository books;

    public CatalogueService(BookRepository books) {
        this.books = books;
    }

    public List<String> genres() {
        return books.findAll().stream()
                .map(Book::getGenre)
                .distinct()
                .sorted()
                .toList();
    }

    public Book byId(String id) {
        return books.findById(id)
                .orElseThrow(() -> new NotFoundException("No book with id " + id));
    }

    /**
     * @param search     matched against title and author, may be blank
     * @param genre      exact genre, or blank / "All" for every genre
     * @param maxPrice   ceiling in rupees, or null for no ceiling
     * @param inStockOnly drop titles with no copies left
     */
    public List<Book> browse(String search, String genre, BigDecimal maxPrice,
                             boolean inStockOnly, SortOrder order) {

        List<Book> found = (search == null || search.isBlank())
                ? books.findAll()
                : books.search(escapeRegex(search.trim()));

        return found.stream()
                .filter(b -> genre == null || genre.isBlank() || genre.equalsIgnoreCase("All")
                        || genre.equalsIgnoreCase(b.getGenre()))
                .filter(b -> maxPrice == null || b.getPrice().compareTo(maxPrice) <= 0)
                .filter(b -> !inStockOnly || b.isInStock())
                .sorted(comparatorFor(order))
                .toList();
    }

    private Comparator<Book> comparatorFor(SortOrder order) {
        return switch (order) {
            case PRICE_LOW_HIGH -> Comparator.comparing(Book::getPrice);
            case PRICE_HIGH_LOW -> Comparator.comparing(Book::getPrice).reversed();
            case RATING -> Comparator.comparingDouble(Book::getRating).reversed()
                    .thenComparing(Book::getTitle);
            case NEWEST -> Comparator.comparingInt(Book::getYear).reversed()
                    .thenComparing(Book::getTitle);
            case TITLE -> Comparator.comparing(Book::getTitle, String.CASE_INSENSITIVE_ORDER);
        };
    }

    /**
     * The search box feeds a Mongo regex, so anything a user types that happens
     * to be a metacharacter has to be neutralised first.
     */
    static String escapeRegex(String term) {
        return term.replaceAll("([\\\\.\\[\\]{}()*+?^$|])", "\\\\$1");
    }
}
