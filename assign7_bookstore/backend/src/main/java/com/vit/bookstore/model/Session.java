package com.vit.bookstore.model;

import java.time.Instant;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

/**
 * An issued login token. Keeping sessions in Mongo rather than in memory means
 * a restart does not silently sign everyone out, and a token can be revoked by
 * deleting one document.
 */
@Document(collection = "sessions")
public class Session {

    @Id
    private String id;

    @Indexed(unique = true)
    private String token;

    private String userId;
    private Instant issuedOn;
    private Instant expiresOn;

    public Session() {
    }

    public Session(String token, String userId, Instant expiresOn) {
        this.token = token;
        this.userId = userId;
        this.issuedOn = Instant.now();
        this.expiresOn = expiresOn;
    }

    public boolean hasExpired() {
        return expiresOn == null || expiresOn.isBefore(Instant.now());
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public Instant getIssuedOn() { return issuedOn; }
    public void setIssuedOn(Instant issuedOn) { this.issuedOn = issuedOn; }

    public Instant getExpiresOn() { return expiresOn; }
    public void setExpiresOn(Instant expiresOn) { this.expiresOn = expiresOn; }
}
