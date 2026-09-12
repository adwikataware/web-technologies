package com.vit.bookstore.web;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.vit.bookstore.service.AccountService;
import com.vit.bookstore.web.Dtos.AccountView;
import com.vit.bookstore.web.Dtos.LoginRequest;
import com.vit.bookstore.web.Dtos.RegistrationRequest;
import com.vit.bookstore.web.Dtos.SessionView;

import jakarta.validation.Valid;

/** Registration, sign in, sign out, and "who am I". */
@RestController
@RequestMapping("/api/auth")
class AuthController {

    private final AccountService accounts;

    AuthController(AccountService accounts) {
        this.accounts = accounts;
    }

    @PostMapping("/register")
    ResponseEntity<SessionView> register(@Valid @RequestBody RegistrationRequest request) {
        var signedIn = accounts.register(request.email(), request.fullName(), request.password());
        return ResponseEntity.status(HttpStatus.CREATED).body(view(signedIn));
    }

    @PostMapping("/login")
    SessionView login(@Valid @RequestBody LoginRequest request) {
        return view(accounts.signIn(request.email(), request.password()));
    }

    @PostMapping("/logout")
    ResponseEntity<Void> logout(@RequestHeader(value = "Authorization", required = false) String header) {
        accounts.signOut(bearer(header));
        return ResponseEntity.noContent().build();
    }

    /** Lets the browser check on load whether the token it kept is still good. */
    @GetMapping("/me")
    AccountView me(@RequestHeader(value = "Authorization", required = false) String header) {
        return AccountView.of(accounts.requireUser(bearer(header)));
    }

    private SessionView view(AccountService.SignedIn signedIn) {
        return new SessionView(AccountView.of(signedIn.user()), signedIn.token(),
                signedIn.expiresOn());
    }

    private String bearer(String header) {
        if (header == null) {
            return null;
        }
        return header.regionMatches(true, 0, "Bearer ", 0, 7) ? header.substring(7).trim() : header.trim();
    }
}
