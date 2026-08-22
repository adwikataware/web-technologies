<%--
    Electricity bill calculator — the whole application, in one JSP.

    The page posts to itself. On a POST the bean is filled from the request,
    validated, and (when good) recorded in this session's history. Everything
    displayed is read through EL and JSTL; the arithmetic lives in the JavaBean,
    not in scriptlets.
--%>
<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<%@ taglib prefix="fmt" uri="jakarta.tags.fmt" %>
<%@ taglib prefix="fn" uri="jakarta.tags.functions" %>

<%--
    Pin the formatting locale. Without this <fmt:formatNumber> follows the
    browser's Accept-Language header, so the same bill would render as 1,420.50
    for one visitor and 1.420,50 for another — and as a bare 1420.5 for a client
    that sends no locale at all.
--%>
<fmt:setLocale value="en_IN"/>

<%-- The form-backing bean, filled from the request parameters in one line. --%>
<jsp:useBean id="bill" class="com.electricity.BillBean" scope="request"/>
<jsp:setProperty name="bill" property="*"/>

<%-- One history per browser session. --%>
<jsp:useBean id="history" class="com.electricity.HistoryBean" scope="session"/>

<%!
    /*
     * JSP declaration — becomes a method on the generated servlet class.
     * Keeps the gauge's inline style out of the markup below.
     */
    private String barWidth(int percent) {
        return "width:" + percent + "%";
    }
%>

<%
    boolean posted = "POST".equalsIgnoreCase(request.getMethod());

    if (request.getParameter("clear") != null) {
        history.clear();
        response.sendRedirect(request.getContextPath() + "/index.jsp");
        return;
    }
    if (posted && bill.isValid()) {
        history.add(bill);
    }
    request.setAttribute("posted", posted);
%>

<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Electricity Bill Calculator &middot; JSP</title>
  <link rel="stylesheet" href="${pageContext.request.contextPath}/assets/app.css">
</head>
<body>
<main class="shell">

  <%@ include file="/WEB-INF/jspf/header.jspf" %>

  <div class="hero">
    <h1>Electricity bill calculator</h1>
    <p>Enter a meter reading and get a slab-wise breakdown of what you owe &mdash; every
       band priced separately, so you can see where each rupee came from.</p>

    <div class="tariff">
      <div class="band"><div class="rng">First 50 units</div><div class="amt">&#8377;3.50 <small>/unit</small></div></div>
      <div class="band"><div class="rng">Next 100 units</div><div class="amt">&#8377;4.00 <small>/unit</small></div></div>
      <div class="band"><div class="rng">Next 100 units</div><div class="amt">&#8377;5.20 <small>/unit</small></div></div>
      <div class="band"><div class="rng">Above 250 units</div><div class="amt">&#8377;6.50 <small>/unit</small></div></div>
    </div>
  </div>

  <div class="layout">
    <div class="col-main">

      <section class="card">
        <div class="label-row">Meter details</div>

        <%-- Validation messages, only after a submission that failed. --%>
        <c:if test="${posted and not bill.valid}">
          <div class="errors" role="alert">
            <ul>
              <c:forEach var="message" items="${bill.errors}">
                <li><c:out value="${message}"/></li>
              </c:forEach>
            </ul>
          </div>
        </c:if>

        <form method="post" action="${pageContext.request.contextPath}/index.jsp">
          <div class="field">
            <label for="name">Full name</label>
            <input type="text" id="name" name="name" required
                   placeholder="e.g. Adwika Taware" value="${fn:escapeXml(bill.name)}">
          </div>
          <div class="field">
            <label for="address">Address</label>
            <input type="text" id="address" name="address" required
                   placeholder="e.g. Pune, Maharashtra" value="${fn:escapeXml(bill.address)}">
          </div>
          <div class="field">
            <label for="units">Units consumed (kWh)</label>
            <input type="number" id="units" name="units" step="any" min="0" required
                   inputmode="decimal" placeholder="e.g. 180" value="${fn:escapeXml(bill.units)}">
          </div>
          <button type="submit" class="btn">Calculate bill <span class="arrow">&rarr;</span></button>
        </form>

        <%-- The bill itself. --%>
        <c:if test="${posted and bill.valid}">
          <div class="result" id="result">
            <div class="top">
              <div class="who">
                <b><c:out value="${bill.name}"/></b>
                <span>
                  <c:out value="${bill.address}"/> &middot;
                  <fmt:formatNumber value="${bill.unitsValue}" type="number"
                                    minFractionDigits="2" maxFractionDigits="2"/> kWh
                </span>
              </div>
              <div class="amount">
                &#8377;<fmt:formatNumber value="${bill.total}" type="number"
                                         minFractionDigits="2" maxFractionDigits="2"/>
              </div>
            </div>

            <div class="gauge">
              <div class="bar"><div class="fill" style="<%= barWidth(bill.getGaugePercent()) %>"></div></div>
              <div class="labels"><span>0</span><span>150</span><span>300+ kWh</span></div>
              <span class="tier-chip">${bill.usageTier}</span>
            </div>

            <div class="table-wrap">
              <table>
                <thead>
                  <tr><th>Slab</th><th class="num">Units</th><th class="num">Rate</th><th class="num">Amount</th></tr>
                </thead>
                <tbody>
                  <c:forEach var="slab" items="${bill.slabs}">
                    <tr>
                      <td><c:out value="${slab.label}"/></td>
                      <td class="num"><fmt:formatNumber value="${slab.units}" type="number"
                                                        minFractionDigits="2" maxFractionDigits="2"/></td>
                      <td class="num">&#8377;<fmt:formatNumber value="${slab.rate}" type="number"
                                                        minFractionDigits="2" maxFractionDigits="2"/></td>
                      <td class="num">&#8377;<fmt:formatNumber value="${slab.amount}" type="number"
                                                        minFractionDigits="2" maxFractionDigits="2"/></td>
                    </tr>
                  </c:forEach>
                </tbody>
              </table>
            </div>
          </div>
        </c:if>
      </section>

    </div>

    <aside class="col-side">
      <section class="card">
        <div class="label-row">This session</div>

        <div class="stats">
          <div class="stat">
            <div class="k">Bills</div>
            <div class="v">${history.count}</div>
          </div>
          <div class="stat">
            <div class="k">Total units</div>
            <div class="v"><fmt:formatNumber value="${history.totalUnits}" type="number"
                                             minFractionDigits="2" maxFractionDigits="2"/></div>
          </div>
          <div class="stat">
            <div class="k">Avg bill</div>
            <div class="v">&#8377;<fmt:formatNumber value="${history.averageAmount}"
                                             type="number" maxFractionDigits="0"/></div>
          </div>
          <div class="stat">
            <div class="k">Highest</div>
            <div class="v">&#8377;<fmt:formatNumber value="${history.highestAmount}"
                                             type="number" maxFractionDigits="0"/></div>
          </div>
        </div>

        <div class="ticker" aria-hidden="true">
          <div class="track">
            <span>LED bulbs use <b>75% less</b> energy than incandescent</span>
            <span>Every 1&deg;C on your AC adds <b>~6%</b> to cooling cost</span>
            <span>Standby devices can be <b>10%</b> of your bill</span>
            <span>LED bulbs use <b>75% less</b> energy than incandescent</span>
            <span>Every 1&deg;C on your AC adds <b>~6%</b> to cooling cost</span>
            <span>Standby devices can be <b>10%</b> of your bill</span>
          </div>
        </div>
      </section>
    </aside>
  </div>

  <section class="card history">
    <div class="label-row">
      Bills this session
      <span class="hint">&mdash; tap a row for the breakdown</span>
      <c:if test="${not empty history.entries}">
        <a class="clear" href="${pageContext.request.contextPath}/index.jsp?clear=1">Clear</a>
      </c:if>
    </div>

    <c:choose>
      <c:when test="${empty history.entries}">
        <p class="history-empty">Nothing calculated yet. Work out a bill above and it will be listed here.</p>
      </c:when>
      <c:otherwise>
        <div class="table-wrap">
          <table>
            <thead>
              <tr><th>Name</th><th class="num">Units</th><th class="num">Bill</th><th class="num">Time</th></tr>
            </thead>
            <tbody>
              <c:forEach var="entry" items="${history.entries}">
                <tr class="main" tabindex="0" role="button" aria-expanded="false">
                  <td><c:out value="${entry.name}"/></td>
                  <td class="num"><fmt:formatNumber value="${entry.units}" type="number"
                                                    minFractionDigits="2" maxFractionDigits="2"/></td>
                  <td class="num">&#8377;<fmt:formatNumber value="${entry.total}" type="number"
                                                    minFractionDigits="2" maxFractionDigits="2"/></td>
                  <td class="num">${entry.formattedAt}</td>
                </tr>
                <tr class="detail">
                  <td colspan="4">
                    <div class="detail-box">
                      <div class="addr"><c:out value="${entry.address}"/></div>
                      <div class="table-wrap">
                        <table>
                          <thead>
                            <tr><th>Slab</th><th class="num">Units</th><th class="num">Rate</th><th class="num">Amount</th></tr>
                          </thead>
                          <tbody>
                            <c:forEach var="slab" items="${entry.slabs}">
                              <tr>
                                <td><c:out value="${slab.label}"/></td>
                                <td class="num"><fmt:formatNumber value="${slab.units}" type="number"
                                                                  minFractionDigits="2" maxFractionDigits="2"/></td>
                                <td class="num">&#8377;<fmt:formatNumber value="${slab.rate}" type="number"
                                                                  minFractionDigits="2" maxFractionDigits="2"/></td>
                                <td class="num">&#8377;<fmt:formatNumber value="${slab.amount}" type="number"
                                                                  minFractionDigits="2" maxFractionDigits="2"/></td>
                              </tr>
                            </c:forEach>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </td>
                </tr>
              </c:forEach>
            </tbody>
          </table>
        </div>
      </c:otherwise>
    </c:choose>
  </section>

  <%@ include file="/WEB-INF/jspf/footer.jspf" %>

</main>
<script src="${pageContext.request.contextPath}/assets/app.js"></script>
</body>
</html>
