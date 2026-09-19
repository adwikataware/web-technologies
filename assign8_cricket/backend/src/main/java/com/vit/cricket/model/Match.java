package com.vit.cricket.model;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/** A whole limited-overs match: two teams, up to two innings, one result. */
public class Match {

    private final String id;
    private final Team teamA;
    private final Team teamB;
    private final String venue;
    private final int oversLimit;
    private final Instant startedAt = Instant.now();

    private final List<Innings> innings = new ArrayList<>();
    private MatchStatus status = MatchStatus.SCHEDULED;
    private String resultSummary;

    public Match(String id, Team teamA, Team teamB, String venue, int oversLimit) {
        this.id = id;
        this.teamA = teamA;
        this.teamB = teamB;
        this.venue = venue;
        this.oversLimit = oversLimit;
    }

    public void startFirstInnings(Team battingFirst, Team bowlingFirst) {
        innings.add(new Innings(battingFirst, bowlingFirst));
        status = MatchStatus.LIVE;
    }

    public Innings currentInnings() {
        return innings.get(innings.size() - 1);
    }

    public boolean isSecondInnings() {
        return innings.size() == 2;
    }

    public void startSecondInnings() {
        Innings first = currentInnings();
        Innings second = new Innings(first.getBowlingTeam(), first.getBattingTeam());
        second.setTarget(first.getTotalRuns());
        innings.add(second);
        status = MatchStatus.LIVE;
    }

    public void markInningsBreak() {
        status = MatchStatus.INNINGS_BREAK;
    }

    public void complete() {
        currentInnings().close();
        status = MatchStatus.COMPLETED;
        resultSummary = buildResultSummary();
    }

    private String buildResultSummary() {
        if (innings.size() < 2) {
            return currentInnings().getBattingTeam().getName() + " won by forfeit";
        }
        Innings first = innings.get(0);
        Innings second = innings.get(1);

        if (second.getTotalRuns() > first.getTotalRuns()) {
            int wicketsInHand = second.getBattingTeam().getPlayers().size() - 1 - second.getWickets();
            return second.getBattingTeam().getName() + " won by " + wicketsInHand
                    + " wicket" + (wicketsInHand == 1 ? "" : "s");
        }
        if (first.getTotalRuns() > second.getTotalRuns()) {
            int margin = first.getTotalRuns() - second.getTotalRuns();
            return first.getBattingTeam().getName() + " won by " + margin
                    + " run" + (margin == 1 ? "" : "s");
        }
        return "Match tied";
    }

    public String getId() { return id; }
    public Team getTeamA() { return teamA; }
    public Team getTeamB() { return teamB; }
    public String getVenue() { return venue; }
    public int getOversLimit() { return oversLimit; }
    public Instant getStartedAt() { return startedAt; }
    public List<Innings> getInnings() { return innings; }
    public MatchStatus getStatus() { return status; }
    public String getResultSummary() { return resultSummary; }

    public Team other(Team team) {
        return team.getId().equals(teamA.getId()) ? teamB : teamA;
    }
}
