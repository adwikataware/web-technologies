package com.vit.cricket.model;

/**
 * One player on one team's sheet. Batting and bowling figures live directly on
 * the player rather than in a side table, because a scorecard is always read
 * as "this player's numbers for this match" and never joined against anything
 * else.
 */
public class Player {

    private final String id;
    private final String name;
    private final PlayerRole role;

    // Batting figures, accumulated ball by ball.
    private int runsScored;
    private int ballsFaced;
    private int fours;
    private int sixes;
    private boolean out;
    private DismissalType dismissalType = DismissalType.NOT_OUT;
    private String dismissedBy;

    // Bowling figures.
    private int legalBallsBowled;
    private int runsConceded;
    private int wicketsTaken;
    private int wides;
    private int noBalls;

    public Player(String id, String name, PlayerRole role) {
        this.id = id;
        this.name = name;
        this.role = role;
    }

    public double battingStrikeRate() {
        return ballsFaced == 0 ? 0.0 : (runsScored * 100.0) / ballsFaced;
    }

    /** Whole overs plus the leftover balls, printed the way scorecards do: 4.2 */
    public String oversBowled() {
        return (legalBallsBowled / 6) + "." + (legalBallsBowled % 6);
    }

    public double economyRate() {
        return legalBallsBowled == 0 ? 0.0 : (runsConceded * 6.0) / legalBallsBowled;
    }

    void recordBattingBall(int runsOffBat, boolean legalDelivery) {
        if (legalDelivery) {
            ballsFaced++;
        }
        runsScored += runsOffBat;
        if (runsOffBat == 4) fours++;
        if (runsOffBat == 6) sixes++;
    }

    void recordDismissal(DismissalType type, String bowlerName) {
        this.out = true;
        this.dismissalType = type;
        this.dismissedBy = bowlerName;
    }

    void recordBowlingBall(int runsConcededOffBall, boolean legalDelivery, ExtraType extra) {
        if (legalDelivery) legalBallsBowled++;
        runsConceded += runsConcededOffBall;
        if (extra == ExtraType.WIDE) wides++;
        if (extra == ExtraType.NO_BALL) noBalls++;
    }

    void recordWicket() {
        wicketsTaken++;
    }

    public String getId() { return id; }
    public String getName() { return name; }
    public PlayerRole getRole() { return role; }
    public int getRunsScored() { return runsScored; }
    public int getBallsFaced() { return ballsFaced; }
    public int getFours() { return fours; }
    public int getSixes() { return sixes; }
    public boolean isOut() { return out; }
    public DismissalType getDismissalType() { return dismissalType; }
    public String getDismissedBy() { return dismissedBy; }
    public int getLegalBallsBowled() { return legalBallsBowled; }
    public int getRunsConceded() { return runsConceded; }
    public int getWicketsTaken() { return wicketsTaken; }
    public int getWides() { return wides; }
    public int getNoBalls() { return noBalls; }
}
