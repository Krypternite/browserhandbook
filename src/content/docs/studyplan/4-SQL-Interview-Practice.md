---
title: "SQL Interview Practice"
---

# SQL Interview Practice

## How to Practice

For every question:

1. Explain your interpretation.
2. State the table grain.
3. Identify the numerator and denominator if it is a metric.
4. Write the query.
5. Explain the result.
6. Mention edge cases.

---

# Level 1 — Fundamentals

### Q1
Return all completed orders.

### Q2
Find all distinct countries represented in the customer table.

### Q3
Count total customers.

### Q4
Count unique customers who placed orders.

### Q5
Calculate total revenue.

### Q6
Calculate average order value.

### Q7
Find the 10 highest-value orders.

### Q8
Calculate order count by country.

### Q9
Return countries with more than 100 orders.

### Q10
Find customers whose email is NULL.

---

# Level 2 — Joins and Analytics

### Q11
Find customers who have never placed an order.

### Q12
Calculate revenue by customer.

### Q13
Find the top 10 customers by revenue.

### Q14
Calculate revenue by product category.

### Q15
Find products that have never been ordered.

### Q16
Calculate orders by month.

### Q17
Calculate revenue by month.

### Q18
Compare revenue for new vs returning customers.

### Q19
Calculate average number of orders per customer.

### Q20
Find customers with more than five orders.

---

# Level 3 — CASE and Window Functions

### Q21
Segment customers into High, Medium, and Low spenders.

### Q22
Find each customer's first order.

### Q23
Find each customer's most recent order.

### Q24
Number each customer's orders chronologically.

### Q25
Find the top three products in every category.

### Q26
Calculate month-over-month revenue.

### Q27
Calculate the difference between a user's current and previous order.

### Q28
Find users who made a second purchase within 30 days.

### Q29
Rank products by revenue within each category.

### Q30
Find the highest-revenue category for each month.

---

# Product Analytics Cases

## Case 1 — Conversion Drop

The VP says:

> "Website traffic is up, but revenue isn't growing."

Investigate:

- traffic
- users
- conversion
- AOV
- device
- acquisition channel
- new vs returning users

Explain your investigation before writing SQL.

---

## Case 2 — Checkout Drop

Checkout completion dropped 15%.

Investigate:

```text
Product view
→ Add to cart
→ Checkout
→ Payment
→ Purchase
```

Questions:

- Which step changed?
- Which users are affected?
- When did it start?
- Was there a release?
- Is the issue device-specific?
- Are payment failures increasing?

---

## Case 3 — Revenue Decline

Revenue dropped 20% month-over-month.

Break revenue into:

```text
Customers
×
Orders per customer
×
Average order value
```

Then segment.

---

## Case 4 — Feature Adoption

A new feature has 8% adoption.

Do not immediately call it a failure.

Ask:

- What was the target?
- Which users are eligible?
- How old is the feature?
- Is adoption increasing?
- Does adoption correlate with retention?
- Are users discovering the feature?
- Is the feature actually valuable?

---

## Case 5 — Churn

Churn increased.

Investigate:

- customer segment
- tenure
- product usage
- support interactions
- subscription type
- geography
- acquisition source
- recent releases

---

# SQL Verbal Questions

Be able to answer these without writing code:

### What is DISTINCT?

It removes duplicate combinations of the selected columns.

### COUNT(*) vs COUNT(column)?

`COUNT(*)` counts rows. `COUNT(column)` ignores NULLs.

### COUNT(*) vs COUNT(DISTINCT user_id)?

The former counts rows; the latter counts unique users.

### WHERE vs HAVING?

WHERE filters rows before aggregation. HAVING filters groups after aggregation.

### INNER JOIN vs LEFT JOIN?

INNER JOIN keeps matching rows. LEFT JOIN keeps every left-side row.

### Why might a JOIN inflate revenue?

Because the join can multiply rows when tables have different grains.

### RANK vs DENSE_RANK?

Both assign the same rank to ties; RANK leaves gaps while DENSE_RANK does not.

### Why use a CTE?

To break complex logic into readable, reusable query stages.

### Why use CASE?

To apply conditional logic or perform conditional aggregation.

### Why is ORDER BY important?

SQL does not guarantee result order without it.

---

# Timed Practice

## 15-minute challenge

Find customers who:

- placed at least 3 orders
- generated more than $500 total revenue
- have a most recent order within the last 90 days

Explain your approach first.

## 20-minute challenge

Calculate monthly:

- unique visitors
- unique purchasers
- conversion rate
- revenue
- AOV

Then identify the month with the largest conversion decline.

## 30-minute challenge

Investigate a 20% revenue decline and produce:

1. SQL analysis
2. likely cause
3. supporting evidence
4. recommended product action
5. metric to monitor

---

# Interview Rule

If you get stuck, don't silently write random SQL.

Say:

> "Let me clarify the grain and define the metric first."

That demonstrates analytical maturity.
