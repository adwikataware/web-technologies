# Assignment 1 — Electricity Bill Calculator

A PHP + MySQL web application that calculates an electricity bill from a meter
reading using slab-based tariffs, stores each bill in a MySQL database, and
presents the data month-wise with a minimalist UI.

## Features

- Slab-based tariff calculation with an itemised breakdown
- Records saved to MySQL using prepared statements (safe from SQL injection)
- **Month-wise organisation** — pick a billing month; browse bills by month via a calendar strip
- Per-month analytics (total bills, total units, average bill, highest bill)
- Clickable history rows that expand to show each bill's slab breakdown
- Animated bill counter, usage gauge, and an energy-tips ticker
- Fully responsive, minimal editorial UI

## Tariff slabs

| Units          | Rate (₹/unit) |
| -------------- | ------------- |
| 0 – 50         | 3.50          |
| 51 – 150       | 4.00          |
| 151 – 250      | 5.20          |
| Above 250      | 6.50          |

## Setup (XAMPP)

1. Copy the `assign1_electricity` folder into `htdocs` (e.g. `D:\xampp\htdocs\`).
2. Start **Apache** and **MySQL** from the XAMPP Control Panel.
3. Create the database by importing [`setup.sql`](setup.sql), or run it from the
   phpMyAdmin **SQL** tab (http://localhost/phpmyadmin).
4. If your MySQL `root` user has a password, set it in [`db.php`](db.php).
5. Open **http://localhost/assign1_electricity/lab.php**.

## Files

- `lab.php` — the application (form, calculation, UI, month navigation)
- `db.php` — MySQL connection (default XAMPP credentials: `root` / empty password)
- `setup.sql` — creates the `electricity_billing` database and `bills` table
