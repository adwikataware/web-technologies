package com.vit.bookstore.service;

/** Something the request asked for clashes with what is already stored. */
public class ConflictException extends RuntimeException {

    public ConflictException(String message) {
        super(message);
    }
}
