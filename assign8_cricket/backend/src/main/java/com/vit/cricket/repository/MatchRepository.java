package com.vit.cricket.repository;

import java.util.Collection;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Repository;

import com.vit.cricket.model.Match;

/**
 * Holds every match the simulator knows about. There is no database behind
 * this on purpose: nothing here needs to survive a restart, and the whole
 * point of the assignment is a live feed, not a persisted archive.
 */
@Repository
public class MatchRepository {

    private final Map<String, Match> matches = new ConcurrentHashMap<>();

    public Match save(Match match) {
        matches.put(match.getId(), match);
        return match;
    }

    public Optional<Match> findById(String id) {
        return Optional.ofNullable(matches.get(id));
    }

    public Collection<Match> findAll() {
        return matches.values();
    }
}
