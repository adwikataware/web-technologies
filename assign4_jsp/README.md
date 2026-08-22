# Assignment 4 — Electricity Bill Calculator using **JSP**

> **Technology: JavaServer Pages (JSP 3.1) with JSTL, EL and a JavaBean.**
> `index.jsp` *is* the application — it takes the request, fills a JavaBean with
> `<jsp:setProperty>`, and renders the bill with JSTL tags. There are no servlet
> classes of my own anywhere in this project.

A responsive web application that calculates an electricity bill from a meter
reading using slab-based tariffs. Same problem statement as
[assignment 3](../assign3_servlet), rebuilt on **JSP** instead of a servlet.

## Tariff slabs

| Units      | Rate (₹/unit) |
| ---------- | ------------- |
| 0 – 50     | 3.50          |
| 51 – 150   | 4.00          |
| 151 – 250  | 5.20          |
| Above 250  | 6.50          |

## The JSP, in one place

Everything a JSP assignment is marked on lives in
[`index.jsp`](src/main/webapp/index.jsp):

| JSP concept | Where / what it looks like |
| --- | --- |
| Page directive | `<%@ page contentType="text/html; charset=UTF-8" %>` |
| Taglib directive | `<%@ taglib prefix="c" uri="jakarta.tags.core" %>` |
| Include directive | `<%@ include file="/WEB-INF/jspf/header.jspf" %>` |
| Declaration `<%! %>` | the `barWidth(int)` helper — becomes a method on the generated servlet |
| Scriptlet `<% %>` | detects the POST and records the bill in the session |
| Expression `<%= %>` | `<%= barWidth(bill.getGaugePercent()) %>`, and the year in the footer |
| `<jsp:useBean>` | creates `bill` (request scope) and `history` (session scope) |
| `<jsp:setProperty property="*">` | copies every request parameter onto the bean in one line |
| Expression Language | `${bill.total}`, `${history.count}`, `${pageContext.request.contextPath}` |
| JSTL core | `<c:if>`, `<c:choose>/<c:when>/<c:otherwise>`, `<c:forEach>`, `<c:out>` |
| JSTL formatting | `<fmt:setLocale>`, `<fmt:formatNumber>` |
| JSTL functions | `${fn:escapeXml(...)}` on the form values |
| Implicit objects | `request`, `response`, `session`, `pageContext` |
| JSP fragments | [`WEB-INF/jspf/`](src/main/webapp/WEB-INF/jspf) — header and footer |
| Deployment descriptor | [`WEB-INF/web.xml`](src/main/webapp/WEB-INF/web.xml) |

The supporting JavaBeans are plain Java, in
[`src/main/java/com/electricity`](src/main/java/com/electricity):

- **`BillBean`** — the form-backing bean. Every property is a `String` on
  purpose: `property="*"` would throw on a non-numeric value if `units` were a
  number, and the page could not then redisplay what the user actually typed.
- **`HistoryBean`** — session-scoped list of this browser's calculations.
- **`Tariff`** / **`Slab`** — the slab arithmetic.

`Slab` is written as a class with `getX()` accessors rather than as a `record`,
because EL resolves `${slab.amount}` by looking for `getAmount()` — a record's
`amount()` accessor would not be found.

## How it differs from assignment 3

Same problem, same tariff, same look — a different technology underneath.

| | assignment 3 (servlet) | assignment 4 (this one) |
| --- | --- | --- |
| Technology | `HttpServlet`, `doGet` / `doPost` | **JSP page, JSTL, EL, JavaBean** |
| Page markup | generated from Java in `HtmlPage.java` | written as HTML in `index.jsp` |
| Request handling | servlet reads `request.getParameter` | `<jsp:setProperty property="*">` |
| Iteration | Java `for` loop building a `StringBuilder` | `<c:forEach>` |
| Number formatting | `NumberFormat` in Java | `<fmt:formatNumber>` |
| After submit | 303 redirect (Post/Redirect/Get) | posts to itself and renders |
| Storage scope | `ServletContext` — shared by everyone | `session` — one history per browser |
| Grouping | month-wise, with a calendar strip | per browser session |
| Accent colour | indigo | teal |

### One deliberate trade-off

Assignment 3 answers a POST with a **303 redirect**, so refreshing the result
page cannot save the bill twice. This one posts to itself and renders the result
directly — the classic JSP pattern, and much easier to read — which means a
browser refresh re-submits the form and adds the bill again. The browser's
"confirm resubmission" prompt is the only guard. That is a fair description of
the pattern, not an accident; **Clear** empties the session history.

## Requirements

**A JDK (17 or newer) is the only thing you need to install.** Maven arrives via
the bundled wrapper on first run.

## Running it

### Quickest — embedded container, nothing to install

```bash
mvnw jetty:run          # Windows
./mvnw jetty:run        # macOS / Linux
```

Then open **http://localhost:8080/**. Stop it with `Ctrl+C`.

### As a WAR on Tomcat

```bash
mvnw package
```

Copy `target/assign4_jsp.war` into your Tomcat `webapps/` folder, start Tomcat,
and open **http://localhost:8080/assign4_jsp/**.

Needs **Tomcat 10.1 or newer** — the Jakarta EE generation, which uses the
`jakarta.*` namespace and the `jakarta.tags.*` JSTL URIs. On Tomcat 9 the page
will not compile: change the JSTL URIs back to
`http://java.sun.com/jsp/jstl/core` (and `.../fmt`, `.../functions`), swap the
dependencies to `javax.servlet:javax.servlet-api:4.0.1` and
`javax.servlet:jstl:1.2`, and drop the `web.xml` version to 4.0.

### From an IDE

A standard Maven web application, so NetBeans, Eclipse and IntelliJ all open
`pom.xml` (or the folder) directly.

### Tests

```bash
mvnw test
```

25 tests cover the slab arithmetic against hand-worked figures, the form bean's
validation and gauge scaling, and the session history's ordering and aggregates.
The JSP itself is verified by running it, not by unit tests.

## A bug worth knowing about

`<fmt:formatNumber>` follows the browser's `Accept-Language` header. With no
locale pinned, the same bill renders as `1,420.50` for one visitor, `1.420,50`
for another, and a bare `1420.5` for a client that sends no locale at all — which
is exactly what happened the first time this page was tested with `curl`. The
page now sets `<fmt:setLocale value="en_IN"/>` once at the top, so the
formatting is the same for everyone.

## Project layout

```
src/main/java/com/electricity/
    BillBean.java      form-backing bean — properties, validation, totals
    HistoryBean.java   session-scoped history and its aggregates
    Tariff.java        slab table and the breakdown/total arithmetic
    Slab.java          one band as it applies to a reading
src/main/webapp/
    index.jsp          THE APPLICATION — directives, beans, JSTL, EL
    WEB-INF/web.xml    deployment descriptor — welcome file, UTF-8 encoding
    WEB-INF/jspf/      header and footer fragments, pulled in with <%@ include %>
    assets/app.css     the interface
    assets/app.js      expands a history row; nothing else needs script
src/test/java/com/electricity/
    TariffTest.java      slab maths against hand-worked figures
    BillBeanTest.java    validation, trimming, gauge scaling
    HistoryBeanTest.java ordering, aggregates, immutability
```

Note that `app.js` is nearly empty compared with the servlet build: the amount is
printed by `<fmt:formatNumber>` and the gauge width is written by a JSP
declaration, both on the server, so the page needs almost no JavaScript.
