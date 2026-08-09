---
title: "SQL Fundamentals for Analytics Interviews"
---

# SQL Fundamentals

## 1. SELECT

```sql
SELECT column1, column2
FROM users;
```

Use `SELECT` to choose which columns you want.

Useful variants:

```sql
SELECT *
FROM users;
```

```sql
SELECT DISTINCT country
FROM users;
```

## 2. WHERE

Filters rows before aggregation.

```sql
SELECT *
FROM orders
WHERE order_status = 'completed';
```

Common operators:

```sql
=  <>  >  <  >=  <=
AND OR NOT
IN
BETWEEN
LIKE
IS NULL
IS NOT NULL
```

## 3. DISTINCT

`DISTINCT` removes duplicate combinations of the selected columns.

```sql
SELECT DISTINCT country
FROM customers;
```

For:

```text
India
India
USA
USA
UK
```

the result is:

```text
India
USA
UK
```

Important:

```sql
SELECT DISTINCT country, city
FROM customers;
```

removes duplicate `(country, city)` pairs, not duplicates independently in each column.

## 4. COUNT

```sql
COUNT(*)
```

counts rows.

```sql
COUNT(user_id)
```

counts non-NULL values of `user_id`.

```sql
COUNT(DISTINCT user_id)
```

counts unique non-NULL users.

For product analytics, `COUNT(DISTINCT user_id)` is often critical because one user can generate many events.

## 5. Aggregations

Core functions:

```sql
COUNT()
SUM()
AVG()
MIN()
MAX()
```

Example:

```sql
SELECT
    COUNT(*) AS orders,
    SUM(order_amount) AS revenue,
    AVG(order_amount) AS average_order_value,
    MIN(order_amount) AS smallest_order,
    MAX(order_amount) AS largest_order
FROM orders;
```

## 6. GROUP BY

Use `GROUP BY` when calculating metrics by category.

```sql
SELECT
    country,
    COUNT(*) AS orders
FROM orders
GROUP BY country;
```

Every selected non-aggregated column generally needs to appear in `GROUP BY`.

## 7. WHERE vs HAVING

`WHERE` filters rows before aggregation.

`HAVING` filters groups after aggregation.

```sql
SELECT
    country,
    COUNT(*) AS orders
FROM orders
WHERE order_status = 'completed'
GROUP BY country
HAVING COUNT(*) > 100;
```

Think:

```text
FROM
 ↓
WHERE
 ↓
GROUP BY
 ↓
HAVING
 ↓
SELECT
 ↓
ORDER BY
 ↓
LIMIT
```

## 8. ORDER BY

`ORDER BY` controls result ordering.

```sql
SELECT *
FROM orders
ORDER BY order_amount DESC;
```

Multiple columns:

```sql
ORDER BY country ASC, revenue DESC;
```

Always remember that SQL does not guarantee row order unless you explicitly use `ORDER BY`.

## 9. LIMIT

```sql
SELECT *
FROM products
ORDER BY revenue DESC
LIMIT 10;
```

Useful for top-N analysis.

## 10. CASE

`CASE` provides conditional logic.

```sql
SELECT
    user_id,
    CASE
        WHEN total_spend >= 1000 THEN 'High'
        WHEN total_spend >= 500 THEN 'Medium'
        ELSE 'Low'
    END AS customer_segment
FROM customers;
```

Conditional aggregation:

```sql
SELECT
    COUNT(*) AS users,
    COUNT(CASE WHEN status = 'active' THEN 1 END) AS active_users
FROM users;
```

A common pattern:

```sql
COUNT(DISTINCT CASE
    WHEN completed_checkout = 1 THEN user_id
END)
```

## 11. NULL

`NULL` means missing/unknown, not zero and not an empty string.

Wrong:

```sql
WHERE phone = NULL
```

Correct:

```sql
WHERE phone IS NULL
```

or:

```sql
WHERE phone IS NOT NULL
```

## 12. COALESCE

Returns the first non-NULL value.

```sql
COALESCE(discount, 0)
```

This is useful when calculating metrics where missing values should be treated as zero.

## 13. JOINS

### INNER JOIN

Returns matching rows from both tables.

```sql
SELECT
    u.user_id,
    o.order_id
FROM users u
INNER JOIN orders o
    ON u.user_id = o.user_id;
```

### LEFT JOIN

Keeps every row from the left table.

```sql
SELECT
    u.user_id,
    o.order_id
FROM users u
LEFT JOIN orders o
    ON u.user_id = o.user_id;
```

This is especially useful for questions such as:

> Which registered users never placed an order?

```sql
SELECT u.user_id
FROM users u
LEFT JOIN orders o
    ON u.user_id = o.user_id
WHERE o.order_id IS NULL;
```

## 14. Join Duplication

One of the most important analytics interview concepts.

If one user has 10 orders and another table has 20 events for that user, joining both at the user level can multiply rows.

Before joining, ask:

> What does one row represent in each table?

This is called **grain**.

Example:

```text
users:     1 row per user
orders:    1 row per order
order_items: 1 row per order item
events:    1 row per event
```

Joining different grains incorrectly can inflate `SUM()` and `COUNT()`.

## 15. Date Functions

Common operations:

```sql
DATE(order_date)
EXTRACT(YEAR FROM order_date)
EXTRACT(MONTH FROM order_date)
```

Syntax varies by SQL dialect.

Monthly grouping often looks conceptually like:

```sql
SELECT
    DATE_TRUNC('month', order_date) AS month,
    SUM(order_amount) AS revenue
FROM orders
GROUP BY DATE_TRUNC('month', order_date)
ORDER BY month;
```

## 16. Interview Checklist

Be able to explain:

- `DISTINCT`
- `COUNT(*)`
- `COUNT(column)`
- `COUNT(DISTINCT column)`
- `WHERE`
- `GROUP BY`
- `HAVING`
- `ORDER BY`
- `CASE`
- `COALESCE`
- `NULL`
- `INNER JOIN`
- `LEFT JOIN`
- table grain
- duplicate rows after joins
- basic date grouping
