CREATE TYPE "public"."booking_payment_status" AS ENUM('pending', 'paid', 'failed', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."booking_status" AS ENUM('confirmed', 'checked-in', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."cleaning_status" AS ENUM('pending', 'scheduled', 'in-progress', 'completed', 'verified');--> statement-breakpoint
CREATE TYPE "public"."cleaning_type" AS ENUM('post_checkout', 'pre_checkout', 'round_trip', 'on_demand');--> statement-breakpoint
CREATE TYPE "public"."job_status" AS ENUM('unassigned', 'assigned', 'accepted', 'in-progress', 'completed');--> statement-breakpoint
CREATE TYPE "public"."job_type" AS ENUM('post_checkout', 'pre_checkout');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('pending', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."payment_type" AS ENUM('deposit', 'payout');--> statement-breakpoint
CREATE TYPE "public"."photo_type" AS ENUM('before', 'after');--> statement-breakpoint
CREATE TYPE "public"."role_scope" AS ENUM('admin', 'host', 'cleaner', 'all');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('host', 'cleaner', 'admin', 'cleaning_company');--> statement-breakpoint
CREATE TABLE "activity_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"target_user_id" integer,
	"role_scope" "role_scope" NOT NULL,
	"type" text NOT NULL,
	"message" text NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" serial PRIMARY KEY NOT NULL,
	"property_id" integer NOT NULL,
	"airbnb_booking_id" text,
	"guest_name" text NOT NULL,
	"check_in" timestamp NOT NULL,
	"check_out" timestamp NOT NULL,
	"status" "booking_status" DEFAULT 'confirmed' NOT NULL,
	"cleaning_status" "cleaning_status" DEFAULT 'pending' NOT NULL,
	"cleaning_type" "cleaning_type" DEFAULT 'post_checkout' NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"special_instructions" text,
	"host_notes" text,
	"check_in_checklist" jsonb,
	"check_out_checklist" jsonb,
	"square_feet" integer,
	"bedrooms" integer,
	"bathrooms" integer,
	"has_pets" boolean DEFAULT false NOT NULL,
	"restock_requested" boolean DEFAULT false NOT NULL,
	"quote_amount" numeric(10, 2),
	"quote_breakdown" jsonb,
	"payment_status" "booking_payment_status" DEFAULT 'pending' NOT NULL,
	"payment_reference" text,
	"payment_provider" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "checklist_completions" (
	"id" serial PRIMARY KEY NOT NULL,
	"job_id" integer NOT NULL,
	"checklist_id" integer NOT NULL,
	"completed_items" jsonb NOT NULL,
	"completed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cleaner_availability" (
	"id" serial PRIMARY KEY NOT NULL,
	"cleaner_id" integer NOT NULL,
	"weekday" integer NOT NULL,
	"start_time" time NOT NULL,
	"end_time" time NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cleaner_jobs" (
	"id" serial PRIMARY KEY NOT NULL,
	"booking_id" integer NOT NULL,
	"assigned_cleaner_id" integer,
	"assigned_company_id" integer,
	"status" "job_status" DEFAULT 'unassigned' NOT NULL,
	"job_type" "job_type" DEFAULT 'post_checkout' NOT NULL,
	"payout_amount" numeric(10, 2) NOT NULL,
	"scheduled_date" timestamp NOT NULL,
	"checklist" jsonb,
	"notes" text,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cleaner_time_off" (
	"id" serial PRIMARY KEY NOT NULL,
	"cleaner_id" integer NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cleaning_checklists" (
	"id" serial PRIMARY KEY NOT NULL,
	"property_id" integer NOT NULL,
	"name" text NOT NULL,
	"items" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "job_photos" (
	"id" serial PRIMARY KEY NOT NULL,
	"job_id" integer NOT NULL,
	"cleaner_id" integer NOT NULL,
	"type" "photo_type" NOT NULL,
	"url" text NOT NULL,
	"caption" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"job_id" integer,
	"type" "payment_type" NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"status" "payment_status" DEFAULT 'pending' NOT NULL,
	"description" text,
	"paid_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "properties" (
	"id" serial PRIMARY KEY NOT NULL,
	"host_id" integer NOT NULL,
	"name" text NOT NULL,
	"address" text NOT NULL,
	"city" text DEFAULT 'Austin' NOT NULL,
	"state" text DEFAULT 'TX' NOT NULL,
	"zip" text NOT NULL,
	"latitude" numeric(10, 7),
	"longitude" numeric(10, 7),
	"airbnb_property_id" text,
	"ical_url" text,
	"last_sync_at" timestamp,
	"last_sync_status" text,
	"last_sync_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sync_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"property_id" integer,
	"source" text NOT NULL,
	"status" text NOT NULL,
	"message" text,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" "user_role" DEFAULT 'host' NOT NULL,
	"company_id" integer,
	"phone" text,
	"avatar" text,
	"email_verified" boolean DEFAULT false NOT NULL,
	"email_verification_token" text,
	"email_verification_sent_at" timestamp,
	"stripe_customer_id" text,
	"stripe_subscription_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_target_user_id_users_id_fk" FOREIGN KEY ("target_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checklist_completions" ADD CONSTRAINT "checklist_completions_job_id_cleaner_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."cleaner_jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checklist_completions" ADD CONSTRAINT "checklist_completions_checklist_id_cleaning_checklists_id_fk" FOREIGN KEY ("checklist_id") REFERENCES "public"."cleaning_checklists"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cleaner_availability" ADD CONSTRAINT "cleaner_availability_cleaner_id_users_id_fk" FOREIGN KEY ("cleaner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cleaner_jobs" ADD CONSTRAINT "cleaner_jobs_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cleaner_jobs" ADD CONSTRAINT "cleaner_jobs_assigned_cleaner_id_users_id_fk" FOREIGN KEY ("assigned_cleaner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cleaner_jobs" ADD CONSTRAINT "cleaner_jobs_assigned_company_id_users_id_fk" FOREIGN KEY ("assigned_company_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cleaner_time_off" ADD CONSTRAINT "cleaner_time_off_cleaner_id_users_id_fk" FOREIGN KEY ("cleaner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cleaning_checklists" ADD CONSTRAINT "cleaning_checklists_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_photos" ADD CONSTRAINT "job_photos_job_id_cleaner_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."cleaner_jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_photos" ADD CONSTRAINT "job_photos_cleaner_id_users_id_fk" FOREIGN KEY ("cleaner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_job_id_cleaner_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."cleaner_jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "properties" ADD CONSTRAINT "properties_host_id_users_id_fk" FOREIGN KEY ("host_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sync_logs" ADD CONSTRAINT "sync_logs_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE no action ON UPDATE no action;