-- Database setup for the Electricity Bill Calculator.
-- Run this from the phpMyAdmin SQL tab, or: mysql -u root < setup.sql

CREATE DATABASE IF NOT EXISTS electricity_billing
    CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE electricity_billing;

CREATE TABLE IF NOT EXISTS bills (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(100)  NOT NULL,
    address     VARCHAR(255)  NOT NULL,
    units       DECIMAL(10,2) NOT NULL,
    bill_month  DATE          NULL,           -- stored as YYYY-MM-01
    bill_amount DECIMAL(10,2) NOT NULL,
    created_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
);
