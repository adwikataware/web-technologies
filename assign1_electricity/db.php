<?php
// Database connection for the Electricity Billing app.
// Default XAMPP credentials: user "root" with an empty password.
$host = "localhost";
$user = "root";
$pass = "";
$dbname = "electricity_billing";

$conn = new mysqli($host, $user, $pass, $dbname);

if ($conn->connect_error) {
    die("Database connection failed: " . $conn->connect_error);
}
$conn->set_charset("utf8mb4");
?>
