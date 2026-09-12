package com.vit.bookstore.web;

import java.math.BigDecimal;
import java.time.Instant;

import com.vit.bookstore.model.Book;
import com.vit.bookstore.model.User;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * What crosses the wire. These are separate from the @Document classes on
 * purpose: the request shapes carry the validation rules, and the response
 * shapes make it impossible to leak a password hash by accident.
 */
final class Dtos {

    private Dtos() {
    }

    record RegistrationRequest(
            @NotBlank(message = "Full name is required")
            @Size(min = 2, max = 80, message = "Full name must be between 2 and 80 characters")
            String fullName,

            @NotBlank(message = "Email is required")
            @Email(message = "Enter a valid email address")
            String email,

            @NotBlank(message = "Password is required")
            @Size(min = 8, max = 72, message = "Password must be at least 8 characters")
            @Pattern(regexp = ".*[A-Za-z].*", message = "Password must contain a letter")
            @Pattern(regexp = ".*\\d.*", message = "Password must contain a digit")
            String password) {
    }

    record LoginRequest(
            @NotBlank(message = "Email is required")
            @Email(message = "Enter a valid email address")
            String email,

            @NotBlank(message = "Password is required")
            String password) {
    }

    /** The signed-in customer. Note there is no field for the hash. */
    record AccountView(String id, String fullName, String email, Instant registeredOn) {

        static AccountView of(User user) {
            return new AccountView(user.getId(), user.getFullName(), user.getEmail(),
                    user.getRegisteredOn());
        }
    }

    record SessionView(AccountView account, String token, Instant expiresOn) {
    }

    record BookView(String id, String isbn, String title, String author, String genre,
                    BigDecimal price, double rating, int stock, int year, String blurb,
                    String coverColour, boolean inStock) {

        static BookView of(Book book) {
            return new BookView(book.getId(), book.getIsbn(), book.getTitle(), book.getAuthor(),
                    book.getGenre(), book.getPrice(), book.getRating(), book.getStock(),
                    book.getYear(), book.getBlurb(), book.getCoverColour(), book.isInStock());
        }
    }
}
