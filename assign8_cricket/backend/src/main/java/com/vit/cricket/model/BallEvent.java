package com.vit.cricket.model;

import java.time.Instant;

/** A single delivery, kept so the dashboard can show a ball-by-ball feed. */
public class BallEvent {

    private final int over;
    private final int ballInOver;
    private final String bowlerId;
    private final String bowlerName;
    private final String batterId;
    private final String batterName;
    private final int runs;
    private final ExtraType extraType;
    private final boolean wicket;
    private final DismissalType dismissalType;
    private final String commentary;
    private final Instant timestamp;

    public BallEvent(int over, int ballInOver, String bowlerId, String bowlerName,
                      String batterId, String batterName, int runs, ExtraType extraType,
                      boolean wicket, DismissalType dismissalType, String commentary) {
        this.over = over;
        this.ballInOver = ballInOver;
        this.bowlerId = bowlerId;
        this.bowlerName = bowlerName;
        this.batterId = batterId;
        this.batterName = batterName;
        this.runs = runs;
        this.extraType = extraType;
        this.wicket = wicket;
        this.dismissalType = dismissalType;
        this.commentary = commentary;
        this.timestamp = Instant.now();
    }

    /** The label a scorecard prints for this ball, e.g. "12.4" */
    public String overLabel() {
        return over + "." + ballInOver;
    }

    /** What goes in the little ball-by-ball ticker: "4", "W", "1", "wd" ... */
    public String shortLabel() {
        if (wicket) return "W";
        if (extraType == ExtraType.WIDE) return "wd";
        if (extraType == ExtraType.NO_BALL) return "nb";
        return String.valueOf(runs);
    }

    public int getOver() { return over; }
    public int getBallInOver() { return ballInOver; }
    public String getBowlerId() { return bowlerId; }
    public String getBowlerName() { return bowlerName; }
    public String getBatterId() { return batterId; }
    public String getBatterName() { return batterName; }
    public int getRuns() { return runs; }
    public ExtraType getExtraType() { return extraType; }
    public boolean isWicket() { return wicket; }
    public DismissalType getDismissalType() { return dismissalType; }
    public String getCommentary() { return commentary; }
    public Instant getTimestamp() { return timestamp; }
}
