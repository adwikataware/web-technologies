package com.vit.bookstore.web;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.vit.bookstore.service.CatalogueService;
import com.vit.bookstore.service.CatalogueService.SortOrder;
import com.vit.bookstore.web.Dtos.BookView;

/** The catalogue itself. Reading it does not require an account. */
@RestController
@RequestMapping("/api")
class CatalogueController {

    private final CatalogueService catalogue;

    CatalogueController(CatalogueService catalogue) {
        this.catalogue = catalogue;
    }

    @GetMapping("/books")
    List<BookView> browse(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String genre,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(defaultValue = "false") boolean inStockOnly,
            @RequestParam(required = false) String sort) {

        return catalogue.browse(search, genre, maxPrice, inStockOnly, SortOrder.parse(sort))
                .stream()
                .map(BookView::of)
                .toList();
    }

    @GetMapping("/books/{id}")
    BookView one(@PathVariable String id) {
        return BookView.of(catalogue.byId(id));
    }

    /** Feeds the genre dropdown on the catalogue page. */
    @GetMapping("/genres")
    List<String> genres() {
        return catalogue.genres();
    }
}
