-- Expose schema jobboard to PostgREST (Accept-Profile).
-- Apply on instance ai-scrapper. Does not GRANT anon (S11).
-- Without this, REST looks in public and the Android ingest client cannot list payment_methods.

alter role authenticator set pgrst.db_schemas to 'public, graphql_public, jobboard';
notify pgrst, 'reload config';
notify pgrst, 'reload schema';
