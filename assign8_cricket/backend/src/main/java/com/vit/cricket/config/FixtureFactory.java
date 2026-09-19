package com.vit.cricket.config;

import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Component;

import com.vit.cricket.model.Match;
import com.vit.cricket.model.Player;
import com.vit.cricket.model.PlayerRole;
import com.vit.cricket.model.Team;

/**
 * Builds the demo teams and matches. Real player and squad data would come
 * from a feed or a database in a production system; here the point is the
 * scoring engine, so the fixtures are invented but shaped like a real
 * scorecard - a top order, a middle order, a couple of all-rounders and a
 * tail of specialist bowlers.
 */
@Component
public class FixtureFactory {

    private int idCounter = 0;

    private String nextId(String prefix) {
        return prefix + "-" + (++idCounter);
    }

    private Team team(String name, String shortName, String... battingOrderThenBowlers) {
        // The first seven names are top and middle order plus all-rounders; the
        // rest are specialist bowlers, so recordDelivery's batting order and
        // the simulation engine's bowler pool both make sense.
        List<Player> players = new ArrayList<>();
        String[] roles = {
                "BATTER", "BATTER", "BATTER", "ALL_ROUNDER", "WICKET_KEEPER",
                "ALL_ROUNDER", "BOWLER", "BOWLER", "BOWLER", "BOWLER", "BOWLER"
        };
        for (int i = 0; i < battingOrderThenBowlers.length; i++) {
            PlayerRole role = PlayerRole.valueOf(roles[Math.min(i, roles.length - 1)]);
            players.add(new Player(nextId("p"), battingOrderThenBowlers[i], role));
        }
        return new Team(nextId("team"), name, shortName, players);
    }

    public Match mumbaiVsPune(int oversLimit) {
        Team mumbai = team("Mumbai Strikers", "MUM",
                "Aarav Sharma", "Vihaan Iyer", "Kabir Deshmukh", "Rohan Kulkarni",
                "Sai Patil", "Aditya Rao", "Nikhil Joshi", "Rahul Naik",
                "Yash Pawar", "Om Chavan", "Dev Salunkhe");
        Team pune = team("Pune Warriors", "PUN",
                "Arjun Kadam", "Ishaan Bhosale", "Vedant More", "Karan Shinde",
                "Aniket Gaikwad", "Manav Jadhav", "Siddharth Pujari", "Tanmay Kale",
                "Harsh Wagh", "Pratik Thorat", "Suyash Bhagat");
        return new Match(nextId("match"), mumbai, pune, "Wankhede Ground, Pune", oversLimit);
    }

    public Match bangaloreVsChennai(int oversLimit) {
        Team bangalore = team("Bangalore Blazers", "BLR",
                "Varun Reddy", "Nitin Gowda", "Chirag Hegde", "Manoj Shetty",
                "Ganesh Rao", "Pranav Kumar", "Sagar Nair", "Vikram Achar",
                "Deepak Poojary", "Ashwin Bhat", "Kiran Shastri");
        Team chennai = team("Chennai Titans", "CHE",
                "Surya Raman", "Karthik Iyer", "Vignesh Pillai", "Aravind Menon",
                "Bharath Krishnan", "Dinesh Subramaniam", "Mukesh Rajan", "Naveen Balan",
                "Praveen Ganesan", "Ramesh Chandran", "Sathish Murthy");
        return new Match(nextId("match"), bangalore, chennai, "Chepauk Stadium, Chennai", oversLimit);
    }

    public Match delhiVsKolkata(int oversLimit) {
        Team delhi = team("Delhi Dynamos", "DEL",
                "Rajat Malhotra", "Vivaan Chopra", "Aryan Khanna", "Dhruv Mehta",
                "Kunal Bakshi", "Rishi Kapoor", "Uday Sethi", "Amanpreet Singh",
                "Gurpreet Dhillon", "Harpreet Bajwa", "Jaspreet Sandhu");
        Team kolkata = team("Kolkata Knights", "KOL",
                "Sourav Mukherjee", "Abir Chatterjee", "Ritwik Banerjee", "Debashish Ghosh",
                "Subhankar Dey", "Anirban Bose", "Soumyajit Sarkar", "Rajarshi Dutta",
                "Arnab Sengupta", "Koustav Roy", "Indranil Basu");
        return new Match(nextId("match"), delhi, kolkata, "Eden Gardens, Kolkata", oversLimit);
    }
}
