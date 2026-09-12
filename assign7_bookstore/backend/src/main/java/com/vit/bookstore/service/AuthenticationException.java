package com.vit.bookstore.service;

/** Bad credentials, or a token that is missing, unknown or expired. */
public class AuthenticationException extends RuntimeException {

    public AuthenticationException(String message) {
        super(message);
    }
}
