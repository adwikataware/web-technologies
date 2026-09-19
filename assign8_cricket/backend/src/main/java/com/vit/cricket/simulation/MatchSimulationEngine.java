package com.vit.cricket.simulation;

import java.util.List;
import java.util.Random;
import java.util.stream.Collectors;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.vit.cricket.model.Innings;
import com.vit.cricket.model.Match;
import com.vit.cricket.model.MatchStatus;
import com.vit.cricket.model.Player;
import com.vit.cricket.model.PlayerRole;
import com.vit.cricket.model.Team;
import com.vit.cricket.repository.MatchRepository;
import com.vit.cricket.simulation.BallOutcomeGenerator.Outcome;
import com.vit.cricket.web.MatchMapper;

/**
 * Advances every live match by one delivery per tick and pushes the result out
 * over WebSocket. Bundling "decide the next ball" and "broadcast the new
 * state" in one place keeps the two guaranteed to agree - there is no window
 * where the REST snapshot and the last push could show different balls.
 */
@Component
public class MatchSimulationEngine {

    private final MatchRepository matches;
    private final BallOutcomeGenerator outcomes;
    private final SimpMessagingTemplate messaging;
    private final MatchMapper mapper;
    private final Random random = new Random();

    public MatchSimulationEngine(MatchRepository matches, BallOutcomeGenerator outcomes,
                                 SimpMessagingTemplate messaging, MatchMapper mapper) {
        this.matches = matches;
        this.outcomes = outcomes;
        this.messaging = messaging;
        this.mapper = mapper;
    }

    /** Ticks every match once every two seconds - a full T20 innings plays out
     *  in a few minutes, fast enough to watch without feeling instantaneous. */
    @Scheduled(fixedRate = 2000)
    void tick() {
        for (Match match : matches.findAll()) {
            if (match.getStatus() == MatchStatus.COMPLETED) {
                continue;
            }
            simulateOneBall(match);
            broadcast(match);
        }
    }

    /**
     * Advances a match by exactly one step: starting an innings, bowling one
     * delivery, or handing over between innings. Exposed separately from
     * {@link #tick()} so a match can be fast-forwarded synchronously (the demo
     * seeder uses this to have a completed match ready at startup) without
     * waiting on the scheduler.
     */
    public void simulateOneBall(Match match) {
        switch (match.getStatus()) {
            case SCHEDULED -> match.startFirstInnings(match.getTeamA(), match.getTeamB());
            case INNINGS_BREAK -> match.startSecondInnings();
            case LIVE -> bowlOneDelivery(match);
            case COMPLETED -> { /* nothing left to advance */ }
        }
    }

    private void bowlOneDelivery(Match match) {
        Innings innings = match.currentInnings();

        if (innings.isComplete(match.getOversLimit())) {
            endInnings(match);
            return;
        }

        Outcome outcome = outcomes.next();
        Player bowlerBeforeThisBall = innings.currentBowler();

        innings.recordDelivery(outcome.runsOffBat(), outcome.extraType(), outcome.extraRuns(),
                outcome.wicket(), outcome.dismissalType());

        boolean overJustCompleted = innings.getBallsInCurrentOver() == 0
                && !isWideOrNoBall(outcome);
        if (overJustCompleted && !innings.isComplete(match.getOversLimit())) {
            innings.setBowler(pickNextBowler(innings, bowlerBeforeThisBall));
        }

        if (innings.isComplete(match.getOversLimit())) {
            endInnings(match);
        }
    }

    private boolean isWideOrNoBall(Outcome outcome) {
        return switch (outcome.extraType()) {
            case WIDE, NO_BALL -> true;
            default -> false;
        };
    }

    private void endInnings(Match match) {
        if (match.isSecondInnings()) {
            match.complete();
        } else {
            match.markInningsBreak();
        }
    }

    /** A bowler never bowls two overs back to back; bowling all-rounders and
     *  specialist bowlers are preferred over recognised batters. */
    private String pickNextBowler(Innings innings, Player justBowled) {
        Team bowlingTeam = innings.getBowlingTeam();
        List<Player> candidates = bowlingTeam.getPlayers().stream()
                .filter(p -> !p.getId().equals(justBowled.getId()))
                .filter(p -> p.getRole() == PlayerRole.BOWLER || p.getRole() == PlayerRole.ALL_ROUNDER)
                .collect(Collectors.toList());

        if (candidates.isEmpty()) {
            candidates = bowlingTeam.getPlayers().stream()
                    .filter(p -> !p.getId().equals(justBowled.getId()))
                    .collect(Collectors.toList());
        }
        return candidates.get(random.nextInt(candidates.size())).getId();
    }

    private void broadcast(Match match) {
        messaging.convertAndSend("/topic/matches/" + match.getId(), mapper.toDetail(match));
        messaging.convertAndSend("/topic/matches", mapper.toSummaries(matches.findAll()));
    }
}
