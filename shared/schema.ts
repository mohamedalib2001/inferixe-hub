import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, date, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export * from "./models/auth";
import { type UserRole } from "./models/auth";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull(),
  fullName: text("full_name").notNull(),
  fullNameAr: text("full_name_ar"),
  role: text("role").$type<UserRole>().notNull().default("employee"),
  avatar: text("avatar"),
  isActive: boolean("is_active").notNull().default(true),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  fullName: true,
  fullNameAr: true,
  role: true,
  avatar: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const departments = pgTable("departments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  nameAr: text("name_ar").notNull(),
  managerId: varchar("manager_id"),
  isActive: boolean("is_active").notNull().default(true),
});

export const insertDepartmentSchema = createInsertSchema(departments).omit({ id: true });
export type InsertDepartment = z.infer<typeof insertDepartmentSchema>;
export type Department = typeof departments.$inferSelect;

export const employees = pgTable("employees", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeNumber: varchar("employee_number").notNull().unique(),
  fullName: text("full_name").notNull(),
  fullNameAr: text("full_name_ar"),
  email: text("email").notNull(),
  phone: text("phone"),
  departmentId: varchar("department_id"),
  position: text("position"),
  positionAr: text("position_ar"),
  hireDate: date("hire_date"),
  salary: integer("salary"),
  status: text("status").$type<"active" | "inactive" | "terminated">().default("active"),
  avatar: text("avatar"),
  userId: varchar("user_id"),
  bankName: text("bank_name"),
  bankNameAr: text("bank_name_ar"),
  ibanNumber: text("iban_number"),
  bankCode: text("bank_code"),
  bankAccountNumber: text("bank_account_number"),
  nationalId: text("national_id"),
  bankCurrency: text("bank_currency").default("SAR"),
});

export const insertEmployeeSchema = createInsertSchema(employees).omit({ id: true });
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;
export type Employee = typeof employees.$inferSelect;

export const attendance = pgTable("attendance", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: varchar("employee_id").notNull(),
  date: date("date").notNull(),
  checkIn: text("check_in"),
  checkOut: text("check_out"),
  status: text("status").$type<"present" | "absent" | "late" | "leave">().default("present"),
  notes: text("notes"),
});

export const insertAttendanceSchema = createInsertSchema(attendance).omit({ id: true });
export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;
export type Attendance = typeof attendance.$inferSelect;

// Request types grouped by category
export type RequestType = 
  // Attendance & Leave
  | "leave" | "vacation" | "extend_vacation" | "absence" | "escape"
  // Work Status
  | "start_work_new" | "start_work_return" | "last_day_vacation" | "last_day_end_service"
  // Payroll Related
  | "salary_increase" | "advance" | "bonus" | "late_fine" | "deduction" | "addition_hours" | "addition_days"
  // HR & Compliance
  | "complaint" | "evaluation" | "objection" | "disciplinary" | "clearance" | "update_data" | "letters"
  // Operations
  | "transfer" | "employee_guarantee" | "desire_workers" | "data_sim"
  // General
  | "maintenance" | "certificate" | "expense" | "other";

// Subtype for requests that need additional categorization
export type RequestSubtype = 
  | "new_employee" | "after_vacation"  // for start_work
  | "vacation_leave" | "end_of_service" // for last_day
  | null;

export type RequestStatus = "pending" | "approved" | "rejected" | "in_progress";

export const requests = pgTable("requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: text("type").$type<RequestType>().notNull(),
  subtype: text("subtype").$type<RequestSubtype>(),
  title: text("title").notNull(),
  titleAr: text("title_ar"),
  description: text("description"),
  requesterId: varchar("requester_id").notNull(), // User who submitted the request
  targetEmployeeId: varchar("target_employee_id"), // Employee the request is for (null = same as requester)
  status: text("status").$type<RequestStatus>().default("pending"),
  priority: text("priority").$type<"low" | "medium" | "high">().default("medium"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at"),
  approvedBy: varchar("approved_by"),
  startDate: date("start_date"),
  endDate: date("end_date"),
  // Additional fields for specific request types
  amount: text("amount"), // For salary/financial requests
  days: integer("days"), // For leave/addition days
  hours: text("hours"), // For hour-based requests
  reason: text("reason"), // Detailed reason
  attachmentUrl: text("attachment_url"), // For documents
});

export const insertRequestSchema = createInsertSchema(requests).omit({ id: true });
export type InsertRequest = z.infer<typeof insertRequestSchema>;
export type Request = typeof requests.$inferSelect;

export const vehicles = pgTable("vehicles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  plateNumber: text("plate_number").notNull().unique(),
  make: text("make").notNull(),
  model: text("model").notNull(),
  year: integer("year"),
  color: text("color"),
  type: text("type").$type<"sedan" | "suv" | "truck" | "van" | "bus">().default("sedan"),
  status: text("status").$type<"available" | "in_use" | "maintenance" | "retired">().default("available"),
  assignedDriverId: varchar("assigned_driver_id"),
  lastMaintenanceDate: date("last_maintenance_date"),
  nextMaintenanceDate: date("next_maintenance_date"),
  mileage: integer("mileage"),
});

export const insertVehicleSchema = createInsertSchema(vehicles).omit({ id: true });
export type InsertVehicle = z.infer<typeof insertVehicleSchema>;
export type Vehicle = typeof vehicles.$inferSelect;

export const drivers = pgTable("drivers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: varchar("employee_id").notNull(),
  licenseNumber: text("license_number").notNull(),
  licenseExpiry: date("license_expiry"),
  licenseType: text("license_type"),
  status: text("status").$type<"active" | "inactive" | "suspended">().default("active"),
  violations: integer("violations").default(0),
});

export const insertDriverSchema = createInsertSchema(drivers).omit({ id: true });
export type InsertDriver = z.infer<typeof insertDriverSchema>;
export type Driver = typeof drivers.$inferSelect;

export const employeeDocuments = pgTable("employee_documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: varchar("employee_id").notNull(),
  name: text("name").notNull(),
  nameAr: text("name_ar"),
  type: text("type").$type<"id_card" | "passport" | "license" | "certificate" | "contract" | "other">().notNull(),
  fileUrl: text("file_url"),
  expiryDate: date("expiry_date"),
  issuedDate: date("issued_date"),
  notes: text("notes"),
  uploadedAt: text("uploaded_at").notNull(),
});

export const insertEmployeeDocumentSchema = createInsertSchema(employeeDocuments).omit({ id: true });
export type InsertEmployeeDocument = z.infer<typeof insertEmployeeDocumentSchema>;
export type EmployeeDocument = typeof employeeDocuments.$inferSelect;

export interface DashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  pendingRequests: number;
  totalVehicles: number;
  availableVehicles: number;
  todayAttendance: number;
  attendanceRate: number;
  activeDrivers: number;
}

// Biometric Face Recognition Tables
export type BiometricEnrollmentStatus = "pending" | "active" | "suspended" | "expired";
export type LivenessVerdict = "passed" | "failed" | "inconclusive";
export type BiometricEventType = "check_in" | "check_out";

export const biometricEnrollments = pgTable("biometric_enrollments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: varchar("employee_id").notNull(),
  faceEmbedding: text("face_embedding"),
  status: text("status").$type<BiometricEnrollmentStatus>().default("pending"),
  enrolledAt: text("enrolled_at").notNull(),
  updatedAt: text("updated_at"),
  expiresAt: text("expires_at"),
  consentGiven: boolean("consent_given").notNull().default(false),
  deviceInfo: text("device_info"),
});

export const insertBiometricEnrollmentSchema = createInsertSchema(biometricEnrollments).omit({ id: true });
export type InsertBiometricEnrollment = z.infer<typeof insertBiometricEnrollmentSchema>;
export type BiometricEnrollment = typeof biometricEnrollments.$inferSelect;

export const biometricAttendanceEvents = pgTable("biometric_attendance_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: varchar("employee_id").notNull(),
  branchId: varchar("branch_id"),
  eventType: text("event_type").$type<BiometricEventType>().notNull(),
  timestamp: text("timestamp").notNull(),
  confidenceScore: integer("confidence_score"),
  livenessVerdict: text("liveness_verdict").$type<LivenessVerdict>().default("inconclusive"),
  spoofScore: integer("spoof_score"),
  blinkDetected: boolean("blink_detected").default(false),
  headMovementDetected: boolean("head_movement_detected").default(false),
  deviceInfo: text("device_info"),
  ipAddress: text("ip_address"),
  locationData: text("location_data"),
  latitude: real("latitude"),
  longitude: real("longitude"),
  locationAccuracy: real("location_accuracy"),
  distanceFromBranch: real("distance_from_branch"),
  isMobileDevice: boolean("is_mobile_device").default(false),
  verified: boolean("verified").notNull().default(false),
  linkedAttendanceId: varchar("linked_attendance_id"),
  notes: text("notes"),
});

export const insertBiometricAttendanceEventSchema = createInsertSchema(biometricAttendanceEvents).omit({ id: true });
export type InsertBiometricAttendanceEvent = z.infer<typeof insertBiometricAttendanceEventSchema>;
export type BiometricAttendanceEvent = typeof biometricAttendanceEvents.$inferSelect;

// Branches/Locations Table for Geofenced Attendance
export const branches = pgTable("branches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  nameAr: text("name_ar").notNull(),
  code: varchar("code").notNull().unique(),
  address: text("address"),
  addressAr: text("address_ar"),
  latitude: real("latitude"),
  longitude: real("longitude"),
  radiusMeters: integer("radius_meters").default(100),
  isActive: boolean("is_active").notNull().default(true),
  kioskEnabled: boolean("kiosk_enabled").notNull().default(false),
  kioskToken: text("kiosk_token"),
  mobileAttendanceEnabled: boolean("mobile_attendance_enabled").notNull().default(false),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at"),
});

export const insertBranchSchema = createInsertSchema(branches).omit({ id: true });
export type InsertBranch = z.infer<typeof insertBranchSchema>;
export type Branch = typeof branches.$inferSelect;

// Employee-Branch Assignments
export const employeeBranches = pgTable("employee_branches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: varchar("employee_id").notNull(),
  branchId: varchar("branch_id").notNull(),
  isPrimary: boolean("is_primary").notNull().default(false),
  mobileAttendanceAllowed: boolean("mobile_attendance_allowed").notNull().default(false),
  assignedAt: text("assigned_at").notNull(),
});

export const insertEmployeeBranchSchema = createInsertSchema(employeeBranches).omit({ id: true });
export type InsertEmployeeBranch = z.infer<typeof insertEmployeeBranchSchema>;
export type EmployeeBranch = typeof employeeBranches.$inferSelect;

// Vehicle Events/Requests Table for comprehensive vehicle tracking
export type VehicleEventType = "accident" | "receipt" | "sale" | "maintenance" | "oil_change" | "assignment" | "return" | "inspection" | "fuel" | "insurance" | "registration" | "tire_change" | "other";
export type VehicleEventStatus = "pending" | "in_progress" | "completed" | "cancelled";

export const vehicleEvents = pgTable("vehicle_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vehicleId: varchar("vehicle_id").notNull(),
  eventType: text("event_type").$type<VehicleEventType>().notNull(),
  title: text("title").notNull(),
  titleAr: text("title_ar"),
  description: text("description"),
  descriptionAr: text("description_ar"),
  status: text("status").$type<VehicleEventStatus>().default("pending"),
  priority: text("priority").$type<"low" | "medium" | "high" | "urgent">().default("medium"),
  driverId: varchar("driver_id"),
  employeeId: varchar("employee_id"),
  cost: integer("cost"),
  mileageAtEvent: integer("mileage_at_event"),
  location: text("location"),
  locationAr: text("location_ar"),
  scheduledDate: date("scheduled_date"),
  completedDate: date("completed_date"),
  notes: text("notes"),
  notesAr: text("notes_ar"),
  attachments: text("attachments"),
  createdBy: varchar("created_by").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at"),
});

export const insertVehicleEventSchema = createInsertSchema(vehicleEvents).omit({ id: true });
export type InsertVehicleEvent = z.infer<typeof insertVehicleEventSchema>;
export type VehicleEvent = typeof vehicleEvents.$inferSelect;

// Vehicle Driver Assignment History
export const vehicleDriverHistory = pgTable("vehicle_driver_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vehicleId: varchar("vehicle_id").notNull(),
  driverId: varchar("driver_id").notNull(),
  assignedBy: varchar("assigned_by").notNull(),
  assignedAt: text("assigned_at").notNull(),
  returnedAt: text("returned_at"),
  returnedBy: varchar("returned_by"),
  mileageAtAssignment: integer("mileage_at_assignment"),
  mileageAtReturn: integer("mileage_at_return"),
  notes: text("notes"),
  notesAr: text("notes_ar"),
});

export const insertVehicleDriverHistorySchema = createInsertSchema(vehicleDriverHistory).omit({ id: true });
export type InsertVehicleDriverHistory = z.infer<typeof insertVehicleDriverHistorySchema>;
export type VehicleDriverHistory = typeof vehicleDriverHistory.$inferSelect;

// ==================== Commercial Contracts Management ====================

export type ContractType = "commercial_lease" | "unit_lease" | "long_term_lease" | "other";
export type ContractStatus = "draft" | "pending_review" | "active" | "expired" | "terminated" | "renewed";
export type PartyType = "lessor" | "lessee";
export type PaymentStatus = "pending" | "paid" | "overdue" | "cancelled";

// Main Contracts Table
export const contracts = pgTable("contracts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contractNumber: varchar("contract_number").notNull().unique(),
  type: text("type").$type<ContractType>().notNull().default("commercial_lease"),
  status: text("status").$type<ContractStatus>().notNull().default("draft"),
  
  // Contract Dates
  signingDate: date("signing_date"),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  durationDays: integer("duration_days"),
  signingLocation: text("signing_location"),
  signingLocationAr: text("signing_location_ar"),
  
  // Contract Details
  title: text("title").notNull(),
  titleAr: text("title_ar"),
  description: text("description"),
  descriptionAr: text("description_ar"),
  
  // Financial Information
  annualRent: integer("annual_rent"),
  totalContractValue: integer("total_contract_value"),
  deposit: integer("deposit"),
  securityAmount: integer("security_amount"),
  vatPercentage: real("vat_percentage").default(15),
  vatAmount: integer("vat_amount"),
  publicServicesAmount: integer("public_services_amount"),
  paymentCycleMonths: integer("payment_cycle_months").default(1),
  totalPayments: integer("total_payments"),
  
  // Property Information (linked separately)
  propertyId: varchar("property_id"),
  unitId: varchar("unit_id"),
  
  // Document Storage
  originalDocumentUrl: text("original_document_url"),
  extractedData: text("extracted_data"), // JSON from AI extraction
  aiConfidenceScore: integer("ai_confidence_score"),
  isAiExtracted: boolean("is_ai_extracted").default(false),
  needsReview: boolean("needs_review").default(true),
  
  // Obligations
  lessorObligations: text("lessor_obligations"),
  lessorObligationsAr: text("lessor_obligations_ar"),
  lesseeObligations: text("lessee_obligations"),
  lesseeObligationsAr: text("lessee_obligations_ar"),
  generalTerms: text("general_terms"),
  generalTermsAr: text("general_terms_ar"),
  suspensionCondition: text("suspension_condition"),
  suspensionConditionAr: text("suspension_condition_ar"),
  
  // Audit
  createdBy: varchar("created_by").notNull(),
  reviewedBy: varchar("reviewed_by"),
  approvedBy: varchar("approved_by"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at"),
  reviewedAt: text("reviewed_at"),
  approvedAt: text("approved_at"),
});

export const insertContractSchema = createInsertSchema(contracts).omit({ id: true });
export type InsertContract = z.infer<typeof insertContractSchema>;
export type Contract = typeof contracts.$inferSelect;

// Contract Parties (Lessor/Lessee)
export const contractParties = pgTable("contract_parties", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contractId: varchar("contract_id").notNull(),
  partyType: text("party_type").$type<PartyType>().notNull(),
  
  // Organization Details
  organizationName: text("organization_name"),
  organizationNameAr: text("organization_name_ar"),
  organizationType: text("organization_type"),
  commercialRegistrationNumber: text("commercial_registration_number"),
  unifiedNumber: text("unified_number"),
  registrationDate: date("registration_date"),
  
  // Representative Details
  representativeName: text("representative_name").notNull(),
  representativeNameAr: text("representative_name_ar"),
  nationality: text("nationality"),
  identityType: text("identity_type"),
  identityNumber: text("identity_number"),
  email: text("email"),
  phone: text("phone"),
  nationalAddress: text("national_address"),
  nationalAddressAr: text("national_address_ar"),
  
  createdAt: text("created_at").notNull(),
});

export const insertContractPartySchema = createInsertSchema(contractParties).omit({ id: true });
export type InsertContractParty = z.infer<typeof insertContractPartySchema>;
export type ContractParty = typeof contractParties.$inferSelect;

// Properties (Buildings)
export const properties = pgTable("properties", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  nationalAddress: text("national_address").notNull(),
  nationalAddressAr: text("national_address_ar"),
  usageType: text("usage_type").default("commercial"),
  buildingType: text("building_type"),
  buildingTypeAr: text("building_type_ar"),
  totalUnits: integer("total_units"),
  totalFloors: integer("total_floors"),
  parkingSpaces: integer("parking_spaces"),
  elevatorCount: integer("elevator_count"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at"),
});

export const insertPropertySchema = createInsertSchema(properties).omit({ id: true });
export type InsertProperty = z.infer<typeof insertPropertySchema>;
export type Property = typeof properties.$inferSelect;

// Property Units
export const propertyUnits = pgTable("property_units", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  propertyId: varchar("property_id").notNull(),
  unitNumber: varchar("unit_number").notNull(),
  unitType: text("unit_type"),
  unitTypeAr: text("unit_type_ar"),
  floorNumber: integer("floor_number"),
  area: real("area"),
  facadeLength: real("facade_length"),
  hasMezzanine: boolean("has_mezzanine").default(false),
  privateParking: integer("private_parking"),
  acType: text("ac_type"),
  acTypeAr: text("ac_type_ar"),
  status: text("status").$type<"available" | "occupied" | "maintenance">().default("available"),
  currentContractId: varchar("current_contract_id"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at"),
});

export const insertPropertyUnitSchema = createInsertSchema(propertyUnits).omit({ id: true });
export type InsertPropertyUnit = z.infer<typeof insertPropertyUnitSchema>;
export type PropertyUnit = typeof propertyUnits.$inferSelect;

// Contract Payment Schedule
export const contractPayments = pgTable("contract_payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contractId: varchar("contract_id").notNull(),
  paymentNumber: integer("payment_number").notNull(),
  dueDate: date("due_date").notNull(),
  dueDateHijri: text("due_date_hijri"),
  rentAmount: integer("rent_amount").notNull(),
  vatAmount: integer("vat_amount"),
  servicesAmount: integer("services_amount"),
  totalAmount: integer("total_amount").notNull(),
  status: text("status").$type<PaymentStatus>().notNull().default("pending"),
  paidDate: date("paid_date"),
  paidAmount: integer("paid_amount"),
  paymentMethod: text("payment_method"),
  receiptNumber: text("receipt_number"),
  notes: text("notes"),
  notesAr: text("notes_ar"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at"),
});

export const insertContractPaymentSchema = createInsertSchema(contractPayments).omit({ id: true });
export type InsertContractPayment = z.infer<typeof insertContractPaymentSchema>;
export type ContractPayment = typeof contractPayments.$inferSelect;

// User Permissions Table for Admin Access Control
export type PermissionModule = "dashboard" | "employees" | "attendance" | "requests" | "fleet" | "drivers" | "contracts" | "properties" | "reports" | "settings" | "users" | "branches";
export type PermissionAction = "view" | "create" | "edit" | "delete" | "approve" | "export";

export const userPermissions = pgTable("user_permissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  module: text("module").$type<PermissionModule>().notNull(),
  action: text("action").$type<PermissionAction>().notNull(),
  grantedBy: varchar("granted_by").notNull(),
  grantedAt: text("granted_at").notNull(),
});

export const insertUserPermissionSchema = createInsertSchema(userPermissions).omit({ id: true });
export type InsertUserPermission = z.infer<typeof insertUserPermissionSchema>;
export type UserPermission = typeof userPermissions.$inferSelect;

// Audit Log for tracking all system actions
export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  action: text("action").notNull(),
  module: text("module").notNull(),
  entityType: text("entity_type"),
  entityId: varchar("entity_id"),
  oldData: text("old_data"),
  newData: text("new_data"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  timestamp: text("timestamp").notNull(),
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({ id: true });
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;

// Contract Statistics Interface
export interface ContractStats {
  totalContracts: number;
  activeContracts: number;
  expiringThisMonth: number;
  pendingPayments: number;
  overduePayments: number;
  totalMonthlyRent: number;
  totalAnnualRent: number;
  totalProperties: number;
  occupiedUnits: number;
  availableUnits: number;
}

// Employee Work Contract (Qiwa/Saudi Standard)
export type EmploymentContractType = "definite" | "indefinite";
export type EmploymentContractStatus = "active" | "expired" | "terminated" | "pending";

export const employeeContracts = pgTable("employee_contracts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: varchar("employee_id").notNull(),
  documentId: varchar("document_id"),
  
  // Contract Basic Info
  contractNumber: text("contract_number"),
  contractType: text("contract_type").$type<EmploymentContractType>(),
  status: text("status").$type<EmploymentContractStatus>().default("active"),
  signedDate: date("signed_date"),
  startDate: date("start_date"),
  endDate: date("end_date"),
  workStartDate: date("work_start_date"),
  signedLocation: text("signed_location"),
  signedLocationAr: text("signed_location_ar"),
  
  // Employer Info (from contract)
  employerName: text("employer_name"),
  employerNameAr: text("employer_name_ar"),
  employerType: text("employer_type"),
  employerTypeAr: text("employer_type_ar"),
  employerNationalId: text("employer_national_id"),
  employerAddress: text("employer_address"),
  employerAddressAr: text("employer_address_ar"),
  employerPhone: text("employer_phone"),
  employerEmail: text("employer_email"),
  representativeName: text("representative_name"),
  representativeNameAr: text("representative_name_ar"),
  representativeId: text("representative_id"),
  representativeTitle: text("representative_title"),
  representativeTitleAr: text("representative_title_ar"),
  
  // Employee Info (from contract - for verification)
  employeeNameContract: text("employee_name_contract"),
  employeeNameContractAr: text("employee_name_contract_ar"),
  employeeNationality: text("employee_nationality"),
  employeeNationalityAr: text("employee_nationality_ar"),
  employeeIdNumber: text("employee_id_number"),
  employeeGender: text("employee_gender"),
  employeeMaritalStatus: text("employee_marital_status"),
  employeeDateOfBirth: date("employee_date_of_birth"),
  employeeAddress: text("employee_address"),
  employeeAddressAr: text("employee_address_ar"),
  employeeQualification: text("employee_qualification"),
  employeeQualificationAr: text("employee_qualification_ar"),
  employeeSpecialization: text("employee_specialization"),
  employeeSpecializationAr: text("employee_specialization_ar"),
  
  // Job Details
  jobTitle: text("job_title"),
  jobTitleAr: text("job_title_ar"),
  profession: text("profession"),
  professionAr: text("profession_ar"),
  workLocation: text("work_location"),
  workLocationAr: text("work_location_ar"),
  workScope: text("work_scope"),
  workScopeAr: text("work_scope_ar"),
  isPartTime: boolean("is_part_time").default(false),
  
  // Contract Duration
  durationDays: integer("duration_days"),
  autoRenewal: boolean("auto_renewal").default(false),
  probationDays: integer("probation_days"),
  probationTerms: text("probation_terms"),
  probationTermsAr: text("probation_terms_ar"),
  
  // Working Hours & Leave
  workDaysPerWeek: integer("work_days_per_week"),
  workHoursPerDay: real("work_hours_per_day"),
  weeklyRestDay: text("weekly_rest_day"),
  weeklyRestDayAr: text("weekly_rest_day_ar"),
  annualLeaveDays: integer("annual_leave_days"),
  
  // Salary & Benefits (Payroll Ready)
  basicSalary: integer("basic_salary"),
  housingAllowance: integer("housing_allowance"),
  transportAllowance: integer("transport_allowance"),
  otherAllowances: integer("other_allowances"),
  totalMonthlySalary: integer("total_monthly_salary"),
  paymentDueDay: integer("payment_due_day"),
  paymentMethod: text("payment_method"),
  paymentMethodAr: text("payment_method_ar"),
  currency: text("currency").default("SAR"),
  
  // Bank Details
  bankName: text("bank_name"),
  bankNameAr: text("bank_name_ar"),
  ibanNumber: text("iban_number"),
  
  // Obligations
  employerObligations: text("employer_obligations"),
  employerObligationsAr: text("employer_obligations_ar"),
  employeeObligations: text("employee_obligations"),
  employeeObligationsAr: text("employee_obligations_ar"),
  
  // AI Analysis Info
  analysisConfidence: real("analysis_confidence"),
  rawExtractedData: text("raw_extracted_data"),
  isVerified: boolean("is_verified").default(false),
  verifiedBy: varchar("verified_by"),
  verifiedAt: text("verified_at"),
  
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at"),
});

export const insertEmployeeContractSchema = createInsertSchema(employeeContracts).omit({ id: true });
export type InsertEmployeeContract = z.infer<typeof insertEmployeeContractSchema>;
export type EmployeeContract = typeof employeeContracts.$inferSelect;

// ==================== RECRUITMENT SYSTEM ====================

// Application Status Workflow
export type ApplicationStatus = 
  | "submitted"        // Initial submission
  | "under_review"     // HR reviewing application
  | "shortlisted"      // Passed initial screening
  | "interview_scheduled" // Interview set up
  | "interviewed"      // Interview completed
  | "evaluation"       // Under evaluation
  | "offer_pending"    // Offer being prepared
  | "offer_sent"       // Offer sent to candidate
  | "offer_accepted"   // Candidate accepted
  | "offer_declined"   // Candidate declined
  | "hired"           // Successfully hired
  | "rejected"        // Application rejected
  | "withdrawn";      // Candidate withdrew

export type JobType = "full_time" | "part_time" | "contract" | "temporary" | "internship";
export type JobStatus = "draft" | "published" | "closed" | "on_hold";
export type InterviewType = "phone" | "video" | "in_person" | "panel" | "technical" | "hr";
export type InterviewStatus = "scheduled" | "confirmed" | "completed" | "cancelled" | "no_show" | "rescheduled";
export type DocumentType = "photo" | "cv" | "id_card" | "passport" | "certificate" | "degree" | "transcript" | "recommendation" | "portfolio" | "other";

// Job Postings
export const jobPostings = pgTable("job_postings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Basic Info
  title: text("title").notNull(),
  titleAr: text("title_ar"),
  description: text("description").notNull(),
  descriptionAr: text("description_ar"),
  requirements: text("requirements"),
  requirementsAr: text("requirements_ar"),
  responsibilities: text("responsibilities"),
  responsibilitiesAr: text("responsibilities_ar"),
  benefits: text("benefits"),
  benefitsAr: text("benefits_ar"),
  
  // Job Details
  departmentId: varchar("department_id"),
  location: text("location"),
  locationAr: text("location_ar"),
  jobType: text("job_type").$type<JobType>().default("full_time"),
  experienceYearsMin: integer("experience_years_min"),
  experienceYearsMax: integer("experience_years_max"),
  educationLevel: text("education_level"),
  educationLevelAr: text("education_level_ar"),
  
  // Salary Range
  salaryMin: integer("salary_min"),
  salaryMax: integer("salary_max"),
  currency: text("currency").default("SAR"),
  showSalary: boolean("show_salary").default(false),
  
  // Skills & Keywords
  requiredSkills: text("required_skills").array(),
  preferredSkills: text("preferred_skills").array(),
  keywords: text("keywords").array(),
  
  // Publishing
  status: text("status").$type<JobStatus>().default("draft"),
  publishedAt: text("published_at"),
  closingDate: text("closing_date"),
  applicationDeadline: text("application_deadline"),
  
  // Workflow Settings
  requirePhoto: boolean("require_photo").default(true),
  requireCV: boolean("require_cv").default(true),
  requireCoverLetter: boolean("require_cover_letter").default(false),
  maxApplications: integer("max_applications"),
  autoScreeningEnabled: boolean("auto_screening_enabled").default(false),
  
  // Metadata
  createdBy: varchar("created_by"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at"),
});

export const insertJobPostingSchema = createInsertSchema(jobPostings).omit({ id: true });
export type InsertJobPosting = z.infer<typeof insertJobPostingSchema>;
export type JobPosting = typeof jobPostings.$inferSelect;

// Job Applications (Main application record)
export const jobApplications = pgTable("job_applications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  jobId: varchar("job_id").notNull(),
  applicationNumber: text("application_number").notNull(), // Auto-generated like APP-2026-0001
  
  // Applicant Personal Info
  firstName: text("first_name").notNull(),
  firstNameAr: text("first_name_ar"),
  lastName: text("last_name").notNull(),
  lastNameAr: text("last_name_ar"),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  alternatePhone: text("alternate_phone"),
  dateOfBirth: date("date_of_birth"),
  gender: text("gender"),
  nationality: text("nationality"),
  nationalityAr: text("nationality_ar"),
  nationalId: text("national_id"),
  
  // Address
  address: text("address"),
  addressAr: text("address_ar"),
  city: text("city"),
  cityAr: text("city_ar"),
  country: text("country"),
  countryAr: text("country_ar"),
  postalCode: text("postal_code"),
  
  // Professional Info
  currentPosition: text("current_position"),
  currentPositionAr: text("current_position_ar"),
  currentCompany: text("current_company"),
  currentCompanyAr: text("current_company_ar"),
  currentSalary: integer("current_salary"),
  expectedSalary: integer("expected_salary"),
  noticePeriodDays: integer("notice_period_days"),
  availableStartDate: date("available_start_date"),
  
  // Cover Letter & Summary
  coverLetter: text("cover_letter"),
  coverLetterAr: text("cover_letter_ar"),
  professionalSummary: text("professional_summary"),
  professionalSummaryAr: text("professional_summary_ar"),
  
  // Application Photo
  photoUrl: text("photo_url"),
  
  // Social & Portfolio
  linkedinUrl: text("linkedin_url"),
  portfolioUrl: text("portfolio_url"),
  githubUrl: text("github_url"),
  
  // Workflow Status
  status: text("status").$type<ApplicationStatus>().default("submitted"),
  currentStage: text("current_stage").default("application"),
  
  // Scoring & Ranking
  screeningScore: real("screening_score"),
  interviewScore: real("interview_score"),
  overallScore: real("overall_score"),
  ranking: integer("ranking"),
  
  // Internal Notes
  internalNotes: text("internal_notes"),
  rejectionReason: text("rejection_reason"),
  rejectionReasonAr: text("rejection_reason_ar"),
  
  // Source Tracking
  applicationSource: text("application_source"), // website, linkedin, referral, etc.
  referredBy: text("referred_by"),
  
  // Timestamps & Assignment
  assignedTo: varchar("assigned_to"), // HR reviewer
  submittedAt: text("submitted_at").notNull(),
  reviewedAt: text("reviewed_at"),
  reviewedBy: varchar("reviewed_by"),
  lastStatusChangeAt: text("last_status_change_at"),
  
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at"),
});

export const insertJobApplicationSchema = createInsertSchema(jobApplications).omit({ id: true });
export type InsertJobApplication = z.infer<typeof insertJobApplicationSchema>;
export type JobApplication = typeof jobApplications.$inferSelect;

// Applicant Documents (CV, certificates, photo, etc.)
export const applicantDocuments = pgTable("applicant_documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  applicationId: varchar("application_id").notNull(),
  
  documentType: text("document_type").$type<DocumentType>().notNull(),
  name: text("name").notNull(),
  nameAr: text("name_ar"),
  fileUrl: text("file_url"),
  fileBase64: text("file_base64"), // For storing small documents
  mimeType: text("mime_type"),
  fileSize: integer("file_size"),
  
  // Document Details
  issueDate: date("issue_date"),
  expiryDate: date("expiry_date"),
  issuingAuthority: text("issuing_authority"),
  issuingAuthorityAr: text("issuing_authority_ar"),
  documentNumber: text("document_number"),
  
  isVerified: boolean("is_verified").default(false),
  verifiedBy: varchar("verified_by"),
  verifiedAt: text("verified_at"),
  
  createdAt: text("created_at").notNull(),
});

export const insertApplicantDocumentSchema = createInsertSchema(applicantDocuments).omit({ id: true });
export type InsertApplicantDocument = z.infer<typeof insertApplicantDocumentSchema>;
export type ApplicantDocument = typeof applicantDocuments.$inferSelect;

// Applicant Work Experience
export const applicantExperiences = pgTable("applicant_experiences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  applicationId: varchar("application_id").notNull(),
  
  companyName: text("company_name").notNull(),
  companyNameAr: text("company_name_ar"),
  jobTitle: text("job_title").notNull(),
  jobTitleAr: text("job_title_ar"),
  
  startDate: date("start_date").notNull(),
  endDate: date("end_date"), // null if current
  isCurrent: boolean("is_current").default(false),
  
  location: text("location"),
  locationAr: text("location_ar"),
  industry: text("industry"),
  industryAr: text("industry_ar"),
  
  responsibilities: text("responsibilities"),
  responsibilitiesAr: text("responsibilities_ar"),
  achievements: text("achievements"),
  achievementsAr: text("achievements_ar"),
  
  salary: integer("salary"),
  reasonForLeaving: text("reason_for_leaving"),
  reasonForLeavingAr: text("reason_for_leaving_ar"),
  
  // Reference
  referenceName: text("reference_name"),
  referenceTitle: text("reference_title"),
  referencePhone: text("reference_phone"),
  referenceEmail: text("reference_email"),
  canContactReference: boolean("can_contact_reference").default(false),
  
  createdAt: text("created_at").notNull(),
});

export const insertApplicantExperienceSchema = createInsertSchema(applicantExperiences).omit({ id: true });
export type InsertApplicantExperience = z.infer<typeof insertApplicantExperienceSchema>;
export type ApplicantExperience = typeof applicantExperiences.$inferSelect;

// Applicant Education
export const applicantEducation = pgTable("applicant_education", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  applicationId: varchar("application_id").notNull(),
  
  institution: text("institution").notNull(),
  institutionAr: text("institution_ar"),
  degree: text("degree").notNull(),
  degreeAr: text("degree_ar"),
  fieldOfStudy: text("field_of_study"),
  fieldOfStudyAr: text("field_of_study_ar"),
  
  startDate: date("start_date"),
  endDate: date("end_date"),
  isOngoing: boolean("is_ongoing").default(false),
  
  grade: text("grade"), // GPA, percentage, classification
  gradeScale: text("grade_scale"), // "4.0", "100%", "First Class"
  
  location: text("location"),
  locationAr: text("location_ar"),
  country: text("country"),
  countryAr: text("country_ar"),
  
  honors: text("honors"),
  honorsAr: text("honors_ar"),
  activities: text("activities"),
  activitiesAr: text("activities_ar"),
  
  createdAt: text("created_at").notNull(),
});

export const insertApplicantEducationSchema = createInsertSchema(applicantEducation).omit({ id: true });
export type InsertApplicantEducation = z.infer<typeof insertApplicantEducationSchema>;
export type ApplicantEducation = typeof applicantEducation.$inferSelect;

// Applicant Skills
export const applicantSkills = pgTable("applicant_skills", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  applicationId: varchar("application_id").notNull(),
  
  skillName: text("skill_name").notNull(),
  skillNameAr: text("skill_name_ar"),
  category: text("category"), // technical, soft, language, etc.
  categoryAr: text("category_ar"),
  proficiencyLevel: integer("proficiency_level"), // 1-5 or 1-10
  yearsOfExperience: real("years_of_experience"),
  
  // For languages
  isLanguage: boolean("is_language").default(false),
  readingLevel: text("reading_level"),
  writingLevel: text("writing_level"),
  speakingLevel: text("speaking_level"),
  
  // Certification
  isCertified: boolean("is_certified").default(false),
  certificationName: text("certification_name"),
  certificationDate: date("certification_date"),
  certificationExpiry: date("certification_expiry"),
  
  createdAt: text("created_at").notNull(),
});

export const insertApplicantSkillSchema = createInsertSchema(applicantSkills).omit({ id: true });
export type InsertApplicantSkill = z.infer<typeof insertApplicantSkillSchema>;
export type ApplicantSkill = typeof applicantSkills.$inferSelect;

// Interviews
export const interviews = pgTable("interviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  applicationId: varchar("application_id").notNull(),
  jobId: varchar("job_id").notNull(),
  
  // Interview Details
  interviewType: text("interview_type").$type<InterviewType>().default("in_person"),
  title: text("title"),
  titleAr: text("title_ar"),
  
  // Scheduling
  scheduledDate: date("scheduled_date").notNull(),
  scheduledTime: text("scheduled_time").notNull(),
  durationMinutes: integer("duration_minutes").default(60),
  timezone: text("timezone").default("Asia/Riyadh"),
  
  // Location / Link
  location: text("location"),
  locationAr: text("location_ar"),
  meetingLink: text("meeting_link"),
  meetingPassword: text("meeting_password"),
  
  // Interviewers
  interviewerIds: text("interviewer_ids").array(),
  primaryInterviewerId: varchar("primary_interviewer_id"),
  
  // Status
  status: text("status").$type<InterviewStatus>().default("scheduled"),
  
  // Candidate Communication
  invitationSentAt: text("invitation_sent_at"),
  candidateConfirmedAt: text("candidate_confirmed_at"),
  reminderSentAt: text("reminder_sent_at"),
  
  // Pre-interview
  interviewGuide: text("interview_guide"),
  interviewGuideAr: text("interview_guide_ar"),
  questionsTemplate: text("questions_template"),
  
  // Post-interview
  actualStartTime: text("actual_start_time"),
  actualEndTime: text("actual_end_time"),
  
  // Notes
  internalNotes: text("internal_notes"),
  candidateNotes: text("candidate_notes"),
  
  createdBy: varchar("created_by"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at"),
});

export const insertInterviewSchema = createInsertSchema(interviews).omit({ id: true });
export type InsertInterview = z.infer<typeof insertInterviewSchema>;
export type Interview = typeof interviews.$inferSelect;

// Interview Feedback / Evaluations
export const interviewFeedback = pgTable("interview_feedback", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  interviewId: varchar("interview_id").notNull(),
  applicationId: varchar("application_id").notNull(),
  interviewerId: varchar("interviewer_id").notNull(),
  
  // Ratings (1-5)
  technicalSkillsRating: integer("technical_skills_rating"),
  communicationRating: integer("communication_rating"),
  problemSolvingRating: integer("problem_solving_rating"),
  cultureFitRating: integer("culture_fit_rating"),
  leadershipRating: integer("leadership_rating"),
  overallRating: integer("overall_rating"),
  
  // Detailed Feedback
  strengths: text("strengths"),
  strengthsAr: text("strengths_ar"),
  weaknesses: text("weaknesses"),
  weaknessesAr: text("weaknesses_ar"),
  
  technicalNotes: text("technical_notes"),
  behavioralNotes: text("behavioral_notes"),
  additionalComments: text("additional_comments"),
  
  // Recommendation
  recommendation: text("recommendation"), // hire, no_hire, maybe, next_round
  recommendationNotes: text("recommendation_notes"),
  recommendationNotesAr: text("recommendation_notes_ar"),
  
  // Questions & Answers
  questionsAsked: text("questions_asked"),
  candidateResponses: text("candidate_responses"),
  
  isSubmitted: boolean("is_submitted").default(false),
  submittedAt: text("submitted_at"),
  
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at"),
});

export const insertInterviewFeedbackSchema = createInsertSchema(interviewFeedback).omit({ id: true });
export type InsertInterviewFeedback = z.infer<typeof insertInterviewFeedbackSchema>;
export type InterviewFeedback = typeof interviewFeedback.$inferSelect;

// Application Status History (Workflow Audit Trail)
export const applicationStatusHistory = pgTable("application_status_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  applicationId: varchar("application_id").notNull(),
  
  fromStatus: text("from_status").$type<ApplicationStatus>(),
  toStatus: text("to_status").$type<ApplicationStatus>().notNull(),
  
  changedBy: varchar("changed_by"),
  changedByName: text("changed_by_name"),
  
  reason: text("reason"),
  reasonAr: text("reason_ar"),
  notes: text("notes"),
  
  createdAt: text("created_at").notNull(),
});

export const insertApplicationStatusHistorySchema = createInsertSchema(applicationStatusHistory).omit({ id: true });
export type InsertApplicationStatusHistory = z.infer<typeof insertApplicationStatusHistorySchema>;
export type ApplicationStatusHistory = typeof applicationStatusHistory.$inferSelect;

// ========================
// Payroll Management System
// ========================

export type PayrollRunStatus = "draft" | "processing" | "completed" | "cancelled" | "hr_approved" | "finance_approved";
export type PayrollItemStatus = "pending" | "processed" | "paid" | "on_hold";
export type AdjustmentType = "addition" | "deduction";

// Payroll Runs - One per month execution
export const payrollRuns = pgTable("payroll_runs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Period
  year: integer("year").notNull(),
  month: integer("month").notNull(), // 1-12
  periodLabel: text("period_label"), // "January 2026"
  periodLabelAr: text("period_label_ar"), // "يناير 2026"
  
  // Totals
  totalEmployees: integer("total_employees").default(0),
  totalBaseSalary: integer("total_base_salary").default(0),
  totalAdditions: integer("total_additions").default(0),
  totalDeductions: integer("total_deductions").default(0),
  totalNetPay: integer("total_net_pay").default(0),
  
  // Status
  status: text("status").$type<PayrollRunStatus>().default("draft"),
  
  // Metadata
  createdBy: varchar("created_by"),
  processedBy: varchar("processed_by"),
  processedAt: text("processed_at"),
  notes: text("notes"),
  notesAr: text("notes_ar"),
  
  // HR Approval
  hrApprovedBy: varchar("hr_approved_by"),
  hrApprovedAt: text("hr_approved_at"),
  
  // Finance Approval
  financeApprovedBy: varchar("finance_approved_by"),
  financeApprovedAt: text("finance_approved_at"),
  
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at"),
});

export const insertPayrollRunSchema = createInsertSchema(payrollRuns).omit({ id: true });
export type InsertPayrollRun = z.infer<typeof insertPayrollRunSchema>;
export type PayrollRun = typeof payrollRuns.$inferSelect;

// Payroll Items - Per employee per run
export const payrollItems = pgTable("payroll_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  runId: varchar("run_id").notNull(),
  employeeId: varchar("employee_id").notNull(),
  
  // Employee snapshot at time of payroll
  employeeName: text("employee_name"),
  employeeNameAr: text("employee_name_ar"),
  employeeNumber: text("employee_number"),
  departmentName: text("department_name"),
  position: text("position"),
  
  // Amounts
  baseSalary: integer("base_salary").default(0),
  totalAdditions: integer("total_additions").default(0),
  totalDeductions: integer("total_deductions").default(0),
  grossPay: integer("gross_pay").default(0), // base + additions
  netPay: integer("net_pay").default(0), // gross - deductions
  
  // Status
  status: text("status").$type<PayrollItemStatus>().default("pending"),
  
  // Payment Details
  paymentMethod: text("payment_method"), // bank_transfer, cash, check
  bankName: text("bank_name"),
  accountNumber: text("account_number"),
  iban: text("iban"),
  
  notes: text("notes"),
  
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at"),
});

export const insertPayrollItemSchema = createInsertSchema(payrollItems).omit({ id: true });
export type InsertPayrollItem = z.infer<typeof insertPayrollItemSchema>;
export type PayrollItem = typeof payrollItems.$inferSelect;

// Payroll Adjustments - Additions and Deductions
export const payrollAdjustments = pgTable("payroll_adjustments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  payrollItemId: varchar("payroll_item_id").notNull(),
  
  type: text("type").$type<AdjustmentType>().notNull(), // addition or deduction
  
  // Details
  name: text("name").notNull(), // Overtime, Bonus, Insurance, Tax, etc.
  nameAr: text("name_ar"),
  amount: integer("amount").notNull(),
  
  // Category
  category: text("category"), // overtime, bonus, allowance, insurance, tax, loan, etc.
  categoryAr: text("category_ar"),
  
  description: text("description"),
  descriptionAr: text("description_ar"),
  
  // Recurring flag for templates
  isRecurring: boolean("is_recurring").default(false),
  
  // Link to source request (for automatic payroll integration)
  sourceRequestId: varchar("source_request_id"), // Links to requests table when auto-created from approved request
  
  createdAt: text("created_at").notNull(),
});

export const insertPayrollAdjustmentSchema = createInsertSchema(payrollAdjustments).omit({ id: true });
export type InsertPayrollAdjustment = z.infer<typeof insertPayrollAdjustmentSchema>;
export type PayrollAdjustment = typeof payrollAdjustments.$inferSelect;

// Payroll Templates - Recurring adjustments for employees
export const payrollTemplates = pgTable("payroll_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: varchar("employee_id").notNull(),
  
  type: text("type").$type<AdjustmentType>().notNull(),
  
  name: text("name").notNull(),
  nameAr: text("name_ar"),
  amount: integer("amount").notNull(),
  
  category: text("category"),
  categoryAr: text("category_ar"),
  
  description: text("description"),
  descriptionAr: text("description_ar"),
  
  isActive: boolean("is_active").default(true),
  
  // Validity period
  startDate: date("start_date"),
  endDate: date("end_date"),
  
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at"),
});

export const insertPayrollTemplateSchema = createInsertSchema(payrollTemplates).omit({ id: true });
export type InsertPayrollTemplate = z.infer<typeof insertPayrollTemplateSchema>;
export type PayrollTemplate = typeof payrollTemplates.$inferSelect;

// Payroll Approval Roles - Configurable approval chain
export type PayrollApprovalRole = "operations" | "supervisor" | "hr" | "finance";

// Payroll Approval Settings - Admin configurable approval stages
export const payrollApprovalSettings = pgTable("payroll_approval_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Approval stage configuration
  role: text("role").$type<PayrollApprovalRole>().notNull().unique(),
  roleName: text("role_name").notNull(),
  roleNameAr: text("role_name_ar"),
  
  // Order in approval chain (1 = first, 2 = second, etc.)
  orderIndex: integer("order_index").notNull(),
  
  // Is this approval stage enabled?
  isEnabled: boolean("is_enabled").default(true),
  
  // Which user roles can perform this approval
  allowedUserRoles: text("allowed_user_roles").array(),
  
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at"),
});

export const insertPayrollApprovalSettingSchema = createInsertSchema(payrollApprovalSettings).omit({ id: true });
export type InsertPayrollApprovalSetting = z.infer<typeof insertPayrollApprovalSettingSchema>;
export type PayrollApprovalSetting = typeof payrollApprovalSettings.$inferSelect;

// Payroll Run Approvals - Track individual approvals for each payroll run
export type PayrollApprovalStatus = "pending" | "approved" | "rejected";

export const payrollRunApprovals = pgTable("payroll_run_approvals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  runId: varchar("run_id").notNull(),
  role: text("role").$type<PayrollApprovalRole>().notNull(),
  
  status: text("status").$type<PayrollApprovalStatus>().default("pending"),
  
  // Who approved/rejected
  approverId: varchar("approver_id"),
  approverName: text("approver_name"),
  
  // When
  approvedAt: text("approved_at"),
  
  // Optional notes/comments
  notes: text("notes"),
  
  createdAt: text("created_at").notNull(),
});

export const insertPayrollRunApprovalSchema = createInsertSchema(payrollRunApprovals).omit({ id: true });
export type InsertPayrollRunApproval = z.infer<typeof insertPayrollRunApprovalSchema>;
export type PayrollRunApproval = typeof payrollRunApprovals.$inferSelect;

// Management Assignments - Links managers to branches/employees they can view
export type ManagementScopeType = "branch" | "employee";

export const managementAssignments = pgTable("management_assignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // The manager user (from auth_users)
  managerUserId: varchar("manager_user_id").notNull(),
  
  // Type of scope: 'branch' or 'employee'
  scopeType: text("scope_type").$type<ManagementScopeType>().notNull(),
  
  // ID of the branch or employee being managed
  scopeId: varchar("scope_id").notNull(),
  
  // Optional: notes about this assignment
  notes: text("notes"),
  
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at"),
});

export const insertManagementAssignmentSchema = createInsertSchema(managementAssignments).omit({ id: true });
export type InsertManagementAssignment = z.infer<typeof insertManagementAssignmentSchema>;
export type ManagementAssignment = typeof managementAssignments.$inferSelect;

// ================================
// NOTIFICATIONS SYSTEM
// ================================

export type NotificationType = "info" | "success" | "warning" | "alert" | "announcement" | "reminder" | "system";
export type NotificationPriority = "low" | "normal" | "high" | "urgent";
export type NotificationTargetType = "all" | "employees" | "department" | "branch" | "role";

export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Content
  title: text("title").notNull(),
  titleAr: text("title_ar"),
  content: text("content").notNull(),
  contentAr: text("content_ar"),
  
  // Type and priority
  type: text("type").$type<NotificationType>().default("info"),
  priority: text("priority").$type<NotificationPriority>().default("normal"),
  
  // Targeting
  targetType: text("target_type").$type<NotificationTargetType>().default("all"),
  targetIds: text("target_ids").array(), // Array of department/branch/employee IDs based on targetType
  
  // Sender info
  senderId: varchar("sender_id").notNull(),
  senderName: text("sender_name"),
  
  // Optional link/action
  actionUrl: text("action_url"),
  actionLabel: text("action_label"),
  actionLabelAr: text("action_label_ar"),
  
  // Scheduling
  scheduledAt: text("scheduled_at"), // If null, send immediately
  expiresAt: text("expires_at"), // Optional expiration
  
  // Status
  isActive: boolean("is_active").default(true),
  
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at"),
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({ id: true });
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;

// Notification Recipients - Tracks read status per user
export const notificationRecipients = pgTable("notification_recipients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  notificationId: varchar("notification_id").notNull(),
  recipientId: varchar("recipient_id").notNull(), // auth_user.id
  
  // Status
  isRead: boolean("is_read").default(false),
  readAt: text("read_at"),
  
  // Deleted by recipient (soft delete for user)
  isDeleted: boolean("is_deleted").default(false),
  deletedAt: text("deleted_at"),
  
  createdAt: text("created_at").notNull(),
});

export const insertNotificationRecipientSchema = createInsertSchema(notificationRecipients).omit({ id: true });
export type InsertNotificationRecipient = z.infer<typeof insertNotificationRecipientSchema>;
export type NotificationRecipient = typeof notificationRecipients.$inferSelect;

// ================================
// PAYROLL REQUESTS SYSTEM
// ================================

// Deduction types: absence, disciplinary, amount_deduction
// Addition types: extra_days, extra_hours, bonus
export type PayrollRequestCategory = "deduction" | "addition";
export type PayrollDeductionType = "absence" | "disciplinary" | "amount_deduction";
export type PayrollAdditionType = "extra_days" | "extra_hours" | "bonus";
export type PayrollRequestStatus = "pending" | "approved" | "rejected" | "applied";

export const payrollRequests = pgTable("payroll_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Employee this request is for
  employeeId: varchar("employee_id").notNull(),
  
  // Category: deduction or addition
  category: text("category").$type<PayrollRequestCategory>().notNull(),
  
  // Type based on category
  // For deductions: absence, disciplinary, amount_deduction
  // For additions: extra_days, extra_hours, bonus
  requestType: text("request_type").notNull(),
  
  // Title/description
  title: text("title").notNull(),
  titleAr: text("title_ar"),
  description: text("description"),
  descriptionAr: text("description_ar"),
  
  // Amount calculation
  // For absence: number of days
  // For extra_days: number of days
  // For extra_hours: number of hours
  // For bonus/amount_deduction: direct amount
  days: real("days"), // Number of days (can be decimal like 0.5)
  hours: real("hours"), // Number of hours
  amount: integer("amount"), // Direct amount in SAR
  
  // Calculated final amount (filled when processing)
  calculatedAmount: integer("calculated_amount"),
  
  // Target payroll period
  targetYear: integer("target_year").notNull(),
  targetMonth: integer("target_month").notNull(), // 1-12
  
  // Status
  status: text("status").$type<PayrollRequestStatus>().default("pending"),
  
  // Approval info
  approvedBy: varchar("approved_by"),
  approverName: text("approver_name"),
  approvedAt: text("approved_at"),
  rejectionReason: text("rejection_reason"),
  
  // Link to payroll run when applied
  appliedToRunId: varchar("applied_to_run_id"),
  appliedAt: text("applied_at"),
  
  // Created by (HR/Manager who created the request)
  createdBy: varchar("created_by").notNull(),
  creatorName: text("creator_name"),
  
  // Timestamps
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at"),
});

export const insertPayrollRequestSchema = createInsertSchema(payrollRequests).omit({ id: true });
export type InsertPayrollRequest = z.infer<typeof insertPayrollRequestSchema>;
export type PayrollRequest = typeof payrollRequests.$inferSelect;

// Payroll Automation Settings - Admin configurable settings
export const payrollAutomationSettings = pgTable("payroll_automation_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Auto-link payroll requests when general requests are approved
  autoLinkPayrollRequests: boolean("auto_link_payroll_requests").default(true),
  
  // Audit info
  updatedAt: text("updated_at"),
  updatedBy: varchar("updated_by"),
});

export const insertPayrollAutomationSettingsSchema = createInsertSchema(payrollAutomationSettings).omit({ id: true });
export type InsertPayrollAutomationSettings = z.infer<typeof insertPayrollAutomationSettingsSchema>;
export type PayrollAutomationSettings = typeof payrollAutomationSettings.$inferSelect;
