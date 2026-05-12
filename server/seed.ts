import { db } from "./db";
import { users, employees, departments, vehicles, drivers, requests, attendance } from "@shared/schema";

async function seed() {
  console.log("Seeding database...");

  const existingDepts = await db.select().from(departments);
  if (existingDepts.length > 0) {
    console.log("Database already seeded, skipping...");
    return;
  }

  const [hrDept, financeDept, opsDept, itDept, marketingDept] = await db.insert(departments).values([
    { name: "Human Resources", nameAr: "الموارد البشرية" },
    { name: "Finance", nameAr: "الشؤون المالية" },
    { name: "Operations", nameAr: "العمليات" },
    { name: "IT", nameAr: "تقنية المعلومات" },
    { name: "Marketing", nameAr: "التسويق" },
  ]).returning();

  const [adminUser, hrUser, fleetUser] = await db.insert(users).values([
    {
      username: "admin",
      password: "admin123",
      email: "admin@inferixe.com",
      fullName: "System Administrator",
      fullNameAr: "مدير النظام",
      role: "super_admin",
    },
    {
      username: "hr_manager",
      password: "hr123",
      email: "hr@inferixe.com",
      fullName: "Sarah Johnson",
      fullNameAr: "سارة جونسون",
      role: "hr",
    },
    {
      username: "fleet_manager",
      password: "fleet123",
      email: "fleet@inferixe.com",
      fullName: "Ahmed Hassan",
      fullNameAr: "أحمد حسن",
      role: "fleet_manager",
    },
  ]).returning();

  const employeesData = await db.insert(employees).values([
    {
      employeeNumber: "EMP001",
      fullName: "Ahmed Hassan",
      fullNameAr: "أحمد حسن",
      email: "ahmed@inferixe.com",
      phone: "+966 50 123 4567",
      departmentId: opsDept.id,
      position: "Operations Manager",
      positionAr: "مدير العمليات",
      hireDate: "2022-01-15",
      salary: 15000,
      status: "active",
      userId: fleetUser.id,
      bankName: "Al Rajhi Bank",
      bankNameAr: "مصرف الراجحي",
      ibanNumber: "SA0380000000608010167519",
    },
    {
      employeeNumber: "EMP002",
      fullName: "Sarah Johnson",
      fullNameAr: "سارة جونسون",
      email: "sarah@inferixe.com",
      phone: "+966 50 234 5678",
      departmentId: hrDept.id,
      position: "HR Manager",
      positionAr: "مديرة الموارد البشرية",
      hireDate: "2021-06-01",
      salary: 18000,
      status: "active",
      userId: hrUser.id,
      bankName: "Saudi National Bank",
      bankNameAr: "البنك الأهلي السعودي",
      ibanNumber: "SA4420000001234567891234",
    },
    {
      employeeNumber: "EMP003",
      fullName: "Mohammed Ali",
      fullNameAr: "محمد علي",
      email: "mohammed@inferixe.com",
      phone: "+966 50 345 6789",
      departmentId: itDept.id,
      position: "Senior Developer",
      positionAr: "مطور أول",
      hireDate: "2023-03-10",
      salary: 12000,
      status: "active",
      bankName: "Riyad Bank",
      bankNameAr: "بنك الرياض",
      ibanNumber: "SA0660000000012345678901",
    },
    {
      employeeNumber: "EMP004",
      fullName: "Fatima Ahmed",
      fullNameAr: "فاطمة أحمد",
      email: "fatima@inferixe.com",
      phone: "+966 50 456 7890",
      departmentId: marketingDept.id,
      position: "Marketing Specialist",
      positionAr: "أخصائية تسويق",
      hireDate: "2023-08-20",
      salary: 9000,
      status: "active",
      bankName: "Al Rajhi Bank",
      bankNameAr: "مصرف الراجحي",
      ibanNumber: "SA0380000000608010167520",
    },
    {
      employeeNumber: "EMP005",
      fullName: "Omar Khalid",
      fullNameAr: "عمر خالد",
      email: "omar@inferixe.com",
      phone: "+966 50 567 8901",
      departmentId: financeDept.id,
      position: "Accountant",
      positionAr: "محاسب",
      hireDate: "2022-11-05",
      salary: 10000,
      status: "inactive",
      bankName: "Saudi British Bank",
      bankNameAr: "البنك السعودي البريطاني",
      ibanNumber: "SA4560000000123456789012",
    },
    {
      employeeNumber: "EMP006",
      fullName: "Layla Youssef",
      fullNameAr: "ليلى يوسف",
      email: "layla@inferixe.com",
      phone: "+966 50 678 9012",
      departmentId: itDept.id,
      position: "Software Engineer",
      positionAr: "مهندسة برمجيات",
      hireDate: "2023-01-15",
      salary: 11000,
      status: "active",
      bankName: "Bank AlJazira",
      bankNameAr: "بنك الجزيرة",
      ibanNumber: "SA7060000000098765432101",
    },
  ]).returning();

  const vehiclesData = await db.insert(vehicles).values([
    {
      plateNumber: "ABC 1234",
      make: "Toyota",
      model: "Camry",
      year: 2023,
      color: "White",
      type: "sedan",
      status: "available",
      lastMaintenanceDate: "2024-01-15",
      nextMaintenanceDate: "2024-04-15",
      mileage: 25000,
    },
    {
      plateNumber: "XYZ 5678",
      make: "Toyota",
      model: "Land Cruiser",
      year: 2022,
      color: "Black",
      type: "suv",
      status: "in_use",
      lastMaintenanceDate: "2024-01-10",
      nextMaintenanceDate: "2024-04-10",
      mileage: 45000,
    },
    {
      plateNumber: "DEF 9012",
      make: "Ford",
      model: "Transit",
      year: 2021,
      color: "Silver",
      type: "van",
      status: "maintenance",
      lastMaintenanceDate: "2024-01-20",
      nextMaintenanceDate: "2024-01-25",
      mileage: 78000,
    },
    {
      plateNumber: "GHI 3456",
      make: "Isuzu",
      model: "NPR",
      year: 2020,
      color: "White",
      type: "truck",
      status: "in_use",
      lastMaintenanceDate: "2024-01-05",
      nextMaintenanceDate: "2024-04-05",
      mileage: 120000,
    },
  ]).returning();

  await db.insert(drivers).values([
    {
      employeeId: employeesData[0].id,
      licenseNumber: "DL-2024-001",
      licenseExpiry: "2025-06-15",
      licenseType: "Heavy Vehicle",
      status: "active",
      violations: 0,
    },
    {
      employeeId: employeesData[4].id,
      licenseNumber: "DL-2023-045",
      licenseExpiry: "2024-09-20",
      licenseType: "Commercial",
      status: "active",
      violations: 1,
    },
  ]);

  const today = new Date().toISOString().split("T")[0];
  await db.insert(attendance).values([
    { employeeId: employeesData[0].id, date: today, checkIn: "08:00", checkOut: "17:00", status: "present" },
    { employeeId: employeesData[1].id, date: today, checkIn: "08:15", checkOut: "17:30", status: "present" },
    { employeeId: employeesData[2].id, date: today, checkIn: "09:30", status: "late" },
    { employeeId: employeesData[3].id, date: today, status: "leave" },
    { employeeId: employeesData[5].id, date: today, checkIn: "07:55", checkOut: "16:30", status: "present" },
  ]);

  await db.insert(requests).values([
    {
      type: "leave",
      title: "Annual Leave - 5 Days",
      titleAr: "إجازة سنوية - 5 أيام",
      description: "Requesting annual leave for family vacation",
      requesterId: employeesData[0].id,
      status: "pending",
      priority: "medium",
      createdAt: new Date().toISOString(),
      startDate: "2024-02-01",
      endDate: "2024-02-05",
    },
    {
      type: "maintenance",
      title: "Vehicle AC Repair",
      titleAr: "إصلاح مكيف السيارة",
      description: "AC not cooling properly, needs repair",
      requesterId: employeesData[1].id,
      status: "approved",
      priority: "high",
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      approvedBy: adminUser.id,
    },
    {
      type: "certificate",
      title: "Experience Certificate",
      titleAr: "شهادة خبرة",
      description: "Need experience certificate for visa application",
      requesterId: employeesData[2].id,
      status: "in_progress",
      priority: "low",
      createdAt: new Date(Date.now() - 172800000).toISOString(),
    },
    {
      type: "transfer",
      title: "Department Transfer Request",
      titleAr: "طلب نقل قسم",
      description: "Request transfer to IT department",
      requesterId: employeesData[3].id,
      status: "rejected",
      priority: "medium",
      createdAt: new Date(Date.now() - 259200000).toISOString(),
    },
  ]);

  console.log("Database seeded successfully!");
}

seed()
  .catch((error) => {
    console.error("Seeding error:", error);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
