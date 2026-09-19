package com.vit.cricket.model;

import java.util.ArrayList;
import java.util.List;

/**
 * One team's innings: the batting order, who is at the crease, the ball-by-ball
 * feed and the running total. This class owns the rules a delivery has to obey
 * (strike rotation, over completion, extras, what happens on a wicket) so the
 * simulation engine only has to decide *what* a ball does, not how the
 * scoreboard reacts to it.
 */
public class Innings {

    private final Team battingTeam;
    private final Team bowlingTeam;

    /** Index into battingTeam.getPlayers() for each role in the innings. */
    private int strikerIndex = 0;
    private int nonStrikerIndex = 1;
    private int nextBatterIndex = 2;

    private String currentBowlerId;
    private int totalRuns = 0;
    private int wickets = 0;
    private int completedOvers = 0;
    private int ballsInCurrentOver = 0;

    private int wideRuns = 0;
    private int noBallRuns = 0;
    private int byeRuns = 0;
    private int legByeRuns = 0;

    private final List<BallEvent> balls = new ArrayList<>();
    private final List<String> fallOfWickets = new ArrayList<>();

    /** Runs the chasing side needs; null for the first innings of the match. */
    private Integer target;
    private boolean closed = false;

    public Innings(Team battingTeam, Team bowlingTeam) {
        this.battingTeam = battingTeam;
        this.bowlingTeam = bowlingTeam;
        this.currentBowlerId = bowlingTeam.getPlayers().get(0).getId();
    }

    public Player currentStriker() {
        return battingTeam.getPlayers().get(strikerIndex);
    }

    public Player currentNonStriker() {
        return battingTeam.getPlayers().get(nonStrikerIndex);
    }

    public Player currentBowler() {
        return bowlingTeam.player(currentBowlerId);
    }

    public void setBowler(String bowlerId) {
        this.currentBowlerId = bowlerId;
    }

    /**
     * Applies one delivery to the innings and returns the event recorded for it.
     *
     * @param runsOffBat runs the batter struck; 0 for a dot, a wide or a bye
     * @param extraType  what kind of extra this delivery was, or NONE
     * @param extraRuns  the byes/leg-byes run on this ball; ignored unless
     *                   extraType is BYE or LEG_BYE
     * @param wicket     whether the striker was dismissed on this ball
     * @param dismissalType the mode of dismissal, meaningful only if wicket
     */
    public BallEvent recordDelivery(int runsOffBat, ExtraType extraType, int extraRuns,
                                    boolean wicket, DismissalType dismissalType) {
        if (closed) {
            throw new IllegalStateException("Innings is already closed");
        }

        Player striker = currentStriker();
        Player bowler = currentBowler();
        boolean legalDelivery = extraType != ExtraType.WIDE && extraType != ExtraType.NO_BALL;

        int runsThisBall = switch (extraType) {
            case WIDE -> 1;
            case NO_BALL -> 1 + runsOffBat;
            case BYE -> extraRuns;
            case LEG_BYE -> extraRuns;
            case NONE -> runsOffBat;
        };
        totalRuns += runsThisBall;

        switch (extraType) {
            case WIDE -> wideRuns += 1;
            case NO_BALL -> noBallRuns += 1;
            case BYE -> byeRuns += extraRuns;
            case LEG_BYE -> legByeRuns += extraRuns;
            case NONE -> { /* no extra to record */ }
        }

        // The striker only faces a ball, and only gets runs credited, when the
        // delivery was fair; byes and leg byes reach the boundary without the
        // bat, so they add to the team score but not to the batter's tally.
        boolean batterRunsCredited = extraType == ExtraType.NONE || extraType == ExtraType.NO_BALL;
        int batterRuns = batterRunsCredited ? runsOffBat : 0;
        striker.recordBattingBall(batterRuns, legalDelivery);
        bowler.recordBowlingBall(runsThisBall, legalDelivery, extraType);

        int runsForStrikeRotation = extraType == ExtraType.BYE || extraType == ExtraType.LEG_BYE
                ? extraRuns : runsOffBat;

        if (wicket) {
            wickets++;
            striker.recordDismissal(dismissalType, bowler.getName());
            bowler.recordWicket();
            fallOfWickets.add(totalRuns + "-" + wickets + " (" + striker.getName()
                    + ", " + overLabel() + ")");
            if (!isAllOut()) {
                strikerIndex = nextBatterIndex;
                nextBatterIndex++;
            }
        }

        BallEvent event = new BallEvent(completedOvers, legalDelivery ? ballsInCurrentOver + 1 : ballsInCurrentOver,
                bowler.getId(), bowler.getName(), striker.getId(), striker.getName(),
                runsOffBat, extraType, wicket, wicket ? dismissalType : DismissalType.NOT_OUT,
                commentaryFor(runsOffBat, extraType, wicket));
        balls.add(event);

        if (legalDelivery) {
            ballsInCurrentOver++;
            if (ballsInCurrentOver == 6) {
                completedOvers++;
                ballsInCurrentOver = 0;
                if (!wicket && !isAllOut()) {
                    swapStrike();
                }
            } else if (!wicket && runsForStrikeRotation % 2 == 1) {
                swapStrike();
            }
        } else if (!wicket && runsForStrikeRotation % 2 == 1) {
            // An odd-run wide or no-ball still sends the batters running.
            swapStrike();
        }

        return event;
    }

    private void swapStrike() {
        int temp = strikerIndex;
        strikerIndex = nonStrikerIndex;
        nonStrikerIndex = temp;
    }

    private String commentaryFor(int runs, ExtraType extraType, boolean wicket) {
        if (wicket) return "WICKET! " + currentBowler().getName() + " strikes.";
        return switch (extraType) {
            case WIDE -> "Wide ball.";
            case NO_BALL -> "No ball" + (runs > 0 ? ", plus " + runs + " run" + (runs == 1 ? "" : "s") : "") + ".";
            case BYE -> runs + " bye" + (runs == 1 ? "" : "s") + ".";
            case LEG_BYE -> runs + " leg bye" + (runs == 1 ? "" : "s") + ".";
            case NONE -> switch (runs) {
                case 0 -> "Dot ball.";
                case 4 -> "FOUR! Races to the boundary.";
                case 6 -> "SIX! Into the stands.";
                default -> runs + " run" + (runs == 1 ? "" : "s") + ".";
            };
        };
    }

    public boolean isAllOut() {
        return wickets >= battingTeam.getPlayers().size() - 1;
    }

    public boolean isOversComplete(int oversLimit) {
        return completedOvers >= oversLimit;
    }

    public boolean isChasingTargetReached() {
        return target != null && totalRuns > target;
    }

    public boolean isComplete(int oversLimit) {
        return isAllOut() || isOversComplete(oversLimit) || isChasingTargetReached();
    }

    public void close() {
        this.closed = true;
    }

    /** The over-and-ball label for the *next* delivery, e.g. "12.4" */
    public String overLabel() {
        return completedOvers + "." + ballsInCurrentOver;
    }

    public double runRate() {
        double ballsBowled = completedOvers * 6.0 + ballsInCurrentOver;
        return ballsBowled == 0 ? 0.0 : (totalRuns * 6.0) / ballsBowled;
    }

    public void setTarget(int target) {
        this.target = target;
    }

    public Integer runsNeeded() {
        return target == null ? null : Math.max(0, target - totalRuns + 1);
    }

    public Team getBattingTeam() { return battingTeam; }
    public Team getBowlingTeam() { return bowlingTeam; }
    public int getTotalRuns() { return totalRuns; }
    public int getWickets() { return wickets; }
    public int getCompletedOvers() { return completedOvers; }
    public int getBallsInCurrentOver() { return ballsInCurrentOver; }
    public int getWideRuns() { return wideRuns; }
    public int getNoBallRuns() { return noBallRuns; }
    public int getByeRuns() { return byeRuns; }
    public int getLegByeRuns() { return legByeRuns; }
    public int getTotalExtras() { return wideRuns + noBallRuns + byeRuns + legByeRuns; }
    public List<BallEvent> getBalls() { return balls; }
    public List<String> getFallOfWickets() { return fallOfWickets; }
    public Integer getTarget() { return target; }
    public boolean isClosed() { return closed; }
}
