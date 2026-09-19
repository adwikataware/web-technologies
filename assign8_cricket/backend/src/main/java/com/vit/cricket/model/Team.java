package com.vit.cricket.model;

import java.util.List;

public class Team {

    private final String id;
    private final String name;
    private final String shortName;
    private final List<Player> players;

    public Team(String id, String name, String shortName, List<Player> players) {
        this.id = id;
        this.name = name;
        this.shortName = shortName;
        this.players = players;
    }

    public Player player(String playerId) {
        return players.stream()
                .filter(p -> p.getId().equals(playerId))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException(
                        "No player " + playerId + " in " + name));
    }

    public String getId() { return id; }
    public String getName() { return name; }
    public String getShortName() { return shortName; }
    public List<Player> getPlayers() { return players; }
}
