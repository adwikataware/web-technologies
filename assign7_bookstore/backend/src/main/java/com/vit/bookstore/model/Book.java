package com.vit.bookstore.model;

import java.math.BigDecimal;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

/** One title in the catalogue. */
@Document(collection = "books")
public class Book {

    @Id
    private String id;

    @Indexed(unique = true)
    private String isbn;

    private String title;
    private String author;
    private String genre;
    private BigDecimal price;
    private double rating;
    private int stock;
    private int year;
    private String blurb;

    /** Hex colour the cover placeholder is drawn in, so the grid is not grey. */
    private String coverColour;

    public Book() {
    }

    public Book(String isbn, String title, String author, String genre, BigDecimal price,
                double rating, int stock, int year, String blurb, String coverColour) {
        this.isbn = isbn;
        this.title = title;
        this.author = author;
        this.genre = genre;
        this.price = price;
        this.rating = rating;
        this.stock = stock;
        this.year = year;
        this.blurb = blurb;
        this.coverColour = coverColour;
    }

    public boolean isInStock() {
        return stock > 0;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getIsbn() { return isbn; }
    public void setIsbn(String isbn) { this.isbn = isbn; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getAuthor() { return author; }
    public void setAuthor(String author) { this.author = author; }

    public String getGenre() { return genre; }
    public void setGenre(String genre) { this.genre = genre; }

    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }

    public double getRating() { return rating; }
    public void setRating(double rating) { this.rating = rating; }

    public int getStock() { return stock; }
    public void setStock(int stock) { this.stock = stock; }

    public int getYear() { return year; }
    public void setYear(int year) { this.year = year; }

    public String getBlurb() { return blurb; }
    public void setBlurb(String blurb) { this.blurb = blurb; }

    public String getCoverColour() { return coverColour; }
    public void setCoverColour(String coverColour) { this.coverColour = coverColour; }
}
