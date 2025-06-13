
-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create the cron job to run every 10 minutes
SELECT cron.schedule(
  'process-order-fulfillment',
  '*/10 * * * *', 
  $$
  SELECT
    net.http_post(
        url:='https://rxqoczksnddbxcdwobnw.supabase.co/functions/v1/process-order-fulfillment-cron',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4cW9jemtzbmRkYnhjZHdvYm53Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczOTMyNjksImV4cCI6MjA2Mjk2OTI2OX0.0zMo3UaZlnAetDDqw0dg4vRvHW5aLa0uj8L3TKGZhaA"}'::jsonb,
        body:='{"triggered_by": "cron", "timestamp": "' || now() || '"}'::jsonb
    ) as request_id;
  $$
);
