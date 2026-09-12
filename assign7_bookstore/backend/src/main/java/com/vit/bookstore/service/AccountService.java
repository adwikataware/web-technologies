package com.vit.bookstore.service;

import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.security.SecureRandom;

import org.springframework.dao.DuplicateKeyException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.vit.bookstore.model.Session;
import com.vit.bookstore.model.User;
import com.vit.bookstore.repository.SessionRepository;
import com.vit.bookstore.repository.UserRepository;

/** Registration, sign in, sign out and resolving a token back to its user. */
@Service
public class AccountService {

    private static final Duration SESSION_LIFETIME = Duration.ofDays(7);

    private final UserRepository users;
    private final SessionRepository sessions;
    private final PasswordEncoder encoder = new BCryptPasswordEncoder();
    private final SecureRandom random = new SecureRandom();

    public AccountService(UserRepository users, SessionRepository sessions) {
        this.users = users;
        this.sessions = sessions;
    }

    public record SignedIn(User user, String token, Instant expiresOn) {
    }

    public SignedIn register(String email, String fullName, String password) {
        String normalised = email.trim().toLowerCase();

        if (users.existsByEmailIgnoreCase(normalised)) {
            throw new ConflictException("An account already exists for " + normalised);
        }

        User saved;
        try {
            saved = users.save(new User(normalised, fullName.trim(), encoder.encode(password)));
        } catch (DuplicateKeyException race) {
            // Two registrations for the same address at once: the unique index on
            // email is what actually decides, so report it the same way.
            throw new ConflictException("An account already exists for " + normalised);
        }
        return issue(saved);
    }

    public SignedIn signIn(String email, String password) {
        User user = users.findByEmailIgnoreCase(email.trim().toLowerCase())
                .orElseThrow(() -> new AuthenticationException("Email or password is incorrect"));

        if (!encoder.matches(password, user.getPasswordHash())) {
            // Deliberately the same message as an unknown address, so the form
            // cannot be used to find out which addresses are registered.
            throw new AuthenticationException("Email or password is incorrect");
        }
        return issue(user);
    }

    public void signOut(String token) {
        if (token != null && !token.isBlank()) {
            sessions.deleteByToken(token);
        }
    }

    /** Resolves the Authorization token on a request back to the signed-in user. */
    public User requireUser(String token) {
        if (token == null || token.isBlank()) {
            throw new AuthenticationException("Not signed in");
        }
        Session session = sessions.findByToken(token)
                .orElseThrow(() -> new AuthenticationException("Session is no longer valid"));

        if (session.hasExpired()) {
            sessions.delete(session);
            throw new AuthenticationException("Session has expired, please sign in again");
        }
        return users.findById(session.getUserId())
                .orElseThrow(() -> new AuthenticationException("Session is no longer valid"));
    }

    private SignedIn issue(User user) {
        Instant expiresOn = Instant.now().plus(SESSION_LIFETIME);
        Session session = sessions.save(new Session(newToken(), user.getId(), expiresOn));
        return new SignedIn(user, session.getToken(), expiresOn);
    }

    private String newToken() {
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}
