package com.vit.cricket.web;

import java.util.List;

import com.vit.cricket.model.DismissalType;
import com.vit.cricket.model.ExtraType;
import com.vit.cricket.model.MatchStatus;
import com.vit.cricket.model.PlayerRole;

/**
 * What crosses the wire, both over REST and over the WebSocket topics - the
 * two carry the same shapes so the dashboard's rendering code does not care
 * which one delivered a given update.
 */
public final class Dtos {

    private Dtos() {
    }

    public record TeamRef(String id, String name, String shortName) {
    }

    /** One row in the match list: enough to render a card without the full scorecard. */
    public record MatchSummary(String id, TeamRef teamA, TeamRef teamB, String venue, int oversLimit,
                        MatchStatus status, String scoreLine, String resultSummary) {
    }

    public record PlayerCard(String id, String name, PlayerRole role, boolean onStrike,
                      int runsScored, int ballsFaced, int fours, int sixes, double strikeRate,
                      boolean out, DismissalType dismissalType, String dismissedBy,
                      String oversBowled, int runsConceded, int wicketsTaken, double economyRate) {
    }

    public record BallCard(String overLabel, String shortLabel, int runs, ExtraType extraType,
                    boolean wicket, String commentary) {
    }

    public record InningsCard(TeamRef battingTeam, TeamRef bowlingTeam, int totalRuns, int wickets,
                       String oversLabel, double runRate, Integer target, Integer runsNeeded,
                       int wideRuns, int noBallRuns, int byeRuns, int legByeRuns,
                       PlayerCard striker, PlayerCard nonStriker, PlayerCard currentBowler,
                       List<BallCard> recentBalls, List<String> fallOfWickets,
                       List<PlayerCard> battingCard, List<PlayerCard> bowlingCard) {
    }

    /** The full picture for one match, everything the live dashboard renders. */
    public record MatchDetail(String id, TeamRef teamA, TeamRef teamB, String venue, int oversLimit,
                       MatchStatus status, String resultSummary, List<InningsCard> innings) {
    }
}
