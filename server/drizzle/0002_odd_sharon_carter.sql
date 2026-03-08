CREATE TABLE "housekeeping_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"room_id" uuid NOT NULL,
	"task_type" text NOT NULL,
	"priority" text DEFAULT 'normal' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"scheduled_date" timestamp NOT NULL,
	"notes" text,
	"assigned_to" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lost_and_found" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"item_description" text NOT NULL,
	"found_location" text NOT NULL,
	"found_by" text,
	"found_date" timestamp NOT NULL,
	"category" text,
	"status" text DEFAULT 'stored' NOT NULL,
	"storage_location" text,
	"notes" text,
	"claimed_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ota_channels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"api_endpoint" text,
	"commission_rate" numeric(5, 2),
	"is_active" boolean DEFAULT true,
	"sync_status" text,
	"last_sync_at" timestamp,
	"settings" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ota_channels_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "staff_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" text NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"email" text,
	"phone" text,
	"department" text NOT NULL,
	"position" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"hire_date" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "staff_members_employee_id_unique" UNIQUE("employee_id")
);
--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "password_hash" text;