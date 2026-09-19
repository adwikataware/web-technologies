package com.vit.cricket.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.vit.cricket.model.Match;
import com.vit.cricket.model.MatchStatus;
import com.vit.cricket.repository.MatchRepository;
import com.vit.cricket.simulation.MatchSimulationEngine;

/**
 * Puts three matches in front of a fresh start: two begin live and play out in
 * real time tick by tick, and one is fast-forwarded to a finished result
 * immediately, so the "match summary" view has something to show without
 * making a reviewer wait for a full innings to complete.
 */
@Configuration
public class MatchSeeder {

    private static final Logger log = LoggerFactory.getLogger(MatchSeeder.class);

    @Bean
    ApplicationRunner seedMatches(FixtureFactory fixtures, MatchRepository repository,
                                  MatchSimulationEngine engine) {
        return args -> {
            Match live1 = repository.save(fixtures.mumbaiVsPune(8));
            Match live2 = repository.save(fixtures.bangaloreVsChennai(6));
            Match finished = repository.save(fixtures.delhiVsKolkata(5));

            engine.simulateOneBall(live1); // SCHEDULED -> LIVE, first ball next tick
            engine.simulateOneBall(live2);

            // Fast-forward the third fixture to completion synchronously - there
            // is no broadcast to send yet since nobody has subscribed at
            // startup, only the REST snapshot needs to be ready.
            int guard = 0;
            while (finished.getStatus() != MatchStatus.COMPLETED && guard++ < 5000) {
                engine.simulateOneBall(finished);
            }

            log.info("Seeded 2 live matches ({}, {}) and 1 completed match ({}) -> {}",
                    live1.getId(), live2.getId(), finished.getId(), finished.getResultSummary());
        };
    }
}
