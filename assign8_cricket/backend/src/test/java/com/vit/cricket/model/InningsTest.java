package com.vit.cricket.model;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.ArrayList;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

/**
 * The scoring rules a delivery has to obey: what counts as a legal ball, when
 * the batters cross, and how a wicket moves the next batter in. These are the
 * rules the simulation engine leans on, so a mistake here would show up as a
 * scoreboard that does not add up.
 */
class InningsTest {

    private Team battingTeam;
    private Team bowlingTeam;
    private Innings innings;

    private Team elevenPlayers(String prefix) {
        List<Player> players = new ArrayList<>();
        for (int i = 1; i <= 11; i++) {
            players.add(new Player(prefix + i, prefix + " Player " + i, PlayerRole.BATTER));
        }
        return new Team(prefix, prefix + " Team", prefix.toUpperCase(), players);
    }

    @BeforeEach
    void setUp() {
        battingTeam = elevenPlayers("bat");
        bowlingTeam = elevenPlayers("bowl");
        innings = new Innings(battingTeam, bowlingTeam);
    }

    @Test
    void aDotBallAddsNothingAndDoesNotRotateStrike() {
        Player strikerBefore = innings.currentStriker();

        innings.recordDelivery(0, ExtraType.NONE, 0, false, DismissalType.NOT_OUT);

        assertThat(innings.getTotalRuns()).isZero();
        assertThat(innings.getBallsInCurrentOver()).isEqualTo(1);
        assertThat(innings.currentStriker()).isEqualTo(strikerBefore);
        assertThat(strikerBefore.getBallsFaced()).isEqualTo(1);
    }

    @Test
    void oddRunsRotateStrikeButEvenRunsDoNot() {
        Player strikerBefore = innings.currentStriker();

        innings.recordDelivery(1, ExtraType.NONE, 0, false, DismissalType.NOT_OUT);
        assertThat(innings.currentStriker()).isNotEqualTo(strikerBefore);

        Player strikerNow = innings.currentStriker();
        innings.recordDelivery(2, ExtraType.NONE, 0, false, DismissalType.NOT_OUT);
        assertThat(innings.currentStriker()).isEqualTo(strikerNow);
    }

    @Test
    void aWideAddsOneRunAndIsNotALegalBall() {
        innings.recordDelivery(0, ExtraType.WIDE, 0, false, DismissalType.NOT_OUT);

        assertThat(innings.getTotalRuns()).isEqualTo(1);
        assertThat(innings.getWideRuns()).isEqualTo(1);
        assertThat(innings.getBallsInCurrentOver()).isZero();
        assertThat(innings.currentStriker().getBallsFaced()).isZero();
    }

    @Test
    void aNoBallCreditsTheBatterAndDoesNotCountAsLegal() {
        innings.recordDelivery(4, ExtraType.NO_BALL, 0, false, DismissalType.NOT_OUT);

        // 1 for the no-ball itself, plus the 4 the batter struck.
        assertThat(innings.getTotalRuns()).isEqualTo(5);
        assertThat(innings.getNoBallRuns()).isEqualTo(1);
        assertThat(innings.getBallsInCurrentOver()).isZero();
        assertThat(innings.currentStriker().getRunsScored()).isEqualTo(4);
        assertThat(innings.currentStriker().getFours()).isEqualTo(1);
    }

    @Test
    void byesAddToTheTeamTotalButNotToTheBatter() {
        Player striker = innings.currentStriker();

        innings.recordDelivery(0, ExtraType.BYE, 2, false, DismissalType.NOT_OUT);

        assertThat(innings.getTotalRuns()).isEqualTo(2);
        assertThat(innings.getByeRuns()).isEqualTo(2);
        assertThat(striker.getRunsScored()).isZero();
        assertThat(striker.getBallsFaced()).isEqualTo(1);
    }

    @Test
    void sixLegalBallsCompleteAnOverAndSwapTheStrike() {
        Player strikerBefore = innings.currentStriker();

        for (int i = 0; i < 6; i++) {
            innings.recordDelivery(0, ExtraType.NONE, 0, false, DismissalType.NOT_OUT);
        }

        assertThat(innings.getCompletedOvers()).isEqualTo(1);
        assertThat(innings.getBallsInCurrentOver()).isZero();
        // Six dot balls: nobody ran, so only the automatic end-of-over swap moves it.
        assertThat(innings.currentStriker()).isNotEqualTo(strikerBefore);
    }

    @Test
    void aWicketBringsInTheNextBatterAndDoesNotRotateStrike() {
        Player outBatter = innings.currentStriker();
        Player nonStriker = innings.currentNonStriker();

        innings.recordDelivery(0, ExtraType.NONE, 0, true, DismissalType.BOWLED);

        assertThat(innings.getWickets()).isEqualTo(1);
        assertThat(outBatter.isOut()).isTrue();
        assertThat(outBatter.getDismissalType()).isEqualTo(DismissalType.BOWLED);
        // The incoming batter takes the striker's end; the non-striker is unmoved.
        assertThat(innings.currentStriker().getId()).isEqualTo("bat3");
        assertThat(innings.currentNonStriker()).isEqualTo(nonStriker);
        assertThat(innings.getFallOfWickets()).hasSize(1);
    }

    @Test
    void tenWicketsEndsTheInningsAllOut() {
        for (int i = 0; i < 10; i++) {
            innings.recordDelivery(0, ExtraType.NONE, 0, true, DismissalType.BOWLED);
        }

        assertThat(innings.getWickets()).isEqualTo(10);
        assertThat(innings.isAllOut()).isTrue();
        assertThat(innings.isComplete(20)).isTrue();
    }

    @Test
    void chasingTeamPassesTheTargetAsSoonAsTotalExceedsIt() {
        innings.setTarget(5);
        assertThat(innings.isChasingTargetReached()).isFalse();

        innings.recordDelivery(6, ExtraType.NONE, 0, false, DismissalType.NOT_OUT);

        assertThat(innings.getTotalRuns()).isEqualTo(6);
        assertThat(innings.isChasingTargetReached()).isTrue();
        assertThat(innings.runsNeeded()).isZero();
    }
}
