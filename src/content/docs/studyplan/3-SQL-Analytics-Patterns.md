---
title: "SQL Analytics Patterns for Product Interviews"
---

# SQL Analytics Patterns

## 1. Top Products

```sql
SELECT
    product_id,
    SUM(amount) AS revenue
FROM orders
GROUP BY product_id
ORDER BY revenue DESC
LIMIT 10;
```

## 2. Customers With No Orders

```sql
SELECT u.user_id
FROM users u
LEFT JOIN orders o
    ON u.user_id = o.user_id
WHERE o.user_id IS NULL;
```

## 3. Revenue by Month

```sql
SELECT
    DATE_TRUNC('month', order_date) AS month,
    SUM(amount) AS revenue
FROM orders
GROUP BY 1
ORDER BY 1;
```

## 4. Average Order Value

```sql
SELECT
    SUM(amount) / NULLIF(COUNT(DISTINCT order_id), 0) AS aov
FROM orders;
```

## 5. Unique Purchasers

```sql
SELECT COUNT(DISTINCT user_id)
FROM orders;
```

## 6. Conversion Rate

Conceptually:

```text
converters / eligible population
```

Example:

```sql
SELECT
    100.0 *
    COUNT(DISTINCT CASE
        WHEN event_type = 'purchase' THEN user_id
    END)
    / NULLIF(COUNT(DISTINCT user_id), 0)
FROM events;
```

Always clarify what counts as a conversion.

## 7. Top N Per Category

```sql
WITH ranked AS (
    SELECT
        category,
        product_id,
        SUM(amount) AS revenue,
        ROW_NUMBER() OVER (
            PARTITION BY category
            ORDER BY SUM(amount) DESC
        ) AS rn
    FROM orders
    GROUP BY category, product_id
)
SELECT *
FROM ranked
WHERE rn <= 3;
```

## 8. First Order Per User

```sql
WITH ranked AS (
    SELECT
        user_id,
        order_id,
        order_date,
        ROW_NUMBER() OVER (
            PARTITION BY user_id
            ORDER BY order_date
        ) AS rn
    FROM orders
)
SELECT *
FROM ranked
WHERE rn = 1;
```

## 9. Previous Order

```sql
SELECT
    user_id,
    order_date,
    LAG(order_date) OVER (
        PARTITION BY user_id
        ORDER BY order_date
    ) AS previous_order_date
FROM orders;
```

## 10. Month-over-Month Revenue

```sql
WITH monthly AS (
    SELECT
        DATE_TRUNC('month', order_date) AS month,
        SUM(amount) AS revenue
    FROM orders
    GROUP BY 1
)
SELECT
    month,
    revenue,
    LAG(revenue) OVER (ORDER BY month) AS previous_revenue
FROM monthly
ORDER BY month;
```

## 11. Revenue Growth

Conceptually:

```text
(current - previous) / previous
```

```sql
(revenue - previous_revenue)
/
NULLIF(previous_revenue, 0)
```

## 12. Funnel Analysis

Typical funnel:

```text
Session
 ↓
Product View
 ↓
Add to Cart
 ↓
Checkout
 ↓
Purchase
```

For each stage, determine:

- unique users
- stage conversion
- drop-off
- overall conversion

The critical product question is:

> Where is the largest meaningful drop?

## 13. Segmentation

Investigate metrics by:

- device
- geography
- acquisition channel
- customer type
- product category
- new vs returning users

Example:

```sql
SELECT
    device,
    COUNT(DISTINCT user_id) AS users,
    COUNT(DISTINCT CASE WHEN purchased = 1 THEN user_id END) AS buyers
FROM sessions
GROUP BY device;
```

## 14. Retention

A cohort approach:

```text
January signups
    ↓
How many return in February?
    ↓
March?
    ↓
April?
```

Retention requires a clear definition of:

- cohort
- return behavior
- time window

## 15. Churn

First define churn.

Examples:

- subscription cancellation
- no purchase for 90 days
- no login for 30 days

Then segment churn by relevant dimensions.

## 16. Analytics Investigation Framework

If a metric drops:

```text
1. Validate the metric
2. Check data quality
3. Establish baseline
4. Identify when the change started
5. Segment the population
6. Find the biggest driver
7. Check recent product/business changes
8. Form hypotheses
9. Test hypotheses
10. Recommend action
```

## 17. SQL Interview Questions to Practice

1. Find the second-highest salary.
2. Find duplicate users.
3. Find users who never ordered.
4. Find the top 3 products per category.
5. Calculate monthly revenue.
6. Calculate monthly active users.
7. Calculate conversion rate.
8. Find each user's first purchase.
9. Find each user's latest purchase.
10. Calculate month-over-month growth.
11. Find users with more than 3 orders.
12. Calculate average orders per customer.
13. Find products with no sales.
14. Compare new vs returning customer revenue.
15. Find the highest-revenue category each month.
16. Calculate retention by signup cohort.
17. Find customers whose latest order is older than 90 days.
18. Calculate purchase frequency.
19. Find the largest checkout funnel drop.
20. Investigate a 20% revenue decline.

## 18. Product Interpretation

Never stop at:

> "Revenue is down 20%."

Continue:

> "Revenue is down 20%, primarily because mobile conversion fell 35% among new users after the latest checkout release."

Then ask:

> "What should the product team do next?"

That final step is what turns SQL analysis into product thinking.
