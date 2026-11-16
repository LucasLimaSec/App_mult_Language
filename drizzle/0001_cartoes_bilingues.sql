-- A tabela cards ainda estava vazia nesta versão (nenhum deck tinha sido importado),
-- então ela é recriada sem copiar linhas: as colunas novas não existem na tabela antiga.
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_cards` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`idioma` text NOT NULL,
	`frente` text NOT NULL,
	`direcao` text NOT NULL,
	`verso_en` text,
	`verso_pt` text,
	`classe` text,
	`pinyin` text,
	`exemplo` text,
	`exemplo_en` text,
	`exemplo_pt` text,
	`nota` text,
	`origem` text NOT NULL,
	`conteudo_id` text NOT NULL,
	`licao_id` text,
	`due` integer NOT NULL,
	`stability` real DEFAULT 0 NOT NULL,
	`difficulty` real DEFAULT 0 NOT NULL,
	`scheduled_days` integer DEFAULT 0 NOT NULL,
	`learning_steps` integer DEFAULT 0 NOT NULL,
	`reps` integer DEFAULT 0 NOT NULL,
	`lapses` integer DEFAULT 0 NOT NULL,
	`state` integer DEFAULT 0 NOT NULL,
	`last_review` integer,
	`suspenso` integer DEFAULT false NOT NULL,
	`criado_em` integer NOT NULL
);
--> statement-breakpoint
DROP TABLE `cards`;--> statement-breakpoint
ALTER TABLE `__new_cards` RENAME TO `cards`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `cards_conteudo_direcao_idx` ON `cards` (`conteudo_id`,`direcao`);--> statement-breakpoint
CREATE INDEX `cards_idioma_due_idx` ON `cards` (`idioma`,`due`);--> statement-breakpoint
ALTER TABLE `reviews` ADD `learning_steps` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE INDEX `reviews_revisado_idx` ON `reviews` (`revisado_em`);--> statement-breakpoint
ALTER TABLE `reviews` DROP COLUMN `elapsed_days`;