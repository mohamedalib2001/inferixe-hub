import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertEmployeeSchema, insertRequestSchema, insertVehicleSchema, insertDriverSchema, 
  insertDepartmentSchema, insertAttendanceSchema, insertEmployeeDocumentSchema, 
  insertBiometricEnrollmentSchema, insertBiometricAttendanceEventSchema, 
  insertBranchSchema, insertEmployeeBranchSchema,
  insertContractSchema, insertContractPartySchema, insertPropertySchema,
  insertPropertyUnitSchema, insertContractPaymentSchema, insertUserPermissionSchema,
  insertEmployeeContractSchema,
  insertJobPostingSchema, insertJobApplicationSchema, insertApplicantDocumentSchema,
  insertApplicantExperienceSchema, insertApplicantEducationSchema, insertApplicantSkillSchema,
  insertInterviewSchema, insertInterviewFeedbackSchema, insertApplicationStatusHistorySchema,
  insertPayrollRunSchema, insertPayrollItemSchema, insertPayrollAdjustmentSchema, insertPayrollTemplateSchema
} from "@shared/schema";
import { z } from "zod";
import crypto from "crypto";
import { analyzeContractText, analyzeContractImage } from "./contractAnalysis";
import { analyzeEmploymentContractText, analyzeEmploymentContractImage } from "./employmentContractAnalysis";
import { isAuthenticated } from "./services/customAuth";
import * as authService from "./services/authService";
import type { RequestHandler } from "express";
import type { UserRole, AuthUser } from "@shared/models/auth";

// Role-based access control using the canonical UserRole enum
// These roles have access to management endpoints
const MANAGEMENT_ROLES: UserRole[] = ["super_admin", "admin", "hr", "finance", "operations", "fleet_manager"];

// Middleware to check if user has a management role
// Uses the authoritative authUsers.role field
const requireManagementRole: RequestHandler = async (req, res, next) => {
  const userId = req.session?.userId;
  
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    // Get the authenticated user's role from the auth_users table
    const authUser = await authService.getUserById(userId);
    
    if (!authUser) {
      return res.status(401).json({ message: "User not found" });
    }
    
    // Check if user has a management role
    const userRole = authUser.role as UserRole;
    
    if (MANAGEMENT_ROLES.includes(userRole)) {
      return next();
    }
    
    return res.status(403).json({ message: "Access denied. Management role required." });
  } catch (error) {
    console.error("Role check error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

function calculateHaversineDistance(
  lat1: number, lon1: number, 
  lat2: number, lon2: number
): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // ============================================
  // PROTECTED EMPLOYEE SELF-SERVICE ENDPOINTS
  // These return ONLY the authenticated user's data
  // ============================================

  // Get current employee's profile by their user ID
  app.get("/api/me/profile", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session?.userId;
      
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      // Find employee by userId
      const employees = await storage.getAllEmployees();
      const myEmployee = employees.find(e => e.userId === userId);
      
      if (!myEmployee) {
        return res.status(404).json({ message: "Employee profile not found" });
      }

      res.json(myEmployee);
    } catch (error) {
      console.error("Error fetching my profile:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  // Get current employee's requests only
  app.get("/api/me/requests", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session?.userId;
      
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      // Find employee by userId
      const employees = await storage.getAllEmployees();
      const myEmployee = employees.find(e => e.userId === userId);
      
      if (!myEmployee) {
        return res.json([]);
      }

      // Get only this employee's requests
      const allRequests = await storage.getAllRequests();
      const myRequests = allRequests.filter(r => r.requesterId === myEmployee.id);
      
      res.json(myRequests);
    } catch (error) {
      console.error("Error fetching my requests:", error);
      res.status(500).json({ message: "Failed to fetch requests" });
    }
  });

  // Create a new request for the current employee
  app.post("/api/me/requests", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session?.userId;
      
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      // Find employee by userId
      const employees = await storage.getAllEmployees();
      const myEmployee = employees.find(e => e.userId === userId);
      
      if (!myEmployee) {
        return res.status(404).json({ message: "Employee profile not found" });
      }

      // Ensure request is for this employee only
      const requestData = {
        ...req.body,
        requesterId: myEmployee.id
      };

      const validated = insertRequestSchema.parse(requestData);
      const request = await storage.createRequest(validated);
      res.status(201).json(request);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating request:", error);
      res.status(500).json({ message: "Failed to create request" });
    }
  });

  // Get current employee's attendance only
  app.get("/api/me/attendance", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session?.userId;
      
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      // Find employee by userId
      const employees = await storage.getAllEmployees();
      const myEmployee = employees.find(e => e.userId === userId);
      
      if (!myEmployee) {
        return res.json([]);
      }

      // Get only this employee's attendance
      const allAttendance = await storage.getAllAttendance();
      const myAttendance = allAttendance.filter(a => a.employeeId === myEmployee.id);
      
      res.json(myAttendance);
    } catch (error) {
      console.error("Error fetching my attendance:", error);
      res.status(500).json({ message: "Failed to fetch attendance" });
    }
  });

  // Get current employee's department
  app.get("/api/me/department", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session?.userId;
      
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      // Find employee by userId
      const employees = await storage.getAllEmployees();
      const myEmployee = employees.find(e => e.userId === userId);
      
      if (!myEmployee || !myEmployee.departmentId) {
        return res.status(404).json({ message: "Department not found" });
      }

      const department = await storage.getDepartment(myEmployee.departmentId);
      res.json(department);
    } catch (error) {
      console.error("Error fetching my department:", error);
      res.status(500).json({ message: "Failed to fetch department" });
    }
  });

  // ============================================
  // END PROTECTED EMPLOYEE SELF-SERVICE ENDPOINTS
  // ============================================

  // ============================================
  // MANAGEMENT-ONLY ENDPOINTS
  // These require authentication + management role
  // ============================================

  app.get("/api/employees", isAuthenticated, requireManagementRole, async (req, res) => {
    try {
      const userId = req.session?.userId;
      const authUser = await authService.getUserById(userId!);
      const userRole = authUser?.role || "employee";
      
      // Get access scope for user
      const scope = await storage.getUserAccessScope(userId!, userRole);
      
      let employees = await storage.getAllEmployees();
      
      // If user has restrictions and has assigned scope, filter employees
      if (!scope.hasNoRestrictions) {
        employees = employees.filter(e => scope.employeeIds.includes(e.id));
      }
      
      res.json(employees);
    } catch (error) {
      console.error("Error fetching employees:", error);
      res.status(500).json({ message: "Failed to fetch employees" });
    }
  });

  app.get("/api/employees/:id", isAuthenticated, requireManagementRole, async (req, res) => {
    try {
      const userId = req.session?.userId;
      const authUser = await authService.getUserById(userId!);
      const userRole = authUser?.role || "employee";
      
      // Get access scope for user
      const scope = await storage.getUserAccessScope(userId!, userRole);
      
      const employee = await storage.getEmployee(req.params.id);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }
      
      // If user has restrictions, check if user can access this employee
      if (!scope.hasNoRestrictions && !scope.employeeIds.includes(employee.id)) {
        return res.status(403).json({ message: "Access denied. Not in your management scope." });
      }
      
      res.json(employee);
    } catch (error) {
      console.error("Error fetching employee:", error);
      res.status(500).json({ message: "Failed to fetch employee" });
    }
  });

  app.post("/api/employees", isAuthenticated, requireManagementRole, async (req, res) => {
    try {
      const validated = insertEmployeeSchema.parse(req.body);
      const employee = await storage.createEmployee(validated);
      res.status(201).json(employee);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating employee:", error);
      res.status(500).json({ message: "Failed to create employee" });
    }
  });

  app.patch("/api/employees/:id", isAuthenticated, requireManagementRole, async (req, res) => {
    try {
      const employee = await storage.updateEmployee(req.params.id, req.body);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }
      res.json(employee);
    } catch (error) {
      console.error("Error updating employee:", error);
      res.status(500).json({ message: "Failed to update employee" });
    }
  });

  app.delete("/api/employees/:id", isAuthenticated, requireManagementRole, async (req, res) => {
    try {
      await storage.deleteEmployee(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting employee:", error);
      res.status(500).json({ message: "Failed to delete employee" });
    }
  });

  app.get("/api/departments", isAuthenticated, requireManagementRole, async (req, res) => {
    try {
      const departments = await storage.getAllDepartments();
      res.json(departments);
    } catch (error) {
      console.error("Error fetching departments:", error);
      res.status(500).json({ message: "Failed to fetch departments" });
    }
  });

  app.post("/api/departments", isAuthenticated, requireManagementRole, async (req, res) => {
    try {
      const validated = insertDepartmentSchema.parse(req.body);
      const department = await storage.createDepartment(validated);
      res.status(201).json(department);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating department:", error);
      res.status(500).json({ message: "Failed to create department" });
    }
  });

  app.get("/api/attendance", isAuthenticated, requireManagementRole, async (req, res) => {
    try {
      const userId = req.session?.userId;
      const authUser = await authService.getUserById(userId!);
      const userRole = authUser?.role || "employee";
      
      // Get access scope for user
      const scope = await storage.getUserAccessScope(userId!, userRole);
      
      const { date } = req.query;
      let records;
      if (date && typeof date === "string") {
        records = await storage.getAttendanceByDate(date);
      } else {
        records = await storage.getAllAttendance();
      }
      
      // If user has restrictions, filter attendance by allowed employees
      if (!scope.hasNoRestrictions) {
        records = records.filter(r => scope.employeeIds.includes(r.employeeId));
      }
      
      res.json(records);
    } catch (error) {
      console.error("Error fetching attendance:", error);
      res.status(500).json({ message: "Failed to fetch attendance" });
    }
  });

  app.post("/api/attendance", isAuthenticated, requireManagementRole, async (req, res) => {
    try {
      const validated = insertAttendanceSchema.parse(req.body);
      const record = await storage.createAttendance(validated);
      res.status(201).json(record);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating attendance:", error);
      res.status(500).json({ message: "Failed to create attendance record" });
    }
  });

  app.get("/api/requests", isAuthenticated, requireManagementRole, async (req, res) => {
    try {
      const requests = await storage.getAllRequests();
      res.json(requests);
    } catch (error) {
      console.error("Error fetching requests:", error);
      res.status(500).json({ message: "Failed to fetch requests" });
    }
  });

  app.get("/api/requests/:id", isAuthenticated, requireManagementRole, async (req, res) => {
    try {
      const request = await storage.getRequest(req.params.id);
      if (!request) {
        return res.status(404).json({ message: "Request not found" });
      }
      res.json(request);
    } catch (error) {
      console.error("Error fetching request:", error);
      res.status(500).json({ message: "Failed to fetch request" });
    }
  });

  app.post("/api/requests", isAuthenticated, requireManagementRole, async (req, res) => {
    try {
      const validated = insertRequestSchema.parse(req.body);
      const request = await storage.createRequest(validated);
      res.status(201).json(request);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating request:", error);
      res.status(500).json({ message: "Failed to create request" });
    }
  });

  app.patch("/api/requests/:id", isAuthenticated, requireManagementRole, async (req, res) => {
    try {
      const existingRequest = await storage.getRequest(req.params.id);
      if (!existingRequest) {
        return res.status(404).json({ message: "Request not found" });
      }
      
      const request = await storage.updateRequest(req.params.id, req.body);
      if (!request) {
        return res.status(404).json({ message: "Request not found" });
      }
      
      // Auto-create payroll request when payroll-related request is approved (if enabled)
      const payrollRequestTypes = ["salary_increase", "advance", "bonus", "deduction", "late_fine", "addition_hours", "addition_days"];
      
      if (req.body.status === "approved" && 
          existingRequest.status !== "approved" && 
          payrollRequestTypes.includes(request.type)) {
        
        try {
          // Check if auto-linking is enabled in settings
          const automationSettings = await storage.getPayrollAutomationSettings();
          const autoLinkEnabled = automationSettings?.autoLinkPayrollRequests ?? true;
          
          if (!autoLinkEnabled) {
            console.log(`Auto-link payroll disabled. Skipping auto-creation for request ${request.id}`);
          } else {
            const userId = req.session?.userId;
            const authUser = await authService.getUserById(userId!);
            
            // Determine target employee (use targetEmployeeId if set, otherwise find employee by requesterId)
            const targetEmployeeId = request.targetEmployeeId || null;
            let employeeId = targetEmployeeId;
            
            // If no targetEmployeeId, try to find employee linked to the requester user
            if (!employeeId) {
              const employees = await storage.getAllEmployees();
              const linkedEmployee = employees.find(e => e.userId === request.requesterId);
              if (linkedEmployee) {
                employeeId = linkedEmployee.id;
              }
            }
            
            if (employeeId) {
              const now = new Date();
              const targetYear = now.getFullYear();
              const targetMonth = now.getMonth() + 1;
              
              // Map request type to payroll request category and type
              let category: "deduction" | "addition" = "addition";
              let requestType = "bonus";
              
              if (["deduction", "late_fine"].includes(request.type)) {
                category = "deduction";
                requestType = request.type === "late_fine" ? "disciplinary" : "amount_deduction";
              } else if (request.type === "bonus" || request.type === "salary_increase") {
                category = "addition";
                requestType = "bonus";
              } else if (request.type === "advance") {
                category = "deduction";
                requestType = "amount_deduction"; // Advance is deducted later
              } else if (request.type === "addition_hours") {
                category = "addition";
                requestType = "extra_hours";
              } else if (request.type === "addition_days") {
                category = "addition";
                requestType = "extra_days";
              }
              
              // Create payroll request
              await storage.createPayrollRequest({
                employeeId,
                category,
                requestType,
                title: request.title,
                titleAr: request.titleAr || null,
                description: request.description || `Auto-created from approved request #${request.id}`,
                days: request.days ? parseFloat(String(request.days)) : null,
                hours: request.hours ? parseFloat(request.hours) : null,
                amount: request.amount ? parseInt(request.amount) : null,
                targetYear,
                targetMonth,
                status: "approved", // Auto-approved since parent request was approved
                approvedBy: userId || null,
                approverName: authUser ? `${authUser.firstName || ""} ${authUser.lastName || ""}`.trim() : null,
                approvedAt: now.toISOString(),
                createdBy: request.requesterId,
                creatorName: authUser ? `${authUser.firstName || ""} ${authUser.lastName || ""}`.trim() : "System",
                createdAt: now.toISOString(),
              });
              
              console.log(`Auto-created payroll request for approved request ${request.id}`);
            }
          }
        } catch (payrollError) {
          console.error("Error auto-creating payroll request:", payrollError);
          // Don't fail the main request update if payroll creation fails
        }
      }
      
      res.json(request);
    } catch (error) {
      console.error("Error updating request:", error);
      res.status(500).json({ message: "Failed to update request" });
    }
  });

  app.get("/api/vehicles", isAuthenticated, requireManagementRole, async (req, res) => {
    try {
      const vehicles = await storage.getAllVehicles();
      res.json(vehicles);
    } catch (error) {
      console.error("Error fetching vehicles:", error);
      res.status(500).json({ message: "Failed to fetch vehicles" });
    }
  });

  app.get("/api/vehicles/:id", isAuthenticated, requireManagementRole, async (req, res) => {
    try {
      const vehicle = await storage.getVehicle(req.params.id);
      if (!vehicle) {
        return res.status(404).json({ message: "Vehicle not found" });
      }
      res.json(vehicle);
    } catch (error) {
      console.error("Error fetching vehicle:", error);
      res.status(500).json({ message: "Failed to fetch vehicle" });
    }
  });

  app.post("/api/vehicles", isAuthenticated, requireManagementRole, async (req, res) => {
    try {
      const validated = insertVehicleSchema.parse(req.body);
      const vehicle = await storage.createVehicle(validated);
      res.status(201).json(vehicle);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating vehicle:", error);
      res.status(500).json({ message: "Failed to create vehicle" });
    }
  });

  app.patch("/api/vehicles/:id", isAuthenticated, requireManagementRole, async (req, res) => {
    try {
      const vehicle = await storage.updateVehicle(req.params.id, req.body);
      if (!vehicle) {
        return res.status(404).json({ message: "Vehicle not found" });
      }
      res.json(vehicle);
    } catch (error) {
      console.error("Error updating vehicle:", error);
      res.status(500).json({ message: "Failed to update vehicle" });
    }
  });

  app.delete("/api/vehicles/:id", isAuthenticated, requireManagementRole, async (req, res) => {
    try {
      await storage.deleteVehicle(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting vehicle:", error);
      res.status(500).json({ message: "Failed to delete vehicle" });
    }
  });

  // Vehicle Events Routes
  app.get("/api/vehicles/:vehicleId/events", isAuthenticated, requireManagementRole, async (req, res) => {
    try {
      const events = await storage.getVehicleEvents(req.params.vehicleId);
      res.json(events);
    } catch (error) {
      console.error("Error fetching vehicle events:", error);
      res.status(500).json({ message: "Failed to fetch vehicle events" });
    }
  });

  app.get("/api/vehicle-events", isAuthenticated, requireManagementRole, async (req, res) => {
    try {
      const events = await storage.getAllVehicleEvents();
      res.json(events);
    } catch (error) {
      console.error("Error fetching all vehicle events:", error);
      res.status(500).json({ message: "Failed to fetch vehicle events" });
    }
  });

  app.get("/api/vehicle-events/:id", isAuthenticated, requireManagementRole, async (req, res) => {
    try {
      const event = await storage.getVehicleEvent(req.params.id);
      if (!event) {
        return res.status(404).json({ message: "Vehicle event not found" });
      }
      res.json(event);
    } catch (error) {
      console.error("Error fetching vehicle event:", error);
      res.status(500).json({ message: "Failed to fetch vehicle event" });
    }
  });

  app.post("/api/vehicle-events", isAuthenticated, requireManagementRole, async (req, res) => {
    try {
      const event = await storage.createVehicleEvent({
        ...req.body,
        createdAt: new Date().toISOString(),
      });
      res.status(201).json(event);
    } catch (error) {
      console.error("Error creating vehicle event:", error);
      res.status(500).json({ message: "Failed to create vehicle event" });
    }
  });

  app.patch("/api/vehicle-events/:id", async (req, res) => {
    try {
      const event = await storage.updateVehicleEvent(req.params.id, {
        ...req.body,
        updatedAt: new Date().toISOString(),
      });
      if (!event) {
        return res.status(404).json({ message: "Vehicle event not found" });
      }
      res.json(event);
    } catch (error) {
      console.error("Error updating vehicle event:", error);
      res.status(500).json({ message: "Failed to update vehicle event" });
    }
  });

  app.delete("/api/vehicle-events/:id", async (req, res) => {
    try {
      await storage.deleteVehicleEvent(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting vehicle event:", error);
      res.status(500).json({ message: "Failed to delete vehicle event" });
    }
  });

  // Vehicle Driver History Routes
  app.get("/api/vehicles/:vehicleId/driver-history", async (req, res) => {
    try {
      const history = await storage.getVehicleDriverHistory(req.params.vehicleId);
      res.json(history);
    } catch (error) {
      console.error("Error fetching vehicle driver history:", error);
      res.status(500).json({ message: "Failed to fetch vehicle driver history" });
    }
  });

  app.get("/api/drivers/:driverId/vehicle-history", async (req, res) => {
    try {
      const history = await storage.getDriverVehicleHistory(req.params.driverId);
      res.json(history);
    } catch (error) {
      console.error("Error fetching driver vehicle history:", error);
      res.status(500).json({ message: "Failed to fetch driver vehicle history" });
    }
  });

  app.post("/api/vehicle-driver-history", async (req, res) => {
    try {
      const assignment = await storage.createVehicleDriverHistory({
        ...req.body,
        assignedAt: new Date().toISOString(),
      });
      res.status(201).json(assignment);
    } catch (error) {
      console.error("Error creating vehicle driver assignment:", error);
      res.status(500).json({ message: "Failed to create vehicle driver assignment" });
    }
  });

  app.patch("/api/vehicle-driver-history/:id", async (req, res) => {
    try {
      const assignment = await storage.updateVehicleDriverHistory(req.params.id, req.body);
      if (!assignment) {
        return res.status(404).json({ message: "Vehicle driver assignment not found" });
      }
      res.json(assignment);
    } catch (error) {
      console.error("Error updating vehicle driver assignment:", error);
      res.status(500).json({ message: "Failed to update vehicle driver assignment" });
    }
  });

  app.get("/api/drivers", async (req, res) => {
    try {
      const drivers = await storage.getAllDrivers();
      res.json(drivers);
    } catch (error) {
      console.error("Error fetching drivers:", error);
      res.status(500).json({ message: "Failed to fetch drivers" });
    }
  });

  app.get("/api/drivers/:id", async (req, res) => {
    try {
      const driver = await storage.getDriver(req.params.id);
      if (!driver) {
        return res.status(404).json({ message: "Driver not found" });
      }
      res.json(driver);
    } catch (error) {
      console.error("Error fetching driver:", error);
      res.status(500).json({ message: "Failed to fetch driver" });
    }
  });

  app.post("/api/drivers", async (req, res) => {
    try {
      const validated = insertDriverSchema.parse(req.body);
      const driver = await storage.createDriver(validated);
      res.status(201).json(driver);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating driver:", error);
      res.status(500).json({ message: "Failed to create driver" });
    }
  });

  app.patch("/api/drivers/:id", async (req, res) => {
    try {
      const driver = await storage.updateDriver(req.params.id, req.body);
      if (!driver) {
        return res.status(404).json({ message: "Driver not found" });
      }
      res.json(driver);
    } catch (error) {
      console.error("Error updating driver:", error);
      res.status(500).json({ message: "Failed to update driver" });
    }
  });

  app.get("/api/employee-documents/:employeeId", async (req, res) => {
    try {
      const documents = await storage.getEmployeeDocuments(req.params.employeeId);
      res.json(documents);
    } catch (error) {
      console.error("Error fetching employee documents:", error);
      res.status(500).json({ message: "Failed to fetch employee documents" });
    }
  });

  app.post("/api/employee-documents", async (req, res) => {
    try {
      const validated = insertEmployeeDocumentSchema.parse(req.body);
      const document = await storage.createEmployeeDocument(validated);
      res.status(201).json(document);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating employee document:", error);
      res.status(500).json({ message: "Failed to create employee document" });
    }
  });

  app.delete("/api/employee-documents/:id", async (req, res) => {
    try {
      await storage.deleteEmployeeDocument(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting employee document:", error);
      res.status(500).json({ message: "Failed to delete employee document" });
    }
  });

  // Employee Work Contracts (requires authentication)
  app.get("/api/employees/:employeeId/contracts", isAuthenticated, async (req, res) => {
    try {
      const contracts = await storage.getEmployeeContracts(req.params.employeeId);
      res.json(contracts);
    } catch (error) {
      console.error("Error fetching employee contracts:", error);
      res.status(500).json({ message: "Failed to fetch employee contracts" });
    }
  });

  app.get("/api/employees/:employeeId/contracts/:contractId", isAuthenticated, async (req, res) => {
    try {
      const contract = await storage.getEmployeeContract(req.params.contractId);
      if (!contract) {
        return res.status(404).json({ message: "Contract not found" });
      }
      res.json(contract);
    } catch (error) {
      console.error("Error fetching employee contract:", error);
      res.status(500).json({ message: "Failed to fetch employee contract" });
    }
  });

  app.post("/api/employees/:employeeId/contracts", isAuthenticated, async (req, res) => {
    try {
      const validated = insertEmployeeContractSchema.parse({
        ...req.body,
        employeeId: req.params.employeeId,
        createdAt: new Date().toISOString(),
      });
      const contract = await storage.createEmployeeContract(validated);
      res.status(201).json(contract);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating employee contract:", error);
      res.status(500).json({ message: "Failed to create employee contract" });
    }
  });

  app.patch("/api/employees/:employeeId/contracts/:contractId", isAuthenticated, async (req, res) => {
    try {
      const contract = await storage.updateEmployeeContract(req.params.contractId, {
        ...req.body,
        updatedAt: new Date().toISOString(),
      });
      if (!contract) {
        return res.status(404).json({ message: "Contract not found" });
      }
      res.json(contract);
    } catch (error) {
      console.error("Error updating employee contract:", error);
      res.status(500).json({ message: "Failed to update employee contract" });
    }
  });

  app.delete("/api/employees/:employeeId/contracts/:contractId", isAuthenticated, async (req, res) => {
    try {
      await storage.deleteEmployeeContract(req.params.contractId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting employee contract:", error);
      res.status(500).json({ message: "Failed to delete employee contract" });
    }
  });

  // Employment Contract Analysis with AI (requires authentication)
  app.post("/api/employees/:employeeId/contracts/analyze", isAuthenticated, async (req, res) => {
    try {
      const { text, imageBase64, mimeType } = req.body;
      
      if (!text && !imageBase64) {
        return res.status(400).json({ message: "Either text or imageBase64 is required" });
      }

      // Validate text length
      if (text && text.length > 100000) {
        return res.status(400).json({ message: "Text too long. Maximum 100,000 characters allowed." });
      }

      // Validate image if provided
      if (imageBase64) {
        const estimatedSize = imageBase64.length * 0.75;
        const maxSize = 10 * 1024 * 1024;
        if (estimatedSize > maxSize) {
          return res.status(400).json({ message: "Image too large. Maximum 10MB allowed." });
        }

        const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"];
        if (!allowedTypes.includes(mimeType || "")) {
          return res.status(400).json({ 
            message: "Invalid file type. Please upload an image (PNG, JPG, WEBP). For PDF documents, please copy and paste the text instead." 
          });
        }
      }

      let result;
      if (imageBase64) {
        result = await analyzeEmploymentContractImage(imageBase64, mimeType || "image/png");
      } else {
        result = await analyzeEmploymentContractText(text);
      }

      res.json(result);
    } catch (error: any) {
      console.error("Employment contract analysis error:", error);
      const errorMessage = error?.message || "Failed to analyze employment contract";
      res.status(500).json({ message: errorMessage });
    }
  });

  // ==================== RECRUITMENT SYSTEM ROUTES ====================
  
  // Job Postings (Public for viewing, Auth for management)
  app.get("/api/jobs", async (req, res) => {
    try {
      const { published } = req.query;
      const jobs = published === "true" 
        ? await storage.getPublishedJobPostings()
        : await storage.getJobPostings();
      res.json(jobs);
    } catch (error) {
      console.error("Error fetching jobs:", error);
      res.status(500).json({ message: "Failed to fetch jobs" });
    }
  });

  app.get("/api/jobs/:id", async (req, res) => {
    try {
      const job = await storage.getJobPosting(req.params.id);
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
      res.json(job);
    } catch (error) {
      console.error("Error fetching job:", error);
      res.status(500).json({ message: "Failed to fetch job" });
    }
  });

  app.post("/api/jobs", isAuthenticated, async (req, res) => {
    try {
      const validated = insertJobPostingSchema.parse({
        ...req.body,
        createdAt: new Date().toISOString(),
      });
      const job = await storage.createJobPosting(validated);
      res.status(201).json(job);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating job:", error);
      res.status(500).json({ message: "Failed to create job" });
    }
  });

  app.patch("/api/jobs/:id", isAuthenticated, async (req, res) => {
    try {
      const job = await storage.updateJobPosting(req.params.id, {
        ...req.body,
        updatedAt: new Date().toISOString(),
      });
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
      res.json(job);
    } catch (error) {
      console.error("Error updating job:", error);
      res.status(500).json({ message: "Failed to update job" });
    }
  });

  app.delete("/api/jobs/:id", isAuthenticated, async (req, res) => {
    try {
      await storage.deleteJobPosting(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting job:", error);
      res.status(500).json({ message: "Failed to delete job" });
    }
  });

  // Job Applications (Public submission, Auth for management)
  app.get("/api/applications", isAuthenticated, async (req, res) => {
    try {
      const { jobId } = req.query;
      const applications = await storage.getJobApplications(jobId as string | undefined);
      res.json(applications);
    } catch (error) {
      console.error("Error fetching applications:", error);
      res.status(500).json({ message: "Failed to fetch applications" });
    }
  });

  app.get("/api/applications/:id", async (req, res) => {
    try {
      const application = await storage.getJobApplication(req.params.id);
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }
      
      // Get related data
      const [documents, experiences, education, skills] = await Promise.all([
        storage.getApplicantDocuments(req.params.id),
        storage.getApplicantExperiences(req.params.id),
        storage.getApplicantEducation(req.params.id),
        storage.getApplicantSkills(req.params.id),
      ]);
      
      res.json({ ...application, documents, experiences, education, skills });
    } catch (error) {
      console.error("Error fetching application:", error);
      res.status(500).json({ message: "Failed to fetch application" });
    }
  });

  app.get("/api/applications/track/:applicationNumber", async (req, res) => {
    try {
      const application = await storage.getJobApplicationByNumber(req.params.applicationNumber);
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }
      // Return limited info for public tracking
      res.json({
        applicationNumber: application.applicationNumber,
        status: application.status,
        submittedAt: application.submittedAt,
        lastStatusChangeAt: application.lastStatusChangeAt,
      });
    } catch (error) {
      console.error("Error tracking application:", error);
      res.status(500).json({ message: "Failed to track application" });
    }
  });

  // Public application submission endpoint
  app.post("/api/applications", async (req, res) => {
    try {
      const applicationNumber = await storage.getNextApplicationNumber();
      const now = new Date().toISOString();
      
      const validated = insertJobApplicationSchema.parse({
        ...req.body,
        applicationNumber,
        status: "submitted",
        submittedAt: now,
        createdAt: now,
      });
      
      const application = await storage.createJobApplication(validated);
      
      // Log initial status
      await storage.createApplicationStatusHistory({
        applicationId: application.id,
        toStatus: "submitted",
        createdAt: now,
      });
      
      res.status(201).json(application);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating application:", error);
      res.status(500).json({ message: "Failed to create application" });
    }
  });

  app.patch("/api/applications/:id", isAuthenticated, async (req, res) => {
    try {
      const existing = await storage.getJobApplication(req.params.id);
      if (!existing) {
        return res.status(404).json({ message: "Application not found" });
      }

      const now = new Date().toISOString();
      const updates: any = { ...req.body, updatedAt: now };
      
      // Track status change
      if (req.body.status && req.body.status !== existing.status) {
        updates.lastStatusChangeAt = now;
        
        await storage.createApplicationStatusHistory({
          applicationId: req.params.id,
          fromStatus: existing.status,
          toStatus: req.body.status,
          reason: req.body.statusChangeReason,
          createdAt: now,
        });
      }
      
      const application = await storage.updateJobApplication(req.params.id, updates);
      res.json(application);
    } catch (error) {
      console.error("Error updating application:", error);
      res.status(500).json({ message: "Failed to update application" });
    }
  });

  // Applicant Documents
  app.get("/api/applications/:applicationId/documents", async (req, res) => {
    try {
      const documents = await storage.getApplicantDocuments(req.params.applicationId);
      res.json(documents);
    } catch (error) {
      console.error("Error fetching documents:", error);
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });

  app.post("/api/applications/:applicationId/documents", async (req, res) => {
    try {
      const validated = insertApplicantDocumentSchema.parse({
        ...req.body,
        applicationId: req.params.applicationId,
        createdAt: new Date().toISOString(),
      });
      const document = await storage.createApplicantDocument(validated);
      res.status(201).json(document);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating document:", error);
      res.status(500).json({ message: "Failed to create document" });
    }
  });

  // Applicant Experiences
  app.post("/api/applications/:applicationId/experiences", async (req, res) => {
    try {
      const validated = insertApplicantExperienceSchema.parse({
        ...req.body,
        applicationId: req.params.applicationId,
        createdAt: new Date().toISOString(),
      });
      const experience = await storage.createApplicantExperience(validated);
      res.status(201).json(experience);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating experience:", error);
      res.status(500).json({ message: "Failed to create experience" });
    }
  });

  // Applicant Education
  app.post("/api/applications/:applicationId/education", async (req, res) => {
    try {
      const validated = insertApplicantEducationSchema.parse({
        ...req.body,
        applicationId: req.params.applicationId,
        createdAt: new Date().toISOString(),
      });
      const education = await storage.createApplicantEducation(validated);
      res.status(201).json(education);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating education:", error);
      res.status(500).json({ message: "Failed to create education" });
    }
  });

  // Applicant Skills
  app.post("/api/applications/:applicationId/skills", async (req, res) => {
    try {
      const validated = insertApplicantSkillSchema.parse({
        ...req.body,
        applicationId: req.params.applicationId,
        createdAt: new Date().toISOString(),
      });
      const skill = await storage.createApplicantSkill(validated);
      res.status(201).json(skill);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating skill:", error);
      res.status(500).json({ message: "Failed to create skill" });
    }
  });

  // Interviews
  app.get("/api/interviews", isAuthenticated, async (req, res) => {
    try {
      const { applicationId } = req.query;
      const interviewsList = await storage.getInterviews(applicationId as string | undefined);
      res.json(interviewsList);
    } catch (error) {
      console.error("Error fetching interviews:", error);
      res.status(500).json({ message: "Failed to fetch interviews" });
    }
  });

  app.get("/api/interviews/:id", isAuthenticated, async (req, res) => {
    try {
      const interview = await storage.getInterview(req.params.id);
      if (!interview) {
        return res.status(404).json({ message: "Interview not found" });
      }
      
      const feedback = await storage.getInterviewFeedback(req.params.id);
      res.json({ ...interview, feedback });
    } catch (error) {
      console.error("Error fetching interview:", error);
      res.status(500).json({ message: "Failed to fetch interview" });
    }
  });

  app.post("/api/interviews", isAuthenticated, async (req, res) => {
    try {
      const validated = insertInterviewSchema.parse({
        ...req.body,
        createdAt: new Date().toISOString(),
      });
      const interview = await storage.createInterview(validated);
      
      // Update application status
      if (req.body.applicationId) {
        await storage.updateJobApplication(req.body.applicationId, {
          status: "interview_scheduled",
          lastStatusChangeAt: new Date().toISOString(),
        });
      }
      
      res.status(201).json(interview);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating interview:", error);
      res.status(500).json({ message: "Failed to create interview" });
    }
  });

  app.patch("/api/interviews/:id", isAuthenticated, async (req, res) => {
    try {
      const interview = await storage.updateInterview(req.params.id, {
        ...req.body,
        updatedAt: new Date().toISOString(),
      });
      if (!interview) {
        return res.status(404).json({ message: "Interview not found" });
      }
      res.json(interview);
    } catch (error) {
      console.error("Error updating interview:", error);
      res.status(500).json({ message: "Failed to update interview" });
    }
  });

  // Interview Feedback
  app.post("/api/interviews/:interviewId/feedback", isAuthenticated, async (req, res) => {
    try {
      const validated = insertInterviewFeedbackSchema.parse({
        ...req.body,
        interviewId: req.params.interviewId,
        createdAt: new Date().toISOString(),
      });
      const feedback = await storage.createInterviewFeedback(validated);
      res.status(201).json(feedback);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating feedback:", error);
      res.status(500).json({ message: "Failed to create feedback" });
    }
  });

  app.patch("/api/interviews/:interviewId/feedback/:id", isAuthenticated, async (req, res) => {
    try {
      const feedback = await storage.updateInterviewFeedback(req.params.id, {
        ...req.body,
        updatedAt: new Date().toISOString(),
      });
      if (!feedback) {
        return res.status(404).json({ message: "Feedback not found" });
      }
      res.json(feedback);
    } catch (error) {
      console.error("Error updating feedback:", error);
      res.status(500).json({ message: "Failed to update feedback" });
    }
  });

  // Application Status History
  app.get("/api/applications/:applicationId/history", isAuthenticated, async (req, res) => {
    try {
      const history = await storage.getApplicationStatusHistory(req.params.applicationId);
      res.json(history);
    } catch (error) {
      console.error("Error fetching history:", error);
      res.status(500).json({ message: "Failed to fetch history" });
    }
  });

  // ===== JOB POSTINGS API =====
  app.get("/api/job-postings", isAuthenticated, async (req, res) => {
    try {
      const jobs = await storage.getJobPostings();
      res.json(jobs);
    } catch (error) {
      console.error("Error fetching job postings:", error);
      res.status(500).json({ message: "Failed to fetch job postings" });
    }
  });

  app.get("/api/job-postings/:id", isAuthenticated, async (req, res) => {
    try {
      const job = await storage.getJobPosting(req.params.id);
      if (!job) {
        return res.status(404).json({ message: "Job posting not found" });
      }
      res.json(job);
    } catch (error) {
      console.error("Error fetching job posting:", error);
      res.status(500).json({ message: "Failed to fetch job posting" });
    }
  });

  app.post("/api/job-postings", isAuthenticated, requireManagementRole, async (req, res) => {
    try {
      const validated = insertJobPostingSchema.parse(req.body);
      const job = await storage.createJobPosting(validated);
      res.status(201).json(job);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating job posting:", error);
      res.status(500).json({ message: "Failed to create job posting" });
    }
  });

  app.patch("/api/job-postings/:id", isAuthenticated, requireManagementRole, async (req, res) => {
    try {
      const job = await storage.updateJobPosting(req.params.id, req.body);
      if (!job) {
        return res.status(404).json({ message: "Job posting not found" });
      }
      res.json(job);
    } catch (error) {
      console.error("Error updating job posting:", error);
      res.status(500).json({ message: "Failed to update job posting" });
    }
  });

  app.delete("/api/job-postings/:id", isAuthenticated, requireManagementRole, async (req, res) => {
    try {
      await storage.deleteJobPosting(req.params.id);
      res.json({ message: "Job posting deleted" });
    } catch (error) {
      console.error("Error deleting job posting:", error);
      res.status(500).json({ message: "Failed to delete job posting" });
    }
  });

  // ===== PUBLIC CAREERS API =====
  app.get("/api/careers", async (req, res) => {
    try {
      const jobs = await storage.getJobPostings();
      const publishedJobs = jobs.filter(j => j.status === "published");
      res.json(publishedJobs);
    } catch (error) {
      console.error("Error fetching careers:", error);
      res.status(500).json({ message: "Failed to fetch careers" });
    }
  });

  app.get("/api/careers/:id", async (req, res) => {
    try {
      const job = await storage.getJobPosting(req.params.id);
      if (!job || job.status !== "published") {
        return res.status(404).json({ message: "Job not found" });
      }
      res.json(job);
    } catch (error) {
      console.error("Error fetching career details:", error);
      res.status(500).json({ message: "Failed to fetch career details" });
    }
  });

  app.post("/api/careers/:id/apply", async (req, res) => {
    try {
      const job = await storage.getJobPosting(req.params.id);
      if (!job || job.status !== "published") {
        return res.status(404).json({ message: "Job not found" });
      }
      
      const applicationData = {
        ...req.body,
        jobPostingId: req.params.id,
        status: "submitted",
      };
      const validated = insertJobApplicationSchema.parse(applicationData);
      const application = await storage.createJobApplication(validated);
      res.status(201).json(application);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error submitting application:", error);
      res.status(500).json({ message: "Failed to submit application" });
    }
  });

  // ===== JOB APPLICATIONS API =====
  app.get("/api/job-applications", isAuthenticated, async (req, res) => {
    try {
      const applications = await storage.getJobApplications();
      res.json(applications);
    } catch (error) {
      console.error("Error fetching job applications:", error);
      res.status(500).json({ message: "Failed to fetch job applications" });
    }
  });

  app.get("/api/job-applications/:id", isAuthenticated, async (req, res) => {
    try {
      const application = await storage.getJobApplication(req.params.id);
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }
      res.json(application);
    } catch (error) {
      console.error("Error fetching job application:", error);
      res.status(500).json({ message: "Failed to fetch job application" });
    }
  });

  app.patch("/api/job-applications/:id", isAuthenticated, requireManagementRole, async (req, res) => {
    try {
      const application = await storage.updateJobApplication(req.params.id, req.body);
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }
      res.json(application);
    } catch (error) {
      console.error("Error updating job application:", error);
      res.status(500).json({ message: "Failed to update job application" });
    }
  });

  // Recruitment Dashboard Stats
  app.get("/api/recruitment/stats", isAuthenticated, async (req, res) => {
    try {
      const [jobs, applications] = await Promise.all([
        storage.getJobPostings(),
        storage.getJobApplications(),
      ]);
      
      const publishedJobs = jobs.filter(j => j.status === "published").length;
      const totalApplications = applications.length;
      const newApplications = applications.filter(a => a.status === "submitted").length;
      const shortlisted = applications.filter(a => a.status === "shortlisted").length;
      const interviewScheduled = applications.filter(a => a.status === "interview_scheduled" || a.status === "interviewed").length;
      const offered = applications.filter(a => a.status === "offer_sent" || a.status === "offer_pending").length;
      const hired = applications.filter(a => a.status === "hired").length;
      
      res.json({
        totalJobs: jobs.length,
        publishedJobs,
        totalApplications,
        newApplications,
        shortlisted,
        interviewScheduled,
        offered,
        hired,
      });
    } catch (error) {
      console.error("Error fetching recruitment stats:", error);
      res.status(500).json({ message: "Failed to fetch recruitment stats" });
    }
  });

  app.get("/api/stats/dashboard", async (req, res) => {
    try {
      const [employees, requests, vehicles, drivers, attendance] = await Promise.all([
        storage.getAllEmployees(),
        storage.getAllRequests(),
        storage.getAllVehicles(),
        storage.getAllDrivers(),
        storage.getAllAttendance(),
      ]);

      const today = new Date().toISOString().split("T")[0];
      const todayAttendance = attendance.filter((a) => a.date === today);

      const stats = {
        totalEmployees: employees.length,
        activeEmployees: employees.filter((e) => e.status === "active").length,
        pendingRequests: requests.filter((r) => r.status === "pending").length,
        totalVehicles: vehicles.length,
        availableVehicles: vehicles.filter((v) => v.status === "available").length,
        todayAttendance: todayAttendance.length,
        attendanceRate: employees.length > 0 
          ? Math.round((todayAttendance.filter((a) => a.status === "present").length / employees.length) * 100 * 10) / 10 
          : 0,
        activeDrivers: drivers.filter((d) => d.status === "active").length,
      };

      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Branch Management Routes
  app.get("/api/branches", isAuthenticated, requireManagementRole, async (req, res) => {
    try {
      const userId = req.session?.userId;
      const authUser = await authService.getUserById(userId!);
      const userRole = authUser?.role || "employee";
      
      // Get access scope for user
      const scope = await storage.getUserAccessScope(userId!, userRole);
      
      let branchList = await storage.getAllBranches();
      
      // If user has restrictions, filter branches
      if (!scope.hasNoRestrictions) {
        branchList = branchList.filter(b => scope.branchIds.includes(b.id));
      }
      
      res.json(branchList);
    } catch (error) {
      console.error("Error fetching branches:", error);
      res.status(500).json({ message: "Failed to fetch branches" });
    }
  });

  app.get("/api/branches/:id", isAuthenticated, requireManagementRole, async (req, res) => {
    try {
      const userId = req.session?.userId;
      const authUser = await authService.getUserById(userId!);
      const userRole = authUser?.role || "employee";
      
      // Get access scope for user
      const scope = await storage.getUserAccessScope(userId!, userRole);
      
      const branch = await storage.getBranch(req.params.id);
      if (!branch) {
        return res.status(404).json({ message: "Branch not found" });
      }
      
      // If user has restrictions, check if user can access this branch
      if (!scope.hasNoRestrictions && !scope.branchIds.includes(branch.id)) {
        return res.status(403).json({ message: "Access denied. Not in your management scope." });
      }
      res.json(branch);
    } catch (error) {
      console.error("Error fetching branch:", error);
      res.status(500).json({ message: "Failed to fetch branch" });
    }
  });

  app.post("/api/branches", async (req, res) => {
    try {
      const validated = insertBranchSchema.parse({
        ...req.body,
        createdAt: new Date().toISOString(),
      });
      const branch = await storage.createBranch(validated);
      res.status(201).json(branch);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating branch:", error);
      res.status(500).json({ message: "Failed to create branch" });
    }
  });

  app.patch("/api/branches/:id", async (req, res) => {
    try {
      const branch = await storage.updateBranch(req.params.id, {
        ...req.body,
        updatedAt: new Date().toISOString(),
      });
      if (!branch) {
        return res.status(404).json({ message: "Branch not found" });
      }
      res.json(branch);
    } catch (error) {
      console.error("Error updating branch:", error);
      res.status(500).json({ message: "Failed to update branch" });
    }
  });

  app.delete("/api/branches/:id", async (req, res) => {
    try {
      await storage.deleteBranch(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting branch:", error);
      res.status(500).json({ message: "Failed to delete branch" });
    }
  });

  // Employee-Branch Assignment Routes
  app.get("/api/employees/:employeeId/branches", async (req, res) => {
    try {
      const assignments = await storage.getEmployeeBranches(req.params.employeeId);
      res.json(assignments);
    } catch (error) {
      console.error("Error fetching employee branches:", error);
      res.status(500).json({ message: "Failed to fetch employee branches" });
    }
  });

  app.post("/api/employees/:employeeId/branches", async (req, res) => {
    try {
      const validated = insertEmployeeBranchSchema.parse({
        ...req.body,
        employeeId: req.params.employeeId,
        assignedAt: new Date().toISOString(),
      });
      const assignment = await storage.assignEmployeeToBranch(validated);
      res.status(201).json(assignment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error assigning employee to branch:", error);
      res.status(500).json({ message: "Failed to assign employee to branch" });
    }
  });

  app.patch("/api/employee-branches/:id", async (req, res) => {
    try {
      const assignment = await storage.updateEmployeeBranch(req.params.id, req.body);
      if (!assignment) {
        return res.status(404).json({ message: "Assignment not found" });
      }
      res.json(assignment);
    } catch (error) {
      console.error("Error updating employee branch:", error);
      res.status(500).json({ message: "Failed to update employee branch" });
    }
  });

  app.delete("/api/employee-branches/:id", async (req, res) => {
    try {
      await storage.removeEmployeeFromBranch(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error removing employee from branch:", error);
      res.status(500).json({ message: "Failed to remove employee from branch" });
    }
  });

  app.get("/api/branches/:branchId/employees", async (req, res) => {
    try {
      const assignments = await storage.getBranchEmployees(req.params.branchId);
      res.json(assignments);
    } catch (error) {
      console.error("Error fetching branch employees:", error);
      res.status(500).json({ message: "Failed to fetch branch employees" });
    }
  });

  app.get("/api/biometric/enrollment/:employeeId", async (req, res) => {
    try {
      const enrollment = await storage.getBiometricEnrollment(req.params.employeeId);
      if (!enrollment) {
        return res.status(404).json({ message: "No enrollment found", enrolled: false });
      }
      res.json({ ...enrollment, enrolled: true });
    } catch (error) {
      console.error("Error fetching biometric enrollment:", error);
      res.status(500).json({ message: "Failed to fetch enrollment" });
    }
  });

  app.post("/api/biometric/enroll", async (req, res) => {
    try {
      const { employeeId, faceData, consentGiven, deviceInfo } = req.body;
      
      if (!employeeId || !faceData || !consentGiven) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const employee = await storage.getEmployee(employeeId);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }

      const existing = await storage.getBiometricEnrollment(employeeId);
      if (existing && existing.status === "active") {
        return res.status(409).json({ message: "Employee already enrolled" });
      }

      const faceHash = crypto.createHash('sha256').update(faceData).digest('hex');
      
      const enrollment = await storage.createBiometricEnrollment({
        employeeId,
        faceEmbedding: faceHash,
        status: "active",
        enrolledAt: new Date().toISOString(),
        consentGiven: true,
        deviceInfo: deviceInfo || null,
      });

      res.status(201).json({ 
        success: true, 
        enrollmentId: enrollment.id,
        message: "Face enrolled successfully" 
      });
    } catch (error) {
      console.error("Error enrolling biometric:", error);
      res.status(500).json({ message: "Failed to enroll biometric data" });
    }
  });

  app.delete("/api/biometric/enrollment/:employeeId", isAuthenticated, requireManagementRole, async (req, res) => {
    try {
      const enrollment = await storage.getBiometricEnrollment(req.params.employeeId);
      if (!enrollment) {
        return res.status(404).json({ message: "No enrollment found" });
      }
      await storage.deleteBiometricEnrollment(enrollment.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting biometric enrollment:", error);
      res.status(500).json({ message: "Failed to delete enrollment" });
    }
  });

  app.post("/api/biometric/verify", async (req, res) => {
    try {
      const { 
        employeeId, 
        faceData, 
        eventType, 
        livenessData,
        deviceInfo,
        latitude,
        longitude,
        locationAccuracy,
        branchId,
        isMobileDevice,
        skipLocationCheck
      } = req.body;

      if (!employeeId || !faceData || !eventType) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const enrollment = await storage.getBiometricEnrollment(employeeId);
      if (!enrollment || enrollment.status !== "active") {
        return res.status(404).json({ 
          success: false, 
          message: "Employee not enrolled in face recognition" 
        });
      }

      const employeeBranches = await storage.getEmployeeBranches(employeeId);
      let targetBranch = null;
      let distanceFromBranch = null;
      let locationValid = false;

      if (!skipLocationCheck && employeeBranches.length > 0) {
        if (!latitude || !longitude) {
          return res.status(400).json({ 
            success: false, 
            message: "Location data is required for face attendance",
            messageAr: "بيانات الموقع مطلوبة لتسجيل الحضور بالوجه"
          });
        }

        const employeeBranchAssignment = branchId 
          ? employeeBranches.find(eb => eb.branchId === branchId)
          : employeeBranches.find(eb => eb.isPrimary) || employeeBranches[0];

        if (!employeeBranchAssignment) {
          return res.status(400).json({ 
            success: false, 
            message: "Employee is not assigned to any branch",
            messageAr: "الموظف غير مسجل في أي فرع"
          });
        }

        targetBranch = await storage.getBranch(employeeBranchAssignment.branchId);
        
        if (!targetBranch) {
          return res.status(400).json({ 
            success: false, 
            message: "Branch not found",
            messageAr: "الفرع غير موجود"
          });
        }

        if (!targetBranch.isActive) {
          return res.status(400).json({ 
            success: false, 
            message: "Branch is not active",
            messageAr: "الفرع غير مفعل"
          });
        }

        if (!targetBranch.latitude || !targetBranch.longitude) {
          return res.status(400).json({ 
            success: false, 
            message: "Branch location is not configured. Please contact your administrator.",
            messageAr: "موقع الفرع غير محدد. يرجى التواصل مع المدير."
          });
        }

        if (isMobileDevice && !targetBranch.mobileAttendanceEnabled) {
          if (!employeeBranchAssignment.mobileAttendanceAllowed) {
            return res.status(400).json({ 
              success: false, 
              message: "Mobile attendance is not allowed for this employee/branch",
              messageAr: "تسجيل الحضور من الجوال غير مسموح لهذا الموظف/الفرع"
            });
          }
        }

        distanceFromBranch = calculateHaversineDistance(
          latitude, longitude,
          targetBranch.latitude, targetBranch.longitude
        );

        const radiusMeters = targetBranch.radiusMeters || 100;
        locationValid = distanceFromBranch <= radiusMeters;

        if (!locationValid) {
          return res.status(400).json({ 
            success: false, 
            message: `You are ${Math.round(distanceFromBranch)} meters away from the branch. You must be within ${radiusMeters} meters.`,
            messageAr: `أنت على بعد ${Math.round(distanceFromBranch)} متر من الفرع. يجب أن تكون على بعد ${radiusMeters} متر أو أقل.`,
            distanceFromBranch: Math.round(distanceFromBranch),
            requiredRadius: radiusMeters
          });
        }
      } else if (employeeBranches.length === 0) {
        locationValid = true;
      }

      const todayEvents = await storage.getTodayBiometricEvents(employeeId);
      const hasCheckedIn = todayEvents.some(e => e.eventType === "check_in" && e.verified);
      const hasCheckedOut = todayEvents.some(e => e.eventType === "check_out" && e.verified);

      if (eventType === "check_in" && hasCheckedIn) {
        return res.status(400).json({ 
          success: false, 
          message: "Already checked in today",
          messageAr: "تم تسجيل الحضور مسبقاً اليوم"
        });
      }

      if (eventType === "check_out" && !hasCheckedIn) {
        return res.status(400).json({ 
          success: false, 
          message: "Must check in before checking out",
          messageAr: "يجب تسجيل الحضور أولاً قبل الانصراف"
        });
      }

      if (eventType === "check_out" && hasCheckedOut) {
        return res.status(400).json({ 
          success: false, 
          message: "Already checked out today",
          messageAr: "تم تسجيل الانصراف مسبقاً اليوم"
        });
      }

      const faceHash = crypto.createHash('sha256').update(faceData).digest('hex');
      const isMatch = faceHash === enrollment.faceEmbedding;
      
      const blinkDetected = livenessData?.blinkDetected || false;
      const headMovementDetected = livenessData?.headMovementDetected || false;
      const livenessScore = livenessData?.livenessScore || 0;
      
      const livenessVerdict = (blinkDetected && headMovementDetected && livenessScore >= 80) 
        ? "passed" 
        : (livenessScore >= 50 ? "inconclusive" : "failed");

      if (livenessVerdict === "failed") {
        return res.status(400).json({ 
          success: false, 
          message: "Liveness check failed. Please try again with clear view of your face.",
          messageAr: "فشل التحقق من الحيوية. يرجى المحاولة مرة أخرى مع رؤية واضحة لوجهك.",
          livenessVerdict
        });
      }

      const biometricEvent = await storage.createBiometricAttendanceEvent({
        employeeId,
        branchId: targetBranch?.id || null,
        eventType,
        timestamp: new Date().toISOString(),
        confidenceScore: isMatch ? 95 : 0,
        livenessVerdict,
        spoofScore: livenessScore,
        blinkDetected,
        headMovementDetected,
        deviceInfo: deviceInfo || null,
        ipAddress: req.ip || null,
        locationData: null,
        latitude: latitude || null,
        longitude: longitude || null,
        locationAccuracy: locationAccuracy || null,
        distanceFromBranch: distanceFromBranch ? Math.round(distanceFromBranch) : null,
        isMobileDevice: isMobileDevice || false,
        verified: isMatch && livenessVerdict === "passed",
        linkedAttendanceId: null,
        notes: targetBranch ? `Branch: ${targetBranch.name}` : null,
      });

      if (isMatch && livenessVerdict === "passed") {
        const today = new Date().toISOString().split("T")[0];
        const now = new Date().toTimeString().split(" ")[0].slice(0, 5);
        
        if (eventType === "check_in") {
          const existingAttendance = await storage.getAttendanceByDate(today);
          const employeeAttendance = existingAttendance.find(a => a.employeeId === employeeId);
          
          if (!employeeAttendance) {
            const isLate = parseInt(now.split(":")[0]) >= 9;
            await storage.createAttendance({
              employeeId,
              date: today,
              checkIn: now,
              status: isLate ? "late" : "present",
              notes: targetBranch ? `Face recognition check-in at ${targetBranch.name}` : "Face recognition check-in",
            });
          }
        }
      }

      res.json({
        success: isMatch && livenessVerdict === "passed",
        eventId: biometricEvent.id,
        eventType,
        verified: biometricEvent.verified,
        livenessVerdict,
        branchName: targetBranch?.name,
        distanceFromBranch: distanceFromBranch ? Math.round(distanceFromBranch) : null,
        message: isMatch && livenessVerdict === "passed" 
          ? `Successfully ${eventType === "check_in" ? "checked in" : "checked out"}`
          : "Face verification failed. Please try again.",
        messageAr: isMatch && livenessVerdict === "passed"
          ? `تم ${eventType === "check_in" ? "تسجيل الحضور" : "تسجيل الانصراف"} بنجاح`
          : "فشل التحقق من الوجه. يرجى المحاولة مرة أخرى."
      });
    } catch (error) {
      console.error("Error verifying biometric:", error);
      res.status(500).json({ message: "Failed to verify biometric data" });
    }
  });

  app.get("/api/biometric/events/:employeeId", async (req, res) => {
    try {
      const events = await storage.getBiometricAttendanceEvents(req.params.employeeId);
      res.json(events);
    } catch (error) {
      console.error("Error fetching biometric events:", error);
      res.status(500).json({ message: "Failed to fetch biometric events" });
    }
  });

  app.get("/api/biometric/today/:employeeId", async (req, res) => {
    try {
      const events = await storage.getTodayBiometricEvents(req.params.employeeId);
      res.json(events);
    } catch (error) {
      console.error("Error fetching today's biometric events:", error);
      res.status(500).json({ message: "Failed to fetch today's events" });
    }
  });

  // ==================== Contracts Routes ====================
  
  app.get("/api/contracts", async (req, res) => {
    try {
      const contracts = await storage.getAllContracts();
      res.json(contracts);
    } catch (error) {
      console.error("Error fetching contracts:", error);
      res.status(500).json({ message: "Failed to fetch contracts" });
    }
  });

  app.get("/api/contracts/stats", async (req, res) => {
    try {
      const stats = await storage.getContractStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching contract stats:", error);
      res.status(500).json({ message: "Failed to fetch contract stats" });
    }
  });

  app.get("/api/contracts/:id", async (req, res) => {
    try {
      const contract = await storage.getContract(req.params.id);
      if (!contract) {
        return res.status(404).json({ message: "Contract not found" });
      }
      res.json(contract);
    } catch (error) {
      console.error("Error fetching contract:", error);
      res.status(500).json({ message: "Failed to fetch contract" });
    }
  });

  app.post("/api/contracts", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as AuthUser;
      const contractData = {
        ...req.body,
        createdBy: user.id,
        createdAt: new Date().toISOString(),
      };
      const validated = insertContractSchema.parse(contractData);
      const contract = await storage.createContract(validated);
      res.status(201).json(contract);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating contract:", error);
      res.status(500).json({ message: "Failed to create contract" });
    }
  });

  app.patch("/api/contracts/:id", async (req, res) => {
    try {
      const contract = await storage.updateContract(req.params.id, req.body);
      if (!contract) {
        return res.status(404).json({ message: "Contract not found" });
      }
      res.json(contract);
    } catch (error) {
      console.error("Error updating contract:", error);
      res.status(500).json({ message: "Failed to update contract" });
    }
  });

  app.delete("/api/contracts/:id", async (req, res) => {
    try {
      await storage.deleteContract(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting contract:", error);
      res.status(500).json({ message: "Failed to delete contract" });
    }
  });

  // PDF Text Extraction endpoint
  app.post("/api/contracts/extract-pdf", isAuthenticated, async (req, res) => {
    try {
      const { pdfBase64 } = req.body;
      
      if (!pdfBase64) {
        return res.status(400).json({ message: "PDF data is required" });
      }

      // Check base64 size (roughly 1.37x the original file size)
      const estimatedSize = pdfBase64.length * 0.75;
      const maxSize = 10 * 1024 * 1024; // 10MB limit
      if (estimatedSize > maxSize) {
        return res.status(400).json({ message: "PDF too large. Maximum 10MB allowed." });
      }

      const pdfParse = await import("pdf-parse");
      const pdfBuffer = Buffer.from(pdfBase64, "base64");
      const data = await pdfParse.default(pdfBuffer);
      
      if (!data.text || data.text.trim().length < 10) {
        return res.status(400).json({ 
          message: "Could not extract text from PDF. The PDF may be image-based or empty." 
        });
      }

      res.json({ text: data.text, numPages: data.numpages });
    } catch (error: any) {
      console.error("PDF extraction error:", error);
      res.status(500).json({ message: "Failed to extract text from PDF" });
    }
  });

  // Contract Analysis with AI (requires authentication)
  app.post("/api/contracts/analyze", isAuthenticated, async (req, res) => {
    try {
      const { text, imageBase64, mimeType } = req.body;
      
      if (!text && !imageBase64) {
        return res.status(400).json({ message: "Either text or imageBase64 is required" });
      }

      // Validate text length
      if (text && text.length > 100000) {
        return res.status(400).json({ message: "Text too long. Maximum 100,000 characters allowed." });
      }

      // Validate image if provided
      if (imageBase64) {
        // Check base64 size (roughly 1.37x the original file size)
        const estimatedSize = imageBase64.length * 0.75; // Convert base64 to bytes
        const maxSize = 10 * 1024 * 1024; // 10MB limit
        if (estimatedSize > maxSize) {
          return res.status(400).json({ message: "Image too large. Maximum 10MB allowed." });
        }

        // Validate mime type - only allow images, not PDFs
        const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"];
        if (!allowedTypes.includes(mimeType || "")) {
          return res.status(400).json({ 
            message: "Invalid file type. Please upload an image (PNG, JPG, WEBP). For PDF documents, please copy and paste the text instead." 
          });
        }
      }

      let result;
      if (imageBase64) {
        result = await analyzeContractImage(imageBase64, mimeType || "image/png");
      } else {
        result = await analyzeContractText(text);
      }

      res.json(result);
    } catch (error: any) {
      console.error("Contract analysis error:", error);
      const errorMessage = error?.message || "Failed to analyze contract";
      res.status(500).json({ message: errorMessage });
    }
  });

  // Contract Parties
  app.get("/api/contracts/:contractId/parties", async (req, res) => {
    try {
      const parties = await storage.getContractParties(req.params.contractId);
      res.json(parties);
    } catch (error) {
      console.error("Error fetching contract parties:", error);
      res.status(500).json({ message: "Failed to fetch contract parties" });
    }
  });

  app.post("/api/contract-parties", async (req, res) => {
    try {
      const validated = insertContractPartySchema.parse(req.body);
      const party = await storage.createContractParty(validated);
      res.status(201).json(party);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating contract party:", error);
      res.status(500).json({ message: "Failed to create contract party" });
    }
  });

  // Properties
  app.get("/api/properties", async (req, res) => {
    try {
      const properties = await storage.getAllProperties();
      res.json(properties);
    } catch (error) {
      console.error("Error fetching properties:", error);
      res.status(500).json({ message: "Failed to fetch properties" });
    }
  });

  app.get("/api/properties/:id", async (req, res) => {
    try {
      const property = await storage.getProperty(req.params.id);
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      res.json(property);
    } catch (error) {
      console.error("Error fetching property:", error);
      res.status(500).json({ message: "Failed to fetch property" });
    }
  });

  app.post("/api/properties", async (req, res) => {
    try {
      const validated = insertPropertySchema.parse(req.body);
      const property = await storage.createProperty(validated);
      res.status(201).json(property);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating property:", error);
      res.status(500).json({ message: "Failed to create property" });
    }
  });

  app.patch("/api/properties/:id", async (req, res) => {
    try {
      const property = await storage.updateProperty(req.params.id, req.body);
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      res.json(property);
    } catch (error) {
      console.error("Error updating property:", error);
      res.status(500).json({ message: "Failed to update property" });
    }
  });

  app.delete("/api/properties/:id", async (req, res) => {
    try {
      await storage.deleteProperty(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting property:", error);
      res.status(500).json({ message: "Failed to delete property" });
    }
  });

  // Property Units
  app.get("/api/property-units", async (req, res) => {
    try {
      const units = await storage.getAllPropertyUnits();
      res.json(units);
    } catch (error) {
      console.error("Error fetching property units:", error);
      res.status(500).json({ message: "Failed to fetch property units" });
    }
  });

  app.get("/api/properties/:propertyId/units", async (req, res) => {
    try {
      const units = await storage.getPropertyUnits(req.params.propertyId);
      res.json(units);
    } catch (error) {
      console.error("Error fetching property units:", error);
      res.status(500).json({ message: "Failed to fetch property units" });
    }
  });

  app.post("/api/property-units", async (req, res) => {
    try {
      const validated = insertPropertyUnitSchema.parse(req.body);
      const unit = await storage.createPropertyUnit(validated);
      res.status(201).json(unit);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating property unit:", error);
      res.status(500).json({ message: "Failed to create property unit" });
    }
  });

  app.patch("/api/property-units/:id", async (req, res) => {
    try {
      const unit = await storage.updatePropertyUnit(req.params.id, req.body);
      if (!unit) {
        return res.status(404).json({ message: "Property unit not found" });
      }
      res.json(unit);
    } catch (error) {
      console.error("Error updating property unit:", error);
      res.status(500).json({ message: "Failed to update property unit" });
    }
  });

  app.delete("/api/property-units/:id", async (req, res) => {
    try {
      await storage.deletePropertyUnit(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting property unit:", error);
      res.status(500).json({ message: "Failed to delete property unit" });
    }
  });

  // Contract Payments
  app.get("/api/contract-payments", async (req, res) => {
    try {
      const payments = await storage.getAllContractPayments();
      res.json(payments);
    } catch (error) {
      console.error("Error fetching contract payments:", error);
      res.status(500).json({ message: "Failed to fetch contract payments" });
    }
  });

  app.get("/api/contracts/:contractId/payments", async (req, res) => {
    try {
      const payments = await storage.getContractPayments(req.params.contractId);
      res.json(payments);
    } catch (error) {
      console.error("Error fetching contract payments:", error);
      res.status(500).json({ message: "Failed to fetch contract payments" });
    }
  });

  app.post("/api/contract-payments", async (req, res) => {
    try {
      const validated = insertContractPaymentSchema.parse(req.body);
      const payment = await storage.createContractPayment(validated);
      res.status(201).json(payment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating contract payment:", error);
      res.status(500).json({ message: "Failed to create contract payment" });
    }
  });

  app.patch("/api/contract-payments/:id", async (req, res) => {
    try {
      const payment = await storage.updateContractPayment(req.params.id, req.body);
      if (!payment) {
        return res.status(404).json({ message: "Contract payment not found" });
      }
      res.json(payment);
    } catch (error) {
      console.error("Error updating contract payment:", error);
      res.status(500).json({ message: "Failed to update contract payment" });
    }
  });

  // User Permissions
  app.get("/api/users/:userId/permissions", async (req, res) => {
    try {
      const permissions = await storage.getUserPermissions(req.params.userId);
      res.json(permissions);
    } catch (error) {
      console.error("Error fetching user permissions:", error);
      res.status(500).json({ message: "Failed to fetch user permissions" });
    }
  });

  app.post("/api/user-permissions", async (req, res) => {
    try {
      const validated = insertUserPermissionSchema.parse(req.body);
      const permission = await storage.createUserPermission(validated);
      res.status(201).json(permission);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating user permission:", error);
      res.status(500).json({ message: "Failed to create user permission" });
    }
  });

  app.delete("/api/user-permissions/:id", async (req, res) => {
    try {
      await storage.deleteUserPermission(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting user permission:", error);
      res.status(500).json({ message: "Failed to delete user permission" });
    }
  });

  app.delete("/api/users/:userId/permissions", async (req, res) => {
    try {
      await storage.deleteUserPermissionsByUser(req.params.userId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting user permissions:", error);
      res.status(500).json({ message: "Failed to delete user permissions" });
    }
  });

  // Audit Logs
  app.get("/api/audit-logs", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      const logs = await storage.getAuditLogs(limit);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      res.status(500).json({ message: "Failed to fetch audit logs" });
    }
  });

  // ============================================
  // PAYROLL MANAGEMENT ENDPOINTS
  // ============================================

  const MONTH_NAMES_EN = ["January", "February", "March", "April", "May", "June", 
                          "July", "August", "September", "October", "November", "December"];
  const MONTH_NAMES_AR = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", 
                          "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];

  // Get all payroll runs (history)
  app.get("/api/payroll", isAuthenticated, requireManagementRole, async (req, res) => {
    try {
      const runs = await storage.getPayrollRuns();
      res.json(runs);
    } catch (error) {
      console.error("Error fetching payroll runs:", error);
      res.status(500).json({ message: "Failed to fetch payroll runs" });
    }
  });

  // Get payroll run by period (year/month)
  app.get("/api/payroll/period", isAuthenticated, requireManagementRole, async (req, res) => {
    try {
      const year = parseInt(req.query.year as string);
      const month = parseInt(req.query.month as string);
      
      if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
        return res.status(400).json({ message: "Invalid year or month" });
      }

      const run = await storage.getPayrollRunByPeriod(year, month);
      if (!run) {
        return res.json(null);
      }
      
      const items = await storage.getPayrollItems(run.id);
      res.json({ run, items });
    } catch (error) {
      console.error("Error fetching payroll by period:", error);
      res.status(500).json({ message: "Failed to fetch payroll" });
    }
  });

  // Run payroll for a specific month
  app.post("/api/payroll/run", isAuthenticated, requireManagementRole, async (req, res) => {
    try {
      const { year, month } = req.body;
      
      if (!year || !month || month < 1 || month > 12) {
        return res.status(400).json({ message: "Invalid year or month" });
      }

      // Check if payroll already exists for this period
      const existingRun = await storage.getPayrollRunByPeriod(year, month);
      if (existingRun && existingRun.status !== "draft") {
        return res.status(400).json({ 
          message: "Payroll already exists for this period",
          existingRunId: existingRun.id 
        });
      }

      // Delete existing draft if any
      if (existingRun && existingRun.status === "draft") {
        await storage.deletePayrollRun(existingRun.id);
      }

      // Get all active employees
      const allEmployees = await storage.getAllEmployees();
      const activeEmployees = allEmployees.filter(e => e.status === "active");

      // Get department names for employee snapshots
      const departments = await storage.getAllDepartments();
      const deptMap = new Map(departments.map(d => [d.id, d]));

      // Create payroll run
      const now = new Date().toISOString();
      const userId = req.session?.userId;
      
      let totalBaseSalary = 0;
      let totalAdditions = 0;
      let totalDeductions = 0;
      
      const payrollRun = await storage.createPayrollRun({
        year,
        month,
        periodLabel: `${MONTH_NAMES_EN[month - 1]} ${year}`,
        periodLabelAr: `${MONTH_NAMES_AR[month - 1]} ${year}`,
        totalEmployees: activeEmployees.length,
        status: "processing",
        createdBy: userId || null,
        createdAt: now,
      });

      // Get all approved payroll requests for this period (fetch once, filter per employee)
      const allApprovedRequests = await storage.getApprovedPayrollRequestsForRun(year, month);
      
      // Create payroll items for each employee
      const payrollItemsCreated = [];
      
      for (const employee of activeEmployees) {
        const baseSalary = employee.salary || 0;
        const dept = employee.departmentId ? deptMap.get(employee.departmentId) : null;
        
        // Get recurring templates for this employee
        const templates = await storage.getActivePayrollTemplates(employee.id);
        
        let employeeAdditions = 0;
        let employeeDeductions = 0;
        
        // Create the payroll item first with bank data from employee
        const payrollItem = await storage.createPayrollItem({
          runId: payrollRun.id,
          employeeId: employee.id,
          employeeName: employee.fullName,
          employeeNameAr: employee.fullNameAr || null,
          employeeNumber: employee.employeeNumber,
          departmentName: dept?.name || null,
          position: employee.position || null,
          baseSalary,
          status: "pending",
          paymentMethod: "bank_transfer",
          bankName: employee.bankName || null,
          iban: employee.ibanNumber || null,
          createdAt: now,
        });

        // Apply recurring adjustments from templates
        for (const template of templates) {
          await storage.createPayrollAdjustment({
            payrollItemId: payrollItem.id,
            type: template.type,
            name: template.name,
            nameAr: template.nameAr || null,
            amount: template.amount,
            category: template.category || null,
            categoryAr: template.categoryAr || null,
            description: template.description || null,
            descriptionAr: template.descriptionAr || null,
            isRecurring: true,
            createdAt: now,
          });
          
          if (template.type === "addition") {
            employeeAdditions += template.amount;
          } else {
            employeeDeductions += template.amount;
          }
        }

        // Apply approved payroll requests for this employee and period
        const employeeRequests = allApprovedRequests.filter(r => r.employeeId === employee.id);
        
        for (const request of employeeRequests) {
          const adjustmentAmount = request.calculatedAmount || request.amount || 0;
          
          await storage.createPayrollAdjustment({
            payrollItemId: payrollItem.id,
            type: request.category as "addition" | "deduction",
            name: request.title,
            nameAr: request.titleAr || null,
            amount: adjustmentAmount,
            category: request.requestType,
            categoryAr: request.titleAr || null,
            description: request.description || null,
            descriptionAr: request.descriptionAr || null,
            isRecurring: false,
            createdAt: now,
          });
          
          if (request.category === "addition") {
            employeeAdditions += adjustmentAmount;
          } else {
            employeeDeductions += adjustmentAmount;
          }
        }

        // Calculate totals
        const grossPay = baseSalary + employeeAdditions;
        const netPay = grossPay - employeeDeductions;

        // Update the payroll item with calculated amounts
        await storage.updatePayrollItem(payrollItem.id, {
          totalAdditions: employeeAdditions,
          totalDeductions: employeeDeductions,
          grossPay,
          netPay,
          updatedAt: now,
        });

        totalBaseSalary += baseSalary;
        totalAdditions += employeeAdditions;
        totalDeductions += employeeDeductions;
        
        payrollItemsCreated.push({ ...payrollItem, grossPay, netPay });
      }

      // Update payroll run with totals
      const totalNetPay = totalBaseSalary + totalAdditions - totalDeductions;
      const updatedRun = await storage.updatePayrollRun(payrollRun.id, {
        totalBaseSalary,
        totalAdditions,
        totalDeductions,
        totalNetPay,
        status: "completed",
        processedBy: userId || null,
        processedAt: now,
        updatedAt: now,
      });

      // Mark all approved requests as applied AFTER successful payroll run completion
      for (const request of allApprovedRequests) {
        await storage.updatePayrollRequest(request.id, {
          status: "applied",
          appliedToRunId: payrollRun.id,
          appliedAt: now,
        });
      }

      res.status(201).json({ run: updatedRun, items: payrollItemsCreated });
    } catch (error) {
      console.error("Error running payroll:", error);
      res.status(500).json({ message: "Failed to run payroll" });
    }
  });

  // Update payroll run (for approval workflow)
  app.patch("/api/payroll/runs/:id", isAuthenticated, requireManagementRole, async (req, res) => {
    try {
      const allowedFields = ["status", "hrApprovedBy", "hrApprovedAt", "financeApprovedBy", "financeApprovedAt"];
      const updateData: Record<string, unknown> = {};
      
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          updateData[field] = req.body[field];
        }
      }
      updateData.updatedAt = new Date().toISOString();
      
      const run = await storage.updatePayrollRun(req.params.id, updateData);
      if (!run) {
        return res.status(404).json({ message: "Payroll run not found" });
      }
      res.json(run);
    } catch (error) {
      console.error("Error updating payroll run:", error);
      res.status(500).json({ message: "Failed to update payroll run" });
    }
  });

  // Update payroll item status
  app.patch("/api/payroll/items/:id", isAuthenticated, requireManagementRole, async (req, res) => {
    try {
      const allowedFields = ["status", "notes", "paymentMethod", "bankName", "accountNumber"];
      const updateData: Record<string, unknown> = {};
      
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          updateData[field] = req.body[field];
        }
      }
      updateData.updatedAt = new Date().toISOString();
      
      const item = await storage.updatePayrollItem(req.params.id, updateData);
      if (!item) {
        return res.status(404).json({ message: "Payroll item not found" });
      }
      res.json(item);
    } catch (error) {
      console.error("Error updating payroll item:", error);
      res.status(500).json({ message: "Failed to update payroll item" });
    }
  });

  // Get payroll adjustments for an item
  app.get("/api/payroll/items/:id/adjustments", isAuthenticated, requireManagementRole, async (req, res) => {
    try {
      const adjustments = await storage.getPayrollAdjustments(req.params.id);
      res.json(adjustments);
    } catch (error) {
      console.error("Error fetching payroll adjustments:", error);
      res.status(500).json({ message: "Failed to fetch adjustments" });
    }
  });

  // Add adjustment to payroll item
  app.post("/api/payroll/items/:id/adjustments", isAuthenticated, requireManagementRole, async (req, res) => {
    try {
      const payrollItem = await storage.getPayrollItem(req.params.id);
      if (!payrollItem) {
        return res.status(404).json({ message: "Payroll item not found" });
      }

      const validated = insertPayrollAdjustmentSchema.parse({
        ...req.body,
        payrollItemId: req.params.id,
        createdAt: new Date().toISOString(),
      });
      
      const adjustment = await storage.createPayrollAdjustment(validated);
      
      // Recalculate payroll item totals
      const allAdjustments = await storage.getPayrollAdjustments(req.params.id);
      let totalAdditions = 0;
      let totalDeductions = 0;
      
      for (const adj of allAdjustments) {
        if (adj.type === "addition") {
          totalAdditions += adj.amount;
        } else {
          totalDeductions += adj.amount;
        }
      }
      
      const baseSalary = payrollItem.baseSalary || 0;
      const grossPay = baseSalary + totalAdditions;
      const netPay = grossPay - totalDeductions;
      
      await storage.updatePayrollItem(req.params.id, {
        totalAdditions,
        totalDeductions,
        grossPay,
        netPay,
        updatedAt: new Date().toISOString(),
      });

      res.status(201).json(adjustment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating payroll adjustment:", error);
      res.status(500).json({ message: "Failed to create adjustment" });
    }
  });

  // Delete payroll adjustment
  app.delete("/api/payroll/adjustments/:id", isAuthenticated, requireManagementRole, async (req, res) => {
    try {
      await storage.deletePayrollAdjustment(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting payroll adjustment:", error);
      res.status(500).json({ message: "Failed to delete adjustment" });
    }
  });

  // Payroll templates (recurring adjustments)
  app.get("/api/payroll/templates/:employeeId", isAuthenticated, requireManagementRole, async (req, res) => {
    try {
      const templates = await storage.getPayrollTemplates(req.params.employeeId);
      res.json(templates);
    } catch (error) {
      console.error("Error fetching payroll templates:", error);
      res.status(500).json({ message: "Failed to fetch templates" });
    }
  });

  app.post("/api/payroll/templates", isAuthenticated, requireManagementRole, async (req, res) => {
    try {
      const validated = insertPayrollTemplateSchema.parse({
        ...req.body,
        createdAt: new Date().toISOString(),
      });
      const template = await storage.createPayrollTemplate(validated);
      res.status(201).json(template);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating payroll template:", error);
      res.status(500).json({ message: "Failed to create template" });
    }
  });

  app.patch("/api/payroll/templates/:id", isAuthenticated, requireManagementRole, async (req, res) => {
    try {
      const allowedFields = ["type", "name", "nameAr", "amount", "category", "categoryAr", 
                            "description", "descriptionAr", "isActive", "startDate", "endDate"];
      const updateData: Record<string, unknown> = {};
      
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          updateData[field] = req.body[field];
        }
      }
      updateData.updatedAt = new Date().toISOString();
      
      const template = await storage.updatePayrollTemplate(req.params.id, updateData);
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }
      res.json(template);
    } catch (error) {
      console.error("Error updating payroll template:", error);
      res.status(500).json({ message: "Failed to update template" });
    }
  });

  app.delete("/api/payroll/templates/:id", isAuthenticated, requireManagementRole, async (req, res) => {
    try {
      await storage.deletePayrollTemplate(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting payroll template:", error);
      res.status(500).json({ message: "Failed to delete template" });
    }
  });

  // Payroll stats for dashboard
  app.get("/api/payroll/stats", isAuthenticated, requireManagementRole, async (req, res) => {
    try {
      const runs = await storage.getPayrollRuns();
      const completedRuns = runs.filter(r => r.status === "completed");
      
      let totalPaid = 0;
      let totalEmployeesPaid = 0;
      
      for (const run of completedRuns) {
        totalPaid += run.totalNetPay || 0;
        totalEmployeesPaid += run.totalEmployees || 0;
      }
      
      res.json({
        totalRuns: completedRuns.length,
        totalPaid,
        totalEmployeesPaid,
        recentRuns: completedRuns.slice(-5).reverse(),
      });
    } catch (error) {
      console.error("Error fetching payroll stats:", error);
      res.status(500).json({ message: "Failed to fetch payroll stats" });
    }
  });

  // ==================== PAYROLL APPROVAL SETTINGS ====================

  // Get all approval settings (for admin)
  app.get("/api/payroll/approval-settings", isAuthenticated, requireManagementRole, async (req, res) => {
    try {
      const settings = await storage.getAllPayrollApprovalSettings();
      res.json(settings);
    } catch (error) {
      console.error("Error fetching approval settings:", error);
      res.status(500).json({ message: "Failed to fetch approval settings" });
    }
  });

  // Get enabled approval settings (for workflow)
  app.get("/api/payroll/approval-settings/enabled", isAuthenticated, requireManagementRole, async (req, res) => {
    try {
      const settings = await storage.getEnabledPayrollApprovalSettings();
      res.json(settings);
    } catch (error) {
      console.error("Error fetching enabled approval settings:", error);
      res.status(500).json({ message: "Failed to fetch enabled approval settings" });
    }
  });

  // Update approval setting (admin only - toggle enabled/disabled)
  app.patch("/api/payroll/approval-settings/:id", isAuthenticated, async (req, res) => {
    try {
      const user = await storage.getUser(req.session!.userId!);
      if (!user || !["super_admin", "admin"].includes(user.role || "")) {
        return res.status(403).json({ message: "Only admin can modify approval settings" });
      }

      const allowedFields = ["isEnabled", "orderIndex", "allowedUserRoles"];
      const updateData: Record<string, unknown> = {};
      
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          updateData[field] = req.body[field];
        }
      }
      updateData.updatedAt = new Date().toISOString();
      
      const setting = await storage.updatePayrollApprovalSetting(req.params.id, updateData);
      if (!setting) {
        return res.status(404).json({ message: "Approval setting not found" });
      }
      res.json(setting);
    } catch (error) {
      console.error("Error updating approval setting:", error);
      res.status(500).json({ message: "Failed to update approval setting" });
    }
  });

  // ==================== PAYROLL RUN APPROVALS ====================

  // Get approvals for a payroll run
  app.get("/api/payroll/runs/:id/approvals", isAuthenticated, requireManagementRole, async (req, res) => {
    try {
      const approvals = await storage.getPayrollRunApprovals(req.params.id);
      res.json(approvals);
    } catch (error) {
      console.error("Error fetching run approvals:", error);
      res.status(500).json({ message: "Failed to fetch run approvals" });
    }
  });

  // Submit approval for a payroll run
  app.post("/api/payroll/runs/:id/approve", isAuthenticated, requireManagementRole, async (req, res) => {
    try {
      const { role: approvalRole } = req.body;
      if (!approvalRole) {
        return res.status(400).json({ message: "Approval role is required" });
      }

      const user = await storage.getUser(req.session!.userId!);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      // Get the approval setting for this role
      const setting = await storage.getPayrollApprovalSettingByRole(approvalRole);
      if (!setting || !setting.isEnabled) {
        return res.status(400).json({ message: "This approval stage is not enabled" });
      }

      // Check if user's role is allowed to perform this approval
      const allowedRoles = setting.allowedUserRoles || [];
      if (!allowedRoles.includes(user.role || "")) {
        return res.status(403).json({ message: "You are not authorized to perform this approval" });
      }

      // Get existing approvals
      const existingApprovals = await storage.getPayrollRunApprovals(req.params.id);
      const existingApproval = existingApprovals.find(a => a.role === approvalRole);

      if (existingApproval && existingApproval.status === "approved") {
        return res.status(400).json({ message: "This stage has already been approved" });
      }

      // Check if previous stages are completed
      const enabledSettings = await storage.getEnabledPayrollApprovalSettings();
      const currentIndex = enabledSettings.findIndex(s => s.role === approvalRole);
      
      for (let i = 0; i < currentIndex; i++) {
        const prevRole = enabledSettings[i].role;
        const prevApproval = existingApprovals.find(a => a.role === prevRole);
        if (!prevApproval || prevApproval.status !== "approved") {
          return res.status(400).json({ 
            message: `Previous approval stage (${enabledSettings[i].roleName}) must be completed first` 
          });
        }
      }

      const now = new Date().toISOString();

      // Create or update approval
      let approval;
      if (existingApproval) {
        approval = await storage.updatePayrollRunApproval(existingApproval.id, {
          status: "approved",
          approverId: user.id,
          approverName: user.fullName || user.email,
          approvedAt: now,
        });
      } else {
        approval = await storage.createPayrollRunApproval({
          runId: req.params.id,
          role: approvalRole,
          status: "approved",
          approverId: user.id,
          approverName: user.fullName || user.email,
          approvedAt: now,
          createdAt: now,
        });
      }

      // Check if all enabled stages are now approved
      const allApprovals = await storage.getPayrollRunApprovals(req.params.id);
      const allApproved = enabledSettings.every(setting => {
        const stageApproval = allApprovals.find(a => a.role === setting.role);
        return stageApproval && stageApproval.status === "approved";
      });

      // Update payroll run status if all approved
      if (allApproved) {
        await storage.updatePayrollRun(req.params.id, {
          status: "finance_approved", // Final approved status
          updatedAt: now,
        });
      } else if (currentIndex === enabledSettings.length - 1) {
        // Last stage approved but not all - shouldn't happen but handle it
        await storage.updatePayrollRun(req.params.id, {
          status: `${approvalRole}_approved` as any,
          updatedAt: now,
        });
      } else {
        // Update to next pending status
        const nextRole = enabledSettings[currentIndex + 1]?.role;
        if (nextRole) {
          await storage.updatePayrollRun(req.params.id, {
            status: `${approvalRole}_approved` as any,
            updatedAt: now,
          });
        }
      }

      res.json({ approval, allApproved });
    } catch (error) {
      console.error("Error submitting approval:", error);
      res.status(500).json({ message: "Failed to submit approval" });
    }
  });

  // Export bank file for payroll run
  app.get("/api/payroll/runs/:id/export-bank", isAuthenticated, requireManagementRole, async (req, res) => {
    try {
      const run = await storage.getPayrollRun(req.params.id);
      if (!run) {
        return res.status(404).json({ message: "Payroll run not found" });
      }

      // Get payroll items for this run
      const items = await storage.getPayrollItems(req.params.id);
      if (!items || items.length === 0) {
        return res.status(400).json({ message: "No payroll items found for this run" });
      }

      // Get only employees that are in this payroll run
      const employeeIds = items.map(item => item.employeeId);
      const allEmployees = await storage.getEmployees();
      const employeeMap = new Map(
        allEmployees.filter(e => employeeIds.includes(e.id)).map(e => [e.id, e])
      );

      // Validate required bank fields and collect errors
      const missingBankInfo: string[] = [];
      for (const item of items) {
        const employee = employeeMap.get(item.employeeId);
        if (!employee) {
          missingBankInfo.push(`Employee ID ${item.employeeId} not found`);
          continue;
        }
        
        const missingFields: string[] = [];
        if (!employee.ibanNumber) missingFields.push("IBAN");
        if (!employee.bankAccountNumber) missingFields.push("Account Number");
        
        if (missingFields.length > 0) {
          missingBankInfo.push(`${employee.nameEn || employee.name || employee.employeeId}: Missing ${missingFields.join(", ")}`);
        }
      }

      // Return error if any employees have missing bank info
      if (missingBankInfo.length > 0) {
        return res.status(400).json({ 
          message: "Some employees have incomplete bank information",
          details: missingBankInfo.slice(0, 10), // Limit to first 10 errors
          totalErrors: missingBankInfo.length
        });
      }

      // Build CSV content
      const monthNames = ["January", "February", "March", "April", "May", "June", 
                          "July", "August", "September", "October", "November", "December"];
      const periodName = `${monthNames[run.month - 1]} ${run.year}`;
      
      // Header row
      const headers = [
        "Seq", "Employee ID", "Employee Name", "Employee Name (AR)", "Bank Code", 
        "Account Number", "IBAN", "National ID", "Currency", "Net Salary", "Payment Description"
      ];
      
      let csvContent = headers.join(",") + "\n";
      
      // Data rows - only include employees with complete data
      let totalAmount = 0;
      let exportedCount = 0;
      let seq = 1;
      for (const item of items) {
        const employee = employeeMap.get(item.employeeId);
        if (!employee || !employee.ibanNumber || !employee.bankAccountNumber) continue;
        
        const netSalary = Number(item.netSalary) || 0;
        totalAmount += netSalary;
        exportedCount++;
        
        const row = [
          seq,
          employee.employeeId || "",
          `"${(employee.nameEn || employee.name || "").replace(/"/g, '""')}"`,
          `"${(employee.nameAr || "").replace(/"/g, '""')}"`,
          employee.bankCode || "",
          employee.bankAccountNumber || "",
          employee.ibanNumber || "",
          employee.nationalId || "",
          employee.bankCurrency || "SAR",
          netSalary.toFixed(2),
          `"Salary ${periodName}"`
        ];
        
        csvContent += row.join(",") + "\n";
        seq++;
      }
      
      // Add separator and checksum row
      csvContent += "\n";
      csvContent += `Total Records,${exportedCount}\n`;
      csvContent += `Total Amount,${totalAmount.toFixed(2)}\n`;
      csvContent += `Generated,${new Date().toISOString()}\n`;
      csvContent += `Payroll Period,${periodName}\n`;
      
      // Set response headers for CSV download
      const filename = `bank_transfer_${run.year}_${String(run.month).padStart(2, "0")}.csv`;
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.send(csvContent);
    } catch (error) {
      console.error("Error exporting bank file:", error);
      res.status(500).json({ message: "Failed to export bank file" });
    }
  });

  // Initialize default approval settings (one-time setup)
  app.post("/api/payroll/approval-settings/initialize", isAuthenticated, async (req, res) => {
    try {
      const user = await storage.getUser(req.session!.userId!);
      if (!user || !["super_admin", "admin"].includes(user.role || "")) {
        return res.status(403).json({ message: "Only admin can initialize approval settings" });
      }

      const existing = await storage.getAllPayrollApprovalSettings();
      if (existing.length > 0) {
        return res.json({ message: "Settings already initialized", settings: existing });
      }

      const now = new Date().toISOString();
      const defaultSettings = [
        {
          role: "operations" as const,
          roleName: "Operations Manager",
          roleNameAr: "مدير التشغيل",
          orderIndex: 1,
          isEnabled: false,
          allowedUserRoles: ["operations", "super_admin", "admin"],
          createdAt: now,
        },
        {
          role: "supervisor" as const,
          roleName: "Payroll Supervisor",
          roleNameAr: "مشرف الرواتب",
          orderIndex: 2,
          isEnabled: false,
          allowedUserRoles: ["hr", "super_admin", "admin"],
          createdAt: now,
        },
        {
          role: "hr" as const,
          roleName: "HR Manager",
          roleNameAr: "مدير الموارد البشرية",
          orderIndex: 3,
          isEnabled: true,
          allowedUserRoles: ["hr", "super_admin", "admin"],
          createdAt: now,
        },
        {
          role: "finance" as const,
          roleName: "Finance Manager",
          roleNameAr: "المدير المالي",
          orderIndex: 4,
          isEnabled: true,
          allowedUserRoles: ["finance", "super_admin", "admin"],
          createdAt: now,
        },
      ];

      const createdSettings = [];
      for (const setting of defaultSettings) {
        const created = await storage.createPayrollApprovalSetting(setting);
        createdSettings.push(created);
      }

      res.status(201).json({ message: "Settings initialized", settings: createdSettings });
    } catch (error) {
      console.error("Error initializing approval settings:", error);
      res.status(500).json({ message: "Failed to initialize approval settings" });
    }
  });

  // Get specific payroll run with items (MUST come after all specific /api/payroll/* routes)
  app.get("/api/payroll/:id", isAuthenticated, requireManagementRole, async (req, res) => {
    try {
      const run = await storage.getPayrollRun(req.params.id);
      if (!run) {
        return res.status(404).json({ message: "Payroll run not found" });
      }
      
      const items = await storage.getPayrollItems(run.id);
      res.json({ run, items });
    } catch (error) {
      console.error("Error fetching payroll run:", error);
      res.status(500).json({ message: "Failed to fetch payroll run" });
    }
  });

  // ============================================
  // PAYROLL REQUESTS API
  // Deductions: absence, disciplinary, amount_deduction
  // Additions: extra_days, extra_hours, bonus
  // ============================================

  // Get all payroll requests
  app.get("/api/payroll-requests", isAuthenticated, requireManagementRole, async (req, res) => {
    try {
      const { year, month, category, employeeId } = req.query;
      
      let requests;
      if (year && month) {
        requests = await storage.getPayrollRequestsByPeriod(Number(year), Number(month));
      } else if (category) {
        requests = await storage.getPayrollRequestsByCategory(category as string);
      } else if (employeeId) {
        requests = await storage.getPayrollRequestsByEmployee(employeeId as string);
      } else {
        requests = await storage.getAllPayrollRequests();
      }
      
      // Enrich with employee data
      const employees = await storage.getAllEmployees();
      const enrichedRequests = requests.map(req => {
        const employee = employees.find(e => e.id === req.employeeId);
        return {
          ...req,
          employeeName: employee?.fullName,
          employeeNameAr: employee?.fullNameAr,
          employeeNumber: employee?.employeeNumber,
        };
      });
      
      res.json(enrichedRequests);
    } catch (error) {
      console.error("Error fetching payroll requests:", error);
      res.status(500).json({ message: "Failed to fetch payroll requests" });
    }
  });

  // Get single payroll request
  app.get("/api/payroll-requests/:id", isAuthenticated, requireManagementRole, async (req, res) => {
    try {
      const request = await storage.getPayrollRequest(req.params.id);
      if (!request) {
        return res.status(404).json({ message: "Payroll request not found" });
      }
      
      const employee = await storage.getEmployee(request.employeeId);
      res.json({
        ...request,
        employeeName: employee?.fullName,
        employeeNameAr: employee?.fullNameAr,
        employeeNumber: employee?.employeeNumber,
      });
    } catch (error) {
      console.error("Error fetching payroll request:", error);
      res.status(500).json({ message: "Failed to fetch payroll request" });
    }
  });

  // Create payroll request
  app.post("/api/payroll-requests", isAuthenticated, requireManagementRole, async (req, res) => {
    try {
      const userId = req.session?.userId;
      const authUser = await authService.getUserById(userId!);
      
      const { employeeId, category, requestType, title, titleAr, description, descriptionAr,
              days, hours, amount, targetYear, targetMonth } = req.body;
      
      if (!employeeId || !category || !requestType || !title || !targetYear || !targetMonth) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      // Validate category and requestType
      if (!["deduction", "addition"].includes(category)) {
        return res.status(400).json({ message: "Invalid category. Must be 'deduction' or 'addition'" });
      }
      
      const deductionTypes = ["absence", "disciplinary", "amount_deduction"];
      const additionTypes = ["extra_days", "extra_hours", "bonus"];
      
      if (category === "deduction" && !deductionTypes.includes(requestType)) {
        return res.status(400).json({ message: "Invalid deduction type" });
      }
      if (category === "addition" && !additionTypes.includes(requestType)) {
        return res.status(400).json({ message: "Invalid addition type" });
      }
      
      // Calculate amount based on type
      let calculatedAmount = amount;
      if ((requestType === "absence" || requestType === "extra_days") && days) {
        // Will be calculated when employee salary is known
        const employee = await storage.getEmployee(employeeId);
        if (employee?.salary) {
          const dailyRate = employee.salary / 30;
          calculatedAmount = Math.round(dailyRate * days);
        }
      } else if (requestType === "extra_hours" && hours) {
        const employee = await storage.getEmployee(employeeId);
        if (employee?.salary) {
          const hourlyRate = employee.salary / 30 / 8;
          // Overtime typically 1.5x
          calculatedAmount = Math.round(hourlyRate * hours * 1.5);
        }
      }
      
      const request = await storage.createPayrollRequest({
        employeeId,
        category,
        requestType,
        title,
        titleAr,
        description,
        descriptionAr,
        days,
        hours,
        amount,
        calculatedAmount,
        targetYear,
        targetMonth,
        status: "pending",
        createdBy: userId!,
        creatorName: authUser?.fullName,
        createdAt: new Date().toISOString(),
      });
      
      res.status(201).json(request);
    } catch (error) {
      console.error("Error creating payroll request:", error);
      res.status(500).json({ message: "Failed to create payroll request" });
    }
  });

  // Update payroll request
  app.patch("/api/payroll-requests/:id", isAuthenticated, requireManagementRole, async (req, res) => {
    try {
      const request = await storage.getPayrollRequest(req.params.id);
      if (!request) {
        return res.status(404).json({ message: "Payroll request not found" });
      }
      
      // Cannot update if already applied
      if (request.status === "applied") {
        return res.status(400).json({ message: "Cannot update applied request" });
      }
      
      const updated = await storage.updatePayrollRequest(req.params.id, req.body);
      res.json(updated);
    } catch (error) {
      console.error("Error updating payroll request:", error);
      res.status(500).json({ message: "Failed to update payroll request" });
    }
  });

  // Approve payroll request
  app.post("/api/payroll-requests/:id/approve", isAuthenticated, requireManagementRole, async (req, res) => {
    try {
      const userId = req.session?.userId;
      const authUser = await authService.getUserById(userId!);
      
      const request = await storage.getPayrollRequest(req.params.id);
      if (!request) {
        return res.status(404).json({ message: "Payroll request not found" });
      }
      
      if (request.status !== "pending") {
        return res.status(400).json({ message: "Only pending requests can be approved" });
      }
      
      const updated = await storage.updatePayrollRequest(req.params.id, {
        status: "approved",
        approvedBy: userId,
        approverName: authUser?.fullName,
        approvedAt: new Date().toISOString(),
      });
      
      res.json(updated);
    } catch (error) {
      console.error("Error approving payroll request:", error);
      res.status(500).json({ message: "Failed to approve payroll request" });
    }
  });

  // Reject payroll request
  app.post("/api/payroll-requests/:id/reject", isAuthenticated, requireManagementRole, async (req, res) => {
    try {
      const userId = req.session?.userId;
      const authUser = await authService.getUserById(userId!);
      
      const request = await storage.getPayrollRequest(req.params.id);
      if (!request) {
        return res.status(404).json({ message: "Payroll request not found" });
      }
      
      if (request.status !== "pending") {
        return res.status(400).json({ message: "Only pending requests can be rejected" });
      }
      
      const { reason } = req.body;
      
      const updated = await storage.updatePayrollRequest(req.params.id, {
        status: "rejected",
        approvedBy: userId,
        approverName: authUser?.fullName,
        approvedAt: new Date().toISOString(),
        rejectionReason: reason,
      });
      
      res.json(updated);
    } catch (error) {
      console.error("Error rejecting payroll request:", error);
      res.status(500).json({ message: "Failed to reject payroll request" });
    }
  });

  // Delete payroll request
  app.delete("/api/payroll-requests/:id", isAuthenticated, requireManagementRole, async (req, res) => {
    try {
      const request = await storage.getPayrollRequest(req.params.id);
      if (!request) {
        return res.status(404).json({ message: "Payroll request not found" });
      }
      
      if (request.status === "applied") {
        return res.status(400).json({ message: "Cannot delete applied request" });
      }
      
      await storage.deletePayrollRequest(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting payroll request:", error);
      res.status(500).json({ message: "Failed to delete payroll request" });
    }
  });

  // ============================================
  // MANAGEMENT ASSIGNMENTS API (Admin Only)
  // Allows assigning managers to branches/employees
  // ============================================

  // Get all management assignments (admin only)
  app.get("/api/management-assignments", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session?.userId;
      const authUser = await authService.getUserById(userId!);
      
      if (!authUser || !["super_admin", "admin"].includes(authUser.role || "")) {
        return res.status(403).json({ message: "Only admins can view all management assignments" });
      }
      
      const assignments = await storage.getAllManagementAssignments();
      res.json(assignments);
    } catch (error) {
      console.error("Error fetching management assignments:", error);
      res.status(500).json({ message: "Failed to fetch management assignments" });
    }
  });

  // Get assignments for a specific manager
  app.get("/api/management-assignments/manager/:userId", isAuthenticated, async (req, res) => {
    try {
      const currentUserId = req.session?.userId;
      const authUser = await authService.getUserById(currentUserId!);
      
      // Only admin or the manager themselves can see their assignments
      if (!authUser || (!["super_admin", "admin"].includes(authUser.role || "") && currentUserId !== req.params.userId)) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const assignments = await storage.getManagementAssignments(req.params.userId);
      res.json(assignments);
    } catch (error) {
      console.error("Error fetching manager assignments:", error);
      res.status(500).json({ message: "Failed to fetch manager assignments" });
    }
  });

  // Create management assignment (admin only)
  app.post("/api/management-assignments", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session?.userId;
      const authUser = await authService.getUserById(userId!);
      
      if (!authUser || !["super_admin", "admin"].includes(authUser.role || "")) {
        return res.status(403).json({ message: "Only admins can create management assignments" });
      }
      
      const { managerUserId, scopeType, scopeId, notes } = req.body;
      
      if (!managerUserId || !scopeType || !scopeId) {
        return res.status(400).json({ message: "managerUserId, scopeType, and scopeId are required" });
      }
      
      if (!["branch", "employee"].includes(scopeType)) {
        return res.status(400).json({ message: "scopeType must be 'branch' or 'employee'" });
      }
      
      const assignment = await storage.createManagementAssignment({
        managerUserId,
        scopeType,
        scopeId,
        notes,
        createdAt: new Date().toISOString(),
      });
      
      res.status(201).json(assignment);
    } catch (error) {
      console.error("Error creating management assignment:", error);
      res.status(500).json({ message: "Failed to create management assignment" });
    }
  });

  // Delete management assignment (admin only)
  app.delete("/api/management-assignments/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session?.userId;
      const authUser = await authService.getUserById(userId!);
      
      if (!authUser || !["super_admin", "admin"].includes(authUser.role || "")) {
        return res.status(403).json({ message: "Only admins can delete management assignments" });
      }
      
      await storage.deleteManagementAssignment(req.params.id);
      res.json({ message: "Assignment deleted" });
    } catch (error) {
      console.error("Error deleting management assignment:", error);
      res.status(500).json({ message: "Failed to delete management assignment" });
    }
  });

  // Get auth users list for assignment dropdown (admin only)
  app.get("/api/auth-users", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session?.userId;
      const authUser = await authService.getUserById(userId!);
      
      if (!authUser || !["super_admin", "admin"].includes(authUser.role || "")) {
        return res.status(403).json({ message: "Only admins can view auth users" });
      }
      
      const users = await authService.getAllAuthUsers();
      // Return minimal info for security
      const safeUsers = users.map(u => ({
        id: u.id,
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        role: u.role,
        isActive: u.isActive,
      }));
      res.json(safeUsers);
    } catch (error) {
      console.error("Error fetching auth users:", error);
      res.status(500).json({ message: "Failed to fetch auth users" });
    }
  });

  // ================================
  // NOTIFICATIONS API
  // ================================

  // Get current user's notifications
  app.get("/api/notifications", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const userNotifications = await storage.getUserNotifications(userId);
      res.json(userNotifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  // Get unread notification count
  app.get("/api/notifications/unread-count", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const count = await storage.getUnreadNotificationCount(userId);
      res.json({ count });
    } catch (error) {
      console.error("Error fetching unread count:", error);
      res.status(500).json({ message: "Failed to fetch unread count" });
    }
  });

  // Send a new notification (management only)
  app.post("/api/notifications", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session?.userId;
      const authUser = await authService.getUserById(userId!);
      
      if (!authUser || !["super_admin", "admin", "hr", "finance", "operations", "fleet_manager"].includes(authUser.role || "")) {
        return res.status(403).json({ message: "Only management can send notifications" });
      }
      
      const {
        title,
        titleAr,
        content,
        contentAr,
        type,
        priority,
        targetType,
        targetIds,
        actionUrl,
        actionLabel,
        actionLabelAr,
        scheduledAt,
        expiresAt,
      } = req.body;
      
      if (!title || !content) {
        return res.status(400).json({ message: "Title and content are required" });
      }
      
      // Create the notification
      const notification = await storage.createNotification({
        title,
        titleAr,
        content,
        contentAr,
        type: type || "info",
        priority: priority || "normal",
        targetType: targetType || "all",
        targetIds: targetIds || null,
        senderId: userId!,
        senderName: `${authUser.firstName || ""} ${authUser.lastName || ""}`.trim(),
        actionUrl,
        actionLabel,
        actionLabelAr,
        scheduledAt,
        expiresAt,
        isActive: true,
        createdAt: new Date().toISOString(),
      });
      
      // Determine recipients based on target type
      let recipientUserIds: string[] = [];
      
      if (targetType === "all") {
        // Get all active auth users
        const allUsers = await authService.getAllAuthUsers();
        recipientUserIds = allUsers.filter(u => u.isActive).map(u => u.id);
      } else if (targetType === "employees" && targetIds && targetIds.length > 0) {
        // Get specific employees by their userId
        const allEmployees = await storage.getAllEmployees();
        const targetEmployees = allEmployees.filter(e => targetIds.includes(e.id) && e.userId);
        recipientUserIds = targetEmployees.map(e => e.userId!).filter(Boolean);
      } else if (targetType === "department" && targetIds && targetIds.length > 0) {
        // Get all employees in the specified departments
        const allEmployees = await storage.getAllEmployees();
        const deptEmployees = allEmployees.filter(e => targetIds.includes(e.departmentId || "") && e.userId);
        recipientUserIds = deptEmployees.map(e => e.userId!).filter(Boolean);
      } else if (targetType === "branch" && targetIds && targetIds.length > 0) {
        // Get all employees assigned to the specified branches
        const allEmployeeBranches = await storage.getAllEmployeeBranches();
        const branchEmployeeIds = allEmployeeBranches
          .filter(eb => targetIds.includes(eb.branchId))
          .map(eb => eb.employeeId);
        
        const allEmployees = await storage.getAllEmployees();
        const branchEmployees = allEmployees.filter(e => branchEmployeeIds.includes(e.id) && e.userId);
        recipientUserIds = branchEmployees.map(e => e.userId!).filter(Boolean);
      } else if (targetType === "role" && targetIds && targetIds.length > 0) {
        // Get all auth users with the specified roles
        const allUsers = await authService.getAllAuthUsers();
        recipientUserIds = allUsers.filter(u => u.isActive && targetIds.includes(u.role || "")).map(u => u.id);
      }
      
      // Create recipient records
      for (const recipientId of recipientUserIds) {
        await storage.createNotificationRecipient({
          notificationId: notification.id,
          recipientId,
          isRead: false,
          isDeleted: false,
          createdAt: new Date().toISOString(),
        });
      }
      
      res.status(201).json({ 
        notification, 
        recipientCount: recipientUserIds.length 
      });
    } catch (error) {
      console.error("Error sending notification:", error);
      res.status(500).json({ message: "Failed to send notification" });
    }
  });

  // Mark notification as read
  app.patch("/api/notifications/:id/read", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const updated = await storage.markNotificationAsRead(req.params.id, userId);
      if (!updated) {
        return res.status(404).json({ message: "Notification not found" });
      }
      
      res.json(updated);
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  // Mark all notifications as read
  app.patch("/api/notifications/read-all", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      await storage.markAllNotificationsAsRead(userId);
      res.json({ message: "All notifications marked as read" });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      res.status(500).json({ message: "Failed to mark all notifications as read" });
    }
  });

  // Delete a notification for the user (soft delete)
  app.delete("/api/notifications/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      // Find the recipient record and soft delete
      const userNotifications = await storage.getUserNotifications(userId);
      const notifRecipient = userNotifications.find(n => n.notificationId === req.params.id);
      
      if (!notifRecipient) {
        return res.status(404).json({ message: "Notification not found" });
      }
      
      await storage.deleteNotificationRecipient(notifRecipient.id);
      res.json({ message: "Notification deleted" });
    } catch (error) {
      console.error("Error deleting notification:", error);
      res.status(500).json({ message: "Failed to delete notification" });
    }
  });

  // Get all sent notifications (admin only)
  app.get("/api/notifications/sent", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session?.userId;
      const authUser = await authService.getUserById(userId!);
      
      if (!authUser || !["super_admin", "admin"].includes(authUser.role || "")) {
        return res.status(403).json({ message: "Only admins can view sent notifications" });
      }
      
      const allNotifications = await storage.getNotifications();
      res.json(allNotifications);
    } catch (error) {
      console.error("Error fetching sent notifications:", error);
      res.status(500).json({ message: "Failed to fetch sent notifications" });
    }
  });

  // ==================== Payroll Automation Settings ====================
  
  // Get payroll automation settings (admin only)
  app.get("/api/settings/payroll-automation", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session?.userId;
      const authUser = await authService.getUserById(userId!);
      
      if (!authUser || !["super_admin", "admin"].includes(authUser.role || "")) {
        return res.status(403).json({ message: "Only admins can view payroll automation settings" });
      }
      
      let settings = await storage.getPayrollAutomationSettings();
      if (!settings) {
        // Create default settings if not exist
        settings = await storage.updatePayrollAutomationSettings({
          autoLinkPayrollRequests: true,
        });
      }
      res.json(settings);
    } catch (error) {
      console.error("Error fetching payroll automation settings:", error);
      res.status(500).json({ message: "Failed to fetch payroll automation settings" });
    }
  });

  // Update payroll automation settings (admin only)
  app.put("/api/settings/payroll-automation", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session?.userId;
      const authUser = await authService.getUserById(userId!);
      
      if (!authUser || !["super_admin", "admin"].includes(authUser.role || "")) {
        return res.status(403).json({ message: "Only admins can update payroll automation settings" });
      }
      
      const { autoLinkPayrollRequests } = req.body;
      
      const settings = await storage.updatePayrollAutomationSettings({
        autoLinkPayrollRequests,
        updatedBy: userId,
      });
      
      res.json(settings);
    } catch (error) {
      console.error("Error updating payroll automation settings:", error);
      res.status(500).json({ message: "Failed to update payroll automation settings" });
    }
  });

  return httpServer;
}
