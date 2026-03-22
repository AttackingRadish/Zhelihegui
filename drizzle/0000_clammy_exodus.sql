CREATE TABLE "health_check" (
	"id" serial NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "risk_alerts" (
	"id" serial PRIMARY KEY NOT NULL,
	"shipment_id" integer NOT NULL,
	"risk_prediction_id" integer,
	"alert_type" text NOT NULL,
	"severity" text NOT NULL,
	"message" text NOT NULL,
	"detail" jsonb,
	"is_read" boolean DEFAULT false NOT NULL,
	"is_handled" boolean DEFAULT false NOT NULL,
	"handled_at" timestamp with time zone,
	"handle_action" text,
	"alerted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "risk_predictions" (
	"id" serial PRIMARY KEY NOT NULL,
	"shipment_id" integer NOT NULL,
	"prediction_time" timestamp with time zone NOT NULL,
	"prediction_window" integer NOT NULL,
	"risk_level" text NOT NULL,
	"risk_score" numeric(3, 2) NOT NULL,
	"temperature_deviation" numeric(5, 2),
	"confidence" numeric(3, 2) NOT NULL,
	"factors" jsonb NOT NULL,
	"recommendations" jsonb,
	"is_realized" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shipment_devices" (
	"id" serial PRIMARY KEY NOT NULL,
	"shipment_id" integer NOT NULL,
	"device_id" text NOT NULL,
	"device_type" text NOT NULL,
	"device_name" text,
	"status" text DEFAULT 'active' NOT NULL,
	"assigned_at" timestamp with time zone DEFAULT now() NOT NULL,
	"detached_at" timestamp with time zone,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "shipment_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"shipment_id" integer NOT NULL,
	"event_type" text NOT NULL,
	"event_title" text NOT NULL,
	"description" text,
	"event_data" jsonb,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL,
	"triggered_by" text
);
--> statement-breakpoint
CREATE TABLE "shipment_locations" (
	"id" serial PRIMARY KEY NOT NULL,
	"shipment_id" integer NOT NULL,
	"latitude" numeric(10, 8) NOT NULL,
	"longitude" numeric(11, 8) NOT NULL,
	"address" text,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL,
	"speed" numeric(6, 2),
	"heading" numeric(5, 2),
	"device_id" text
);
--> statement-breakpoint
CREATE TABLE "shipment_status_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"shipment_id" integer NOT NULL,
	"from_status" text,
	"to_status" text NOT NULL,
	"reason" text,
	"changed_by" integer,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "shipment_tags" (
	"id" serial PRIMARY KEY NOT NULL,
	"shipment_id" integer NOT NULL,
	"tag_name" text NOT NULL,
	"tag_color" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shipments" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"shipment_number" text NOT NULL,
	"product" text,
	"product_type" text NOT NULL,
	"quantity" integer NOT NULL,
	"origin" text NOT NULL,
	"destination" text NOT NULL,
	"departure_time" timestamp with time zone NOT NULL,
	"estimated_arrival_time" timestamp with time zone,
	"actual_arrival_time" timestamp with time zone,
	"route" jsonb,
	"packaging" text NOT NULL,
	"temperature_requirement" numeric(5, 2) NOT NULL,
	"current_temperature" numeric(5, 2),
	"current_humidity" numeric(5, 2),
	"customer_id" integer,
	"status" text DEFAULT 'pending' NOT NULL,
	"risk_level" text DEFAULT 'low' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "shipments_shipment_number_unique" UNIQUE("shipment_number")
);
--> statement-breakpoint
CREATE TABLE "team_members" (
	"id" serial PRIMARY KEY NOT NULL,
	"team_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "teams" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"created_by" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "temperature_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"shipment_id" integer NOT NULL,
	"temperature" numeric(5, 2) NOT NULL,
	"humidity" numeric(5, 2),
	"location" jsonb,
	"weather_condition" text,
	"traffic_condition" text,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL,
	"device_id" text,
	"is_anomaly" boolean DEFAULT false NOT NULL,
	"anomaly_score" numeric(3, 2)
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"company" text NOT NULL,
	"phone" text,
	"plan" text DEFAULT 'basic' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "risk_alerts" ADD CONSTRAINT "risk_alerts_shipment_id_shipments_id_fk" FOREIGN KEY ("shipment_id") REFERENCES "public"."shipments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "risk_alerts" ADD CONSTRAINT "risk_alerts_risk_prediction_id_risk_predictions_id_fk" FOREIGN KEY ("risk_prediction_id") REFERENCES "public"."risk_predictions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "risk_predictions" ADD CONSTRAINT "risk_predictions_shipment_id_shipments_id_fk" FOREIGN KEY ("shipment_id") REFERENCES "public"."shipments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipment_devices" ADD CONSTRAINT "shipment_devices_shipment_id_shipments_id_fk" FOREIGN KEY ("shipment_id") REFERENCES "public"."shipments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipment_events" ADD CONSTRAINT "shipment_events_shipment_id_shipments_id_fk" FOREIGN KEY ("shipment_id") REFERENCES "public"."shipments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipment_locations" ADD CONSTRAINT "shipment_locations_shipment_id_shipments_id_fk" FOREIGN KEY ("shipment_id") REFERENCES "public"."shipments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipment_status_history" ADD CONSTRAINT "shipment_status_history_shipment_id_shipments_id_fk" FOREIGN KEY ("shipment_id") REFERENCES "public"."shipments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipment_status_history" ADD CONSTRAINT "shipment_status_history_changed_by_users_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipment_tags" ADD CONSTRAINT "shipment_tags_shipment_id_shipments_id_fk" FOREIGN KEY ("shipment_id") REFERENCES "public"."shipments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teams" ADD CONSTRAINT "teams_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "temperature_records" ADD CONSTRAINT "temperature_records_shipment_id_shipments_id_fk" FOREIGN KEY ("shipment_id") REFERENCES "public"."shipments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "risk_alerts_shipment_id_idx" ON "risk_alerts" USING btree ("shipment_id");--> statement-breakpoint
CREATE INDEX "risk_alerts_risk_prediction_id_idx" ON "risk_alerts" USING btree ("risk_prediction_id");--> statement-breakpoint
CREATE INDEX "risk_alerts_severity_idx" ON "risk_alerts" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "risk_alerts_is_read_idx" ON "risk_alerts" USING btree ("is_read");--> statement-breakpoint
CREATE INDEX "risk_predictions_shipment_id_idx" ON "risk_predictions" USING btree ("shipment_id");--> statement-breakpoint
CREATE INDEX "risk_predictions_prediction_time_idx" ON "risk_predictions" USING btree ("prediction_time");--> statement-breakpoint
CREATE INDEX "risk_predictions_risk_level_idx" ON "risk_predictions" USING btree ("risk_level");--> statement-breakpoint
CREATE INDEX "shipment_devices_shipment_id_idx" ON "shipment_devices" USING btree ("shipment_id");--> statement-breakpoint
CREATE INDEX "shipment_devices_device_id_idx" ON "shipment_devices" USING btree ("device_id");--> statement-breakpoint
CREATE INDEX "shipment_devices_status_idx" ON "shipment_devices" USING btree ("status");--> statement-breakpoint
CREATE INDEX "shipment_events_shipment_id_idx" ON "shipment_events" USING btree ("shipment_id");--> statement-breakpoint
CREATE INDEX "shipment_events_timestamp_idx" ON "shipment_events" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "shipment_events_event_type_idx" ON "shipment_events" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "shipment_locations_shipment_id_idx" ON "shipment_locations" USING btree ("shipment_id");--> statement-breakpoint
CREATE INDEX "shipment_locations_timestamp_idx" ON "shipment_locations" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "shipment_locations_device_id_idx" ON "shipment_locations" USING btree ("device_id");--> statement-breakpoint
CREATE INDEX "shipment_status_history_shipment_id_idx" ON "shipment_status_history" USING btree ("shipment_id");--> statement-breakpoint
CREATE INDEX "shipment_status_history_timestamp_idx" ON "shipment_status_history" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "shipment_status_history_to_status_idx" ON "shipment_status_history" USING btree ("to_status");--> statement-breakpoint
CREATE INDEX "shipment_tags_shipment_id_idx" ON "shipment_tags" USING btree ("shipment_id");--> statement-breakpoint
CREATE INDEX "shipment_tags_tag_name_idx" ON "shipment_tags" USING btree ("tag_name");--> statement-breakpoint
CREATE INDEX "shipments_user_id_idx" ON "shipments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "shipments_status_idx" ON "shipments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "shipments_departure_time_idx" ON "shipments" USING btree ("departure_time");--> statement-breakpoint
CREATE INDEX "shipments_shipment_number_idx" ON "shipments" USING btree ("shipment_number");--> statement-breakpoint
CREATE INDEX "team_members_team_id_idx" ON "team_members" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "team_members_user_id_idx" ON "team_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "team_members_role_idx" ON "team_members" USING btree ("role");--> statement-breakpoint
CREATE INDEX "team_members_team_user_idx" ON "team_members" USING btree ("team_id","user_id");--> statement-breakpoint
CREATE INDEX "teams_name_idx" ON "teams" USING btree ("name");--> statement-breakpoint
CREATE INDEX "teams_created_by_idx" ON "teams" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "temperature_records_shipment_id_idx" ON "temperature_records" USING btree ("shipment_id");--> statement-breakpoint
CREATE INDEX "temperature_records_timestamp_idx" ON "temperature_records" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "temperature_records_device_id_idx" ON "temperature_records" USING btree ("device_id");--> statement-breakpoint
CREATE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "users_status_idx" ON "users" USING btree ("status");