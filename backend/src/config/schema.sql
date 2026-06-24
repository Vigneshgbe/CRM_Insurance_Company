-- ============================================================
-- HYPERNOVA CRM — COMPLETE MySQL SCHEMA
-- DB: padak_insurance_crm
-- All tables matching frontend data shapes exactly
-- ============================================================

CREATE DATABASE IF NOT EXISTS padak_insurance_crm
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE padak_insurance_crm;

-- ============================================================
-- 1. USERS
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id           VARCHAR(36)  PRIMARY KEY,
  name         VARCHAR(255) NOT NULL,
  email        VARCHAR(255) NOT NULL UNIQUE,
  password     VARCHAR(255) NOT NULL,
  role         ENUM('employee','client') NOT NULL DEFAULT 'employee',
  display_role VARCHAR(50) DEFAULT 'Staff',
  is_active    TINYINT(1)   NOT NULL DEFAULT 1,
  created_at   DATETIME     DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================================
-- 2. REFERRERS
-- ============================================================
CREATE TABLE IF NOT EXISTS referrers (
  id         VARCHAR(36)  PRIMARY KEY,
  name       VARCHAR(255) NOT NULL,
  type       VARCHAR(100) NOT NULL,
  created_at DATETIME     DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 3. CLIENTS
-- Matches Client interface in mockData.ts exactly
-- ============================================================
CREATE TABLE IF NOT EXISTS clients (
  id             VARCHAR(36)  PRIMARY KEY,
  first_name     VARCHAR(100) NOT NULL,
  last_name      VARCHAR(100) NOT NULL,
  initial        VARCHAR(5),
  address        VARCHAR(255),
  city           VARCHAR(100),
  province       VARCHAR(100),
  post_code      VARCHAR(20),
  home_phone     VARCHAR(30),
  cell_phone     VARCHAR(30),
  work_phone     VARCHAR(30),
  email          VARCHAR(255),
  date_of_birth  DATE,
  marital_status VARCHAR(50),
  dependants     INT          DEFAULT 0,
  gender         VARCHAR(20),
  created_at     DATETIME     DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================================
-- 4. CASES — CENTRAL TABLE
-- Matches CaseRecord interface in mockData.ts exactly
-- ============================================================
CREATE TABLE IF NOT EXISTS cases (
  id                  VARCHAR(36)  PRIMARY KEY,
  client_id           VARCHAR(36)  NOT NULL,
  file_no             VARCHAR(50)  NOT NULL UNIQUE,
  file_status         VARCHAR(50)  NOT NULL DEFAULT 'Active',
  case_type           VARCHAR(100) NOT NULL,
  date_of_loss        DATE,
  open_date           DATE,
  referred_by         VARCHAR(255),
  referred_by_id      VARCHAR(36),
  clerk_assigned      VARCHAR(255),
  secretary           VARCHAR(255),
  limitation_date     DATE,
  mediation_status    VARCHAR(50)  DEFAULT 'N/A',
  arbitration_status  VARCHAR(50)  DEFAULT 'N/A',
  mva_client_fault    VARCHAR(10)  DEFAULT 'No',
  benefits_claiming   VARCHAR(10)  DEFAULT 'No',
  irb_non_earner_due  VARCHAR(10)  DEFAULT 'No',
  third_party_lawyer  VARCHAR(255),
  tort_file_no        VARCHAR(100),
  closed_file_no      VARCHAR(100),
  -- Client address on case level (can differ from client record)
  client_initials         VARCHAR(10),
  client_signature_url    VARCHAR(1000),
  client_street           VARCHAR(255),
  client_city             VARCHAR(100),
  client_state            VARCHAR(100),
  client_zip              VARCHAR(20),
  client_country          VARCHAR(100) DEFAULT 'Canada',
  client_mobile           VARCHAR(30),
  -- Additional case header fields
  ab_counsel          VARCHAR(255),
  tort_law_firm       VARCHAR(255),
  tort_counsel        VARCHAR(255),
  interviewed_by      VARCHAR(255),
  interviewed_on      DATE,
  conflict_checked    TINYINT(1)   DEFAULT 0,
  conflict_find       TINYINT(1)   DEFAULT 0,
  whose_fault         VARCHAR(255),
  file_status_date    DATE,
  created_at          DATETIME     DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id)      REFERENCES clients(id)   ON DELETE RESTRICT,
  FOREIGN KEY (referred_by_id) REFERENCES referrers(id) ON DELETE SET NULL
);

-- ============================================================
-- 5. CASE INITIAL INTERVIEW
-- Maps to InitialInterviewTab.tsx
-- ============================================================
CREATE TABLE IF NOT EXISTS case_initial_interview (
  id                       VARCHAR(36) PRIMARY KEY,
  case_id                  VARCHAR(36) NOT NULL UNIQUE,
  conflict_checked         VARCHAR(10),
  any_conflict             VARCHAR(10),
  file_no                  VARCHAR(50),
  date_of_mva              DATE,
  interviewed_by           VARCHAR(255),
  interviewed_on           DATE,
  referred_by              VARCHAR(255),
  speaks_english           VARCHAR(10),
  interpreter_required     VARCHAR(10),
  language                 VARCHAR(100),
  born_in_canada           VARCHAR(10),
  where_born               VARCHAR(255),
  year_immigrated          VARCHAR(10),
  client_role              VARCHAR(100),
  seat_belted              VARCHAR(10),
  accident_at_work         VARCHAR(10),
  wsib_filed               VARCHAR(10),
  street_name              VARCHAR(255),
  major_intersection       VARCHAR(255),
  city                     VARCHAR(100),
  province                 VARCHAR(100),
  time_of_mva              VARCHAR(10),
  police_reported          VARCHAR(10),
  date_reported            DATE,
  police_came_to_scene     VARCHAR(10),
  police_department        VARCHAR(255),
  incident_no              VARCHAR(100),
  officer_name             VARCHAR(255),
  badge_no                 VARCHAR(50),
  client_charged           VARCHAR(10),
  client_charged_desc      TEXT,
  third_party_charged      VARCHAR(10),
  third_party_charged_desc TEXT,
  num_occupants            INT,
  seating_arrangement      VARCHAR(255),
  photos_of_damage         VARCHAR(10),
  estimated_damage         DECIMAL(12,2),
  accident_description     TEXT,
  created_at               DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at               DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
);

-- ============================================================
-- 6. CASE CLIENT ID DOCS
-- ID documents + OHIP from ClientInfoTab.tsx
-- ============================================================
CREATE TABLE IF NOT EXISTS case_client_id_docs (
  id                   VARCHAR(36) PRIMARY KEY,
  case_id              VARCHAR(36) NOT NULL UNIQUE,
  dl_number            VARCHAR(100),
  dl_copy              TINYINT(1)  DEFAULT 0,
  health_card_number   VARCHAR(100),
  health_card_copy     TINYINT(1)  DEFAULT 0,
  ohip_number          VARCHAR(100),
  sin_number           VARCHAR(100),
  sin_copy             TINYINT(1)  DEFAULT 0,
  ontario_id_number    VARCHAR(100),
  ontario_id_copy      TINYINT(1)  DEFAULT 0,
  pr_card_number       VARCHAR(100),
  pr_card_copy         TINYINT(1)  DEFAULT 0,
  citizen_card_number  VARCHAR(100),
  citizen_card_copy    TINYINT(1)  DEFAULT 0,
  citizen_id           VARCHAR(100),
  passport_no          VARCHAR(100),
  -- Children (up to 6)
  child1_name VARCHAR(255), child1_dob DATE,
  child2_name VARCHAR(255), child2_dob DATE,
  child3_name VARCHAR(255), child3_dob DATE,
  child4_name VARCHAR(255), child4_dob DATE,
  child5_name VARCHAR(255), child5_dob DATE,
  child6_name VARCHAR(255), child6_dob DATE,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
);

-- ============================================================
-- 7. CASE RELATED CONTACTS
-- ClientInfoTab.tsx — hk/carg/atc contacts
-- ============================================================
CREATE TABLE IF NOT EXISTS case_related_contacts (
  id            VARCHAR(36) PRIMARY KEY,
  case_id       VARCHAR(36) NOT NULL,
  contact_type  VARCHAR(10) NOT NULL,
  name          VARCHAR(255),
  address       VARCHAR(255),
  city          VARCHAR(100),
  post_code     VARCHAR(20),
  phone         VARCHAR(30),
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
);

-- ============================================================
-- 8. CASE ACCIDENT DETAILS
-- Maps to AccidentDetailsSection.tsx
-- ============================================================
CREATE TABLE IF NOT EXISTS case_accident_details (
  id                    VARCHAR(36) PRIMARY KEY,
  case_id               VARCHAR(36) NOT NULL UNIQUE,
  accident_date         DATE,
  accident_time         VARCHAR(10),
  accident_location     TEXT,
  accident_city         VARCHAR(100),
  accident_province     VARCHAR(100),
  how_accident_happened TEXT,
  direction_travelling  VARCHAR(255),
  speed                 VARCHAR(50),
  road_conditions       VARCHAR(255),
  weather_conditions    VARCHAR(255),
  traffic_control       VARCHAR(255),
  vehicle_damage        TEXT,
  injuries_described    TEXT,
  police_called         TINYINT(1)  DEFAULT 0,
  police_report_number  VARCHAR(100),
  charges_laid          TINYINT(1)  DEFAULT 0,
  charges_details       TEXT,
  client_alone          TINYINT(1)  DEFAULT 1,
  occupants_details     TEXT,
  property_damage       TEXT,
  created_at            DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at            DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
);

-- ============================================================
-- 9. CASE NO FAULT (AB Insurance + Independent Company)
-- Maps to NoFaultTab.tsx — both panels
-- ============================================================
CREATE TABLE IF NOT EXISTS case_no_fault (
  id               VARCHAR(36) PRIMARY KEY,
  case_id          VARCHAR(36) NOT NULL UNIQUE,
  -- MVA Company (First Party)
  mva_company      VARCHAR(255),
  adjuster_name    VARCHAR(255),
  adjuster_email   VARCHAR(255),
  mva_address      VARCHAR(255),
  mva_city         VARCHAR(100),
  mva_province     VARCHAR(100),
  mva_postal       VARCHAR(20),
  mva_phone        VARCHAR(30),
  mva_fax          VARCHAR(30),
  mva_supervisor   VARCHAR(255),
  claim_no         VARCHAR(100),
  policy_no        VARCHAR(100),
  named_insured    VARCHAR(255),
  auto_make        VARCHAR(100),
  auto_model       VARCHAR(100),
  auto_year        VARCHAR(10),
  plate_number     VARCHAR(30),
  -- Independent Company (Second Party)
  ind_company      VARCHAR(255),
  ind_adjuster     VARCHAR(255),
  ind_address      VARCHAR(255),
  ind_city         VARCHAR(100),
  ind_postal       VARCHAR(20),
  ind_phone        VARCHAR(30),
  ind_fax          VARCHAR(30),
  ind_claim_no     VARCHAR(100),
  ind_supervisor   VARCHAR(255),
  created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
);

-- ============================================================
-- 10. CASE THIRD PARTY (Driver + Vehicle + Witnesses)
-- Maps to ThirdPartyTab.tsx left panel
-- ============================================================
CREATE TABLE IF NOT EXISTS case_third_party (
  id                   VARCHAR(36) PRIMARY KEY,
  case_id              VARCHAR(36) NOT NULL UNIQUE,
  driver_name          VARCHAR(255),
  driver_address       VARCHAR(255),
  driver_city          VARCHAR(100),
  driver_prov_pc       VARCHAR(100),
  home_phone           VARCHAR(30),
  work_phone           VARCHAR(30),
  employer_name        VARCHAR(255),
  work_address         VARCHAR(255),
  work_city            VARCHAR(100),
  work_prov_pc         VARCHAR(100),
  driver_license       VARCHAR(100),
  driver_dob           DATE,
  auto_make            VARCHAR(100),
  auto_model           VARCHAR(100),
  auto_year            VARCHAR(10),
  plate_number         VARCHAR(30),
  vehicle_owner        VARCHAR(255),
  owner_address        VARCHAR(255),
  owner_city           VARCHAR(100),
  owner_postal         VARCHAR(20),
  owner_phone          VARCHAR(30),
  witness1_name        VARCHAR(255),
  witness1_phone       VARCHAR(30),
  witness2_name        VARCHAR(255),
  witness2_phone       VARCHAR(30),
  created_at           DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at           DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
);

-- ============================================================
-- 11. CASE THIRD PARTY INSURANCE
-- Maps to ThirdPartyTab.tsx right panel
-- ============================================================
CREATE TABLE IF NOT EXISTS case_third_party_insurance (
  id                  VARCHAR(36) PRIMARY KEY,
  case_id             VARCHAR(36) NOT NULL UNIQUE,
  insurance_company   VARCHAR(255),
  ins_address         VARCHAR(255),
  ins_city            VARCHAR(100),
  ins_postal          VARCHAR(20),
  adjuster_name       VARCHAR(255),
  ins_phone           VARCHAR(30),
  ins_fax             VARCHAR(30),
  ins_ext             VARCHAR(20),
  claim_number        VARCHAR(100),
  policy_number       VARCHAR(100),
  created_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
);

-- ============================================================
-- 12. CASE INSURANCE FIRST PARTY
-- Maps to InsuranceInformationSection.tsx First Party sub-tab
-- ============================================================
CREATE TABLE IF NOT EXISTS case_insurance_first_party (
  id                 VARCHAR(36) PRIMARY KEY,
  case_id            VARCHAR(36) NOT NULL UNIQUE,
  insurance_company  VARCHAR(255),
  suite              VARCHAR(50),
  address            VARCHAR(255),
  city               VARCHAR(100),
  province           VARCHAR(100),
  postal_code        VARCHAR(20),
  adjuster_name      VARCHAR(255),
  adjuster_email     VARCHAR(255),
  adjuster_phone     VARCHAR(30),
  adjuster_ext       VARCHAR(20),
  adjuster_fax       VARCHAR(30),
  supervisor_name    VARCHAR(255),
  supervisor_phone   VARCHAR(30),
  policy_no          VARCHAR(100),
  claim_no           VARCHAR(100),
  policy_holder_name VARCHAR(255),
  created_at         DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at         DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
);

-- ============================================================
-- 13. CASE INSURANCE THIRD PARTY (Insurance tab, not ThirdPartyTab)
-- Maps to InsuranceInformationSection.tsx Third Party sub-tab
-- ============================================================
CREATE TABLE IF NOT EXISTS case_insurance_third_party (
  id                           VARCHAR(36) PRIMARY KEY,
  case_id                      VARCHAR(36) NOT NULL UNIQUE,
  rel_policyholder             TINYINT(1)  DEFAULT 0,
  rel_spouse                   TINYINT(1)  DEFAULT 0,
  rel_listed_driver            TINYINT(1)  DEFAULT 0,
  rel_employee                 TINYINT(1)  DEFAULT 0,
  rel_rented_vehicle           TINYINT(1)  DEFAULT 0,
  rel_dependent                TINYINT(1)  DEFAULT 0,
  rel_no_relationship          TINYINT(1)  DEFAULT 0,
  insurance_company            VARCHAR(255),
  suite                        VARCHAR(50),
  address                      VARCHAR(255),
  city                         VARCHAR(100),
  province                     VARCHAR(100),
  postal_code                  VARCHAR(20),
  adjuster_name                VARCHAR(255),
  adjuster_email               VARCHAR(255),
  adjuster_phone               VARCHAR(30),
  adjuster_ext                 VARCHAR(20),
  adjuster_fax                 VARCHAR(30),
  supervisor_name              VARCHAR(255),
  supervisor_phone             VARCHAR(30),
  policy_no                    VARCHAR(100),
  claim_no                     VARCHAR(100),
  policy_holder_name           VARCHAR(255),
  tp_auto_make                 VARCHAR(100),
  tp_auto_model                VARCHAR(100),
  tp_auto_year                 VARCHAR(10),
  tp_license_plate             VARCHAR(30),
  tp_vehicle_insured           TINYINT(1),
  tp_driver_name               VARCHAR(255),
  tp_driver_license_no         VARCHAR(100),
  other_insurance_applicable   TINYINT(1)  DEFAULT 0,
  other_insurance_list         TEXT,
  created_at                   DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at                   DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
);

-- ============================================================
-- 14. CASE INSURANCE EXTENDED HEALTH
-- Maps to InsuranceInformationSection.tsx Extended Health tab
-- ============================================================
CREATE TABLE IF NOT EXISTS case_insurance_extended_health (
  id               VARCHAR(36) PRIMARY KEY,
  case_id          VARCHAR(36) NOT NULL UNIQUE,
  provider_name    VARCHAR(255),
  policy_number    VARCHAR(100),
  group_number     VARCHAR(100),
  coverage_details TEXT,
  created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
);

-- ============================================================
-- 15. CASE EMPLOYMENT (status checkboxes)
-- Maps to EmploymentTab.tsx top section
-- ============================================================
CREATE TABLE IF NOT EXISTS case_employment (
  id                       VARCHAR(36) PRIMARY KEY,
  case_id                  VARCHAR(36) NOT NULL UNIQUE,
  status_employed          TINYINT(1)  DEFAULT 0,
  status_self_employed     TINYINT(1)  DEFAULT 0,
  status_unemployed_26wks  TINYINT(1)  DEFAULT 0,
  status_written_contract  TINYINT(1)  DEFAULT 0,
  status_ei_benefits       TINYINT(1)  DEFAULT 0,
  status_unemployed        TINYINT(1)  DEFAULT 0,
  status_retired           TINYINT(1)  DEFAULT 0,
  status_student           TINYINT(1)  DEFAULT 0,
  status_caregiver         TINYINT(1)  DEFAULT 0,
  loss_of_income_claim     TINYINT(1)  DEFAULT 0,
  created_at               DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at               DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
);

-- ============================================================
-- 16. CASE EMPLOYERS (repeatable — FT=1, PT=2, up to 3)
-- Maps to EmploymentTab.tsx employer sections
-- ============================================================
CREATE TABLE IF NOT EXISTS case_employers (
  id                   VARCHAR(36)   PRIMARY KEY,
  case_id              VARCHAR(36)   NOT NULL,
  employer_order       INT           NOT NULL DEFAULT 1,
  employer_name        VARCHAR(255),
  address              VARCHAR(255),
  city                 VARCHAR(100),
  province             VARCHAR(100),
  postal_code          VARCHAR(20),
  contact              VARCHAR(255),
  phone                VARCHAR(30),
  fax                  VARCHAR(30),
  phone_other          VARCHAR(30),
  job_desc             VARCHAR(255),
  job_title            VARCHAR(255),
  salary_wages         DECIMAL(12,2),
  hours_per_week       DECIMAL(5,2),
  ext_health           VARCHAR(10),
  health_ins_name      VARCHAR(255),
  health_policy_no     VARCHAR(100),
  std_benefits         VARCHAR(10),
  ltd_benefits         VARCHAR(10),
  length_of_employment VARCHAR(100),
  last_day_worked      DATE,
  irb_entitled_amount  DECIMAL(12,2),
  created_at           DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at           DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE,
  UNIQUE KEY unique_case_employer (case_id, employer_order)
);

-- ============================================================
-- 17. CASE MEDICAL HOSPITAL
-- Maps to MedicalTab.tsx Hospital section
-- ============================================================
CREATE TABLE IF NOT EXISTS case_medical_hospital (
  id                       VARCHAR(36) PRIMARY KEY,
  case_id                  VARCHAR(36) NOT NULL UNIQUE,
  went_to_hospital         VARCHAR(10),
  ambulance_required       VARCHAR(10),
  hospital_name            VARCHAR(255),
  hospital_phone           VARCHAR(30),
  hospital_fax             VARCHAR(30),
  hospital_address         VARCHAR(255),
  hospital_city            VARCHAR(100),
  hospital_province        VARCHAR(100),
  hospital_postal_code     VARCHAR(20),
  date_attended            DATE,
  date_released            DATE,
  xray_taken               VARCHAR(10),
  xray_finding             TEXT,
  ct_scan_taken            VARCHAR(10),
  ct_scan_finding          TEXT,
  mri_taken                VARCHAR(10),
  mri_finding              TEXT,
  other_test_taken         VARCHAR(10),
  other_test_finding       TEXT,
  follow_up_recommended    VARCHAR(10),
  follow_up_details        TEXT,
  outstanding_bills        VARCHAR(10),
  outstanding_bills_type   VARCHAR(255),
  -- Family Doctor
  doctor_name              VARCHAR(255),
  doctor_address           VARCHAR(255),
  doctor_city              VARCHAR(100),
  doctor_prov_pc           VARCHAR(100),
  doctor_phone             VARCHAR(30),
  doctor_fax               VARCHAR(30),
  doctor_outstanding       DECIMAL(12,2),
  -- Treating Clinic
  clinic_name              VARCHAR(255),
  clinic_address           VARCHAR(255),
  clinic_city              VARCHAR(100),
  clinic_prov_pc           VARCHAR(100),
  clinic_phone             VARCHAR(30),
  clinic_fax               VARCHAR(30),
  clinic_outstanding       DECIMAL(12,2),
  created_at               DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at               DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
);

-- ============================================================
-- 18. CASE MEDICAL TREATMENT PROVIDERS (up to 4)
-- ============================================================
CREATE TABLE IF NOT EXISTS case_medical_providers (
  id             VARCHAR(36) PRIMARY KEY,
  case_id        VARCHAR(36) NOT NULL,
  provider_order INT         NOT NULL DEFAULT 1,
  centre         VARCHAR(255),
  address        VARCHAR(255),
  phone          VARCHAR(30),
  fax            VARCHAR(30),
  provider_type  VARCHAR(50),
  created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE,
  UNIQUE KEY unique_case_provider (case_id, provider_order)
);

-- ============================================================
-- 19. CASE MEDICAL POST CONDITIONS
-- Checkbox arrays stored as JSON
-- ============================================================
CREATE TABLE IF NOT EXISTS case_medical_post_conditions (
  id              VARCHAR(36) PRIMARY KEY,
  case_id         VARCHAR(36) NOT NULL UNIQUE,
  physical        JSON,
  neurological    JSON,
  psychological   JSON,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
);

-- ============================================================
-- 20. CASE MEDICAL PRE CONDITIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS case_medical_pre_conditions (
  id              VARCHAR(36) PRIMARY KEY,
  case_id         VARCHAR(36) NOT NULL UNIQUE,
  pre_condition   VARCHAR(255),
  pre_time_frame  VARCHAR(100),
  pre_operative   VARCHAR(255),
  pre_status      VARCHAR(255),
  post_status     VARCHAR(255),
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
);

-- ============================================================
-- 21. CASE MEDICAL MEDICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS case_medical_medications (
  id          VARCHAR(36) PRIMARY KEY,
  case_id     VARCHAR(36) NOT NULL UNIQUE,
  med1        VARCHAR(255),
  med2        VARCHAR(255),
  med3        VARCHAR(255),
  med4        VARCHAR(255),
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
);

-- ============================================================
-- 22. CASE POLICE INFO
-- Maps to PoliceInfoTab.tsx
-- ============================================================
CREATE TABLE IF NOT EXISTS case_police_info (
  id                     VARCHAR(36) PRIMARY KEY,
  case_id                VARCHAR(36) NOT NULL UNIQUE,
  reported_date          VARCHAR(10),
  report_ordered         VARCHAR(10),
  report_ordered_date    DATE,
  police_centre          VARCHAR(255),
  police_officer         VARCHAR(255),
  badge_number           VARCHAR(50),
  incident_no            VARCHAR(100),
  division               VARCHAR(100),
  address                VARCHAR(255),
  city                   VARCHAR(100),
  province_pc            VARCHAR(100),
  request_date           DATE,
  received_date          DATE,
  phone                  VARCHAR(30),
  intersection           VARCHAR(255),
  time_of_accident       VARCHAR(10),
  accident_description   TEXT,
  created_at             DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at             DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
);

-- ============================================================
-- 23. CASE LAWYERS (3 rows per case: our/previous/transferred)
-- Maps to LawyersTab.tsx
-- ============================================================
CREATE TABLE IF NOT EXISTS case_lawyers (
  id           VARCHAR(36) PRIMARY KEY,
  case_id      VARCHAR(36) NOT NULL,
  lawyer_type  VARCHAR(20) NOT NULL,
  firm_name    VARCHAR(255),
  address      VARCHAR(255),
  city         VARCHAR(100),
  postal_code  VARCHAR(20),
  lawyer_name  VARCHAR(255),
  phone        VARCHAR(30),
  fax          VARCHAR(30),
  ext          VARCHAR(20),
  created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE,
  UNIQUE KEY unique_case_lawyer_type (case_id, lawyer_type)
);

-- ============================================================
-- 24. CASE SETTLEMENT
-- Matches settlementData shape in mockData.ts exactly
-- ============================================================
CREATE TABLE IF NOT EXISTS case_settlement (
  id                     VARCHAR(36)   PRIMARY KEY,
  case_id                VARCHAR(36)   NOT NULL UNIQUE,
  final_settlement       DECIMAL(14,2) DEFAULT 0,
  our_fee                DECIMAL(14,2) DEFAULT 0,
  rehab_outstanding      DECIMAL(14,2) DEFAULT 0,
  assessment_outstanding DECIMAL(14,2) DEFAULT 0,
  outstanding3           DECIMAL(14,2) DEFAULT 0,
  outstanding4           DECIMAL(14,2) DEFAULT 0,
  hst                    DECIMAL(14,2) DEFAULT 0,
  our_fee_hst            DECIMAL(14,2) DEFAULT 0,
  pay_to_client          DECIMAL(14,2) DEFAULT 0,
  our_final_account      DECIMAL(14,2) DEFAULT 0,
  settlement_date        DATE,
  notes                  TEXT,
  created_at             DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at             DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
);

-- ============================================================
-- 25. CASE SPECIALIST
-- Maps to SpecialistTab.tsx
-- ============================================================
CREATE TABLE IF NOT EXISTS case_specialist (
  id           VARCHAR(36) PRIMARY KEY,
  case_id      VARCHAR(36) NOT NULL UNIQUE,
  company      VARCHAR(255),
  address      VARCHAR(255),
  city         VARCHAR(100),
  province     VARCHAR(100),
  post_code    VARCHAR(20),
  phone        VARCHAR(30),
  fax          VARCHAR(30),
  created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
);

-- ============================================================
-- 26. CASE CONTACT ACCESS
-- Matches ContactAccess interface in mockData.ts
-- ============================================================
CREATE TABLE IF NOT EXISTS case_contact_access (
  id           VARCHAR(36) PRIMARY KEY,
  case_id      VARCHAR(36) NOT NULL,
  name         VARCHAR(255) NOT NULL,
  role         VARCHAR(100),
  access_level VARCHAR(50) DEFAULT 'Read Only',
  date_added   DATE,
  created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
);

-- ============================================================
-- 27. DOCUMENTS
-- Matches CaseDocument interface in mockData.ts
-- ============================================================
CREATE TABLE IF NOT EXISTS documents (
  id           VARCHAR(36)  PRIMARY KEY,
  case_id      VARCHAR(36),
  name         VARCHAR(500) NOT NULL,
  type         VARCHAR(50),
  category     VARCHAR(255),
  sub_category VARCHAR(255),
  uploaded_by  VARCHAR(255),
  file_url     VARCHAR(1000),
  file_size    INT,
  date         DATE,
  created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE SET NULL
);

-- ============================================================
-- 28. ACTIVITIES (Notes + Activities combined)
-- Matches Note + Activity interfaces in mockData.ts
-- ============================================================
CREATE TABLE IF NOT EXISTS activities (
  id             VARCHAR(36)  PRIMARY KEY,
  case_id        VARCHAR(36)  NOT NULL,
  date           DATE         NOT NULL,
  time           VARCHAR(10),
  type           VARCHAR(50)  NOT NULL,
  regarding      VARCHAR(500),
  details        TEXT,
  record_manager VARCHAR(255),
  company_group  VARCHAR(255),
  author         VARCHAR(255),
  text           TEXT,
  created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
);

-- ============================================================
-- 29. CASE HISTORY
-- Matches HistoryEntry interface in mockData.ts
-- ============================================================
CREATE TABLE IF NOT EXISTS case_history (
  id            VARCHAR(36) PRIMARY KEY,
  case_id       VARCHAR(36) NOT NULL,
  date          DATE        NOT NULL,
  time          VARCHAR(10),
  user          VARCHAR(255),
  action        VARCHAR(100),
  field_changed VARCHAR(255),
  old_value     TEXT,
  new_value     TEXT,
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
);

-- ============================================================
-- 30. STATUS HISTORY
-- Matches StatusEntry interface in mockData.ts
-- ============================================================
CREATE TABLE IF NOT EXISTS status_history (
  id          VARCHAR(36) PRIMARY KEY,
  case_id     VARCHAR(36) NOT NULL,
  status      VARCHAR(50) NOT NULL,
  date        DATE        NOT NULL,
  changed_by  VARCHAR(255),
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
);

-- ============================================================
-- 31. OCF FORM DATA
-- JSON storage per case per OCF form number
-- ============================================================
CREATE TABLE IF NOT EXISTS ocf_form_data (
  id          VARCHAR(36) PRIMARY KEY,
  case_id     VARCHAR(36) NOT NULL,
  form_number VARCHAR(20) NOT NULL,
  form_data   JSON        NOT NULL,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_case_form (case_id, form_number),
  FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
);

-- ============================================================
-- SEED DATA
-- ============================================================
INSERT IGNORE INTO users (id, name, email, password, role, display_role) VALUES
('u1', 'Amanda Singh', 'admin@hypernova.com',     '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'employee', 'Admin'),
('u2', 'John Baker',   'john@hypernova.com',      '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'employee', 'Staff'),
('u3', 'Lisa Park',    'lisa@hypernova.com',      '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'employee', 'Staff'),
('u4', 'Maria Costa',  'maria@hypernova.com',     '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'employee', 'Staff');

-- password for all seed users is: password

INSERT IGNORE INTO referrers (id, name, type) VALUES
('r1',  'Dr. Williams',            'Physician'),
('r2',  'Ahmed & Partners',        'Law Firm'),
('r3',  'Walk-in',                 'Direct'),
('r4',  'Google Search',           'Online'),
('r5',  'Client Referral',         'Referral'),
('r6',  'Dr. Sarah Ahmed',         'Physician'),
('r7',  'Insurance Broker Network','Broker'),
('r8',  'Community Legal Clinic',  'Legal Aid'),
('r9',  'Physiotherapy Plus',      'Clinic'),
('r10', 'Hospital ER Referral',    'Hospital');
