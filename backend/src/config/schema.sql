-- ============================================================
-- HYPERNOVA CRM — COMPLETE MySQL SCHEMA
-- Matches exact data shapes from mockData.ts + all UI tabs
-- ============================================================

CREATE DATABASE IF NOT EXISTS hypernova_crm CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE hypernova_crm;

-- ============================================================
-- 1. USERS (staff accounts — role: employee or client)
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id          VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  name        VARCHAR(255) NOT NULL,
  email       VARCHAR(255) NOT NULL UNIQUE,
  password    VARCHAR(255) NOT NULL,
  role        ENUM('employee','client') NOT NULL DEFAULT 'employee',
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================================
-- 2. REFERRERS
-- ============================================================
CREATE TABLE IF NOT EXISTS referrers (
  id          VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  name        VARCHAR(255) NOT NULL,
  type        VARCHAR(100) NOT NULL,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 3. CLIENTS
-- Matches Client interface in mockData.ts exactly
-- ============================================================
CREATE TABLE IF NOT EXISTS clients (
  id              VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  first_name      VARCHAR(100) NOT NULL,
  last_name       VARCHAR(100) NOT NULL,
  initial         VARCHAR(5),
  address         VARCHAR(255),
  city            VARCHAR(100),
  province        VARCHAR(100),
  post_code       VARCHAR(20),
  home_phone      VARCHAR(30),
  cell_phone      VARCHAR(30),
  work_phone      VARCHAR(30),
  email           VARCHAR(255),
  date_of_birth   DATE,
  marital_status  VARCHAR(50),
  dependants      INT DEFAULT 0,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================================
-- 4. CASES — CENTRAL TABLE
-- Matches CaseRecord interface in mockData.ts exactly
-- ============================================================
CREATE TABLE IF NOT EXISTS cases (
  id                  VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  client_id           VARCHAR(36) NOT NULL,
  file_no             VARCHAR(50) NOT NULL UNIQUE,
  file_status         VARCHAR(50) NOT NULL DEFAULT 'Active',
  case_type           VARCHAR(100) NOT NULL,
  date_of_loss        DATE,
  open_date           DATE,
  referred_by         VARCHAR(255),
  referred_by_id      VARCHAR(36),
  clerk_assigned      VARCHAR(255),
  secretary           VARCHAR(255),
  limitation_date     DATE,
  mediation_status    VARCHAR(50) DEFAULT 'N/A',
  arbitration_status  VARCHAR(50) DEFAULT 'N/A',
  mva_client_fault    VARCHAR(10) DEFAULT 'No',
  benefits_claiming   VARCHAR(10) DEFAULT 'No',
  irb_non_earner_due  VARCHAR(10) DEFAULT 'No',
  third_party_lawyer  VARCHAR(255),
  tort_file_no        VARCHAR(100),
  closed_file_no      VARCHAR(100),
  -- Client address/contact on the case level (can differ from client record)
  client_initials     VARCHAR(10),
  client_signature_url VARCHAR(500),
  client_street       VARCHAR(255),
  client_city         VARCHAR(100),
  client_state        VARCHAR(100),
  client_zip          VARCHAR(20),
  client_country      VARCHAR(100) DEFAULT 'Canada',
  client_mobile       VARCHAR(30),
  -- Additional case header fields from NewCaseIntake.tsx
  ab_counsel          VARCHAR(255),
  tort_law_firm       VARCHAR(255),
  tort_counsel        VARCHAR(255),
  interviewed_by      VARCHAR(255),
  interviewed_on      DATE,
  conflict_checked    TINYINT(1) DEFAULT 0,
  conflict_find       TINYINT(1) DEFAULT 0,
  whose_fault         VARCHAR(255),
  file_status_date    DATE,
  created_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE RESTRICT,
  FOREIGN KEY (referred_by_id) REFERENCES referrers(id) ON DELETE SET NULL
);

-- ============================================================
-- 5. CASE INITIAL INTERVIEW
-- Maps to InitialInterviewTab.tsx / NewCaseIntake.tsx
-- Client personal info captured at intake (separate from clients table)
-- ============================================================
CREATE TABLE IF NOT EXISTS case_initial_interview (
  id                        VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  case_id                   VARCHAR(36) NOT NULL UNIQUE,
  -- Client personal info
  salutation                VARCHAR(20),
  gender                    VARCHAR(20),
  date_of_birth             DATE,
  age                       INT,
  first_name                VARCHAR(100),
  last_name                 VARCHAR(100),
  unit_number               VARCHAR(20),
  street_number             VARCHAR(20),
  street_name               VARCHAR(255),
  city                      VARCHAR(100),
  province                  VARCHAR(100),
  postal_code               VARCHAR(20),
  country                   VARCHAR(100) DEFAULT 'Canada',
  home_phone                VARCHAR(30),
  mobile                    VARCHAR(30),
  any_other_phone           VARCHAR(30),
  whatsapp                  VARCHAR(30),
  email                     VARCHAR(255),
  marital_status            VARCHAR(50),
  -- Additional info
  number_of_dependants      INT DEFAULT 0,
  born_in_canada            TINYINT(1),
  if_no_where               VARCHAR(255),
  year_immigrated           VARCHAR(10),
  languages_used            VARCHAR(255),
  speaks_english            TINYINT(1),
  requires_interpreter      TINYINT(1),
  language_needs            VARCHAR(255),
  consent_electronic_comms  TINYINT(1),
  benefit_election          VARCHAR(255),
  created_at                DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at                DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
);

-- ============================================================
-- 6. CASE CLIENT ID DOCUMENTS
-- ID documents section in NewCaseIntake.tsx
-- ============================================================
CREATE TABLE IF NOT EXISTS case_client_id_docs (
  id                  VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  case_id             VARCHAR(36) NOT NULL UNIQUE,
  dl_number           VARCHAR(100),
  dl_copy             TINYINT(1) DEFAULT 0,
  health_card_number  VARCHAR(100),
  health_card_copy    TINYINT(1) DEFAULT 0,
  sin_number          VARCHAR(100),
  sin_copy            TINYINT(1) DEFAULT 0,
  ontario_id_number   VARCHAR(100),
  ontario_id_copy     TINYINT(1) DEFAULT 0,
  pr_card_number      VARCHAR(100),
  pr_card_copy        TINYINT(1) DEFAULT 0,
  citizen_card_number VARCHAR(100),
  citizen_card_copy   TINYINT(1) DEFAULT 0,
  created_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
);

-- ============================================================
-- 7. CASE ACCIDENT DETAILS
-- Maps to AccidentDetailsSection.tsx
-- ============================================================
CREATE TABLE IF NOT EXISTS case_accident_details (
  id                      VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  case_id                 VARCHAR(36) NOT NULL UNIQUE,
  accident_date           DATE,
  accident_time           TIME,
  accident_location       TEXT,
  accident_city           VARCHAR(100),
  accident_province       VARCHAR(100),
  how_accident_happened   TEXT,
  direction_travelling    VARCHAR(255),
  speed                   VARCHAR(50),
  road_conditions         VARCHAR(255),
  weather_conditions      VARCHAR(255),
  traffic_control         VARCHAR(255),
  vehicle_damage          TEXT,
  injuries_described      TEXT,
  -- Police info embedded (also has own tab)
  police_called           TINYINT(1) DEFAULT 0,
  police_report_number    VARCHAR(100),
  charges_laid            TINYINT(1) DEFAULT 0,
  charges_details         TEXT,
  -- Occupants
  client_alone            TINYINT(1) DEFAULT 1,
  occupants_details       TEXT,
  property_damage         TEXT,
  created_at              DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at              DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
);

-- ============================================================
-- 8. CASE NO FAULT (AB Insurance)
-- Maps to NoFaultTab.tsx
-- ============================================================
CREATE TABLE IF NOT EXISTS case_no_fault (
  id                VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  case_id           VARCHAR(36) NOT NULL UNIQUE,
  ab_company        VARCHAR(255),
  ab_adjuster       VARCHAR(255),
  ab_adjuster_phone VARCHAR(30),
  ab_adjuster_ext   VARCHAR(20),
  ab_adjuster_fax   VARCHAR(30),
  ab_adjuster_email VARCHAR(255),
  ab_claim_no       VARCHAR(100),
  ab_policy_no      VARCHAR(100),
  date_reported     DATE,
  created_at        DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
);

-- ============================================================
-- 9. CASE THIRD PARTY (Driver + Vehicle + Witnesses)
-- Maps to ThirdPartyTab.tsx
-- ============================================================
CREATE TABLE IF NOT EXISTS case_third_party (
  id                  VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  case_id             VARCHAR(36) NOT NULL UNIQUE,
  -- Driver info
  driver_name         VARCHAR(255),
  driver_address      VARCHAR(255),
  driver_city         VARCHAR(100),
  driver_province     VARCHAR(100),
  driver_home_phone   VARCHAR(30),
  driver_work_phone   VARCHAR(30),
  driver_employer     VARCHAR(255),
  driver_work_address VARCHAR(255),
  driver_work_city    VARCHAR(100),
  driver_work_province VARCHAR(100),
  driver_license_no   VARCHAR(100),
  driver_dob          DATE,
  -- Vehicle
  auto_make           VARCHAR(100),
  auto_model          VARCHAR(100),
  auto_year           VARCHAR(10),
  plate_number        VARCHAR(30),
  owner_of_vehicle    VARCHAR(255),
  owner_address       VARCHAR(255),
  owner_city          VARCHAR(100),
  owner_postal_code   VARCHAR(20),
  owner_phone         VARCHAR(30),
  -- Witnesses
  witness1_name       VARCHAR(255),
  witness1_phone      VARCHAR(30),
  witness2_name       VARCHAR(255),
  witness2_phone      VARCHAR(30),
  created_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
);

-- ============================================================
-- 10. CASE THIRD PARTY INSURANCE (from ThirdPartyTab.tsx right panel)
-- ============================================================
CREATE TABLE IF NOT EXISTS case_third_party_insurance (
  id                  VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  case_id             VARCHAR(36) NOT NULL UNIQUE,
  insurance_company   VARCHAR(255),
  tp_ins_address      VARCHAR(255),
  tp_ins_city         VARCHAR(100),
  tp_ins_postal_code  VARCHAR(20),
  adjuster_name       VARCHAR(255),
  adjuster_phone      VARCHAR(30),
  adjuster_fax        VARCHAR(30),
  adjuster_ext        VARCHAR(20),
  claim_number        VARCHAR(100),
  policy_number       VARCHAR(100),
  created_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
);

-- ============================================================
-- 11. CASE INSURANCE — FIRST PARTY
-- Maps to InsuranceInformationSection.tsx → First Party tab
-- ============================================================
CREATE TABLE IF NOT EXISTS case_insurance_first_party (
  id                    VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  case_id               VARCHAR(36) NOT NULL UNIQUE,
  insurance_company     VARCHAR(255),
  suite                 VARCHAR(50),
  address               VARCHAR(255),
  city                  VARCHAR(100),
  province              VARCHAR(100),
  postal_code           VARCHAR(20),
  adjuster_name         VARCHAR(255),
  adjuster_email        VARCHAR(255),
  adjuster_phone        VARCHAR(30),
  adjuster_ext          VARCHAR(20),
  adjuster_fax          VARCHAR(30),
  supervisor_name       VARCHAR(255),
  supervisor_phone      VARCHAR(30),
  policy_no             VARCHAR(100),
  claim_no              VARCHAR(100),
  policy_holder_name    VARCHAR(255),
  created_at            DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at            DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
);

-- ============================================================
-- 12. CASE INSURANCE — THIRD PARTY (Insurance tab, not ThirdPartyTab)
-- Maps to InsuranceInformationSection.tsx → Third Party Insurance sub-tab
-- ============================================================
CREATE TABLE IF NOT EXISTS case_insurance_third_party (
  id                            VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  case_id                       VARCHAR(36) NOT NULL UNIQUE,
  -- Relationship checkboxes
  rel_policyholder              TINYINT(1) DEFAULT 0,
  rel_spouse                    TINYINT(1) DEFAULT 0,
  rel_listed_driver             TINYINT(1) DEFAULT 0,
  rel_employee                  TINYINT(1) DEFAULT 0,
  rel_rented_vehicle            TINYINT(1) DEFAULT 0,
  rel_dependent                 TINYINT(1) DEFAULT 0,
  rel_no_relationship           TINYINT(1) DEFAULT 0,
  -- Insurance company
  insurance_company             VARCHAR(255),
  suite                         VARCHAR(50),
  address                       VARCHAR(255),
  city                          VARCHAR(100),
  province                      VARCHAR(100),
  postal_code                   VARCHAR(20),
  adjuster_name                 VARCHAR(255),
  adjuster_email                VARCHAR(255),
  adjuster_phone                VARCHAR(30),
  adjuster_ext                  VARCHAR(20),
  adjuster_fax                  VARCHAR(30),
  supervisor_name               VARCHAR(255),
  supervisor_phone              VARCHAR(30),
  policy_no                     VARCHAR(100),
  claim_no                      VARCHAR(100),
  policy_holder_name            VARCHAR(255),
  -- TP vehicle
  tp_auto_make                  VARCHAR(100),
  tp_auto_model                 VARCHAR(100),
  tp_auto_year                  VARCHAR(10),
  tp_license_plate              VARCHAR(30),
  -- TP driver
  tp_vehicle_insured            TINYINT(1),
  tp_driver_name                VARCHAR(255),
  tp_driver_license_no          VARCHAR(100),
  -- Other insurance
  other_insurance_applicable    TINYINT(1) DEFAULT 0,
  other_insurance_list          TEXT,
  created_at                    DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at                    DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
);

-- ============================================================
-- 13. CASE INSURANCE — EXTENDED HEALTH
-- Maps to InsuranceInformationSection.tsx → Extended Health Coverage tab
-- ============================================================
CREATE TABLE IF NOT EXISTS case_insurance_extended_health (
  id                  VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  case_id             VARCHAR(36) NOT NULL UNIQUE,
  provider_name       VARCHAR(255),
  policy_number       VARCHAR(100),
  group_number        VARCHAR(100),
  coverage_details    TEXT,
  created_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
);

-- ============================================================
-- 14. CASE EMPLOYMENT (status checkboxes + loss of income)
-- Maps to EmploymentTab.tsx / FinancialIncomeSection.tsx
-- ============================================================
CREATE TABLE IF NOT EXISTS case_employment (
  id                        VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  case_id                   VARCHAR(36) NOT NULL UNIQUE,
  -- Employment status checkboxes (all from Financial & Income Information tab)
  status_employed           TINYINT(1) DEFAULT 0,
  status_self_employed      TINYINT(1) DEFAULT 0,
  status_unemployed_26wks   TINYINT(1) DEFAULT 0,
  status_written_contract   TINYINT(1) DEFAULT 0,
  status_ei_benefits        TINYINT(1) DEFAULT 0,
  status_unemployed         TINYINT(1) DEFAULT 0,
  status_retired            TINYINT(1) DEFAULT 0,
  status_student            TINYINT(1) DEFAULT 0,
  status_caregiver          TINYINT(1) DEFAULT 0,
  -- Loss of income claim
  loss_of_income_claim      TINYINT(1) DEFAULT 0,
  created_at                DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at                DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
);

-- ============================================================
-- 15. CASE EMPLOYERS (repeatable — up to 3 per contract)
-- ============================================================
CREATE TABLE IF NOT EXISTS case_employers (
  id                    VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  case_id               VARCHAR(36) NOT NULL,
  employer_order        INT NOT NULL DEFAULT 1,
  employer_name         VARCHAR(255),
  address               VARCHAR(255),
  city                  VARCHAR(100),
  province              VARCHAR(100),
  postal_code           VARCHAR(20),
  phone                 VARCHAR(30),
  fax                   VARCHAR(30),
  occupation            VARCHAR(255),
  industry              VARCHAR(255),
  salary_wages          DECIMAL(12,2),
  hours_per_week        DECIMAL(5,2),
  length_of_employment  VARCHAR(100),
  last_day_worked       DATE,
  irb_entitled_amount   DECIMAL(12,2),
  created_at            DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at            DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
);

-- ============================================================
-- 16. CASE MEDICAL — HOSPITAL
-- Maps to MedicalInformationSection.tsx → Hospital/Emergency sub-tab
-- ============================================================
CREATE TABLE IF NOT EXISTS case_medical_hospital (
  id                      VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  case_id                 VARCHAR(36) NOT NULL UNIQUE,
  went_to_hospital        TINYINT(1) DEFAULT 0,
  ambulance_required      TINYINT(1) DEFAULT 0,
  hospital_name           VARCHAR(255),
  hospital_phone          VARCHAR(30),
  hospital_fax            VARCHAR(30),
  hospital_address        VARCHAR(255),
  hospital_city           VARCHAR(100),
  hospital_province       VARCHAR(100),
  hospital_postal_code    VARCHAR(20),
  admission_date          DATE,
  discharge_date          DATE,
  xray_taken              TINYINT(1) DEFAULT 0,
  xray_finding            TEXT,
  ct_scan_taken           TINYINT(1) DEFAULT 0,
  ct_scan_finding         TEXT,
  mri_taken               TINYINT(1) DEFAULT 0,
  mri_finding             TEXT,
  other_test_taken        TINYINT(1) DEFAULT 0,
  other_test_finding      TEXT,
  follow_up_recommended   TINYINT(1) DEFAULT 0,
  follow_up_details       TEXT,
  outstanding_bills       TINYINT(1) DEFAULT 0,
  outstanding_bills_type  VARCHAR(255),
  created_at              DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at              DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
);

-- ============================================================
-- 17. CASE MEDICAL — DOCTORS (repeatable)
-- ============================================================
CREATE TABLE IF NOT EXISTS case_medical_doctors (
  id                VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  case_id           VARCHAR(36) NOT NULL,
  doctor_order      INT NOT NULL DEFAULT 1,
  doctor_name       VARCHAR(255),
  clinic_name       VARCHAR(255),
  address           VARCHAR(255),
  city              VARCHAR(100),
  province          VARCHAR(100),
  postal_code       VARCHAR(20),
  phone             VARCHAR(30),
  fax               VARCHAR(30),
  first_visit_date  DATE,
  last_visit_date   DATE,
  treatment_details TEXT,
  created_at        DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
);

-- ============================================================
-- 18. CASE MEDICAL — PHYSIOTHERAPY / CHIROPRACTOR
-- ============================================================
CREATE TABLE IF NOT EXISTS case_medical_physio (
  id                VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  case_id           VARCHAR(36) NOT NULL UNIQUE,
  provider_name     VARCHAR(255),
  clinic_name       VARCHAR(255),
  address           VARCHAR(255),
  city              VARCHAR(100),
  province          VARCHAR(100),
  postal_code       VARCHAR(20),
  phone             VARCHAR(30),
  fax               VARCHAR(30),
  first_visit_date  DATE,
  last_visit_date   DATE,
  treatment_details TEXT,
  created_at        DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
);

-- ============================================================
-- 19. CASE MEDICAL — ASSESSMENT CENTRE
-- ============================================================
CREATE TABLE IF NOT EXISTS case_medical_assessment_centre (
  id                  VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  case_id             VARCHAR(36) NOT NULL UNIQUE,
  centre_name         VARCHAR(255),
  address             VARCHAR(255),
  city                VARCHAR(100),
  province            VARCHAR(100),
  postal_code         VARCHAR(20),
  phone               VARCHAR(30),
  fax                 VARCHAR(30),
  assessment_date     DATE,
  assessment_type     VARCHAR(255),
  assessor_name       VARCHAR(255),
  findings            TEXT,
  created_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
);

-- ============================================================
-- 20. CASE MEDICAL — POST ACCIDENT CONDITIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS case_medical_post_conditions (
  id              VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  case_id         VARCHAR(36) NOT NULL UNIQUE,
  conditions      TEXT,
  physical        TEXT,
  neurological    TEXT,
  psychological   TEXT,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
);

-- ============================================================
-- 21. CASE MEDICAL — PRE ACCIDENT CONDITIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS case_medical_pre_conditions (
  id              VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  case_id         VARCHAR(36) NOT NULL UNIQUE,
  conditions      TEXT,
  details         TEXT,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
);

-- ============================================================
-- 22. CASE MEDICAL — MEDICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS case_medical_medications (
  id              VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  case_id         VARCHAR(36) NOT NULL,
  medication_name VARCHAR(255),
  dosage          VARCHAR(100),
  prescribed_by   VARCHAR(255),
  start_date      DATE,
  end_date        DATE,
  notes           TEXT,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
);

-- ============================================================
-- 23. CASE POLICE INFO
-- Maps to PoliceInfoTab.tsx
-- ============================================================
CREATE TABLE IF NOT EXISTS case_police_info (
  id                  VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  case_id             VARCHAR(36) NOT NULL UNIQUE,
  police_department   VARCHAR(255),
  officer_name        VARCHAR(255),
  badge_number        VARCHAR(50),
  incident_number     VARCHAR(100),
  report_date         DATE,
  station_address     VARCHAR(255),
  notes               TEXT,
  created_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
);

-- ============================================================
-- 24. CASE LAWYERS
-- Maps to LawyersTab.tsx
-- ============================================================
CREATE TABLE IF NOT EXISTS case_lawyers (
  id                  VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  case_id             VARCHAR(36) NOT NULL UNIQUE,
  lawyer_name         VARCHAR(255),
  law_firm            VARCHAR(255),
  address             VARCHAR(255),
  city                VARCHAR(100),
  province            VARCHAR(100),
  postal_code         VARCHAR(20),
  phone               VARCHAR(30),
  fax                 VARCHAR(30),
  email               VARCHAR(255),
  lawyer_type         VARCHAR(100),
  notes               TEXT,
  created_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
);

-- ============================================================
-- 25. CASE SETTLEMENT
-- Maps to SettlementTab.tsx — matches settlementData shape in mockData.ts
-- ============================================================
CREATE TABLE IF NOT EXISTS case_settlement (
  id                      VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  case_id                 VARCHAR(36) NOT NULL UNIQUE,
  final_settlement        DECIMAL(14,2) DEFAULT 0,
  our_fee                 DECIMAL(14,2) DEFAULT 0,
  rehab_outstanding       DECIMAL(14,2) DEFAULT 0,
  assessment_outstanding  DECIMAL(14,2) DEFAULT 0,
  outstanding3            DECIMAL(14,2) DEFAULT 0,
  outstanding4            DECIMAL(14,2) DEFAULT 0,
  hst                     DECIMAL(14,2) DEFAULT 0,
  our_fee_hst             DECIMAL(14,2) DEFAULT 0,
  pay_to_client           DECIMAL(14,2) DEFAULT 0,
  our_final_account       DECIMAL(14,2) DEFAULT 0,
  settlement_date         DATE,
  notes                   TEXT,
  created_at              DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at              DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
);

-- ============================================================
-- 26. CASE SPECIALIST / ASSESSMENT
-- Maps to SpecialistTab.tsx
-- ============================================================
CREATE TABLE IF NOT EXISTS case_specialist (
  id                  VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  case_id             VARCHAR(36) NOT NULL,
  specialist_order    INT DEFAULT 1,
  specialist_name     VARCHAR(255),
  company             VARCHAR(255),
  address             VARCHAR(255),
  city                VARCHAR(100),
  phone               VARCHAR(30),
  fax                 VARCHAR(30),
  assessment_date     DATE,
  report_date         DATE,
  specialty_type      VARCHAR(255),
  findings            TEXT,
  created_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
);

-- ============================================================
-- 27. CASE CONTACT ACCESS
-- Maps to ContactAccessTab.tsx — matches ContactAccess shape in mockData.ts
-- ============================================================
CREATE TABLE IF NOT EXISTS case_contact_access (
  id            VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  case_id       VARCHAR(36) NOT NULL,
  name          VARCHAR(255) NOT NULL,
  role          VARCHAR(100),
  access_level  VARCHAR(50) DEFAULT 'Read Only',
  date_added    DATE,
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
);

-- ============================================================
-- 28. DOCUMENTS
-- Matches CaseDocument shape in mockData.ts
-- ============================================================
CREATE TABLE IF NOT EXISTS documents (
  id            VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  case_id       VARCHAR(36),
  name          VARCHAR(500) NOT NULL,
  type          VARCHAR(50),
  category      VARCHAR(255),
  sub_category  VARCHAR(255),
  uploaded_by   VARCHAR(255),
  file_url      VARCHAR(1000),
  file_size     INT,
  date          DATE,
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE SET NULL
);

-- ============================================================
-- 29. ACTIVITIES
-- Matches Activity shape in mockData.ts exactly
-- Also covers notes (type = 'Note') — matches Note shape too
-- ============================================================
CREATE TABLE IF NOT EXISTS activities (
  id              VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  case_id         VARCHAR(36) NOT NULL,
  date            DATE NOT NULL,
  time            VARCHAR(10),
  type            VARCHAR(50) NOT NULL,
  regarding       VARCHAR(500),
  details         TEXT,
  record_manager  VARCHAR(255),
  company_group   VARCHAR(255),
  -- For Notes tab — extra fields
  author          VARCHAR(255),
  text            TEXT,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
);

-- ============================================================
-- 30. CASE HISTORY
-- Matches HistoryEntry shape in mockData.ts exactly
-- ============================================================
CREATE TABLE IF NOT EXISTS case_history (
  id              VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  case_id         VARCHAR(36) NOT NULL,
  date            DATE NOT NULL,
  time            VARCHAR(10),
  user            VARCHAR(255),
  action          VARCHAR(100),
  field_changed   VARCHAR(255),
  old_value       TEXT,
  new_value       TEXT,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
);

-- ============================================================
-- 31. STATUS HISTORY
-- Matches StatusEntry shape in mockData.ts exactly
-- ============================================================
CREATE TABLE IF NOT EXISTS status_history (
  id          VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  case_id     VARCHAR(36) NOT NULL,
  status      VARCHAR(50) NOT NULL,
  date        DATE NOT NULL,
  changed_by  VARCHAR(255),
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
);

-- ============================================================
-- 32. OCF FORM DATA
-- Stores full form field values as JSON per case per OCF form number
-- ============================================================
CREATE TABLE IF NOT EXISTS ocf_form_data (
  id          VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  case_id     VARCHAR(36) NOT NULL,
  form_number VARCHAR(20) NOT NULL,
  form_data   JSON NOT NULL,
  updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_case_form (case_id, form_number),
  FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
);

-- ============================================================
-- SEED: Default users
-- ============================================================
INSERT IGNORE INTO users (id, name, email, password, role) VALUES
('u1', 'Amanda Singh', 'amanda@hypernova.com', '$2a$10$placeholder_hash', 'employee'),
('u2', 'John Baker', 'john@hypernova.com', '$2a$10$placeholder_hash', 'employee'),
('u3', 'Lisa Park', 'lisa@hypernova.com', '$2a$10$placeholder_hash', 'employee'),
('u4', 'Admin User', 'admin@hypernova.com', '$2a$10$placeholder_hash', 'employee');

-- SEED: Referrers (from mockData.ts referrers array)
INSERT IGNORE INTO referrers (id, name, type) VALUES
('r1', 'Dr. Williams', 'Physician'),
('r2', 'Ahmed & Partners', 'Law Firm'),
('r3', 'Walk-in', 'Direct'),
('r4', 'Google Search', 'Online'),
('r5', 'Client Referral', 'Referral'),
('r6', 'Dr. Sarah Ahmed', 'Physician'),
('r7', 'Insurance Broker Network', 'Broker'),
('r8', 'Community Legal Clinic', 'Legal Aid'),
('r9', 'Physiotherapy Plus', 'Clinic'),
('r10', 'Hospital ER Referral', 'Hospital');
