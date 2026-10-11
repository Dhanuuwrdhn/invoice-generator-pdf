ALTER TABLE "invoices" ADD COLUMN "idempotency_key" text;--> statement-breakpoint
CREATE UNIQUE INDEX "invoices_user_idempotency_key_idx" ON "invoices" USING btree ("user_id","idempotency_key");