# Database Fix Instructions

We're encountering an error with the database schema. This document provides step-by-step instructions to fix the issue.

## The Error

```
Failed to complete checkout: Failed to create order: Unknown column 'shippingAddress' in 'field list'
```

This error indicates that the database table structure doesn't match what our application expects.

## Solution

### Option 1: Use phpMyAdmin (Recommended)

1. Open phpMyAdmin (usually at http://localhost/phpmyadmin/ if using XAMPP)
2. Select your database (herba_db) from the left sidebar
3. Click on the "SQL" tab at the top
4. Copy and paste the entire content from the `db-migration-fix.sql` file
5. Click "Go" to execute the script

### Option 2: Use Direct SQL Statements

If Option 1 doesn't work, you can try running these specific SQL statements one by one:

```sql
-- Drop the existing orders table and recreate it
DROP TABLE IF EXISTS orders;

-- Create the orders table with all required columns
CREATE TABLE orders (
  id int(11) NOT NULL AUTO_INCREMENT,
  userId varchar(255) NOT NULL,
  total decimal(10,2) NOT NULL,
  status enum('pending','processing','shipped','delivered','cancelled','canceled') NOT NULL DEFAULT 'pending',
  shippingAddress text,
  billingAddress text,
  customerFirstName varchar(255) NOT NULL,
  customerLastName varchar(255) NOT NULL,
  customerEmail varchar(255) NOT NULL,
  customerPhone varchar(255) NOT NULL,
  paymentStatus enum('pending','paid','failed') DEFAULT 'pending',
  paymentMethod enum('cash_on_delivery','bank_transfer') DEFAULT 'cash_on_delivery',
  paymentDetails text,
  createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Warning**: Option 2 will delete any existing orders data. Only use it if you're starting fresh or have backed up your data.

## Additional Information

- We're using TEXT type instead of JSON for maximum compatibility with different MySQL versions
- The application code has been updated to handle both text and JSON formats for address data
- If you're still experiencing issues after running the fix, please contact support

## Verification

After running the fix, you can verify that it worked by:

1. In phpMyAdmin, click on the "orders" table
2. Click on the "Structure" tab
3. Verify that all the following columns exist:
   - id
   - userId
   - total
   - status
   - shippingAddress
   - billingAddress
   - customerFirstName
   - customerLastName
   - customerEmail
   - customerPhone
   - paymentStatus
   - paymentMethod
   - paymentDetails
   - createdAt
   - updatedAt 