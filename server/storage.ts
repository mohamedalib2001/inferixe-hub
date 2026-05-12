import { db } from "./db";
import { eq, and, gte, lte, sql, inArray } from "drizzle-orm";
import {
  users,
  employees,
  departments,
  attendance,
  requests,
  vehicles,
  drivers,
  employeeDocuments,
  biometricEnrollments,
  biometricAttendanceEvents,
  branches,
  employeeBranches,
  vehicleEvents,
  vehicleDriverHistory,
  contracts,
  contractParties,
  properties,
  propertyUnits,
  contractPayments,
  userPermissions,
  auditLogs,
  employeeContracts,
  jobPostings,
  jobApplications,
  applicantDocuments,
  applicantExperiences,
  applicantEducation,
  applicantSkills,
  interviews,
  interviewFeedback,
  applicationStatusHistory,
  payrollRuns,
  payrollItems,
  payrollAdjustments,
  payrollTemplates,
  payrollApprovalSettings,
  payrollRunApprovals,
  managementAssignments,
  notifications,
  notificationRecipients,
  payrollRequests,
  type User,
  type InsertUser,
  type Employee,
  type InsertEmployee,
  type Department,
  type InsertDepartment,
  type Attendance,
  type InsertAttendance,
  type Request,
  type InsertRequest,
  type Vehicle,
  type InsertVehicle,
  type Driver,
  type InsertDriver,
  type EmployeeDocument,
  type InsertEmployeeDocument,
  type BiometricEnrollment,
  type InsertBiometricEnrollment,
  type BiometricAttendanceEvent,
  type InsertBiometricAttendanceEvent,
  type Branch,
  type InsertBranch,
  type EmployeeBranch,
  type InsertEmployeeBranch,
  type VehicleEvent,
  type InsertVehicleEvent,
  type VehicleDriverHistory,
  type InsertVehicleDriverHistory,
  type Contract,
  type InsertContract,
  type ContractParty,
  type InsertContractParty,
  type Property,
  type InsertProperty,
  type PropertyUnit,
  type InsertPropertyUnit,
  type ContractPayment,
  type InsertContractPayment,
  type UserPermission,
  type InsertUserPermission,
  type AuditLog,
  type InsertAuditLog,
  type ContractStats,
  type EmployeeContract,
  type InsertEmployeeContract,
  type JobPosting,
  type InsertJobPosting,
  type JobApplication,
  type InsertJobApplication,
  type ApplicantDocument,
  type InsertApplicantDocument,
  type ApplicantExperience,
  type InsertApplicantExperience,
  type ApplicantEducation,
  type InsertApplicantEducation,
  type ApplicantSkill,
  type InsertApplicantSkill,
  type Interview,
  type InsertInterview,
  type InterviewFeedback,
  type InsertInterviewFeedback,
  type ApplicationStatusHistory,
  type InsertApplicationStatusHistory,
  type PayrollRun,
  type InsertPayrollRun,
  type PayrollItem,
  type InsertPayrollItem,
  type PayrollAdjustment,
  type InsertPayrollAdjustment,
  type PayrollTemplate,
  type InsertPayrollTemplate,
  type PayrollApprovalSetting,
  type InsertPayrollApprovalSetting,
  type PayrollRunApproval,
  type InsertPayrollRunApproval,
  type ManagementAssignment,
  type InsertManagementAssignment,
  type Notification,
  type InsertNotification,
  type NotificationRecipient,
  type InsertNotificationRecipient,
  type PayrollRequest,
  type InsertPayrollRequest,
  payrollAutomationSettings,
  type PayrollAutomationSettings,
  type InsertPayrollAutomationSettings,
} from "@shared/schema";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;

  getAllEmployees(): Promise<Employee[]>;
  getEmployee(id: string): Promise<Employee | undefined>;
  createEmployee(employee: InsertEmployee): Promise<Employee>;
  updateEmployee(id: string, employee: Partial<InsertEmployee>): Promise<Employee | undefined>;
  deleteEmployee(id: string): Promise<boolean>;

  getAllDepartments(): Promise<Department[]>;
  getDepartment(id: string): Promise<Department | undefined>;
  createDepartment(department: InsertDepartment): Promise<Department>;

  getAllAttendance(): Promise<Attendance[]>;
  getAttendanceByDate(date: string): Promise<Attendance[]>;
  createAttendance(record: InsertAttendance): Promise<Attendance>;

  getAllRequests(): Promise<Request[]>;
  getRequest(id: string): Promise<Request | undefined>;
  createRequest(request: InsertRequest): Promise<Request>;
  updateRequest(id: string, request: Partial<InsertRequest>): Promise<Request | undefined>;

  getAllVehicles(): Promise<Vehicle[]>;
  getVehicle(id: string): Promise<Vehicle | undefined>;
  createVehicle(vehicle: InsertVehicle): Promise<Vehicle>;
  updateVehicle(id: string, vehicle: Partial<InsertVehicle>): Promise<Vehicle | undefined>;
  deleteVehicle(id: string): Promise<boolean>;

  getAllDrivers(): Promise<Driver[]>;
  getDriver(id: string): Promise<Driver | undefined>;
  createDriver(driver: InsertDriver): Promise<Driver>;
  updateDriver(id: string, driver: Partial<InsertDriver>): Promise<Driver | undefined>;

  getEmployeeDocuments(employeeId: string): Promise<EmployeeDocument[]>;
  createEmployeeDocument(doc: InsertEmployeeDocument): Promise<EmployeeDocument>;
  deleteEmployeeDocument(id: string): Promise<boolean>;

  getBiometricEnrollment(employeeId: string): Promise<BiometricEnrollment | undefined>;
  createBiometricEnrollment(enrollment: InsertBiometricEnrollment): Promise<BiometricEnrollment>;
  updateBiometricEnrollment(id: string, enrollment: Partial<InsertBiometricEnrollment>): Promise<BiometricEnrollment | undefined>;
  deleteBiometricEnrollment(id: string): Promise<boolean>;

  getBiometricAttendanceEvents(employeeId: string): Promise<BiometricAttendanceEvent[]>;
  getTodayBiometricEvents(employeeId: string): Promise<BiometricAttendanceEvent[]>;
  createBiometricAttendanceEvent(event: InsertBiometricAttendanceEvent): Promise<BiometricAttendanceEvent>;

  getAllBranches(): Promise<Branch[]>;
  getBranch(id: string): Promise<Branch | undefined>;
  getBranchByCode(code: string): Promise<Branch | undefined>;
  createBranch(branch: InsertBranch): Promise<Branch>;
  updateBranch(id: string, branch: Partial<InsertBranch>): Promise<Branch | undefined>;
  deleteBranch(id: string): Promise<boolean>;

  getEmployeeBranches(employeeId: string): Promise<EmployeeBranch[]>;
  getEmployeePrimaryBranch(employeeId: string): Promise<EmployeeBranch | undefined>;
  getAllEmployeeBranches(): Promise<EmployeeBranch[]>;
  assignEmployeeToBranch(assignment: InsertEmployeeBranch): Promise<EmployeeBranch>;
  updateEmployeeBranch(id: string, assignment: Partial<InsertEmployeeBranch>): Promise<EmployeeBranch | undefined>;
  removeEmployeeFromBranch(id: string): Promise<boolean>;
  getBranchEmployees(branchId: string): Promise<EmployeeBranch[]>;

  getVehicleEvents(vehicleId: string): Promise<VehicleEvent[]>;
  getAllVehicleEvents(): Promise<VehicleEvent[]>;
  getVehicleEvent(id: string): Promise<VehicleEvent | undefined>;
  createVehicleEvent(event: InsertVehicleEvent): Promise<VehicleEvent>;
  updateVehicleEvent(id: string, event: Partial<InsertVehicleEvent>): Promise<VehicleEvent | undefined>;
  deleteVehicleEvent(id: string): Promise<boolean>;

  getVehicleDriverHistory(vehicleId: string): Promise<VehicleDriverHistory[]>;
  getDriverVehicleHistory(driverId: string): Promise<VehicleDriverHistory[]>;
  createVehicleDriverHistory(assignment: InsertVehicleDriverHistory): Promise<VehicleDriverHistory>;
  updateVehicleDriverHistory(id: string, assignment: Partial<InsertVehicleDriverHistory>): Promise<VehicleDriverHistory | undefined>;

  // Contracts
  getAllContracts(): Promise<Contract[]>;
  getContract(id: string): Promise<Contract | undefined>;
  createContract(contract: InsertContract): Promise<Contract>;
  updateContract(id: string, contract: Partial<InsertContract>): Promise<Contract | undefined>;
  deleteContract(id: string): Promise<boolean>;
  getContractStats(): Promise<ContractStats>;

  // Contract Parties
  getContractParties(contractId: string): Promise<ContractParty[]>;
  createContractParty(party: InsertContractParty): Promise<ContractParty>;
  updateContractParty(id: string, party: Partial<InsertContractParty>): Promise<ContractParty | undefined>;
  deleteContractParty(id: string): Promise<boolean>;

  // Properties
  getAllProperties(): Promise<Property[]>;
  getProperty(id: string): Promise<Property | undefined>;
  createProperty(property: InsertProperty): Promise<Property>;
  updateProperty(id: string, property: Partial<InsertProperty>): Promise<Property | undefined>;
  deleteProperty(id: string): Promise<boolean>;

  // Property Units
  getPropertyUnits(propertyId: string): Promise<PropertyUnit[]>;
  getAllPropertyUnits(): Promise<PropertyUnit[]>;
  getPropertyUnit(id: string): Promise<PropertyUnit | undefined>;
  createPropertyUnit(unit: InsertPropertyUnit): Promise<PropertyUnit>;
  updatePropertyUnit(id: string, unit: Partial<InsertPropertyUnit>): Promise<PropertyUnit | undefined>;
  deletePropertyUnit(id: string): Promise<boolean>;

  // Contract Payments
  getContractPayments(contractId: string): Promise<ContractPayment[]>;
  getAllContractPayments(): Promise<ContractPayment[]>;
  getContractPayment(id: string): Promise<ContractPayment | undefined>;
  createContractPayment(payment: InsertContractPayment): Promise<ContractPayment>;
  updateContractPayment(id: string, payment: Partial<InsertContractPayment>): Promise<ContractPayment | undefined>;
  deleteContractPayment(id: string): Promise<boolean>;

  // User Permissions
  getUserPermissions(userId: string): Promise<UserPermission[]>;
  createUserPermission(permission: InsertUserPermission): Promise<UserPermission>;
  deleteUserPermission(id: string): Promise<boolean>;
  deleteUserPermissionsByUser(userId: string): Promise<boolean>;

  // Audit Logs
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;
  getAuditLogs(limit?: number): Promise<AuditLog[]>;

  // Employee Contracts (Work Contracts)
  getEmployeeContracts(employeeId: string): Promise<EmployeeContract[]>;
  getEmployeeContract(id: string): Promise<EmployeeContract | undefined>;
  createEmployeeContract(contract: InsertEmployeeContract): Promise<EmployeeContract>;
  updateEmployeeContract(id: string, contract: Partial<InsertEmployeeContract>): Promise<EmployeeContract | undefined>;
  deleteEmployeeContract(id: string): Promise<boolean>;

  // Job Postings
  getJobPostings(): Promise<JobPosting[]>;
  getJobPosting(id: string): Promise<JobPosting | undefined>;
  getPublishedJobPostings(): Promise<JobPosting[]>;
  createJobPosting(posting: InsertJobPosting): Promise<JobPosting>;
  updateJobPosting(id: string, posting: Partial<InsertJobPosting>): Promise<JobPosting | undefined>;
  deleteJobPosting(id: string): Promise<boolean>;

  // Job Applications
  getJobApplications(jobId?: string): Promise<JobApplication[]>;
  getJobApplication(id: string): Promise<JobApplication | undefined>;
  getJobApplicationByNumber(applicationNumber: string): Promise<JobApplication | undefined>;
  createJobApplication(application: InsertJobApplication): Promise<JobApplication>;
  updateJobApplication(id: string, application: Partial<InsertJobApplication>): Promise<JobApplication | undefined>;
  deleteJobApplication(id: string): Promise<boolean>;
  getNextApplicationNumber(): Promise<string>;

  // Applicant Documents
  getApplicantDocuments(applicationId: string): Promise<ApplicantDocument[]>;
  createApplicantDocument(document: InsertApplicantDocument): Promise<ApplicantDocument>;
  deleteApplicantDocument(id: string): Promise<boolean>;

  // Applicant Experience
  getApplicantExperiences(applicationId: string): Promise<ApplicantExperience[]>;
  createApplicantExperience(experience: InsertApplicantExperience): Promise<ApplicantExperience>;
  updateApplicantExperience(id: string, experience: Partial<InsertApplicantExperience>): Promise<ApplicantExperience | undefined>;
  deleteApplicantExperience(id: string): Promise<boolean>;

  // Applicant Education
  getApplicantEducation(applicationId: string): Promise<ApplicantEducation[]>;
  createApplicantEducation(education: InsertApplicantEducation): Promise<ApplicantEducation>;
  updateApplicantEducation(id: string, education: Partial<InsertApplicantEducation>): Promise<ApplicantEducation | undefined>;
  deleteApplicantEducation(id: string): Promise<boolean>;

  // Applicant Skills
  getApplicantSkills(applicationId: string): Promise<ApplicantSkill[]>;
  createApplicantSkill(skill: InsertApplicantSkill): Promise<ApplicantSkill>;
  deleteApplicantSkill(id: string): Promise<boolean>;

  // Interviews
  getInterviews(applicationId?: string): Promise<Interview[]>;
  getInterview(id: string): Promise<Interview | undefined>;
  createInterview(interview: InsertInterview): Promise<Interview>;
  updateInterview(id: string, interview: Partial<InsertInterview>): Promise<Interview | undefined>;
  deleteInterview(id: string): Promise<boolean>;

  // Interview Feedback
  getInterviewFeedback(interviewId: string): Promise<InterviewFeedback[]>;
  createInterviewFeedback(feedback: InsertInterviewFeedback): Promise<InterviewFeedback>;
  updateInterviewFeedback(id: string, feedback: Partial<InsertInterviewFeedback>): Promise<InterviewFeedback | undefined>;

  // Application Status History
  getApplicationStatusHistory(applicationId: string): Promise<ApplicationStatusHistory[]>;
  createApplicationStatusHistory(history: InsertApplicationStatusHistory): Promise<ApplicationStatusHistory>;

  // Notifications
  getNotifications(): Promise<Notification[]>;
  getNotification(id: string): Promise<Notification | undefined>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  updateNotification(id: string, notification: Partial<InsertNotification>): Promise<Notification | undefined>;
  deleteNotification(id: string): Promise<boolean>;

  // Notification Recipients
  getNotificationRecipients(notificationId: string): Promise<NotificationRecipient[]>;
  getUserNotifications(userId: string): Promise<(NotificationRecipient & { notification: Notification })[]>;
  getUnreadNotificationCount(userId: string): Promise<number>;
  createNotificationRecipient(recipient: InsertNotificationRecipient): Promise<NotificationRecipient>;
  markNotificationAsRead(notificationId: string, userId: string): Promise<NotificationRecipient | undefined>;
  markAllNotificationsAsRead(userId: string): Promise<boolean>;
  deleteNotificationRecipient(id: string): Promise<boolean>;

  // Payroll Automation Settings
  getPayrollAutomationSettings(): Promise<PayrollAutomationSettings | undefined>;
  updatePayrollAutomationSettings(settings: Partial<InsertPayrollAutomationSettings>): Promise<PayrollAutomationSettings>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users);
  }

  async getAllEmployees(): Promise<Employee[]> {
    return db.select().from(employees);
  }

  async getEmployee(id: string): Promise<Employee | undefined> {
    const [employee] = await db.select().from(employees).where(eq(employees.id, id));
    return employee;
  }

  async createEmployee(employee: InsertEmployee): Promise<Employee> {
    const [created] = await db.insert(employees).values(employee).returning();
    return created;
  }

  async updateEmployee(id: string, employee: Partial<InsertEmployee>): Promise<Employee | undefined> {
    const [updated] = await db.update(employees).set(employee).where(eq(employees.id, id)).returning();
    return updated;
  }

  async deleteEmployee(id: string): Promise<boolean> {
    const result = await db.delete(employees).where(eq(employees.id, id));
    return true;
  }

  async getAllDepartments(): Promise<Department[]> {
    return db.select().from(departments);
  }

  async getDepartment(id: string): Promise<Department | undefined> {
    const [department] = await db.select().from(departments).where(eq(departments.id, id));
    return department;
  }

  async createDepartment(department: InsertDepartment): Promise<Department> {
    const [created] = await db.insert(departments).values(department).returning();
    return created;
  }

  async getAllAttendance(): Promise<Attendance[]> {
    return db.select().from(attendance);
  }

  async getAttendanceByDate(date: string): Promise<Attendance[]> {
    return db.select().from(attendance).where(eq(attendance.date, date));
  }

  async createAttendance(record: InsertAttendance): Promise<Attendance> {
    const [created] = await db.insert(attendance).values(record).returning();
    return created;
  }

  async getAllRequests(): Promise<Request[]> {
    return db.select().from(requests);
  }

  async getRequest(id: string): Promise<Request | undefined> {
    const [request] = await db.select().from(requests).where(eq(requests.id, id));
    return request;
  }

  async createRequest(request: InsertRequest): Promise<Request> {
    const [created] = await db.insert(requests).values(request).returning();
    return created;
  }

  async updateRequest(id: string, request: Partial<InsertRequest>): Promise<Request | undefined> {
    const [updated] = await db.update(requests).set(request).where(eq(requests.id, id)).returning();
    return updated;
  }

  async getAllVehicles(): Promise<Vehicle[]> {
    return db.select().from(vehicles);
  }

  async getVehicle(id: string): Promise<Vehicle | undefined> {
    const [vehicle] = await db.select().from(vehicles).where(eq(vehicles.id, id));
    return vehicle;
  }

  async createVehicle(vehicle: InsertVehicle): Promise<Vehicle> {
    const [created] = await db.insert(vehicles).values(vehicle).returning();
    return created;
  }

  async updateVehicle(id: string, vehicle: Partial<InsertVehicle>): Promise<Vehicle | undefined> {
    const [updated] = await db.update(vehicles).set(vehicle).where(eq(vehicles.id, id)).returning();
    return updated;
  }

  async deleteVehicle(id: string): Promise<boolean> {
    await db.delete(vehicles).where(eq(vehicles.id, id));
    return true;
  }

  async getAllDrivers(): Promise<Driver[]> {
    return db.select().from(drivers);
  }

  async getDriver(id: string): Promise<Driver | undefined> {
    const [driver] = await db.select().from(drivers).where(eq(drivers.id, id));
    return driver;
  }

  async createDriver(driver: InsertDriver): Promise<Driver> {
    const [created] = await db.insert(drivers).values(driver).returning();
    return created;
  }

  async updateDriver(id: string, driver: Partial<InsertDriver>): Promise<Driver | undefined> {
    const [updated] = await db.update(drivers).set(driver).where(eq(drivers.id, id)).returning();
    return updated;
  }

  async getEmployeeDocuments(employeeId: string): Promise<EmployeeDocument[]> {
    return db.select().from(employeeDocuments).where(eq(employeeDocuments.employeeId, employeeId));
  }

  async createEmployeeDocument(doc: InsertEmployeeDocument): Promise<EmployeeDocument> {
    const [created] = await db.insert(employeeDocuments).values(doc).returning();
    return created;
  }

  async deleteEmployeeDocument(id: string): Promise<boolean> {
    await db.delete(employeeDocuments).where(eq(employeeDocuments.id, id));
    return true;
  }

  async getBiometricEnrollment(employeeId: string): Promise<BiometricEnrollment | undefined> {
    const [enrollment] = await db.select().from(biometricEnrollments).where(eq(biometricEnrollments.employeeId, employeeId));
    return enrollment;
  }

  async createBiometricEnrollment(enrollment: InsertBiometricEnrollment): Promise<BiometricEnrollment> {
    const [created] = await db.insert(biometricEnrollments).values(enrollment).returning();
    return created;
  }

  async updateBiometricEnrollment(id: string, enrollment: Partial<InsertBiometricEnrollment>): Promise<BiometricEnrollment | undefined> {
    const [updated] = await db.update(biometricEnrollments).set(enrollment).where(eq(biometricEnrollments.id, id)).returning();
    return updated;
  }

  async deleteBiometricEnrollment(id: string): Promise<boolean> {
    await db.delete(biometricEnrollments).where(eq(biometricEnrollments.id, id));
    return true;
  }

  async getBiometricAttendanceEvents(employeeId: string): Promise<BiometricAttendanceEvent[]> {
    return db.select().from(biometricAttendanceEvents).where(eq(biometricAttendanceEvents.employeeId, employeeId));
  }

  async getTodayBiometricEvents(employeeId: string): Promise<BiometricAttendanceEvent[]> {
    const today = new Date().toISOString().split('T')[0];
    const events = await db.select().from(biometricAttendanceEvents).where(eq(biometricAttendanceEvents.employeeId, employeeId));
    return events.filter(e => e.timestamp.startsWith(today));
  }

  async createBiometricAttendanceEvent(event: InsertBiometricAttendanceEvent): Promise<BiometricAttendanceEvent> {
    const [created] = await db.insert(biometricAttendanceEvents).values(event).returning();
    return created;
  }

  async getAllBranches(): Promise<Branch[]> {
    return db.select().from(branches);
  }

  async getBranch(id: string): Promise<Branch | undefined> {
    const [branch] = await db.select().from(branches).where(eq(branches.id, id));
    return branch;
  }

  async getBranchByCode(code: string): Promise<Branch | undefined> {
    const [branch] = await db.select().from(branches).where(eq(branches.code, code));
    return branch;
  }

  async createBranch(branch: InsertBranch): Promise<Branch> {
    const [created] = await db.insert(branches).values(branch).returning();
    return created;
  }

  async updateBranch(id: string, branch: Partial<InsertBranch>): Promise<Branch | undefined> {
    const [updated] = await db.update(branches).set(branch).where(eq(branches.id, id)).returning();
    return updated;
  }

  async deleteBranch(id: string): Promise<boolean> {
    await db.delete(branches).where(eq(branches.id, id));
    return true;
  }

  async getEmployeeBranches(employeeId: string): Promise<EmployeeBranch[]> {
    return db.select().from(employeeBranches).where(eq(employeeBranches.employeeId, employeeId));
  }

  async getEmployeePrimaryBranch(employeeId: string): Promise<EmployeeBranch | undefined> {
    const [assignment] = await db.select().from(employeeBranches)
      .where(and(eq(employeeBranches.employeeId, employeeId), eq(employeeBranches.isPrimary, true)));
    return assignment;
  }

  async getAllEmployeeBranches(): Promise<EmployeeBranch[]> {
    return db.select().from(employeeBranches);
  }

  async assignEmployeeToBranch(assignment: InsertEmployeeBranch): Promise<EmployeeBranch> {
    const [created] = await db.insert(employeeBranches).values(assignment).returning();
    return created;
  }

  async updateEmployeeBranch(id: string, assignment: Partial<InsertEmployeeBranch>): Promise<EmployeeBranch | undefined> {
    const [updated] = await db.update(employeeBranches).set(assignment).where(eq(employeeBranches.id, id)).returning();
    return updated;
  }

  async removeEmployeeFromBranch(id: string): Promise<boolean> {
    await db.delete(employeeBranches).where(eq(employeeBranches.id, id));
    return true;
  }

  async getBranchEmployees(branchId: string): Promise<EmployeeBranch[]> {
    return db.select().from(employeeBranches).where(eq(employeeBranches.branchId, branchId));
  }

  async getVehicleEvents(vehicleId: string): Promise<VehicleEvent[]> {
    return db.select().from(vehicleEvents).where(eq(vehicleEvents.vehicleId, vehicleId));
  }

  async getAllVehicleEvents(): Promise<VehicleEvent[]> {
    return db.select().from(vehicleEvents);
  }

  async getVehicleEvent(id: string): Promise<VehicleEvent | undefined> {
    const [event] = await db.select().from(vehicleEvents).where(eq(vehicleEvents.id, id));
    return event;
  }

  async createVehicleEvent(event: InsertVehicleEvent): Promise<VehicleEvent> {
    const [created] = await db.insert(vehicleEvents).values(event).returning();
    return created;
  }

  async updateVehicleEvent(id: string, event: Partial<InsertVehicleEvent>): Promise<VehicleEvent | undefined> {
    const [updated] = await db.update(vehicleEvents).set(event).where(eq(vehicleEvents.id, id)).returning();
    return updated;
  }

  async deleteVehicleEvent(id: string): Promise<boolean> {
    await db.delete(vehicleEvents).where(eq(vehicleEvents.id, id));
    return true;
  }

  async getVehicleDriverHistory(vehicleId: string): Promise<VehicleDriverHistory[]> {
    return db.select().from(vehicleDriverHistory).where(eq(vehicleDriverHistory.vehicleId, vehicleId));
  }

  async getDriverVehicleHistory(driverId: string): Promise<VehicleDriverHistory[]> {
    return db.select().from(vehicleDriverHistory).where(eq(vehicleDriverHistory.driverId, driverId));
  }

  async createVehicleDriverHistory(assignment: InsertVehicleDriverHistory): Promise<VehicleDriverHistory> {
    const [created] = await db.insert(vehicleDriverHistory).values(assignment).returning();
    return created;
  }

  async updateVehicleDriverHistory(id: string, assignment: Partial<InsertVehicleDriverHistory>): Promise<VehicleDriverHistory | undefined> {
    const [updated] = await db.update(vehicleDriverHistory).set(assignment).where(eq(vehicleDriverHistory.id, id)).returning();
    return updated;
  }

  // Contracts
  async getAllContracts(): Promise<Contract[]> {
    return db.select().from(contracts);
  }

  async getContract(id: string): Promise<Contract | undefined> {
    const [contract] = await db.select().from(contracts).where(eq(contracts.id, id));
    return contract;
  }

  async createContract(contract: InsertContract): Promise<Contract> {
    const [created] = await db.insert(contracts).values(contract).returning();
    return created;
  }

  async updateContract(id: string, contract: Partial<InsertContract>): Promise<Contract | undefined> {
    const [updated] = await db.update(contracts).set(contract).where(eq(contracts.id, id)).returning();
    return updated;
  }

  async deleteContract(id: string): Promise<boolean> {
    await db.delete(contracts).where(eq(contracts.id, id));
    return true;
  }

  async getContractStats(): Promise<ContractStats> {
    const allContracts = await db.select().from(contracts);
    const allProperties = await db.select().from(properties);
    const allUnits = await db.select().from(propertyUnits);
    const allPayments = await db.select().from(contractPayments);
    
    const today = new Date().toISOString().split("T")[0];
    const endOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split("T")[0];
    
    const activeContracts = allContracts.filter(c => c.status === "active");
    const expiringThisMonth = activeContracts.filter(c => c.endDate && c.endDate <= endOfMonth && c.endDate >= today);
    const pendingPayments = allPayments.filter(p => p.status === "pending");
    const overduePayments = allPayments.filter(p => p.status === "overdue" || (p.status === "pending" && p.dueDate < today));
    
    const totalMonthlyRent = activeContracts.reduce((sum, c) => sum + ((c.annualRent || 0) / 12), 0);
    const totalAnnualRent = activeContracts.reduce((sum, c) => sum + (c.annualRent || 0), 0);
    
    const occupiedUnits = allUnits.filter(u => u.status === "occupied");
    const availableUnits = allUnits.filter(u => u.status === "available");
    
    return {
      totalContracts: allContracts.length,
      activeContracts: activeContracts.length,
      expiringThisMonth: expiringThisMonth.length,
      pendingPayments: pendingPayments.length,
      overduePayments: overduePayments.length,
      totalMonthlyRent: Math.round(totalMonthlyRent),
      totalAnnualRent,
      totalProperties: allProperties.length,
      occupiedUnits: occupiedUnits.length,
      availableUnits: availableUnits.length,
    };
  }

  // Contract Parties
  async getContractParties(contractId: string): Promise<ContractParty[]> {
    return db.select().from(contractParties).where(eq(contractParties.contractId, contractId));
  }

  async createContractParty(party: InsertContractParty): Promise<ContractParty> {
    const [created] = await db.insert(contractParties).values(party).returning();
    return created;
  }

  async updateContractParty(id: string, party: Partial<InsertContractParty>): Promise<ContractParty | undefined> {
    const [updated] = await db.update(contractParties).set(party).where(eq(contractParties.id, id)).returning();
    return updated;
  }

  async deleteContractParty(id: string): Promise<boolean> {
    await db.delete(contractParties).where(eq(contractParties.id, id));
    return true;
  }

  // Properties
  async getAllProperties(): Promise<Property[]> {
    return db.select().from(properties);
  }

  async getProperty(id: string): Promise<Property | undefined> {
    const [property] = await db.select().from(properties).where(eq(properties.id, id));
    return property;
  }

  async createProperty(property: InsertProperty): Promise<Property> {
    const [created] = await db.insert(properties).values(property).returning();
    return created;
  }

  async updateProperty(id: string, property: Partial<InsertProperty>): Promise<Property | undefined> {
    const [updated] = await db.update(properties).set(property).where(eq(properties.id, id)).returning();
    return updated;
  }

  async deleteProperty(id: string): Promise<boolean> {
    await db.delete(properties).where(eq(properties.id, id));
    return true;
  }

  // Property Units
  async getPropertyUnits(propertyId: string): Promise<PropertyUnit[]> {
    return db.select().from(propertyUnits).where(eq(propertyUnits.propertyId, propertyId));
  }

  async getAllPropertyUnits(): Promise<PropertyUnit[]> {
    return db.select().from(propertyUnits);
  }

  async getPropertyUnit(id: string): Promise<PropertyUnit | undefined> {
    const [unit] = await db.select().from(propertyUnits).where(eq(propertyUnits.id, id));
    return unit;
  }

  async createPropertyUnit(unit: InsertPropertyUnit): Promise<PropertyUnit> {
    const [created] = await db.insert(propertyUnits).values(unit).returning();
    return created;
  }

  async updatePropertyUnit(id: string, unit: Partial<InsertPropertyUnit>): Promise<PropertyUnit | undefined> {
    const [updated] = await db.update(propertyUnits).set(unit).where(eq(propertyUnits.id, id)).returning();
    return updated;
  }

  async deletePropertyUnit(id: string): Promise<boolean> {
    await db.delete(propertyUnits).where(eq(propertyUnits.id, id));
    return true;
  }

  // Contract Payments
  async getContractPayments(contractId: string): Promise<ContractPayment[]> {
    return db.select().from(contractPayments).where(eq(contractPayments.contractId, contractId));
  }

  async getAllContractPayments(): Promise<ContractPayment[]> {
    return db.select().from(contractPayments);
  }

  async getContractPayment(id: string): Promise<ContractPayment | undefined> {
    const [payment] = await db.select().from(contractPayments).where(eq(contractPayments.id, id));
    return payment;
  }

  async createContractPayment(payment: InsertContractPayment): Promise<ContractPayment> {
    const [created] = await db.insert(contractPayments).values(payment).returning();
    return created;
  }

  async updateContractPayment(id: string, payment: Partial<InsertContractPayment>): Promise<ContractPayment | undefined> {
    const [updated] = await db.update(contractPayments).set(payment).where(eq(contractPayments.id, id)).returning();
    return updated;
  }

  async deleteContractPayment(id: string): Promise<boolean> {
    await db.delete(contractPayments).where(eq(contractPayments.id, id));
    return true;
  }

  // User Permissions
  async getUserPermissions(userId: string): Promise<UserPermission[]> {
    return db.select().from(userPermissions).where(eq(userPermissions.userId, userId));
  }

  async createUserPermission(permission: InsertUserPermission): Promise<UserPermission> {
    const [created] = await db.insert(userPermissions).values(permission).returning();
    return created;
  }

  async deleteUserPermission(id: string): Promise<boolean> {
    await db.delete(userPermissions).where(eq(userPermissions.id, id));
    return true;
  }

  async deleteUserPermissionsByUser(userId: string): Promise<boolean> {
    await db.delete(userPermissions).where(eq(userPermissions.userId, userId));
    return true;
  }

  // Audit Logs
  async createAuditLog(log: InsertAuditLog): Promise<AuditLog> {
    const [created] = await db.insert(auditLogs).values(log).returning();
    return created;
  }

  async getAuditLogs(limit: number = 100): Promise<AuditLog[]> {
    return db.select().from(auditLogs).limit(limit);
  }

  // Employee Contracts (Work Contracts)
  async getEmployeeContracts(employeeId: string): Promise<EmployeeContract[]> {
    return db.select().from(employeeContracts).where(eq(employeeContracts.employeeId, employeeId));
  }

  async getEmployeeContract(id: string): Promise<EmployeeContract | undefined> {
    const [contract] = await db.select().from(employeeContracts).where(eq(employeeContracts.id, id));
    return contract;
  }

  async createEmployeeContract(contract: InsertEmployeeContract): Promise<EmployeeContract> {
    const [created] = await db.insert(employeeContracts).values(contract).returning();
    return created;
  }

  async updateEmployeeContract(id: string, contract: Partial<InsertEmployeeContract>): Promise<EmployeeContract | undefined> {
    const [updated] = await db.update(employeeContracts).set(contract).where(eq(employeeContracts.id, id)).returning();
    return updated;
  }

  async deleteEmployeeContract(id: string): Promise<boolean> {
    await db.delete(employeeContracts).where(eq(employeeContracts.id, id));
    return true;
  }

  // Job Postings
  async getJobPostings(): Promise<JobPosting[]> {
    return db.select().from(jobPostings);
  }

  async getJobPosting(id: string): Promise<JobPosting | undefined> {
    const [posting] = await db.select().from(jobPostings).where(eq(jobPostings.id, id));
    return posting;
  }

  async getPublishedJobPostings(): Promise<JobPosting[]> {
    return db.select().from(jobPostings).where(eq(jobPostings.status, "published"));
  }

  async createJobPosting(posting: InsertJobPosting): Promise<JobPosting> {
    const [created] = await db.insert(jobPostings).values(posting).returning();
    return created;
  }

  async updateJobPosting(id: string, posting: Partial<InsertJobPosting>): Promise<JobPosting | undefined> {
    const [updated] = await db.update(jobPostings).set(posting).where(eq(jobPostings.id, id)).returning();
    return updated;
  }

  async deleteJobPosting(id: string): Promise<boolean> {
    await db.delete(jobPostings).where(eq(jobPostings.id, id));
    return true;
  }

  // Job Applications
  async getJobApplications(jobId?: string): Promise<JobApplication[]> {
    if (jobId) {
      return db.select().from(jobApplications).where(eq(jobApplications.jobId, jobId));
    }
    return db.select().from(jobApplications);
  }

  async getJobApplication(id: string): Promise<JobApplication | undefined> {
    const [application] = await db.select().from(jobApplications).where(eq(jobApplications.id, id));
    return application;
  }

  async getJobApplicationByNumber(applicationNumber: string): Promise<JobApplication | undefined> {
    const [application] = await db.select().from(jobApplications).where(eq(jobApplications.applicationNumber, applicationNumber));
    return application;
  }

  async createJobApplication(application: InsertJobApplication): Promise<JobApplication> {
    const [created] = await db.insert(jobApplications).values(application).returning();
    return created;
  }

  async updateJobApplication(id: string, application: Partial<InsertJobApplication>): Promise<JobApplication | undefined> {
    const [updated] = await db.update(jobApplications).set(application).where(eq(jobApplications.id, id)).returning();
    return updated;
  }

  async deleteJobApplication(id: string): Promise<boolean> {
    await db.delete(jobApplications).where(eq(jobApplications.id, id));
    return true;
  }

  async getNextApplicationNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const result = await db.select({ count: sql<number>`count(*)` }).from(jobApplications);
    const count = (result[0]?.count || 0) + 1;
    return `APP-${year}-${count.toString().padStart(4, '0')}`;
  }

  // Applicant Documents
  async getApplicantDocuments(applicationId: string): Promise<ApplicantDocument[]> {
    return db.select().from(applicantDocuments).where(eq(applicantDocuments.applicationId, applicationId));
  }

  async createApplicantDocument(document: InsertApplicantDocument): Promise<ApplicantDocument> {
    const [created] = await db.insert(applicantDocuments).values(document).returning();
    return created;
  }

  async deleteApplicantDocument(id: string): Promise<boolean> {
    await db.delete(applicantDocuments).where(eq(applicantDocuments.id, id));
    return true;
  }

  // Applicant Experience
  async getApplicantExperiences(applicationId: string): Promise<ApplicantExperience[]> {
    return db.select().from(applicantExperiences).where(eq(applicantExperiences.applicationId, applicationId));
  }

  async createApplicantExperience(experience: InsertApplicantExperience): Promise<ApplicantExperience> {
    const [created] = await db.insert(applicantExperiences).values(experience).returning();
    return created;
  }

  async updateApplicantExperience(id: string, experience: Partial<InsertApplicantExperience>): Promise<ApplicantExperience | undefined> {
    const [updated] = await db.update(applicantExperiences).set(experience).where(eq(applicantExperiences.id, id)).returning();
    return updated;
  }

  async deleteApplicantExperience(id: string): Promise<boolean> {
    await db.delete(applicantExperiences).where(eq(applicantExperiences.id, id));
    return true;
  }

  // Applicant Education
  async getApplicantEducation(applicationId: string): Promise<ApplicantEducation[]> {
    return db.select().from(applicantEducation).where(eq(applicantEducation.applicationId, applicationId));
  }

  async createApplicantEducation(education: InsertApplicantEducation): Promise<ApplicantEducation> {
    const [created] = await db.insert(applicantEducation).values(education).returning();
    return created;
  }

  async updateApplicantEducation(id: string, education: Partial<InsertApplicantEducation>): Promise<ApplicantEducation | undefined> {
    const [updated] = await db.update(applicantEducation).set(education).where(eq(applicantEducation.id, id)).returning();
    return updated;
  }

  async deleteApplicantEducation(id: string): Promise<boolean> {
    await db.delete(applicantEducation).where(eq(applicantEducation.id, id));
    return true;
  }

  // Applicant Skills
  async getApplicantSkills(applicationId: string): Promise<ApplicantSkill[]> {
    return db.select().from(applicantSkills).where(eq(applicantSkills.applicationId, applicationId));
  }

  async createApplicantSkill(skill: InsertApplicantSkill): Promise<ApplicantSkill> {
    const [created] = await db.insert(applicantSkills).values(skill).returning();
    return created;
  }

  async deleteApplicantSkill(id: string): Promise<boolean> {
    await db.delete(applicantSkills).where(eq(applicantSkills.id, id));
    return true;
  }

  // Interviews
  async getInterviews(applicationId?: string): Promise<Interview[]> {
    if (applicationId) {
      return db.select().from(interviews).where(eq(interviews.applicationId, applicationId));
    }
    return db.select().from(interviews);
  }

  async getInterview(id: string): Promise<Interview | undefined> {
    const [interview] = await db.select().from(interviews).where(eq(interviews.id, id));
    return interview;
  }

  async createInterview(interview: InsertInterview): Promise<Interview> {
    const [created] = await db.insert(interviews).values(interview).returning();
    return created;
  }

  async updateInterview(id: string, interview: Partial<InsertInterview>): Promise<Interview | undefined> {
    const [updated] = await db.update(interviews).set(interview).where(eq(interviews.id, id)).returning();
    return updated;
  }

  async deleteInterview(id: string): Promise<boolean> {
    await db.delete(interviews).where(eq(interviews.id, id));
    return true;
  }

  // Interview Feedback
  async getInterviewFeedback(interviewId: string): Promise<InterviewFeedback[]> {
    return db.select().from(interviewFeedback).where(eq(interviewFeedback.interviewId, interviewId));
  }

  async createInterviewFeedback(feedback: InsertInterviewFeedback): Promise<InterviewFeedback> {
    const [created] = await db.insert(interviewFeedback).values(feedback).returning();
    return created;
  }

  async updateInterviewFeedback(id: string, feedback: Partial<InsertInterviewFeedback>): Promise<InterviewFeedback | undefined> {
    const [updated] = await db.update(interviewFeedback).set(feedback).where(eq(interviewFeedback.id, id)).returning();
    return updated;
  }

  // Application Status History
  async getApplicationStatusHistory(applicationId: string): Promise<ApplicationStatusHistory[]> {
    return db.select().from(applicationStatusHistory).where(eq(applicationStatusHistory.applicationId, applicationId));
  }

  async createApplicationStatusHistory(history: InsertApplicationStatusHistory): Promise<ApplicationStatusHistory> {
    const [created] = await db.insert(applicationStatusHistory).values(history).returning();
    return created;
  }

  // ========================
  // Payroll Management
  // ========================

  async getPayrollRuns(): Promise<PayrollRun[]> {
    return db.select().from(payrollRuns);
  }

  async getPayrollRun(id: string): Promise<PayrollRun | undefined> {
    const [run] = await db.select().from(payrollRuns).where(eq(payrollRuns.id, id));
    return run;
  }

  async getPayrollRunByPeriod(year: number, month: number): Promise<PayrollRun | undefined> {
    const [run] = await db.select().from(payrollRuns)
      .where(and(eq(payrollRuns.year, year), eq(payrollRuns.month, month)));
    return run;
  }

  async createPayrollRun(run: InsertPayrollRun): Promise<PayrollRun> {
    const [created] = await db.insert(payrollRuns).values(run).returning();
    return created;
  }

  async updatePayrollRun(id: string, run: Partial<InsertPayrollRun>): Promise<PayrollRun | undefined> {
    const [updated] = await db.update(payrollRuns).set(run).where(eq(payrollRuns.id, id)).returning();
    return updated;
  }

  async deletePayrollRun(id: string): Promise<boolean> {
    const items = await this.getPayrollItems(id);
    for (const item of items) {
      await db.delete(payrollAdjustments).where(eq(payrollAdjustments.payrollItemId, item.id));
    }
    await db.delete(payrollItems).where(eq(payrollItems.runId, id));
    await db.delete(payrollRuns).where(eq(payrollRuns.id, id));
    return true;
  }

  async getPayrollItems(runId: string): Promise<PayrollItem[]> {
    return db.select().from(payrollItems).where(eq(payrollItems.runId, runId));
  }

  async getPayrollItem(id: string): Promise<PayrollItem | undefined> {
    const [item] = await db.select().from(payrollItems).where(eq(payrollItems.id, id));
    return item;
  }

  async createPayrollItem(item: InsertPayrollItem): Promise<PayrollItem> {
    const [created] = await db.insert(payrollItems).values(item).returning();
    return created;
  }

  async updatePayrollItem(id: string, item: Partial<InsertPayrollItem>): Promise<PayrollItem | undefined> {
    const [updated] = await db.update(payrollItems).set(item).where(eq(payrollItems.id, id)).returning();
    return updated;
  }

  async getPayrollAdjustments(payrollItemId: string): Promise<PayrollAdjustment[]> {
    return db.select().from(payrollAdjustments).where(eq(payrollAdjustments.payrollItemId, payrollItemId));
  }

  async createPayrollAdjustment(adjustment: InsertPayrollAdjustment): Promise<PayrollAdjustment> {
    const [created] = await db.insert(payrollAdjustments).values(adjustment).returning();
    return created;
  }

  async deletePayrollAdjustment(id: string): Promise<boolean> {
    await db.delete(payrollAdjustments).where(eq(payrollAdjustments.id, id));
    return true;
  }

  async getPayrollTemplates(employeeId: string): Promise<PayrollTemplate[]> {
    return db.select().from(payrollTemplates).where(eq(payrollTemplates.employeeId, employeeId));
  }

  async getActivePayrollTemplates(employeeId: string): Promise<PayrollTemplate[]> {
    return db.select().from(payrollTemplates)
      .where(and(eq(payrollTemplates.employeeId, employeeId), eq(payrollTemplates.isActive, true)));
  }

  async createPayrollTemplate(template: InsertPayrollTemplate): Promise<PayrollTemplate> {
    const [created] = await db.insert(payrollTemplates).values(template).returning();
    return created;
  }

  async updatePayrollTemplate(id: string, template: Partial<InsertPayrollTemplate>): Promise<PayrollTemplate | undefined> {
    const [updated] = await db.update(payrollTemplates).set(template).where(eq(payrollTemplates.id, id)).returning();
    return updated;
  }

  async deletePayrollTemplate(id: string): Promise<boolean> {
    await db.delete(payrollTemplates).where(eq(payrollTemplates.id, id));
    return true;
  }

  // Payroll Approval Settings
  async getAllPayrollApprovalSettings(): Promise<PayrollApprovalSetting[]> {
    return db.select().from(payrollApprovalSettings).orderBy(payrollApprovalSettings.orderIndex);
  }

  async getEnabledPayrollApprovalSettings(): Promise<PayrollApprovalSetting[]> {
    return db.select().from(payrollApprovalSettings)
      .where(eq(payrollApprovalSettings.isEnabled, true))
      .orderBy(payrollApprovalSettings.orderIndex);
  }

  async getPayrollApprovalSetting(id: string): Promise<PayrollApprovalSetting | undefined> {
    const [setting] = await db.select().from(payrollApprovalSettings).where(eq(payrollApprovalSettings.id, id));
    return setting;
  }

  async getPayrollApprovalSettingByRole(role: string): Promise<PayrollApprovalSetting | undefined> {
    const [setting] = await db.select().from(payrollApprovalSettings).where(eq(payrollApprovalSettings.role, role));
    return setting;
  }

  async createPayrollApprovalSetting(setting: InsertPayrollApprovalSetting): Promise<PayrollApprovalSetting> {
    const [created] = await db.insert(payrollApprovalSettings).values(setting).returning();
    return created;
  }

  async updatePayrollApprovalSetting(id: string, setting: Partial<InsertPayrollApprovalSetting>): Promise<PayrollApprovalSetting | undefined> {
    const [updated] = await db.update(payrollApprovalSettings).set(setting).where(eq(payrollApprovalSettings.id, id)).returning();
    return updated;
  }

  // Payroll Run Approvals
  async getPayrollRunApprovals(runId: string): Promise<PayrollRunApproval[]> {
    return db.select().from(payrollRunApprovals).where(eq(payrollRunApprovals.runId, runId));
  }

  async getPayrollRunApproval(runId: string, role: string): Promise<PayrollRunApproval | undefined> {
    const [approval] = await db.select().from(payrollRunApprovals)
      .where(and(eq(payrollRunApprovals.runId, runId), eq(payrollRunApprovals.role, role)));
    return approval;
  }

  async createPayrollRunApproval(approval: InsertPayrollRunApproval): Promise<PayrollRunApproval> {
    const [created] = await db.insert(payrollRunApprovals).values(approval).returning();
    return created;
  }

  async updatePayrollRunApproval(id: string, approval: Partial<InsertPayrollRunApproval>): Promise<PayrollRunApproval | undefined> {
    const [updated] = await db.update(payrollRunApprovals).set(approval).where(eq(payrollRunApprovals.id, id)).returning();
    return updated;
  }

  async deletePayrollRunApprovals(runId: string): Promise<boolean> {
    await db.delete(payrollRunApprovals).where(eq(payrollRunApprovals.runId, runId));
    return true;
  }

  // Management Assignments
  async getManagementAssignments(managerUserId: string): Promise<ManagementAssignment[]> {
    return db.select().from(managementAssignments).where(eq(managementAssignments.managerUserId, managerUserId));
  }

  async getManagementAssignmentsByScope(scopeType: string, scopeId: string): Promise<ManagementAssignment[]> {
    return db.select().from(managementAssignments)
      .where(and(
        eq(managementAssignments.scopeType, scopeType),
        eq(managementAssignments.scopeId, scopeId)
      ));
  }

  async getAllManagementAssignments(): Promise<ManagementAssignment[]> {
    return db.select().from(managementAssignments);
  }

  async createManagementAssignment(assignment: InsertManagementAssignment): Promise<ManagementAssignment> {
    const [created] = await db.insert(managementAssignments).values(assignment).returning();
    return created;
  }

  async deleteManagementAssignment(id: string): Promise<boolean> {
    await db.delete(managementAssignments).where(eq(managementAssignments.id, id));
    return true;
  }

  async deleteManagementAssignmentsByManager(managerUserId: string): Promise<boolean> {
    await db.delete(managementAssignments).where(eq(managementAssignments.managerUserId, managerUserId));
    return true;
  }

  // Access Scope Helper - Get allowed branch and employee IDs for a user
  // Returns { branchIds: [], employeeIds: [], hasNoRestrictions: true } for admins who bypass restrictions
  // Returns { branchIds: [...], employeeIds: [...], hasNoRestrictions: false } for scoped users
  async getUserAccessScope(userId: string, userRole: string): Promise<{ branchIds: string[]; employeeIds: string[]; hasNoRestrictions: boolean }> {
    // Super admin and admin bypass all restrictions
    if (userRole === "super_admin" || userRole === "admin" || userRole === "hr" || userRole === "finance") {
      return { branchIds: [], employeeIds: [], hasNoRestrictions: true }; // No restrictions for these roles
    }

    // Get direct assignments for this user
    const assignments = await this.getManagementAssignments(userId);
    
    const branchIds: string[] = [];
    const employeeIds: string[] = [];
    
    for (const assignment of assignments) {
      if (assignment.scopeType === "branch") {
        branchIds.push(assignment.scopeId);
      } else if (assignment.scopeType === "employee") {
        employeeIds.push(assignment.scopeId);
      }
    }
    
    // Get employees from assigned branches
    if (branchIds.length > 0) {
      const employeeBranchRecords = await db.select().from(employeeBranches)
        .where(inArray(employeeBranches.branchId, branchIds));
      
      for (const record of employeeBranchRecords) {
        if (!employeeIds.includes(record.employeeId)) {
          employeeIds.push(record.employeeId);
        }
      }
    }
    
    return { branchIds, employeeIds, hasNoRestrictions: false };
  }

  // Notifications
  async getNotifications(): Promise<Notification[]> {
    return db.select().from(notifications).orderBy(sql`${notifications.createdAt} DESC`);
  }

  async getNotification(id: string): Promise<Notification | undefined> {
    const [notification] = await db.select().from(notifications).where(eq(notifications.id, id));
    return notification;
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [created] = await db.insert(notifications).values(notification).returning();
    return created;
  }

  async updateNotification(id: string, notification: Partial<InsertNotification>): Promise<Notification | undefined> {
    const [updated] = await db.update(notifications).set(notification).where(eq(notifications.id, id)).returning();
    return updated;
  }

  async deleteNotification(id: string): Promise<boolean> {
    await db.delete(notificationRecipients).where(eq(notificationRecipients.notificationId, id));
    await db.delete(notifications).where(eq(notifications.id, id));
    return true;
  }

  // Notification Recipients
  async getNotificationRecipients(notificationId: string): Promise<NotificationRecipient[]> {
    return db.select().from(notificationRecipients)
      .where(eq(notificationRecipients.notificationId, notificationId));
  }

  async getUserNotifications(userId: string): Promise<(NotificationRecipient & { notification: Notification })[]> {
    const recipients = await db.select().from(notificationRecipients)
      .where(and(
        eq(notificationRecipients.recipientId, userId),
        eq(notificationRecipients.isDeleted, false)
      ))
      .orderBy(sql`${notificationRecipients.createdAt} DESC`);
    
    const result: (NotificationRecipient & { notification: Notification })[] = [];
    
    for (const recipient of recipients) {
      const notification = await this.getNotification(recipient.notificationId);
      if (notification && notification.isActive) {
        // Check expiration
        if (!notification.expiresAt || new Date(notification.expiresAt) > new Date()) {
          result.push({ ...recipient, notification });
        }
      }
    }
    
    return result;
  }

  async getUnreadNotificationCount(userId: string): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(notificationRecipients)
      .innerJoin(notifications, eq(notificationRecipients.notificationId, notifications.id))
      .where(and(
        eq(notificationRecipients.recipientId, userId),
        eq(notificationRecipients.isRead, false),
        eq(notificationRecipients.isDeleted, false),
        eq(notifications.isActive, true)
      ));
    
    return Number(result[0]?.count || 0);
  }

  async createNotificationRecipient(recipient: InsertNotificationRecipient): Promise<NotificationRecipient> {
    const [created] = await db.insert(notificationRecipients).values(recipient).returning();
    return created;
  }

  async markNotificationAsRead(notificationId: string, userId: string): Promise<NotificationRecipient | undefined> {
    const [updated] = await db.update(notificationRecipients)
      .set({ isRead: true, readAt: new Date().toISOString() })
      .where(and(
        eq(notificationRecipients.notificationId, notificationId),
        eq(notificationRecipients.recipientId, userId)
      ))
      .returning();
    return updated;
  }

  async markAllNotificationsAsRead(userId: string): Promise<boolean> {
    await db.update(notificationRecipients)
      .set({ isRead: true, readAt: new Date().toISOString() })
      .where(and(
        eq(notificationRecipients.recipientId, userId),
        eq(notificationRecipients.isRead, false)
      ));
    return true;
  }

  async deleteNotificationRecipient(id: string): Promise<boolean> {
    await db.update(notificationRecipients)
      .set({ isDeleted: true, deletedAt: new Date().toISOString() })
      .where(eq(notificationRecipients.id, id));
    return true;
  }

  // Payroll Requests
  async getAllPayrollRequests(): Promise<PayrollRequest[]> {
    return db.select().from(payrollRequests).orderBy(sql`${payrollRequests.createdAt} DESC`);
  }

  async getPayrollRequestsByPeriod(year: number, month: number): Promise<PayrollRequest[]> {
    return db.select().from(payrollRequests)
      .where(and(
        eq(payrollRequests.targetYear, year),
        eq(payrollRequests.targetMonth, month)
      ))
      .orderBy(sql`${payrollRequests.createdAt} DESC`);
  }

  async getPayrollRequestsByCategory(category: string): Promise<PayrollRequest[]> {
    return db.select().from(payrollRequests)
      .where(eq(payrollRequests.category, category))
      .orderBy(sql`${payrollRequests.createdAt} DESC`);
  }

  async getPayrollRequestsByEmployee(employeeId: string): Promise<PayrollRequest[]> {
    return db.select().from(payrollRequests)
      .where(eq(payrollRequests.employeeId, employeeId))
      .orderBy(sql`${payrollRequests.createdAt} DESC`);
  }

  async getApprovedPayrollRequestsForRun(year: number, month: number): Promise<PayrollRequest[]> {
    return db.select().from(payrollRequests)
      .where(and(
        eq(payrollRequests.targetYear, year),
        eq(payrollRequests.targetMonth, month),
        eq(payrollRequests.status, "approved")
      ));
  }

  async getPayrollRequest(id: string): Promise<PayrollRequest | undefined> {
    const [request] = await db.select().from(payrollRequests).where(eq(payrollRequests.id, id));
    return request;
  }

  async createPayrollRequest(request: InsertPayrollRequest): Promise<PayrollRequest> {
    const [created] = await db.insert(payrollRequests).values(request).returning();
    return created;
  }

  async updatePayrollRequest(id: string, request: Partial<InsertPayrollRequest>): Promise<PayrollRequest | undefined> {
    const [updated] = await db.update(payrollRequests)
      .set({ ...request, updatedAt: new Date().toISOString() })
      .where(eq(payrollRequests.id, id))
      .returning();
    return updated;
  }

  async deletePayrollRequest(id: string): Promise<boolean> {
    await db.delete(payrollRequests).where(eq(payrollRequests.id, id));
    return true;
  }

  // Payroll Automation Settings
  async getPayrollAutomationSettings(): Promise<PayrollAutomationSettings | undefined> {
    const [settings] = await db.select().from(payrollAutomationSettings).limit(1);
    return settings;
  }

  async updatePayrollAutomationSettings(settings: Partial<InsertPayrollAutomationSettings>): Promise<PayrollAutomationSettings> {
    const existing = await this.getPayrollAutomationSettings();
    if (existing) {
      const [updated] = await db.update(payrollAutomationSettings)
        .set({ ...settings, updatedAt: new Date().toISOString() })
        .where(eq(payrollAutomationSettings.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(payrollAutomationSettings)
        .values({ ...settings, updatedAt: new Date().toISOString() } as any)
        .returning();
      return created;
    }
  }
}

export const storage = new DatabaseStorage();
