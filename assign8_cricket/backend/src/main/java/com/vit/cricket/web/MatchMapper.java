package com.vit.cricket.web;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

import org.springframework.stereotype.Component;

import com.vit.cricket.model.BallEvent;
import com.vit.cricket.model.Innings;
import com.vit.cricket.model.Match;
import com.vit.cricket.model.MatchStatus;
import com.vit.cricket.model.Player;
import com.vit.cricket.model.Team;
import com.vit.cricket.web.Dtos.BallCard;
import com.vit.cricket.web.Dtos.InningsCard;
import com.vit.cricket.web.Dtos.MatchDetail;
import com.vit.cricket.web.Dtos.MatchSummary;
import com.vit.cricket.web.Dtos.PlayerCard;
import com.vit.cricket.web.Dtos.TeamRef;

/** Turns the domain model into the read-only shapes the dashboard consumes. */
@Component
public class MatchMapper {

    private static final int RECENT_BALLS = 12;

    public MatchDetail toDetail(Match match) {
        List<Innings> allInnings = match.getInnings();
        List<InningsCard> cards = new ArrayList<>();
        for (int i = 0; i < allInnings.size(); i++) {
            // Only the match's final innings can still have someone "at the
            // crease" - an earlier, superseded innings is frozen exactly as it
            // stood when the next one began, striker included.
            boolean isLiveInnings = i == allInnings.size() - 1 && match.getStatus() == MatchStatus.LIVE;
            cards.add(toInningsCard(allInnings.get(i), isLiveInnings));
        }
        return new MatchDetail(match.getId(), ref(match.getTeamA()), ref(match.getTeamB()),
                match.getVenue(), match.getOversLimit(), match.getStatus(),
                match.getResultSummary(), cards);
    }

    public List<MatchSummary> toSummaries(Collection<Match> allMatches) {
        return allMatches.stream().map(this::toSummary).toList();
    }

    private MatchSummary toSummary(Match match) {
        String scoreLine = match.getInnings().isEmpty() ? null : scoreLine(match.currentInnings());
        return new MatchSummary(match.getId(), ref(match.getTeamA()), ref(match.getTeamB()),
                match.getVenue(), match.getOversLimit(), match.getStatus(), scoreLine,
                match.getResultSummary());
    }

    private String scoreLine(Innings innings) {
        return innings.getBattingTeam().getShortName() + " " + innings.getTotalRuns() + "/"
                + innings.getWickets() + " (" + innings.overLabel() + " ov)";
    }

    private InningsCard toInningsCard(Innings innings, boolean isLiveInnings) {
        boolean stillBatting = isLiveInnings && !innings.isAllOut();

        List<BallCard> recent = innings.getBalls().stream()
                .skip(Math.max(0, innings.getBalls().size() - RECENT_BALLS))
                .map(this::toBallCard)
                .toList();

        List<PlayerCard> battingCard = innings.getBattingTeam().getPlayers().stream()
                .map(p -> toPlayerCard(p, stillBatting && isOnStrike(innings, p)))
                .toList();
        List<PlayerCard> bowlingCard = innings.getBowlingTeam().getPlayers().stream()
                .filter(p -> p.getLegalBallsBowled() > 0 || p.getId().equals(innings.currentBowler().getId()))
                .map(p -> toPlayerCard(p, false))
                .toList();

        PlayerCard striker = stillBatting ? toPlayerCard(innings.currentStriker(), true) : null;
        PlayerCard nonStriker = stillBatting ? toPlayerCard(innings.currentNonStriker(), false) : null;
        PlayerCard bowler = stillBatting ? toPlayerCard(innings.currentBowler(), false) : null;

        return new InningsCard(ref(innings.getBattingTeam()), ref(innings.getBowlingTeam()),
                innings.getTotalRuns(), innings.getWickets(), innings.overLabel(), innings.runRate(),
                innings.getTarget(), innings.runsNeeded(), innings.getWideRuns(), innings.getNoBallRuns(),
                innings.getByeRuns(), innings.getLegByeRuns(), striker, nonStriker, bowler,
                recent, innings.getFallOfWickets(), battingCard, bowlingCard);
    }

    private boolean isOnStrike(Innings innings, Player player) {
        return innings.currentStriker().getId().equals(player.getId());
    }

    private BallCard toBallCard(BallEvent event) {
        return new BallCard(event.overLabel(), event.shortLabel(), event.getRuns(),
                event.getExtraType(), event.isWicket(), event.getCommentary());
    }

    private PlayerCard toPlayerCard(Player player, boolean onStrike) {
        return new PlayerCard(player.getId(), player.getName(), player.getRole(), onStrike,
                player.getRunsScored(), player.getBallsFaced(), player.getFours(), player.getSixes(),
                round(player.battingStrikeRate()), player.isOut(), player.getDismissalType(),
                player.getDismissedBy(), player.oversBowled(), player.getRunsConceded(),
                player.getWicketsTaken(), round(player.economyRate()));
    }

    private TeamRef ref(Team team) {
        return new TeamRef(team.getId(), team.getName(), team.getShortName());
    }

    private double round(double value) {
        return Math.round(value * 100) / 100.0;
    }
}
