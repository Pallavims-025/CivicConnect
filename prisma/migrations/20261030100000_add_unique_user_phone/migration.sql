-- Enforce unique mobile numbers at the database layer as well as in signup validation.
CREATE UNIQUE INDEX `users_phone_key` ON `users`(`phone`);
