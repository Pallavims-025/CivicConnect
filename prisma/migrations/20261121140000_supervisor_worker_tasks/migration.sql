CREATE TABLE `supervisor_worker_tasks` (
  `id` VARCHAR(36) NOT NULL,
  `work_order_id` VARCHAR(36) NOT NULL,
  `supervisor_id` VARCHAR(36) NOT NULL,
  `worker_name` VARCHAR(255) NOT NULL,
  `worker_contact` VARCHAR(100) NULL,
  `task_description` TEXT NOT NULL,
  `deadline` DATETIME(3) NULL,
  `progress` INTEGER NOT NULL DEFAULT 0,
  `status` VARCHAR(50) NOT NULL DEFAULT 'Not Started',
  `delay_reason` TEXT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  INDEX `supervisor_worker_tasks_work_order_id_idx` (`work_order_id`),
  INDEX `supervisor_worker_tasks_supervisor_id_idx` (`supervisor_id`),
  PRIMARY KEY (`id`),
  CONSTRAINT `supervisor_worker_tasks_work_order_id_fkey` FOREIGN KEY (`work_order_id`) REFERENCES `work_orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `supervisor_worker_tasks_supervisor_id_fkey` FOREIGN KEY (`supervisor_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
