package com.vit.cricket.web;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.vit.cricket.repository.MatchRepository;
import com.vit.cricket.web.Dtos.MatchDetail;
import com.vit.cricket.web.Dtos.MatchSummary;

/**
 * The REST side of the same state the WebSocket topics push. It exists so the
 * dashboard has something to render on first load (and a plain HTTP client can
 * inspect a match) without waiting for the next broadcast.
 */
@RestController
@RequestMapping("/api/matches")
class MatchController {

    private final MatchRepository matches;
    private final MatchMapper mapper;

    MatchController(MatchRepository matches, MatchMapper mapper) {
        this.matches = matches;
        this.mapper = mapper;
    }

    @GetMapping
    List<MatchSummary> all() {
        return mapper.toSummaries(matches.findAll());
    }

    @GetMapping("/{id}")
    MatchDetail one(@PathVariable String id) {
        return matches.findById(id)
                .map(mapper::toDetail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "No match with id " + id));
    }
}
