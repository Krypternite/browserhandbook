---
title: "SQL Concepts Explained for Product Analytics"
---

# SQL Concepts Explained

## DISTINCT in Detail

Consider:

```text
user_id
1
1
2
2
3
```

```sql
SELECT DISTINCT user_id
FROM events;
```

returns:

```text
1
2
3
```

But:

```sql
SELECT DISTINCT user_id, event_type
FROM events;
```

returns unique combinations of the two columns.

### Product Analytics Example

To calculate unique purchasers:

```sql
SELECT COUNT(DISTINCT user_id)
FROM orders;
```

Do not use:

```sql
COUNT(user_id)
```

if a customer can place multiple orders.

---

# Aggregations

## COUNT

Rows:

```sql
COUNT(*)
```

Non-NULL values:

```sql
COUNT(column)
```

Unique values:

```sql
COUNT(DISTINCT column)
```

## SUM

```sql
SUM(revenue)
```

## AVG

```sql
AVG(order_amount)
```

Be careful: average order value should usually be calculated at the correct grain.

## MIN / MAX

```sql
MIN(order_amount)
MAX(order_amount)
```

---

## Conditional Aggregation

A powerful analytics technique:

```sql
SELECT
    COUNT(DISTINCT user_id) AS users,
    COUNT(DISTINCT CASE
        WHEN event_type = 'purchase'
        THEN user_id
    END) AS purchasers
FROM events;
```

Conversion:

```sql
SELECT
    100.0 *
    COUNT(DISTINCT CASE WHEN event_type = 'purchase' THEN user_id END)
    / NULLIF(COUNT(DISTINCT user_id), 0) AS conversion_rate
FROM events;
```

`NULLIF` helps avoid division-by-zero.

---

## CASE Statements

Basic:

```sql
CASE
    WHEN revenue >= 1000 THEN 'High'
    WHEN revenue >= 500 THEN 'Medium'
    ELSE 'Low'
END
```

Multiple conditions:

```sql
CASE
    WHEN age < 18 THEN 'Minor'
    WHEN age BETWEEN 18 AND 64 THEN 'Adult'
    ELSE 'Senior'
END
```

CASE can be used in:

- `SELECT`
- `ORDER BY`
- conditional aggregation
- sometimes `WHERE` logic through expressions

---

## COALESCE

```sql
COALESCE(revenue, 0)
```

Useful for preserving users from a `LEFT JOIN` while replacing missing measures.

Example:

```sql
SELECT
    u.user_id,
    COALESCE(SUM(o.amount), 0) AS revenue
FROM users u
LEFT JOIN orders o
    ON u.user_id = o.user_id
GROUP BY u.user_id;
```

---

## JOINs and Grain

Always identify the grain before joining.

Example:

```text
users
1 row/user

orders
1 row/order

order_items
1 row/item

events
1 row/event
```

If you join orders to order_items, one order may become multiple rows.

That is not necessarily wrong, but you must understand the resulting grain.

## Classic Interview Trap

You join:

```text
orders
```

to:

```text
order_items
```

and then:

```sql
SUM(order_total)
```

The order total may be repeated once per item.

Possible solution: aggregate order_items first or calculate at the appropriate grain.

---

## WHERE vs HAVING

```sql
WHERE amount > 100
```

filters individual rows.

```sql
HAVING SUM(amount) > 10000
```

filters groups.

---

## ORDER BY

Ordering happens after the query logic produces a result.

```sql
ORDER BY revenue DESC
```

For top-N:

```sql
ORDER BY revenue DESC
LIMIT 10;
```

For ranking within categories, use a window function instead of relying only on LIMIT.

---

## Window Functions

Window functions calculate across related rows without collapsing them.

Example:

```sql
SELECT
    user_id,
    order_date,
    amount,
    ROW_NUMBER() OVER (
        PARTITION BY user_id
        ORDER BY order_date
    ) AS order_number
FROM orders;
```

This numbers each user's orders.

## ROW_NUMBER

Always gives unique sequential numbers within a partition.

```text
1
2
3
4
```

## RANK

Ties share rank and gaps appear.

```text
1
2
2
4
```

## DENSE_RANK

Ties share rank but no gaps.

```text
1
2
2
3
```

## LAG

Looks at a previous row.

```sql
LAG(revenue) OVER (
    ORDER BY month
)
```

Useful for:

- month-over-month comparisons
- previous purchase
- previous status
- previous event

## LEAD

Looks at a future row.

---

## CTEs

CTEs make complicated queries easier to read.

```sql
WITH monthly_revenue AS (
    SELECT
        DATE_TRUNC('month', order_date) AS month,
        SUM(amount) AS revenue
    FROM orders
    GROUP BY 1
)
SELECT *
FROM monthly_revenue
ORDER BY month;
```

Use CTEs to break an analytical problem into steps.

---

## Subqueries

Example:

```sql
SELECT *
FROM customers
WHERE customer_id IN (
    SELECT customer_id
    FROM orders
    GROUP BY customer_id
    HAVING SUM(amount) > 1000
);
```

CTEs are often easier to read when multiple steps are required.

---

## Query Thinking

When solving an interview problem:

```text
1. What does one row represent?
2. What tables contain the information?
3. What population am I measuring?
4. What is the numerator?
5. What is the denominator?
6. Do I need unique users?
7. Could a JOIN duplicate rows?
8. Do I need aggregation?
9. Do I need a window function?
10. How should the result be sorted?
```

This checklist is more valuable than memorizing syntax.
