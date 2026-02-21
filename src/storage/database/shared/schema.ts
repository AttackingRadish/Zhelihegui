import { pgTable, serial, timestamp, text, integer, decimal, boolean, jsonb, index } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

// System table - DO NOT DELETE OR MODIFY
export const healthCheck = pgTable("health_check", {
	id: serial().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

// Users table
export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    email: text("email").notNull().unique(),
    name: text("name").notNull(),
    company: text("company").notNull(),
    phone: text("phone"),
    plan: text("plan").notNull().default("basic"),
    status: text("status").notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
  },
  (table) => [
    index("users_email_idx").on(table.email),
    index("users_status_idx").on(table.status),
  ]
);

// Shipments table
export const shipments = pgTable(
  "shipments",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").references(() => users.id, { onDelete: 'cascade' }),
    shipmentNumber: text("shipment_number").notNull().unique(),
    product: text("product"),
    productType: text("product_type").notNull(),
    quantity: integer("quantity").notNull(),
    origin: text("origin").notNull(),
    destination: text("destination").notNull(),
    departureTime: timestamp("departure_time", { withTimezone: true, mode: 'string' }).notNull(),
    estimatedArrivalTime: timestamp("estimated_arrival_time", { withTimezone: true, mode: 'string' }),
    actualArrivalTime: timestamp("actual_arrival_time", { withTimezone: true, mode: 'string' }),
    route: jsonb("route"),
    packaging: text("packaging").notNull(),
    temperatureRequirement: decimal("temperature_requirement", { precision: 5, scale: 2 }).notNull(),
    currentTemperature: decimal("current_temperature", { precision: 5, scale: 2 }),
    currentHumidity: decimal("current_humidity", { precision: 5, scale: 2 }),
    customerId: integer("customer_id"),
    status: text("status").notNull().default("pending"),
    riskLevel: text("risk_level").notNull().default("low"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
  },
  (table) => [
    index("shipments_user_id_idx").on(table.userId),
    index("shipments_status_idx").on(table.status),
    index("shipments_departure_time_idx").on(table.departureTime),
    index("shipments_shipment_number_idx").on(table.shipmentNumber),
  ]
);

// Temperature records table
export const temperatureRecords = pgTable(
  "temperature_records",
  {
    id: serial("id").primaryKey(),
    shipmentId: integer("shipment_id").notNull().references(() => shipments.id, { onDelete: 'cascade' }),
    temperature: decimal("temperature", { precision: 5, scale: 2 }).notNull(),
    humidity: decimal("humidity", { precision: 5, scale: 2 }),
    location: jsonb("location"),
    weatherCondition: text("weather_condition"),
    trafficCondition: text("traffic_condition"),
    timestamp: timestamp("timestamp", { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
    deviceId: text("device_id"),
    isAnomaly: boolean("is_anomaly").notNull().default(false),
    anomalyScore: decimal("anomaly_score", { precision: 3, scale: 2 }),
  },
  (table) => [
    index("temperature_records_shipment_id_idx").on(table.shipmentId),
    index("temperature_records_timestamp_idx").on(table.timestamp),
    index("temperature_records_device_id_idx").on(table.deviceId),
  ]
);

// Risk predictions table
export const riskPredictions = pgTable(
  "risk_predictions",
  {
    id: serial("id").primaryKey(),
    shipmentId: integer("shipment_id").notNull().references(() => shipments.id, { onDelete: 'cascade' }),
    predictionTime: timestamp("prediction_time", { withTimezone: true, mode: 'string' }).notNull(),
    predictionWindow: integer("prediction_window").notNull(),
    riskLevel: text("risk_level").notNull(),
    riskScore: decimal("risk_score", { precision: 3, scale: 2 }).notNull(),
    temperatureDeviation: decimal("temperature_deviation", { precision: 5, scale: 2 }),
    confidence: decimal("confidence", { precision: 3, scale: 2 }).notNull(),
    factors: jsonb("factors").notNull(),
    recommendations: jsonb("recommendations"),
    isRealized: boolean("is_realized").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
  },
  (table) => [
    index("risk_predictions_shipment_id_idx").on(table.shipmentId),
    index("risk_predictions_prediction_time_idx").on(table.predictionTime),
    index("risk_predictions_risk_level_idx").on(table.riskLevel),
  ]
);

// Risk alerts table
export const riskAlerts = pgTable(
  "risk_alerts",
  {
    id: serial("id").primaryKey(),
    shipmentId: integer("shipment_id").notNull().references(() => shipments.id, { onDelete: 'cascade' }),
    riskPredictionId: integer("risk_prediction_id").references(() => riskPredictions.id, { onDelete: 'set null' }),
    alertType: text("alert_type").notNull(),
    severity: text("severity").notNull(),
    message: text("message").notNull(),
    detail: jsonb("detail"),
    isRead: boolean("is_read").notNull().default(false),
    isHandled: boolean("is_handled").notNull().default(false),
    handledAt: timestamp("handled_at", { withTimezone: true, mode: 'string' }),
    handleAction: text("handle_action"),
    alertedAt: timestamp("alerted_at", { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
  },
  (table) => [
    index("risk_alerts_shipment_id_idx").on(table.shipmentId),
    index("risk_alerts_risk_prediction_id_idx").on(table.riskPredictionId),
    index("risk_alerts_severity_idx").on(table.severity),
    index("risk_alerts_is_read_idx").on(table.isRead),
  ]
);

// Shipment status history table - 批次状态历史
export const shipmentStatusHistory = pgTable(
  "shipment_status_history",
  {
    id: serial("id").primaryKey(),
    shipmentId: integer("shipment_id").notNull().references(() => shipments.id, { onDelete: 'cascade' }),
    fromStatus: text("from_status"),
    toStatus: text("to_status").notNull(),
    reason: text("reason"),
    changedBy: integer("changed_by").references(() => users.id),
    timestamp: timestamp("timestamp", { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
    metadata: jsonb("metadata"),
  },
  (table) => [
    index("shipment_status_history_shipment_id_idx").on(table.shipmentId),
    index("shipment_status_history_timestamp_idx").on(table.timestamp),
    index("shipment_status_history_to_status_idx").on(table.toStatus),
  ]
);

// Shipment locations table - 批次位置追踪
export const shipmentLocations = pgTable(
  "shipment_locations",
  {
    id: serial("id").primaryKey(),
    shipmentId: integer("shipment_id").notNull().references(() => shipments.id, { onDelete: 'cascade' }),
    latitude: decimal("latitude", { precision: 10, scale: 8 }).notNull(),
    longitude: decimal("longitude", { precision: 11, scale: 8 }).notNull(),
    address: text("address"),
    timestamp: timestamp("timestamp", { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
    speed: decimal("speed", { precision: 6, scale: 2 }),
    heading: decimal("heading", { precision: 5, scale: 2 }),
    deviceId: text("device_id"),
  },
  (table) => [
    index("shipment_locations_shipment_id_idx").on(table.shipmentId),
    index("shipment_locations_timestamp_idx").on(table.timestamp),
    index("shipment_locations_device_id_idx").on(table.deviceId),
  ]
);

// Shipment events table - 批次事件日志
export const shipmentEvents = pgTable(
  "shipment_events",
  {
    id: serial("id").primaryKey(),
    shipmentId: integer("shipment_id").notNull().references(() => shipments.id, { onDelete: 'cascade' }),
    eventType: text("event_type").notNull(),
    eventTitle: text("event_title").notNull(),
    description: text("description"),
    eventData: jsonb("event_data"),
    timestamp: timestamp("timestamp", { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
    triggeredBy: text("triggered_by"),
  },
  (table) => [
    index("shipment_events_shipment_id_idx").on(table.shipmentId),
    index("shipment_events_timestamp_idx").on(table.timestamp),
    index("shipment_events_event_type_idx").on(table.eventType),
  ]
);

// Shipment tags table - 批次标签
export const shipmentTags = pgTable(
  "shipment_tags",
  {
    id: serial("id").primaryKey(),
    shipmentId: integer("shipment_id").notNull().references(() => shipments.id, { onDelete: 'cascade' }),
    tagName: text("tag_name").notNull(),
    tagColor: text("tag_color"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
  },
  (table) => [
    index("shipment_tags_shipment_id_idx").on(table.shipmentId),
    index("shipment_tags_tag_name_idx").on(table.tagName),
  ]
);

// Shipment devices table - 批次设备关联
export const shipmentDevices = pgTable(
  "shipment_devices",
  {
    id: serial("id").primaryKey(),
    shipmentId: integer("shipment_id").notNull().references(() => shipments.id, { onDelete: 'cascade' }),
    deviceId: text("device_id").notNull(),
    deviceType: text("device_type").notNull(),
    deviceName: text("device_name"),
    status: text("status").notNull().default("active"),
    assignedAt: timestamp("assigned_at", { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
    detachedAt: timestamp("detached_at", { withTimezone: true, mode: 'string' }),
    metadata: jsonb("metadata"),
  },
  (table) => [
    index("shipment_devices_shipment_id_idx").on(table.shipmentId),
    index("shipment_devices_device_id_idx").on(table.deviceId),
    index("shipment_devices_status_idx").on(table.status),
  ]
);
