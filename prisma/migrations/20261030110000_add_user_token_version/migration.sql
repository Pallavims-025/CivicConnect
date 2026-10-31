-- Allows logout to invalidate outstanding JWTs without a separate sessions table.
ALTER TABLE `users`
ADD COLUMN `token_version` INTEGER NOT NULL DEFAULT 0;
