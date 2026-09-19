package com.vit.cricket.model;

/** What kind of extra a delivery was, if any. Byes and leg byes still count as
 *  a legal ball; wides and no-balls do not and are re-bowled. */
public enum ExtraType {
    NONE,
    WIDE,
    NO_BALL,
    BYE,
    LEG_BYE
}
