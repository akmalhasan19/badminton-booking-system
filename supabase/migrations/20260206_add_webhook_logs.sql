create table if not exists webhook_logs (
    id uuid primary key default gen_random_uuid(),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    source text not null, -- 'xendit', etc.
    payload jsonb,
    status text, -- 'processed', 'failed', 'ignored'
    response_code integer,
    error_message text
);

-- Add index for faster querying by time
create index if not exists idx_webhook_logs_created_at on webhook_logs(created_at desc);
