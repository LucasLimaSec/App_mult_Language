CREATE TABLE `cards` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`idioma` text NOT NULL,
	`frente` text NOT NULL,
	`verso` text NOT NULL,
	`pinyin` text,
	`exemplo` text,
	`exemplo_traducao` text,
	`origem` text NOT NULL,
	`conteudo_id` text,
	`licao_id` text,
	`due` integer NOT NULL,
	`stability` real DEFAULT 0 NOT NULL,
	`difficulty` real DEFAULT 0 NOT NULL,
	`elapsed_days` integer DEFAULT 0 NOT NULL,
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
CREATE UNIQUE INDEX `cards_conteudo_id_unique` ON `cards` (`conteudo_id`);--> statement-breakpoint
CREATE INDEX `cards_idioma_due_idx` ON `cards` (`idioma`,`due`);--> statement-breakpoint
CREATE TABLE `lessons` (
	`id` text PRIMARY KEY NOT NULL,
	`idioma` text NOT NULL,
	`status` text DEFAULT 'nao_iniciada' NOT NULL,
	`acertos` integer DEFAULT 0 NOT NULL,
	`total_exercicios` integer DEFAULT 0 NOT NULL,
	`duvida` integer DEFAULT false NOT NULL,
	`nota_duvida` text,
	`iniciada_em` integer,
	`concluida_em` integer
);
--> statement-breakpoint
CREATE TABLE `reviews` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`card_id` integer NOT NULL,
	`rating` integer NOT NULL,
	`state` integer NOT NULL,
	`due` integer NOT NULL,
	`stability` real NOT NULL,
	`difficulty` real NOT NULL,
	`elapsed_days` integer NOT NULL,
	`scheduled_days` integer NOT NULL,
	`duracao_ms` integer,
	`revisado_em` integer NOT NULL,
	FOREIGN KEY (`card_id`) REFERENCES `cards`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `reviews_card_idx` ON `reviews` (`card_id`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`dia` text NOT NULL,
	`tipo` text NOT NULL,
	`idioma` text NOT NULL,
	`duracao_seg` integer DEFAULT 0 NOT NULL,
	`itens` integer DEFAULT 0 NOT NULL,
	`iniciada_em` integer NOT NULL,
	`terminada_em` integer
);
--> statement-breakpoint
CREATE INDEX `sessions_dia_idx` ON `sessions` (`dia`);--> statement-breakpoint
CREATE TABLE `settings` (
	`chave` text PRIMARY KEY NOT NULL,
	`valor` text NOT NULL
);
