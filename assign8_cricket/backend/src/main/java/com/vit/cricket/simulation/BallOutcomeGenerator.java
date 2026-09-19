package com.vit.cricket.simulation;

import java.util.List;
import java.util.Random;

import org.springframework.stereotype.Component;

import com.vit.cricket.model.DismissalType;
import com.vit.cricket.model.ExtraType;

/**
 * Rolls one delivery's outcome. The weights are not lifted from any real
 * dataset - they are chosen so a simulated over looks like cricket (mostly
 * ones and dots, the odd boundary, wickets uncommon) rather than to model a
 * particular format precisely.
 */
@Component
public class BallOutcomeGenerator {

    /** What a rolled delivery amounts to, before it is applied to an innings. */
    public record Outcome(int runsOffBat, ExtraType extraType, int extraRuns, boolean wicket,
                          DismissalType dismissalType) {

        public static Outcome runs(int runs) {
            return new Outcome(runs, ExtraType.NONE, 0, false, DismissalType.NOT_OUT);
        }

        public static Outcome wicket(DismissalType type) {
            return new Outcome(0, ExtraType.NONE, 0, true, type);
        }

        public static Outcome extra(ExtraType type, int runs) {
            return new Outcome(type == ExtraType.NO_BALL ? runs : 0, type,
                    type == ExtraType.BYE || type == ExtraType.LEG_BYE ? runs : 0,
                    false, DismissalType.NOT_OUT);
        }
    }

    private record Weighted<T>(T value, double weight) {
    }

    private final List<Weighted<Outcome>> deliveryOutcomes = List.of(
            new Weighted<>(Outcome.runs(0), 33),
            new Weighted<>(Outcome.runs(1), 23),
            new Weighted<>(Outcome.runs(2), 7),
            new Weighted<>(Outcome.runs(3), 1),
            new Weighted<>(Outcome.runs(4), 11),
            new Weighted<>(Outcome.runs(6), 5),
            new Weighted<>(Outcome.wicket(DismissalType.NOT_OUT), 5),
            new Weighted<>(Outcome.extra(ExtraType.WIDE, 0), 4),
            new Weighted<>(Outcome.extra(ExtraType.NO_BALL, 1), 3),
            new Weighted<>(Outcome.extra(ExtraType.BYE, 1), 4),
            new Weighted<>(Outcome.extra(ExtraType.LEG_BYE, 1), 3)
    );

    private final List<Weighted<DismissalType>> dismissalTypes = List.of(
            new Weighted<>(DismissalType.BOWLED, 30),
            new Weighted<>(DismissalType.CAUGHT, 40),
            new Weighted<>(DismissalType.LBW, 12),
            new Weighted<>(DismissalType.RUN_OUT, 10),
            new Weighted<>(DismissalType.STUMPED, 6),
            new Weighted<>(DismissalType.HIT_WICKET, 2)
    );

    private final Random random = new Random();

    /** Rolls one delivery. A wicket outcome is filled in with a dismissal type. */
    public Outcome next() {
        Outcome picked = pick(deliveryOutcomes);
        if (!picked.wicket()) {
            return picked;
        }
        return Outcome.wicket(pick(dismissalTypes));
    }

    private <T> T pick(List<Weighted<T>> options) {
        double total = options.stream().mapToDouble(Weighted::weight).sum();
        double roll = random.nextDouble() * total;
        double cumulative = 0;
        for (Weighted<T> option : options) {
            cumulative += option.weight();
            if (roll <= cumulative) {
                return option.value();
            }
        }
        return options.get(options.size() - 1).value();
    }
}
