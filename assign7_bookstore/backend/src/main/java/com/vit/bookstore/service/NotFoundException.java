package com.vit.bookstore.service;

/** Nothing is stored under the identifier the request used. */
public class NotFoundException extends RuntimeException {

    public NotFoundException(String message) {
        super(message);
    }
}
