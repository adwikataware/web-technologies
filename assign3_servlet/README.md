# Assignment 3 — Electricity Bill Calculator using **Servlet**

> **Technology: Java Servlet (Jakarta Servlet 6.0).**
> The request handling, validation and page generation are all done by a
> `HttpServlet` subclass — `BillServlet` — through its `doGet()` and `doPost()`
> methods. There is no PHP, no JSP and no framework anywhere in this project.

A responsive web application that calculates an electricity bill from a meter
reading using slab-based tariffs. Same problem statement as
[assignment 1](../assign1_electricity), rebuilt on the **Java Servlet** stack
instead of PHP + MySQL.

## Tariff slabs

| Units      | Rate (₹/unit) |
| ---------- | ------------- |
| 0 – 50     | 3.50          |
| 51 – 150   | 4.00          |
| 151 – 250  | 5.20          |
| Above 250  | 6.50          |

## The Servlet, in one place

Everything a Servlet assignment is marked on lives in
[`BillServlet.java`](src/main/java/com/voltix/BillServlet.java):

| Servlet concept | Where |
| --- | --- |
| `import jakarta.servlet.*` | top of the file |
| `extends HttpServlet` | class declaration |
| `@WebServlet` mapping | annotation above the class, patterns `""` and `/bill` |
| `@WebInitParam` | inside `@WebServlet` — the `seedDemoData` parameter |
| `init()` | servlet lifecycle — creates the store |
| `doGet(HttpServletRequest, HttpServletResponse)` | renders the calculator |
| `doPost(HttpServletRequest, HttpServletResponse)` | validates and saves the bill |
| `request.getParameter(...)` | reading the submitted form |
| `response.setContentType` / `getWriter()` | writing the HTML back |
| `getServletContext().setAttribute(...)` | application-scoped storage |
| Deployment descriptor | [`WEB-INF/web.xml`](src/main/webapp/WEB-INF/web.xml) |
| Servlet API dependency | `jakarta.servlet-api` in [`pom.xml`](pom.xml) |

## How it differs from assignment 1

| | assignment 1 | assignment 3 (this one) |
| --- | --- | --- |
| Technology | PHP | **Java Servlet (Jakarta Servlet 6)** |
| Server | Apache (XAMPP) | Tomcat 10.1+ / embedded Jetty |
| URL | `localhost/assign1_electricity/lab.php` | `localhost:8080/bill` |
| Storage | MySQL + prepared statements | In-memory store in the `ServletContext` |
| Setup | Import `setup.sql`, start MySQL | None — no database at all |
| Form handling | `$_POST` in one script | `doPost()`, then a 303 redirect (PRG) |
| Structure | one 673-line `lab.php` | 9 classes, controller/view/model split |
| Tests | none | 26 automated tests |

## Features

- Slab-based calculation with an itemised breakdown of every band
- Server-side validation in the servlet — the HTML `required`/`min` attributes
  are a convenience, never the guarantee
- **Month-wise organisation** — pick a billing month, browse bills by month via
  a calendar strip
- Per-month analytics (total bills, total units, average bill, highest bill)
- Clickable history rows that expand to show that bill's slab breakdown
- Animated bill counter, usage gauge, and an energy-tips ticker
- Fully responsive — verified with no horizontal scroll from 320px upward
- Post/Redirect/Get, so refreshing the result page never saves a duplicate
- Everything user-supplied is HTML-escaped on the way out

## Requirements

**A JDK (17 or newer) is the only thing you need to install.** Maven arrives via
the bundled wrapper on first run.

## Running it

### Quickest — embedded servlet container, nothing to install

```bash
mvnw jetty:run          # Windows
./mvnw jetty:run        # macOS / Linux
```

Then open **http://localhost:8080/**. Stop it with `Ctrl+C`.

### As a WAR on Tomcat

```bash
mvnw package
```

Copy `target/assign3_servlet.war` into your Tomcat `webapps/` folder, start
Tomcat, and open **http://localhost:8080/assign3_servlet/**.

Needs **Tomcat 10.1 or newer**, the Jakarta EE generation that uses the
`jakarta.servlet.*` namespace. On Tomcat 9 or older the app will deploy but the
servlet will not be found — those versions still use `javax.servlet.*`. To
target Tomcat 9, change the dependency in `pom.xml` to
`javax.servlet:javax.servlet-api:4.0.1` and rewrite the `jakarta.servlet`
imports as `javax.servlet`.

### From an IDE

A standard Maven web application, so NetBeans, Eclipse and IntelliJ all open
`pom.xml` (or the folder) directly — no import wizard needed.

### Tests

```bash
mvnw test
```

26 tests cover the slab arithmetic against hand-worked figures, the month-wise
store, and the rendered HTML (including that a `<script>` tag typed into the
form comes back escaped).

## How it works

`BillServlet` is mapped to two URL patterns: the empty string `""`, which is the
Servlet spec's special "context root" pattern, and `/bill`. Mapping the root
that way means the calculator answers at `/` while the container's default
servlet still serves `/assets/*` — mapping to `/` instead would have taken those
static files over.

A `GET` renders the page. A `POST` validates the form; if anything is wrong the
page is re-rendered in place with the messages and the values the user typed
still in the inputs. If it is valid the bill is saved and the servlet answers
**303 See Other** pointing at `/bill?month=…&id=…`. 303 rather than
`sendRedirect`'s default 302 because only 303 obliges the client to follow up
with a `GET` — which is the entire point of Post/Redirect/Get.

Money is `BigDecimal` throughout. A `double` drifts on rates like 5.20, and a
bill that is a paisa off is a bill that is wrong.

### No database

Assignment 1 persisted to MySQL. This one keeps bills in `BillStore`, an
in-memory store held in the `ServletContext`, so the app runs with zero setup —
nothing to install, no schema to import, nothing to go wrong during a demo. A
servlet container serves requests on many threads at once, so the store is built
on concurrent collections. **Bills are lost when the container stops.**

A few sample bills are seeded at startup so the dashboard is not empty on first
run. Turn that off with the `seedDemoData` init-param in `BillServlet`.

## Project layout

```
src/main/java/com/voltix/
    BillServlet.java   THE SERVLET — @WebServlet, init, doGet, doPost
    Tariff.java        slab table and the breakdown/total arithmetic
    Slab.java          one band as it applies to a reading
    Bill.java          a saved bill
    BillStore.java     in-memory, month-wise storage
    MonthStats.java    per-month aggregates
    FormData.java      raw form values, kept as typed for redisplay
    PageModel.java     everything one render needs
    HtmlPage.java      renders the page from a PageModel
    DemoData.java      startup sample bills
src/main/webapp/
    WEB-INF/web.xml    deployment descriptor — welcome file, UTF-8 encoding
    assets/app.css     the interface
    assets/app.js      count-up, gauge fill, expandable rows
src/test/java/com/voltix/
    TariffTest.java    slab maths against hand-worked figures
    BillStoreTest.java month scoping, ordering, aggregates
    HtmlPageTest.java  escaping, URLs, result rendering
```

The view is rendered by the servlet rather than a JSP, which keeps this a
pure-Servlet solution and means there is no JSP/JSTL dependency to install.
`HtmlPage` is a pure function of `PageModel`, so the markup can be asserted in
an ordinary unit test without starting a container.
