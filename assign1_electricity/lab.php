<?php
require "db.php";

$result = null;
$errors = [];

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $name    = trim($_POST['name'] ?? '');
    $address = trim($_POST['address'] ?? '');
    $units   = $_POST['units'] ?? '';
    $month   = trim($_POST['month'] ?? '');   // HTML month input gives "YYYY-MM"

    // Basic server-side validation.
    if ($name === '')    $errors[] = "Please enter a name.";
    if ($address === '') $errors[] = "Please enter an address.";
    if (!is_numeric($units) || floatval($units) < 0) {
        $errors[] = "Please enter a valid number of units.";
    }
    if (!preg_match('/^\d{4}-\d{2}$/', $month)) {
        $errors[] = "Please pick a billing month.";
    }

    if (!$errors) {
        $units = floatval($units);

        // Slab-based tariff calculation.
        $slabs = [];
        if ($units <= 50) {
            $slabs[] = ["0 - 50 units", $units, 3.5];
        } elseif ($units <= 150) {
            $slabs[] = ["0 - 50 units", 50, 3.5];
            $slabs[] = ["51 - 150 units", $units - 50, 4];
        } elseif ($units <= 250) {
            $slabs[] = ["0 - 50 units", 50, 3.5];
            $slabs[] = ["51 - 150 units", 100, 4];
            $slabs[] = ["151 - 250 units", $units - 150, 5.2];
        } else {
            $slabs[] = ["0 - 50 units", 50, 3.5];
            $slabs[] = ["51 - 150 units", 100, 4];
            $slabs[] = ["151 - 250 units", 100, 5.2];
            $slabs[] = ["Above 250 units", $units - 250, 6.5];
        }

        $bill = 0;
        foreach ($slabs as $s) {
            $bill += $s[1] * $s[2];
        }

        // Normalise the chosen month to the first day of that month (YYYY-MM-01).
        $billMonth = $month . "-01";

        // Save the record using a prepared statement (prevents SQL injection).
        $stmt = $conn->prepare(
            "INSERT INTO bills (name, address, units, bill_month, bill_amount) VALUES (?, ?, ?, ?, ?)"
        );
        $stmt->bind_param("ssdsd", $name, $address, $units, $billMonth, $bill);
        $stmt->execute();
        $stmt->close();

        $result = [
            "name"    => $name,
            "address" => $address,
            "units"   => $units,
            "bill"    => $bill,
            "slabs"   => $slabs,
            "month"   => $billMonth,
        ];
    }
}

// ---- Month navigation ------------------------------------------------------
// Build the list of months that actually have bills (for the calendar strip).
$monthsList = [];
$mres = $conn->query("
    SELECT DATE_FORMAT(bill_month, '%Y-%m') AS ym, COUNT(*) AS cnt
    FROM bills WHERE bill_month IS NOT NULL
    GROUP BY ym ORDER BY ym DESC
");
while ($mres && $m = $mres->fetch_assoc()) {
    $monthsList[$m['ym']] = (int) $m['cnt'];
}

// Which month is selected? Priority: ?month=YYYY-MM  >  just-saved bill  >  newest month.
$selectedMonth = $_GET['month'] ?? ($result['month'] ?? null);
if ($selectedMonth) $selectedMonth = substr($selectedMonth, 0, 7);        // normalise to YYYY-MM
if (!$selectedMonth || !preg_match('/^\d{4}-\d{2}$/', $selectedMonth)) {
    $selectedMonth = $monthsList ? array_key_first($monthsList) : date('Y-m');
}
$selectedMonthStart = $selectedMonth . "-01";
$selectedMonthLabel = date('F Y', strtotime($selectedMonthStart));

// Fetch bills for the SELECTED month (clickable history panel).
$history = $conn->prepare("
    SELECT name, address, units, bill_amount, created_at
    FROM bills WHERE bill_month = ? ORDER BY id DESC
");
$history->bind_param("s", $selectedMonthStart);
$history->execute();
$history = $history->get_result();

// Aggregate stats for the SELECTED month.
$sstmt = $conn->prepare("
    SELECT
        COUNT(*)                       AS total_bills,
        COALESCE(SUM(units), 0)        AS total_units,
        COALESCE(AVG(bill_amount), 0)  AS avg_bill,
        COALESCE(MAX(bill_amount), 0)  AS max_bill,
        COALESCE(SUM(bill_amount), 0)  AS total_revenue
    FROM bills WHERE bill_month = ?
");
$sstmt->bind_param("s", $selectedMonthStart);
$sstmt->execute();
$stats = $sstmt->get_result()->fetch_assoc();

// Recompute a bill's slab breakdown on demand (used for expandable rows).
function slabBreakdown($units) {
    $units = (float) $units;
    $slabs = [];
    if ($units <= 50) {
        $slabs[] = ["0 - 50 units", $units, 3.5];
    } elseif ($units <= 150) {
        $slabs[] = ["0 - 50 units", 50, 3.5];
        $slabs[] = ["51 - 150 units", $units - 50, 4];
    } elseif ($units <= 250) {
        $slabs[] = ["0 - 50 units", 50, 3.5];
        $slabs[] = ["51 - 150 units", 100, 4];
        $slabs[] = ["151 - 250 units", $units - 150, 5.2];
    } else {
        $slabs[] = ["0 - 50 units", 50, 3.5];
        $slabs[] = ["51 - 150 units", 100, 4];
        $slabs[] = ["151 - 250 units", 100, 5.2];
        $slabs[] = ["Above 250 units", $units - 250, 6.5];
    }
    return $slabs;
}

// A small helper: total units + a friendly usage tier for the gauge.
$usageTier = "";
if ($result) {
    $u = $result['units'];
    if     ($u <= 50)  $usageTier = "Low usage";
    elseif ($u <= 150) $usageTier = "Moderate usage";
    elseif ($u <= 250) $usageTier = "High usage";
    else               $usageTier = "Very high usage";
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Voltix · Electricity Bill Calculator</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <style>
        /* ============================================================
           Minimal editorial UI — paper background, ink type,
           one restrained amber accent, hairline borders, no gradients.
           ============================================================ */
        :root {
            --paper: #f6f5f1;
            --card:  #fffefb;
            --ink:   #17150f;
            --muted: #6c675c;
            --faint: #a09a8c;
            --line:  #e4e0d6;
            --line-strong: #d3cec1;
            --accent: #c8781e;      /* single warm amber */
            --accent-ink: #a25f12;
            --ok: #3f7d4f;
            --danger: #b23b3b;
            --r: 4px;
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; -webkit-text-size-adjust: 100%; }

        body {
            min-height: 100vh;
            font-family: "Inter", ui-sans-serif, "Segoe UI", system-ui, -apple-system, sans-serif;
            color: var(--ink);
            background: var(--paper);
            line-height: 1.55;
            padding: 48px 20px;
            display: flex;
            justify-content: center;
            -webkit-font-smoothing: antialiased;
        }

        ::selection { background: var(--accent); color: #fff; }

        .shell {
            width: 100%;
            max-width: 780px;
        }

        /* ---- Masthead ---------------------------------------------------- */
        .masthead {
            display: flex; align-items: baseline; justify-content: space-between;
            padding-bottom: 18px; margin-bottom: 40px;
            border-bottom: 1px solid var(--line-strong);
        }
        .brandmark {
            font-size: 0.95rem; font-weight: 600; letter-spacing: -0.01em;
            display: inline-flex; align-items: center; gap: 9px;
        }
        .brandmark .dot {
            width: 8px; height: 8px; border-radius: 50%;
            background: var(--accent);
            box-shadow: 0 0 0 3px rgba(200,120,30,0.16);
        }
        .masthead .tag { font-size: 0.78rem; color: var(--faint); letter-spacing: 0.02em; }

        /* ---- Hero -------------------------------------------------------- */
        .hero { margin-bottom: 38px; }
        .hero h1 {
            font-size: clamp(1.9rem, 4vw, 2.6rem);
            font-weight: 700; letter-spacing: -0.035em; line-height: 1.08;
        }
        .hero h1 em { font-style: normal; color: var(--accent-ink); }
        .hero p { color: var(--muted); font-size: 1rem; margin-top: 12px; max-width: 52ch; }

        /* ---- Cards ------------------------------------------------------- */
        .card {
            background: var(--card);
            border: 1px solid var(--line);
            border-radius: var(--r);
            padding: 30px;
        }
        .card + .card { margin-top: 20px; }

        .label-row {
            font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.13em;
            color: var(--faint); font-weight: 600; margin-bottom: 20px;
        }

        /* ---- Form -------------------------------------------------------- */
        .errors {
            border-left: 2px solid var(--danger);
            color: var(--danger); background: #fbf2f0;
            padding: 12px 14px; margin-bottom: 22px; font-size: 0.87rem;
            border-radius: 0 var(--r) var(--r) 0;
        }
        .errors ul { padding-left: 16px; }

        .field { margin-bottom: 22px; }
        .field label {
            display: block; font-size: 0.78rem; font-weight: 600;
            letter-spacing: 0.02em; color: var(--muted); margin-bottom: 8px;
        }
        .field input {
            width: 100%; padding: 11px 2px;
            border: none; border-bottom: 1px solid var(--line-strong);
            background: transparent; color: var(--ink);
            font-size: 1.05rem; font-family: inherit;
            transition: border-color .2s;
        }
        .field input::placeholder { color: var(--faint); }
        .field input:focus {
            outline: none; border-bottom-color: var(--accent);
        }
        .field input:focus::placeholder { color: transparent; }
        .field input[type="month"] { color: var(--ink); }

        /* two fields side by side (units + month) */
        .field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .field-row .field { margin-bottom: 22px; }

        /* ---- Month navigator (calendar strip) ---------------------------- */
        .monthnav {
            display: flex; align-items: stretch; gap: 8px; margin-bottom: 22px;
        }
        .mn-arrow {
            flex: 0 0 auto; width: 34px; display: grid; place-items: center;
            text-decoration: none; color: var(--muted); font-size: 1.2rem;
            border: 1px solid var(--line-strong); border-radius: var(--r);
            transition: background .14s, color .14s, border-color .14s;
        }
        .mn-arrow:hover { background: var(--ink); color: var(--paper); border-color: var(--ink); }
        .mn-scroll {
            flex: 1 1 auto; display: flex; gap: 8px; overflow-x: auto;
            padding-bottom: 2px; scrollbar-width: thin;
        }
        .mn-chip {
            flex: 0 0 auto; text-decoration: none;
            padding: 8px 14px; border-radius: var(--r);
            border: 1px solid var(--line-strong); background: var(--card);
            display: flex; flex-direction: column; gap: 2px; min-width: 78px;
            transition: border-color .14s, background .14s, transform .12s;
        }
        .mn-chip:hover { border-color: var(--accent); transform: translateY(-1px); }
        .mn-chip .mn-m { font-size: 0.86rem; font-weight: 600; color: var(--ink); letter-spacing: -0.01em; }
        .mn-chip .mn-c { font-size: 0.68rem; color: var(--faint); }
        .mn-chip.active {
            background: var(--ink); border-color: var(--ink);
        }
        .mn-chip.active .mn-m { color: var(--paper); }
        .mn-chip.active .mn-c { color: rgba(255,255,255,0.65); }
        .mn-empty { color: var(--faint); font-size: 0.85rem; align-self: center; }

        .btn {
            appearance: none; border: 1px solid var(--ink);
            background: var(--ink); color: var(--paper);
            font-family: inherit; font-size: 0.92rem; font-weight: 600; letter-spacing: 0.01em;
            padding: 12px 22px; border-radius: var(--r); cursor: pointer;
            display: inline-flex; align-items: center; gap: 8px;
            transition: background .18s, color .18s, transform .12s, box-shadow .18s;
        }
        .btn .arrow { transition: transform .2s; }
        .btn:hover {
            background: var(--accent); border-color: var(--accent); color: #fff;
            box-shadow: 0 6px 18px -8px rgba(200,120,30,0.7);
        }
        .btn:hover .arrow { transform: translateX(4px); }
        .btn:active { transform: translateY(1px); }

        /* ---- Result ------------------------------------------------------ */
        .result {
            margin-top: 26px; padding-top: 26px;
            border-top: 1px dashed var(--line-strong);
            animation: fade 0.5s ease both;
        }
        @keyframes fade { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }

        .result .top { display: flex; justify-content: space-between; align-items: flex-end; gap: 16px; flex-wrap: wrap; }
        .result .who b { display: block; font-size: 1.02rem; }
        .result .who span { color: var(--muted); font-size: 0.86rem; }
        .amount {
            font-size: 2.5rem; font-weight: 700; letter-spacing: -0.04em;
            font-variant-numeric: tabular-nums; line-height: 1;
        }
        .amount small { font-size: 0.9rem; color: var(--faint); font-weight: 500; letter-spacing: 0; }

        .gauge { margin: 22px 0 20px; }
        .gauge .bar { height: 4px; border-radius: 99px; background: var(--line); overflow: hidden; }
        .gauge .fill { height: 100%; width: 0; background: var(--accent); border-radius: 99px; transition: width 1s cubic-bezier(.2,.75,.2,1); }
        .gauge .labels { display: flex; justify-content: space-between; font-size: 0.7rem; color: var(--faint); margin-top: 7px; }
        .tier-chip {
            display: inline-block; font-size: 0.72rem; font-weight: 600; letter-spacing: 0.03em;
            padding: 3px 9px; border-radius: 99px; margin-top: 12px;
            border: 1px solid var(--line-strong); color: var(--muted);
        }

        /* ---- Tables ------------------------------------------------------ */
        table { width: 100%; border-collapse: collapse; font-size: 0.87rem; }
        thead th {
            font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.1em;
            color: var(--faint); font-weight: 600; text-align: left;
            padding: 8px 6px; border-bottom: 1px solid var(--line-strong);
        }
        tbody td { padding: 10px 6px; border-bottom: 1px solid var(--line); }
        td.num, th.num { text-align: right; font-variant-numeric: tabular-nums; }
        .result > table { margin-top: 8px; }

        /* ---- Ticker (quiet, monochrome) ---------------------------------- */
        .ticker {
            margin-top: 20px; border-top: 1px solid var(--line); border-bottom: 1px solid var(--line);
            overflow: hidden; position: relative;
            -webkit-mask-image: linear-gradient(90deg, transparent, #000 6%, #000 94%, transparent);
            mask-image: linear-gradient(90deg, transparent, #000 6%, #000 94%, transparent);
        }
        .ticker .track {
            display: inline-flex; white-space: nowrap; gap: 46px;
            padding: 11px 0; font-size: 0.8rem; color: var(--muted);
            animation: scroll 30s linear infinite;
        }
        .ticker:hover .track { animation-play-state: paused; }
        .ticker .track b { color: var(--accent-ink); font-weight: 600; }
        @keyframes scroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }

        /* ---- Stats ------------------------------------------------------- */
        .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1px; background: var(--line); border: 1px solid var(--line); border-radius: var(--r); overflow: hidden; }
        .stat { background: var(--card); padding: 16px 14px; transition: background .16s; }
        .stat:hover { background: #fbf8f1; }
        .stat .k { font-size: 0.66rem; text-transform: uppercase; letter-spacing: 0.09em; color: var(--faint); font-weight: 600; }
        .stat .v { font-size: 1.35rem; font-weight: 700; letter-spacing: -0.02em; margin-top: 6px; font-variant-numeric: tabular-nums; }

        /* ---- History (clickable rows) ------------------------------------ */
        .history { margin-top: 4px; }
        .history .hint { text-transform: none; letter-spacing: 0; color: var(--faint); font-weight: 400; }
        .history tbody tr.main { cursor: pointer; transition: background .14s; }
        .history tbody tr.main td { transition: color .14s; }
        .history tbody tr.main:hover td { color: var(--accent-ink); }
        .history tbody tr.main td:first-child::before {
            content: "+"; color: var(--faint); font-weight: 600;
            display: inline-block; width: 14px; transition: transform .18s, color .18s;
        }
        .history tbody tr.main.open td:first-child::before { content: "\2212"; color: var(--accent); }
        .history tr.detail { display: none; }
        .history tr.detail.show { display: table-row; }
        .history tr.detail > td { padding: 0 6px 14px; border-bottom: 1px solid var(--line); }
        .detail-box {
            background: var(--paper); border: 1px solid var(--line);
            border-radius: var(--r); padding: 14px 16px;
            animation: fade 0.3s ease both;
        }
        .detail-box .addr { color: var(--muted); font-size: 0.82rem; margin-bottom: 10px; }
        .detail-box thead th { border-bottom-color: var(--line); }
        .detail-box tbody td { border-bottom-color: var(--line); }
        .history-empty { color: var(--faint); font-size: 0.88rem; }

        /* ---- Footer ------------------------------------------------------ */
        .foot { margin-top: 34px; text-align: center; font-size: 0.76rem; color: var(--faint); }

        /* ---- Responsive -------------------------------------------------- */
        @media (max-width: 560px) {
            body { padding: 30px 16px; }
            .card { padding: 22px; }
            .stats { grid-template-columns: repeat(2, 1fr); }
            .amount { font-size: 2rem; }
            .field-row { grid-template-columns: 1fr; gap: 0; }
        }

        @media (prefers-reduced-motion: reduce) {
            *, *::before, *::after { animation: none !important; transition: none !important; }
        }
    </style>
</head>
<body>
    <main class="shell">
        <header class="masthead">
            <div class="brandmark"><span class="dot"></span> Voltix</div>
            <div class="tag">Electricity billing</div>
        </header>

        <div class="hero">
            <h1>Know your bill <em>before</em> it arrives.</h1>
            <p>A transparent, slab-wise estimate from a single meter reading — see exactly where every rupee goes.</p>
        </div>

        <!-- Form -->
        <section class="card">
            <div class="label-row">Meter details</div>

            <?php if ($errors): ?>
                <div class="errors">
                    <ul>
                        <?php foreach ($errors as $e): ?>
                            <li><?= htmlspecialchars($e) ?></li>
                        <?php endforeach; ?>
                    </ul>
                </div>
            <?php endif; ?>

            <form method="post" action="">
                <div class="field">
                    <label for="name">Full name</label>
                    <input type="text" id="name" name="name" placeholder="e.g. Adwika Taware" required
                           value="<?= htmlspecialchars($_POST['name'] ?? '') ?>">
                </div>
                <div class="field">
                    <label for="address">Address</label>
                    <input type="text" id="address" name="address" placeholder="e.g. Pune, Maharashtra" required
                           value="<?= htmlspecialchars($_POST['address'] ?? '') ?>">
                </div>
                <div class="field-row">
                    <div class="field">
                        <label for="units">Units consumed (kWh)</label>
                        <input type="number" id="units" name="units" step="any" min="0" placeholder="e.g. 180" required
                               value="<?= htmlspecialchars($_POST['units'] ?? '') ?>">
                    </div>
                    <div class="field">
                        <label for="month">Billing month</label>
                        <input type="month" id="month" name="month" required
                               value="<?= htmlspecialchars($_POST['month'] ?? date('Y-m')) ?>">
                    </div>
                </div>
                <button type="submit" class="btn">Calculate bill <span class="arrow">→</span></button>
            </form>

            <?php if ($result): ?>
            <div class="result">
                <div class="top">
                    <div class="who">
                        <b><?= htmlspecialchars($result['name']) ?></b>
                        <span><?= htmlspecialchars($result['address']) ?> · <?= $result['units'] ?> kWh · <?= date('F Y', strtotime($result['month'])) ?></span>
                    </div>
                    <div class="amount" id="amount" data-value="<?= $result['bill'] ?>">₹0.00</div>
                </div>

                <div class="gauge">
                    <div class="bar"><div class="fill" id="gaugeFill"></div></div>
                    <div class="labels"><span>0</span><span>150</span><span>300+ kWh</span></div>
                    <span class="tier-chip"><?= htmlspecialchars($usageTier) ?></span>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th>Slab</th>
                            <th class="num">Units</th>
                            <th class="num">Rate</th>
                            <th class="num">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($result['slabs'] as $s): ?>
                            <tr>
                                <td><?= htmlspecialchars($s[0]) ?></td>
                                <td class="num"><?= number_format($s[1], 2) ?></td>
                                <td class="num">₹<?= number_format($s[2], 2) ?></td>
                                <td class="num">₹<?= number_format($s[1] * $s[2], 2) ?></td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
            <?php endif; ?>
        </section>

        <!-- Analytics + ticker -->
        <section class="card">
            <div class="label-row">Overview · <span class="hint"><?= htmlspecialchars($selectedMonthLabel) ?></span></div>

            <!-- Month navigator (calendar strip) -->
            <?php
                // Previous / next month for the arrow controls.
                $prevMonth = date('Y-m', strtotime($selectedMonthStart . ' -1 month'));
                $nextMonth = date('Y-m', strtotime($selectedMonthStart . ' +1 month'));
            ?>
            <div class="monthnav">
                <a class="mn-arrow" href="?month=<?= $prevMonth ?>" title="Previous month" aria-label="Previous month">‹</a>
                <div class="mn-scroll">
                    <?php if ($monthsList): foreach ($monthsList as $ym => $cnt):
                        $active = ($ym === $selectedMonth);
                        $lbl = date('M Y', strtotime($ym . '-01')); ?>
                        <a class="mn-chip<?= $active ? ' active' : '' ?>" href="?month=<?= $ym ?>">
                            <span class="mn-m"><?= $lbl ?></span>
                            <span class="mn-c"><?= $cnt ?> bill<?= $cnt == 1 ? '' : 's' ?></span>
                        </a>
                    <?php endforeach; else: ?>
                        <span class="mn-empty">No months yet — save a bill to begin.</span>
                    <?php endif; ?>
                </div>
                <a class="mn-arrow" href="?month=<?= $nextMonth ?>" title="Next month" aria-label="Next month">›</a>
            </div>

            <div class="stats">
                <div class="stat">
                    <div class="k">Bills</div>
                    <div class="v"><?= number_format($stats['total_bills']) ?></div>
                </div>
                <div class="stat">
                    <div class="k">Total units</div>
                    <div class="v"><?= number_format($stats['total_units']) ?></div>
                </div>
                <div class="stat">
                    <div class="k">Avg bill</div>
                    <div class="v">₹<?= number_format($stats['avg_bill'], 0) ?></div>
                </div>
                <div class="stat">
                    <div class="k">Highest</div>
                    <div class="v">₹<?= number_format($stats['max_bill'], 0) ?></div>
                </div>
            </div>

            <div class="ticker" aria-hidden="true">
                <div class="track">
                    <span>LED bulbs use <b>75% less</b> energy than incandescent</span>
                    <span>Every 1°C on your AC adds <b>~6%</b> to cooling cost</span>
                    <span>Standby devices can be <b>10%</b> of your bill</span>
                    <span>Solar can offset <b>40–60%</b> of usage</span>
                    <span>LED bulbs use <b>75% less</b> energy than incandescent</span>
                    <span>Every 1°C on your AC adds <b>~6%</b> to cooling cost</span>
                    <span>Standby devices can be <b>10%</b> of your bill</span>
                    <span>Solar can offset <b>40–60%</b> of usage</span>
                </div>
            </div>
        </section>

        <!-- History -->
        <section class="card history">
            <div class="label-row">Bills in <?= htmlspecialchars($selectedMonthLabel) ?> <span class="hint">— tap a row for the breakdown</span></div>
                <?php if ($history && $history->num_rows > 0): ?>
                    <table>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th class="num">Units</th>
                                <th class="num">Bill</th>
                                <th class="num">Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php while ($row = $history->fetch_assoc()): ?>
                                <tr class="main" tabindex="0" role="button" aria-expanded="false">
                                    <td><?= htmlspecialchars($row['name']) ?></td>
                                    <td class="num"><?= number_format($row['units'], 2) ?></td>
                                    <td class="num">₹<?= number_format($row['bill_amount'], 2) ?></td>
                                    <td class="num"><?= date("d M, H:i", strtotime($row['created_at'])) ?></td>
                                </tr>
                                <tr class="detail">
                                    <td colspan="4">
                                        <div class="detail-box">
                                            <div class="addr">📍 <?= htmlspecialchars($row['address']) ?> · <?= date("d M Y, H:i", strtotime($row['created_at'])) ?></div>
                                            <table>
                                                <thead>
                                                    <tr><th>Slab</th><th class="num">Units</th><th class="num">Rate</th><th class="num">Amount</th></tr>
                                                </thead>
                                                <tbody>
                                                    <?php foreach (slabBreakdown($row['units']) as $s): ?>
                                                        <tr>
                                                            <td><?= htmlspecialchars($s[0]) ?></td>
                                                            <td class="num"><?= number_format($s[1], 2) ?></td>
                                                            <td class="num">₹<?= number_format($s[2], 2) ?></td>
                                                            <td class="num">₹<?= number_format($s[1] * $s[2], 2) ?></td>
                                                        </tr>
                                                    <?php endforeach; ?>
                                                </tbody>
                                            </table>
                                        </div>
                                    </td>
                                </tr>
                            <?php endwhile; ?>
                        </tbody>
                    </table>
                <?php else: ?>
                    <p class="history-empty">No bills for <?= htmlspecialchars($selectedMonthLabel) ?>. Pick another month above, or calculate a new bill.</p>
                <?php endif; ?>
        </section>

        <p class="foot">Voltix · slab-based tariff estimate · saved to MySQL</p>
    </main>

    <script>
        // Animated count-up for the bill amount + gauge fill.
        (function () {
            var el = document.getElementById('amount');
            if (!el) return;

            var target = parseFloat(el.dataset.value) || 0;
            var dur = 900, start = null;

            function fmt(n) {
                return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            }
            function step(ts) {
                if (!start) start = ts;
                var p = Math.min((ts - start) / dur, 1);
                var eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
                el.textContent = fmt(target * eased);
                if (p < 1) requestAnimationFrame(step);
            }
            requestAnimationFrame(step);

            // Gauge: map units onto 0–300 scale.
            var fill = document.getElementById('gaugeFill');
            if (fill) {
                var units = <?= $result ? (float)$result['units'] : 0 ?>;
                var pct = Math.min(units / 300 * 100, 100);
                setTimeout(function () { fill.style.width = pct + '%'; }, 120);
            }
        })();

        // Expandable history rows: click (or Enter/Space) toggles the detail row.
        (function () {
            document.querySelectorAll('.history tr.main').forEach(function (row) {
                function toggle() {
                    var detail = row.nextElementSibling;
                    if (!detail || !detail.classList.contains('detail')) return;
                    var open = row.classList.toggle('open');
                    detail.classList.toggle('show', open);
                    row.setAttribute('aria-expanded', open ? 'true' : 'false');
                }
                row.addEventListener('click', toggle);
                row.addEventListener('keydown', function (e) {
                    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
                });
            });
        })();
    </script>
</body>
</html>
<?php $conn->close(); ?>
