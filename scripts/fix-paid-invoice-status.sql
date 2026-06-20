-- One-off: mark fully-paid POS invoices as DELIVERED when status stuck on PENDING
UPDATE salesinvoices
SET status = 'DELIVERED'
WHERE status = 'PENDING'
  AND paymentstatus = 'PAID'
  AND COALESCE(remainingamount, 0) = 0;
