package com.vit.bookstore.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.vit.bookstore.model.Book;
import com.vit.bookstore.repository.BookRepository;
import com.vit.bookstore.service.CatalogueService.SortOrder;

/** The filtering and sorting rules behind the catalogue page. */
@ExtendWith(MockitoExtension.class)
class CatalogueServiceTest {

    @Mock
    private BookRepository books;

    private CatalogueService catalogue;

    private static Book book(String title, String genre, String price, double rating,
                             int stock, int year) {
        return new Book("isbn-" + title, title, "Some Author", genre, new BigDecimal(price),
                rating, stock, year, "blurb", "#000000");
    }

    private final Book cheap = book("Algorithms", "Computer Science", "300.00", 4.1, 4, 2009);
    private final Book dear = book("Effective Java", "Programming", "710.00", 4.8, 0, 2018);
    private final Book middle = book("Clean Code", "Programming", "549.00", 4.6, 12, 2008);

    @BeforeEach
    void setUp() {
        catalogue = new CatalogueService(books);
    }

    @Test
    void sortsByTitleByDefault() {
        when(books.findAll()).thenReturn(List.of(dear, cheap, middle));

        var result = catalogue.browse(null, null, null, false, SortOrder.TITLE);

        assertThat(result).extracting(Book::getTitle)
                .containsExactly("Algorithms", "Clean Code", "Effective Java");
    }

    @Test
    void appliesPriceCeilingAndGenreTogether() {
        when(books.findAll()).thenReturn(List.of(dear, cheap, middle));

        var result = catalogue.browse(null, "Programming", new BigDecimal("600.00"), false,
                SortOrder.TITLE);

        assertThat(result).extracting(Book::getTitle).containsExactly("Clean Code");
    }

    @Test
    void inStockOnlyDropsTitlesWithNoCopiesLeft() {
        when(books.findAll()).thenReturn(List.of(dear, cheap, middle));

        var result = catalogue.browse(null, null, null, true, SortOrder.PRICE_HIGH_LOW);

        assertThat(result).extracting(Book::getTitle).containsExactly("Clean Code", "Algorithms");
    }

    @Test
    void ratingSortPutsTheBestFirst() {
        when(books.findAll()).thenReturn(List.of(cheap, middle, dear));

        var result = catalogue.browse(null, null, null, false, SortOrder.RATING);

        assertThat(result).extracting(Book::getRating).containsExactly(4.8, 4.6, 4.1);
    }

    @Test
    void unknownSortValueFallsBackToTitle() {
        assertThat(SortOrder.parse("nonsense")).isEqualTo(SortOrder.TITLE);
        assertThat(SortOrder.parse(null)).isEqualTo(SortOrder.TITLE);
        assertThat(SortOrder.parse("price-low-high")).isEqualTo(SortOrder.PRICE_LOW_HIGH);
    }

    /** A search for "C++" must not reach Mongo as a regex quantifier. */
    @Test
    void escapesRegexMetacharactersInTheSearchTerm() {
        assertThat(CatalogueService.escapeRegex("C++")).isEqualTo("C\\+\\+");
        assertThat(CatalogueService.escapeRegex("what?")).isEqualTo("what\\?");
        assertThat(CatalogueService.escapeRegex("plain")).isEqualTo("plain");
    }
}
