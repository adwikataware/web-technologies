package com.vit.results.service;

public class ResultNotFoundException extends RuntimeException {

    public ResultNotFoundException(String prn) {
        super("No result stored for PRN " + prn);
    }
}
