import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export interface EmploymentContractAnalysisResult {
  // Contract Basic Info
  contractNumber: string | null;
  contractType: "definite" | "indefinite" | null;
  signedDate: string | null;
  startDate: string | null;
  endDate: string | null;
  workStartDate: string | null;
  signedLocation: string | null;
  signedLocationAr: string | null;
  
  // Employer Info
  employer: {
    name: string | null;
    nameAr: string | null;
    type: string | null;
    typeAr: string | null;
    nationalId: string | null;
    address: string | null;
    addressAr: string | null;
    phone: string | null;
    email: string | null;
    representativeName: string | null;
    representativeNameAr: string | null;
    representativeId: string | null;
    representativeTitle: string | null;
    representativeTitleAr: string | null;
  };
  
  // Employee Info
  employee: {
    name: string | null;
    nameAr: string | null;
    nationality: string | null;
    nationalityAr: string | null;
    idNumber: string | null;
    gender: string | null;
    maritalStatus: string | null;
    dateOfBirth: string | null;
    address: string | null;
    addressAr: string | null;
    qualification: string | null;
    qualificationAr: string | null;
    specialization: string | null;
    specializationAr: string | null;
    phone: string | null;
    email: string | null;
  };
  
  // Job Details
  job: {
    title: string | null;
    titleAr: string | null;
    profession: string | null;
    professionAr: string | null;
    workLocation: string | null;
    workLocationAr: string | null;
    workScope: string | null;
    workScopeAr: string | null;
    isPartTime: boolean;
  };
  
  // Contract Duration
  duration: {
    days: number | null;
    autoRenewal: boolean;
    probationDays: number | null;
    probationTerms: string | null;
    probationTermsAr: string | null;
  };
  
  // Working Hours & Leave
  workSchedule: {
    daysPerWeek: number | null;
    hoursPerDay: number | null;
    restDay: string | null;
    restDayAr: string | null;
    annualLeaveDays: number | null;
  };
  
  // Salary & Benefits
  compensation: {
    basicSalary: number | null;
    housingAllowance: number | null;
    transportAllowance: number | null;
    otherAllowances: number | null;
    totalMonthlySalary: number | null;
    paymentDueDay: number | null;
    paymentMethod: string | null;
    paymentMethodAr: string | null;
    currency: string;
  };
  
  // Bank Details
  bank: {
    name: string | null;
    nameAr: string | null;
    iban: string | null;
  };
  
  // Obligations
  obligations: {
    employer: string | null;
    employerAr: string | null;
    employee: string | null;
    employeeAr: string | null;
  };
  
  confidence: number;
  rawText: string;
}

const EMPLOYMENT_CONTRACT_PROMPT = `أنت خبير في تحليل عقود العمل السعودية ونظام قوى. قم بتحليل عقد العمل المرفق واستخراج جميع البيانات بدقة.

You are an expert in analyzing Saudi Arabian employment contracts and Qiwa system. Analyze the attached employment contract and extract all data accurately.

Return your analysis as a valid JSON object with the following structure:

{
  "contractNumber": "رقم العقد / contract number",
  "contractType": "definite" | "indefinite",
  "signedDate": "YYYY-MM-DD",
  "startDate": "YYYY-MM-DD",
  "endDate": "YYYY-MM-DD or null for indefinite",
  "workStartDate": "YYYY-MM-DD",
  "signedLocation": "location in English",
  "signedLocationAr": "مكان التوقيع بالعربي",
  
  "employer": {
    "name": "اسم المنشأة بالإنجليزي",
    "nameAr": "اسم المنشأة بالعربي",
    "type": "company type in English",
    "typeAr": "نوع المنشأة بالعربي",
    "nationalId": "الرقم الوطني الموحد",
    "address": "العنوان بالإنجليزي",
    "addressAr": "العنوان بالعربي",
    "phone": "رقم الهاتف",
    "email": "البريد الإلكتروني",
    "representativeName": "اسم الممثل بالإنجليزي",
    "representativeNameAr": "اسم الممثل بالعربي",
    "representativeId": "رقم هوية الممثل",
    "representativeTitle": "صفة الممثل بالإنجليزي",
    "representativeTitleAr": "صفة الممثل بالعربي"
  },
  
  "employee": {
    "name": "اسم الموظف بالإنجليزي",
    "nameAr": "اسم الموظف بالعربي",
    "nationality": "الجنسية بالإنجليزي",
    "nationalityAr": "الجنسية بالعربي",
    "idNumber": "رقم الهوية",
    "gender": "male" | "female",
    "maritalStatus": "single" | "married" | "other",
    "dateOfBirth": "YYYY-MM-DD",
    "address": "العنوان بالإنجليزي",
    "addressAr": "العنوان بالعربي",
    "qualification": "المؤهل بالإنجليزي",
    "qualificationAr": "المؤهل بالعربي",
    "specialization": "التخصص بالإنجليزي",
    "specializationAr": "التخصص بالعربي",
    "phone": "رقم الجوال",
    "email": "البريد الإلكتروني"
  },
  
  "job": {
    "title": "المسمى الوظيفي بالإنجليزي",
    "titleAr": "المسمى الوظيفي بالعربي",
    "profession": "المهنة بالإنجليزي",
    "professionAr": "المهنة بالعربي",
    "workLocation": "مقر العمل بالإنجليزي",
    "workLocationAr": "مقر العمل بالعربي",
    "workScope": "نطاق العمل بالإنجليزي",
    "workScopeAr": "نطاق العمل بالعربي",
    "isPartTime": false
  },
  
  "duration": {
    "days": number,
    "autoRenewal": true | false,
    "probationDays": number,
    "probationTerms": "شروط فترة التجربة بالإنجليزي",
    "probationTermsAr": "شروط فترة التجربة بالعربي"
  },
  
  "workSchedule": {
    "daysPerWeek": number,
    "hoursPerDay": number,
    "restDay": "يوم الراحة بالإنجليزي",
    "restDayAr": "يوم الراحة بالعربي",
    "annualLeaveDays": number
  },
  
  "compensation": {
    "basicSalary": number,
    "housingAllowance": number,
    "transportAllowance": number,
    "otherAllowances": number,
    "totalMonthlySalary": number,
    "paymentDueDay": number (1-30),
    "paymentMethod": "طريقة الدفع بالإنجليزي",
    "paymentMethodAr": "طريقة الدفع بالعربي",
    "currency": "SAR"
  },
  
  "bank": {
    "name": "اسم البنك بالإنجليزي",
    "nameAr": "اسم البنك بالعربي",
    "iban": "رقم الآيبان"
  },
  
  "obligations": {
    "employer": "التزامات صاحب العمل بالإنجليزي",
    "employerAr": "التزامات صاحب العمل بالعربي",
    "employee": "التزامات الموظف بالإنجليزي",
    "employeeAr": "التزامات الموظف بالعربي"
  },
  
  "confidence": 0.0 to 1.0
}

Important Guidelines:
- Extract dates in YYYY-MM-DD format (Gregorian calendar)
- All monetary amounts should be numbers without currency symbols
- Use null for fields not found in the contract
- Handle both Arabic and English text
- Look for common Saudi contract terms:
  - عقد عمل = Employment Contract
  - الطرف الأول = First Party (Employer)
  - الطرف الثاني = Second Party (Employee)
  - الراتب الأساسي = Basic Salary
  - بدل السكن = Housing Allowance
  - بدل النقل = Transport Allowance
  - فترة التجربة = Probation Period
  - مدة العقد = Contract Duration
  - محدد المدة = Definite Term
  - غير محدد المدة = Indefinite Term
- Provide confidence score based on extraction quality`;

export async function analyzeEmploymentContractText(text: string): Promise<EmploymentContractAnalysisResult> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: EMPLOYMENT_CONTRACT_PROMPT },
        { role: "user", content: `قم بتحليل عقد العمل التالي واستخراج البيانات:\n\n${text}` }
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
      max_tokens: 4000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from AI");
    }

    const parsed = JSON.parse(content);
    return {
      ...parsed,
      rawText: text,
    };
  } catch (error) {
    console.error("Employment contract analysis error:", error);
    throw new Error("Failed to analyze employment contract");
  }
}

export async function analyzeEmploymentContractImage(base64Image: string, mimeType: string = "image/png"): Promise<EmploymentContractAnalysisResult> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: EMPLOYMENT_CONTRACT_PROMPT },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "قم بتحليل صورة عقد العمل هذه واستخراج جميع البيانات. اقرأ النص أولاً ثم استخرج البيانات المنظمة.\n\nAnalyze this employment contract image and extract all data. First read and transcribe the text, then extract structured data."
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`,
                detail: "high"
              }
            }
          ]
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
      max_tokens: 4000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from AI");
    }

    const parsed = JSON.parse(content);
    return {
      ...parsed,
      rawText: parsed.rawText || "Extracted from image",
    };
  } catch (error) {
    console.error("Employment contract image analysis error:", error);
    throw new Error("Failed to analyze employment contract image");
  }
}
