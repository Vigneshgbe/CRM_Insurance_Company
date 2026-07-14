"""
fill_intake_form.py — Matrix Legal Services Intake Master PDF filler.

All field IDs are verified from the actual Intake_Master.pdf AcroForm extraction.

The Intake_Master.pdf uses a non-standard /Opt structure that crashes pypdf's
reader.get_fields() method.  This script bypasses that by using a manual AcroForm
tree traversal (get_field_info_safe) that was confirmed to work against the real PDF.
It then calls update_page_form_field_values() directly — the same approach used
in fill_fillable_fields.py — so the output is identical in format.

Usage:
    python fill_intake_form.py input.pdf data.json output.pdf

data.json keys are documented in build_intake_fields() below.
"""
import json
import sys
from pypdf import PdfReader, PdfWriter
from pypdf.generic import DictionaryObject


# ── Safe field info collector (bypasses reader.get_fields crash) ──────────────

def get_field_info_safe(reader: PdfReader) -> list:
    """
    Manual AcroForm traversal. Returns a list of dicts with at minimum:
      { "field_id": str, "type": str }
    Does NOT validate /Opt choice options (skipped to avoid crash).
    """
    catalog = reader.trailer['/Root'].get_object()
    acroform = catalog.get('/AcroForm')
    if not acroform:
        return []
    acroform = acroform.get_object()
    fields_arr = acroform.get('/Fields')
    if not fields_arr:
        return []

    results = []

    def visit(ref_or_obj, parent_name=""):
        obj = (ref_or_obj.get_object()
               if hasattr(ref_or_obj, 'get_object') else ref_or_obj)
        if not isinstance(obj, DictionaryObject):
            return
        t = obj.get('/T')
        partial = str(t) if t else ""
        full_name = (f"{parent_name}.{partial}" if parent_name and partial
                     else (parent_name or partial))
        ft = obj.get('/FT')
        if ft and full_name:
            fd = {"field_id": full_name}
            if str(ft) == "/Tx":
                fd["type"] = "text"
            elif str(ft) == "/Btn":
                fd["type"] = "checkbox"
                fd["checked_value"] = "/Yes"
                fd["unchecked_value"] = "/Off"
            elif str(ft) == "/Ch":
                fd["type"] = "choice"
                fd["choice_options"] = []   # skipped — avoids crash
            else:
                fd["type"] = f"unknown ({ft})"
            results.append(fd)
        kids = obj.get('/Kids')
        if kids:
            for kid in kids.get_object():
                visit(kid, full_name)

    for fld in fields_arr.get_object():
        visit(fld)

    return results


# ── Core fill function ─────────────────────────────────────────────────────────

def fill_pdf_fields_safe(input_pdf_path: str,
                         field_entries: list,
                         output_pdf_path: str) -> None:
    """
    Fill the PDF form at input_pdf_path using field_entries (a list of dicts):
      [{ "field_id": str, "page": int, "value": str }, ...]

    Uses update_page_form_field_values() — identical to fill_fillable_fields.py.
    Unknown field IDs are skipped with a warning (same behaviour).
    """
    reader = PdfReader(input_pdf_path)
    known_ids = {f["field_id"] for f in get_field_info_safe(reader)}

    fields_by_page: dict[int, dict[str, str]] = {}

    for entry in field_entries:
        fid   = entry.get("field_id", "")
        page  = int(entry.get("page", 1))
        value = str(entry.get("value", ""))

        if fid not in known_ids:
            print(f"WARNING: field not found in PDF, skipping: {fid}",
                  file=sys.stderr)
            continue

        fields_by_page.setdefault(page, {})[fid] = value

    writer = PdfWriter(clone_from=reader)
    for page_num, field_values in fields_by_page.items():
        writer.update_page_form_field_values(
            writer.pages[page_num - 1], field_values, auto_regenerate=False
        )

    writer.set_need_appearances_writer(True)

    with open(output_pdf_path, "wb") as fh:
        writer.write(fh)


# ── Helpers ───────────────────────────────────────────────────────────────────

def s(v) -> str:
    if v is None:
        return ''
    return str(v).strip()


def f(field_id: str, page: int, value) -> dict:
    return {"field_id": field_id, "page": page,
            "value": str(value) if value is not None else ""}


def chk_val(truthy: bool, on_value: str = '/Yes') -> str:
    return on_value if truthy else '/Off'


def yv(v) -> bool:
    return s(v).lower() in ('y', 'yes', '1', 'true')


# ── Physical/Neurological condition checkbox maps ─────────────────────────────
# IDs verified from actual AcroForm extraction of Intake_Master.pdf

PHYSICAL_FIELD_MAP = {
    "Head":       ("Check Box4",  None),
    "Chest":      ("Check Box15", None),
    "Upper Back": ("Check Box20", None),
    "Mid Back":   ("Check Box21", None),
    "Lower Back": ("Check Box22", None),
    "Radiating pain down Arm(s) L/R": ("Check Box45", None),
    "Radiating pain down Leg(s) L/R": ("Check Box65", None),
    # L/R pairs
    "Face L/R":      ("L",    "R"),
    "Eyes L/R":      ("L_2",  "R_2"),
    "Nose L/R":      ("L_3",  "R_3"),
    "Ears L/R":      ("L_4",  "R_4"),
    "Jaw L/R":       ("L_5",  "R_5"),
    "Teeth L/R":     ("L_6",  "R_6"),
    "Neck L/R":      ("L_7",  "R_7"),
    "Shoulders L/R": ("L_8",  "R_8"),
    "Arms L/R":      ("L_9",  "R_9"),
    "Wrists L/R":    ("L_10", "R_10"),
    "Hands L/R":     ("L_11", "R_11"),
    "Fingers L/R":   ("L_12", "R_12"),
    "Ribs L/R":      ("L_13", "R_13"),
    "Abdomen L/R":   ("L_14", "R_14"),
    "Hips L/R":      ("L_15", "R_15"),
    "Pelvis L/R":    ("L_16", "R_16"),
    "Thighs L/R":    ("L_17", "R_17"),
    "Knees L/R":     ("L_18", "R_18"),
    "Legs L/R":      ("L_19", "R_19"),
    "Ankles L/R":    ("L_20", "R_20"),
    "Feet L/R":      ("L_21", "R_21"),
    "Toes L/R":      ("L_22", "R_22"),
}

NEURO_FIELD_MAP = {
    "Headaches":               "Check Box16",
    "Dizziness":               "Check Box49",
    "Ringing in the ears":     "Check Box17",
    "Problems with hearing":   "Check Box51",
    "Blurred Vision":          "Check Box18",
    "Forgetfulness":           "Check Box53",
    "Tingling":                "Check Box19",
    "Numbness":                "Check Box54",
    "Irritability":            "Check Box55",
    "Anxiety":                 "Check Box56",
    "Stress":                  "Check Box57",
    "Depression":              "Check Box58",
    "Lack of sleep":           "Check Box59",
    "Nightmares (general)":    "Check Box60",
    "Flashbacks to MVA":       "Check Box61",
    "Periodic crying":         "Check Box62",
    "Low self-esteem":         "Check Box63",
    "Loss of incentive":       "Check Box65",
    "Fear of Driving":         "Check Box66",
    "Nervous when a passenger":"Check Box67",
    "Withdraw from others":    "Check Box68",
    "Poor appetite":           "Check Box69",
    "Loss of weight":          "Check Box28",
    "Decrease sex drive":      "Check Box71",
    "Fatigue/low energy":      "Check Box72",
    "Short-tempered":          "Check Box73",
    "Spousal arguments":       "Check Box74",
    "Over-react to small things": "Check Box75",
    "Excessive worry":         "Check Box76",
    "Suicidal thought":        "Check Box77",
}

# Auth-letter date dropdown helpers
MONTH_NAMES = ['January','February','March','April','May','June',
               'July','August','September','October','November','December']
DAY_SUFFIXES = {
    1:'1st',2:'2nd',3:'3rd',4:'4th',5:'5th',6:'6th',7:'7th',
    8:'8th',9:'9th',10:'10th',11:'11th',12:'12th',13:'13th',
    14:'14th',15:'15th',16:'16th',17:'17th',18:'18th',19:'19th',
    20:'20th',21:'21st',22:'22nd',23:'23rd',24:'24th',25:'25th',
    26:'26th',27:'27th',28:'28th',29:'29th',30:'30th',31:'31st',
}


def _day_str(iso: str) -> str:
    try:
        return DAY_SUFFIXES.get(int(iso[8:10]), '')
    except (ValueError, TypeError, IndexError):
        return ''


def _month_str(iso: str) -> str:
    try:
        m = int(iso[5:7])
        return MONTH_NAMES[m - 1] if 1 <= m <= 12 else ''
    except (ValueError, TypeError, IndexError):
        return ''


def _year_str(iso: str) -> str:
    try:
        return iso[2:4]    # "2026" → "26"
    except (IndexError, TypeError):
        return ''


# ── Main builder ──────────────────────────────────────────────────────────────

def build_intake_fields(d: dict) -> list:
    """
    Build the complete field entry list for the Intake Master PDF.
    See parameter documentation in the module docstring above.
    """
    fields: list = []

    def chk(field_id, page, truthy):
        fields.append(f(field_id, page, '/Yes' if truthy else '/Off'))

    def on(field_id, page, truthy, on_val='/On'):
        fields.append(f(field_id, page, on_val if truthy else '/Off'))

    mva_date  = s(d.get('dateOfMva') or d.get('dateOfAccident', ''))
    auth_day  = s(d.get('authDay'))   or _day_str(mva_date)
    auth_mon  = s(d.get('authMonth')) or _month_str(mva_date)
    auth_yr   = s(d.get('authYear'))  or _year_str(mva_date)

    # ── Page 1: Interview header + personal data ──────────────────────────────
    p = 1
    chk('Conflict checked yes', p, yv(d.get('conflictChecked')))
    chk('Conflict checked no',  p, not yv(d.get('conflictChecked')))
    chk('Conflict find yes', p, yv(d.get('conflictFind')))
    chk('Conflict find no',  p, not yv(d.get('conflictFind')))
    fields.append(f('File No',            p, s(d.get('fileNo'))))
    fields.append(f('Date of MVA',        p, mva_date))
    fields.append(f('Client Interviewed On', p, s(d.get('interviewedOn', ''))))
    fields.append(f('Interviewed by',       p, s(d.get('interviewedBy', ''))))
    fields.append(f('Client referred by',   p, s(d.get('referredBy', ''))))
    fields.append(f('Retainer %-1',         p, s(d.get('percent', '25%'))))

    fields.append(f('Last Name',  p, s(d.get('lastName'))))
    fields.append(f('First Name', p, s(d.get('firstName'))))
    fields.append(f('First and Last Name', p,
                    f'{s(d.get("firstName"))} {s(d.get("lastName"))}'.strip()))
    fields.append(f('unit no',        p, s(d.get('unitNo', ''))))
    fields.append(f('Street no',      p, s(d.get('streetNo', ''))))
    fields.append(f('Client Address', p, s(d.get('address'))))
    fields.append(f('Client City',    p, s(d.get('city'))))
    fields.append(f('Client Province', p, s(d.get('province', 'ON'))))
    fields.append(f('Client Post Code', p, s(d.get('postCode'))))
    fields.append(f('Date of Birth',  p, s(d.get('dateOfBirth'))))
    fields.append(f('Home Phone',     p, s(d.get('homePhone'))))
    fields.append(f('Cell Phone',     p, s(d.get('cellPhone'))))
    fields.append(f('Work Phone',     p, s(d.get('workPhone', ''))))
    fields.append(f('EMail',          p, s(d.get('email'))))

    gender = s(d.get('gender', ''))
    chk('Male',   p, gender.lower() == 'male')
    chk('Female', p, gender.lower() == 'female')

    marital = s(d.get('maritalStatus', ''))
    for label, btn in [('Single','Single'),('Married','Married'),
                       ('C-Law','Commonlaw'),('Separated','Separated'),
                       ('Divorced','Divorced'),('Widow','Widower')]:
        on(btn, p, marital == label, '/On')

    dep = s(d.get('dependants', '0'))
    chk('Dependants yes', p, dep not in ('', '0'))
    chk('Dependants NO',  p, dep in ('', '0'))
    fields.append(f('Dependants', p, dep))

    fields.append(f("Driver's License No", p, s(d.get('driverLicenseNo'))))
    chk('License copy no',  p, True)
    chk('License copy yes', p, False)
    fields.append(f('Health Card No', p,
                    s(d.get('healthCardNo') or d.get('ohipNumber'))))
    chk('Health card copy no',  p, True)
    chk('Health card copy yes', p, False)
    fields.append(f('Social Insurance No', p, s(d.get('sinNo'))))
    chk('SIN Copy no',  p, True)
    chk('SIN Copy yes', p, False)
    chk('Ontario ID card', p, bool(s(d.get('ontarioIdNo'))))
    chk('PR',      p, bool(s(d.get('prCitizenNo'))))
    chk('Citizen', p, bool(s(d.get('citizenCardNo'))))
    fields.append(f('PR or Citizen', p,
                    s(d.get('prCitizenNo') or d.get('citizenCardNo'))))
    chk('PR Citizen copy no',  p, True)
    chk('PR Citizen copy yes', p, False)

    benefit = s(d.get('benefitElection', ''))
    chk('Income replacement benefit', p, benefit == 'Income Replacement Benefit')
    chk('Non- earner benefit',        p, benefit == 'Non-Earner Benefit')
    chk('Caregiver Benefit',          p, benefit == 'Caregiver Benefit')

    # ── Page 2: Language / accident ───────────────────────────────────────────
    p = 2
    chk('Client spake english yes', p, yv(d.get('speaksEnglish')))
    chk('Client spake english no',  p, not yv(d.get('speaksEnglish')))
    chk('Interpreter request yes',  p, yv(d.get('needsInterpreter')))
    chk('Interpreter request no',   p, not yv(d.get('needsInterpreter')))
    fields.append(f('Yes NoYear immigrated to Canada', p,
                    s(d.get('yearImmigrated', ''))))
    chk('Client born in canada yes', p, yv(d.get('bornInCanada')))
    chk('Client born in canada no',  p, not yv(d.get('bornInCanada')))
    chk('Seat-belted yes', p, yv(d.get('seatBelted')))
    chk('Seat-belted no',  p, not yv(d.get('seatBelted')))

    chk('Did the accident occur while at work Yes', p, yv(d.get('accidentAtWork')))
    chk('Did the accident occur while at work no',  p, not yv(d.get('accidentAtWork')))
    chk('Did client file claim with WSIB yes', p, yv(d.get('wsibClaim')))
    chk('Did client file claim with WSIB No',  p, not yv(d.get('wsibClaim')))

    fields.append(f('Street Name',        p, s(d.get('accidentStreet'))))
    fields.append(f('Major Intersection', p, s(d.get('accidentIntersection'))))
    fields.append(f('Accident city',      p, s(d.get('accidentCity', ''))))
    fields.append(f('Accident province',  p, 'ON'))

    time_str = s(d.get('timeOfAccident', ''))
    fields.append(f('Time of MVA', p, time_str))
    is_pm = ('pm' in time_str.lower() or
             (len(time_str) >= 2 and time_str[:2].isdigit()
              and int(time_str[:2]) >= 12))
    chk('AM', p, not is_pm)
    chk('PM', p, is_pm)

    chk('accident reported to the police yes', p, yv(d.get('policeReported')))
    chk('accident reported to the police no',  p, not yv(d.get('policeReported')))
    fields.append(f('Date of Reported', p, s(d.get('policeReportDate', ''))))
    chk('Police come to the scene yes', p, yv(d.get('policeCameToScene')))
    chk('Police come to the scene',     p, not yv(d.get('policeCameToScene')))
    fields.append(f('Police Department/ collision reporting', p,
                    s(d.get('policeDepartment', ''))))
    fields.append(f('Incident No', p, s(d.get('incidentNo', ''))))
    fields.append(f('Officer',     p, s(d.get('officerName', ''))))
    fields.append(f('Badge No',    p, s(d.get('badgeNo', ''))))

    chk('was the client charged yes',  p, yv(d.get('clientCharged')))
    chk('was the client charged no',   p, not yv(d.get('clientCharged')))
    chk('was third party charged yes', p, yv(d.get('thirdPartyCharged')))
    chk('was third party charged no',  p, not yv(d.get('thirdPartyCharged')))

    chk('photo of the damage yes', p, yv(d.get('photosOfDamage')))
    chk('photo of the damage no',  p, not yv(d.get('photosOfDamage')))
    fields.append(f('fill_21', p, s(d.get('estimatedDamage', ''))))

    # ── Page 3: Accident description + first-party insurance ─────────────────
    p = 3
    fields.append(f('Please provide a brief description of how the accident occurred',
                    p, s(d.get('accidentDescription', ''))))

    fields.append(f('First Part Insurance Name',     p, s(d.get('fp_insurerName', ''))))
    fields.append(f('First Part Insurance Address',  p, s(d.get('fp_insurerAddress', ''))))
    fields.append(f('First Part Insurance City',     p, s(d.get('fp_insurerCity', ''))))
    fields.append(f('First party province',          p, 'ON'))
    fields.append(f('First Party Post code',         p, s(d.get('fp_insurerPostal', ''))))
    fields.append(f('AB Adjuster',                   p, s(d.get('fp_adjuster', ''))))
    fields.append(f('First Part Insurance Email',    p, s(d.get('fp_adjusterEmail', ''))))
    fields.append(f('First Part Insurance Phone No', p, s(d.get('fp_phone', ''))))
    fields.append(f('First Part Insurance Fax No',   p, s(d.get('fp_fax', ''))))
    fields.append(f('First Part Insurance Claim No', p, s(d.get('fp_claimNo', ''))))
    fields.append(f('First Part Insurance Policy No', p, s(d.get('fp_policyNo', ''))))
    fields.append(f('Name of policy Holder',         p, s(d.get('fp_policyHolder', ''))))
    fields.append(f('1st Automobile Make:',          p, s(d.get('fp_autoMake', ''))))
    fields.append(f('1st Automobile Model:',         p, s(d.get('fp_autoModel', ''))))
    fields.append(f('1st Automobile Year:',          p, s(d.get('fp_autoYear', ''))))
    fields.append(f('License Plate Number',          p, s(d.get('fp_plateNo', ''))))

    # ── Page 4: Third party + hospital ────────────────────────────────────────
    p = 4
    fields.append(f('3rd Driver name',        p, s(d.get('tp_driverName', ''))))
    fields.append(f('3rd Driver address',     p, s(d.get('tp_driverAddress', ''))))
    fields.append(f('3rd Drivers License No', p, s(d.get('tp_driverLicenseNo', ''))))
    fields.append(f('3rd driver phone',       p, s(d.get('tp_driverPhone', ''))))
    fields.append(f('3rd Insurance Company',  p, s(d.get('tp_insurerName', ''))))
    fields.append(f('3rd insurance address',  p, s(d.get('tp_insurerAddress', ''))))
    fields.append(f('3rd Name of Adjuster',   p, s(d.get('tp_adjuster', ''))))
    fields.append(f('3rd Phone No_3',         p, s(d.get('tp_phone', ''))))
    fields.append(f('3rd Fax No_2',           p, s(d.get('tp_fax', ''))))
    fields.append(f('3rd Policy No_2',        p, s(d.get('tp_policyNo', ''))))
    fields.append(f('Claim No_2',             p, s(d.get('tp_claimNo', ''))))
    fields.append(f('3rd Name of policy Holder_2', p, s(d.get('tp_policyHolder', ''))))
    fields.append(f('3rd Make',               p, s(d.get('tp_autoMake', ''))))
    fields.append(f('3rd Automobile Model:',  p, s(d.get('tp_autoModel', ''))))
    fields.append(f('3rd Year',               p, s(d.get('tp_autoYear', ''))))
    fields.append(f('3rd License Plate Number_2', p, s(d.get('tp_plateNo', ''))))

    chk('did you got to hospital yes', p, yv(d.get('wentToHospital')))
    chk('did you got to hospital no',  p, not yv(d.get('wentToHospital')))
    chk('Check Box48', p, yv(d.get('ambulanceRequired')))
    chk('Check Box47', p, not yv(d.get('ambulanceRequired')))

    fields.append(f('Name of the Hospital', p, s(d.get('hospitalName', ''))))
    fields.append(f('Hospital address',     p, s(d.get('hospitalAddress', ''))))
    fields.append(f('Admission date',       p, s(d.get('admissionDate', ''))))
    fields.append(f('Discharge date',       p, s(d.get('dischargeDate', ''))))
    chk('X-Ray taken yes', p, yv(d.get('xrayTaken')))
    chk('X-Ray taken no',  p, not yv(d.get('xrayTaken')))

    fields.append(f('Family Physician Name',    p, s(d.get('familyDoctor', ''))))
    fields.append(f('Family Physician Address', p, s(d.get('familyDoctorAddress', ''))))
    fields.append(f('Family Physician City',    p, s(d.get('familyDoctorCity', ''))))
    fields.append(f('Family Physician province', p, 'ON'))
    fields.append(f('Family Physician Post code', p, s(d.get('familyDoctorPC', ''))))
    fields.append(f('Family Physician Phone No.:', p, s(d.get('familyDoctorPhone', ''))))
    fields.append(f('Family Physician Fax No.:',   p, s(d.get('familyDoctorFax', ''))))

    # ── Page 5: Treatment providers + medications ─────────────────────────────
    p = 5
    for num in [1, 2, 3, 4]:
        px = f'tp{num}'
        fields.append(f(f'Treatment Provider-{num}',
                        p, s(d.get(f'{px}_centre', ''))))
        fields.append(f(f'Treatment Provider-{num} address',
                        p, s(d.get(f'{px}_address', ''))))
        fields.append(f(f'Treatment Provider-{num} Phone number',
                        p, s(d.get(f'{px}_phone', ''))))
        fields.append(f(f'Treatment Provider-{num} Fax Number',
                        p, s(d.get(f'{px}_fax', ''))))

    fields.append(f('List of Medication Prescribed-1', p, s(d.get('medication1', ''))))
    fields.append(f('List of Medication Prescribed-2', p, s(d.get('medication2', ''))))
    fields.append(f('List of Medication Prescribed-3', p, s(d.get('medication3', ''))))
    fields.append(f('List of Medication Prescribed-4', p, s(d.get('medication4', ''))))

    # ── Page 6: Post-accident conditions + pre-conditions ────────────────────
    p = 6
    physical_list = d.get('postPhysical', []) or []
    all_neuro = set(d.get('postNeuro', []) or []) | set(d.get('postPsych', []) or [])

    for condition, (left_fld, right_fld) in PHYSICAL_FIELD_MAP.items():
        is_chk = condition in physical_list
        chk(left_fld, p, is_chk)
        if right_fld:
            chk(right_fld, p, is_chk)

    for condition, fld_id in NEURO_FIELD_MAP.items():
        chk(fld_id, p, condition in all_neuro)

    fields.append(f('Condition',           p, s(d.get('preCondition', ''))))
    fields.append(f('Time Frame',          p, s(d.get('preTimeFrame', ''))))
    fields.append(f('Operative Procedure', p, s(d.get('preOperativeProcedure', ''))))
    fields.append(f('Preaccident Status',  p, s(d.get('preAccidentStatus', ''))))
    fields.append(f('Postaccident Status', p, s(d.get('postAccidentStatus', ''))))

    # ── Page 7: Employment ────────────────────────────────────────────────────
    p = 7
    on('Employed',          p, yv(d.get('empFullTime')))
    on('SelfEmployed',      p, yv(d.get('empSelfEmployed')))
    on('Unemployed but worked 26 weeks in last 52 weeks', p, yv(d.get('empUnemployed26')))
    on('Written contract  agreement to start work within one year',
       p, yv(d.get('empContract')))
    on('Client is receiving EI benefits', p, yv(d.get('empEI')))
    on('Unemployed',        p, yv(d.get('empUnemployed')))
    on('Retired',           p, yv(d.get('empRetired')))
    on('Student or Recent graduate', p, yv(d.get('empStudent')))
    on('Caregiver',         p, yv(d.get('empCaregiver')))

    fields.append(f('Employer 1',              p, s(d.get('emp1_name', ''))))
    fields.append(f('Employer Address 1',      p, s(d.get('emp1_address', ''))))
    fields.append(f('Phone',                   p, s(d.get('emp1_phone', ''))))
    fields.append(f('Fax',                     p, s(d.get('emp1_fax', ''))))
    fields.append(f('Occupation 1',            p, s(d.get('emp1_occupation', ''))))
    fields.append(f('Salary  Wages 1',         p, s(d.get('emp1_salary', ''))))
    fields.append(f('Hours worked per week 1', p, s(d.get('emp1_hoursPerWeek', ''))))
    fields.append(f('Length of Employment',    p, s(d.get('emp1_length', ''))))
    fields.append(f('last day of work 1',      p, s(d.get('emp1_lastDay', ''))))

    fields.append(f('Employer 2',              p, s(d.get('emp2_name', ''))))
    fields.append(f('Employer Address 2',      p, s(d.get('emp2_address', ''))))
    fields.append(f('Phone_2',                 p, s(d.get('emp2_phone', ''))))
    fields.append(f('Fax_2',                   p, s(d.get('emp2_fax', ''))))
    fields.append(f('Occupation 2',            p, s(d.get('emp2_occupation', ''))))
    fields.append(f('Salary  Wages 2',         p, s(d.get('emp2_salary', ''))))
    fields.append(f('Hours worked per week 2', p, s(d.get('emp2_hoursPerWeek', ''))))
    fields.append(f('Length of Employment_2',  p, s(d.get('emp2_length', ''))))
    fields.append(f('Last Day Worked 2',       p, s(d.get('emp2_lastDay', ''))))

    chk('Did you go back to work yes', p, yv(d.get('returnedToWork')))
    chk('Did you go back to work no',  p, not yv(d.get('returnedToWork')))
    fields.append(f('Date of return to work', p, s(d.get('dateReturnedToWork', ''))))

    # ── Page 8: Employer 3 + caregiver ───────────────────────────────────────
    p = 8
    fields.append(f('Employer 3',              p, s(d.get('emp3_name', ''))))
    fields.append(f('Employer Address 3',      p, s(d.get('emp3_address', ''))))
    fields.append(f('Phone_3',                 p, s(d.get('emp3_phone', ''))))
    fields.append(f('Fax_3',                   p, s(d.get('emp3_fax', ''))))
    fields.append(f('Occupation 3',            p, s(d.get('emp3_occupation', ''))))
    fields.append(f('Salary  Wages 3',         p, s(d.get('emp3_salary', ''))))
    fields.append(f('Hours worked per week 3', p, s(d.get('emp3_hoursPerWeek', ''))))
    fields.append(f('Length of Employment_3',  p, s(d.get('emp3_length', ''))))
    fields.append(f('Last Day Worked 3',       p, s(d.get('emp3_lastDay', ''))))

    on('dependents mentally disabled prior to the MVA Yes',
       p, yv(d.get('wasPrimaryCaregiver')))
    on('No_21', p, not yv(d.get('wasPrimaryCaregiver')))

    cg_ids    = ['1','2_2','3_2','4_2','5','6']
    cg_dob_ids= ['Date of Birth1','Date of Birth2','Date of Birth3',
                 'Date of Birth4','Date of Birth5','Date of Birth6']
    for i in range(1, 7):
        fields.append(f(cg_ids[i-1],     p, s(d.get(f'cg{i}_name', ''))))
        fields.append(f(cg_dob_ids[i-1], p, s(d.get(f'cg{i}_dob', ''))))

    on('Do the clients injuries prevent him  her from performing care giving activities Yes',
       p, yv(d.get('injuriesPreventCaregiving')))
    on('No_28', p, not yv(d.get('injuriesPreventCaregiving')))

    fields.append(f('From',                        p, s(d.get('caregivingFrom', ''))))
    fields.append(f('Return to care giving duties', p, s(d.get('caregivingReturn', ''))))

    expl = s(d.get('caregivingExplanation', '')).split('\n')
    for i, eid in enumerate(['Explanation 1','Explanation 2','Explanation 3',
                              'Explanation 4','Explanation 5','Explanation 6']):
        fields.append(f(eid, p, expl[i] if i < len(expl) else ''))

    # ── Page 9: Education + other insurance ──────────────────────────────────
    p = 9
    fields.append(f('Name of Institution',         p, s(d.get('eduInstitution', ''))))
    fields.append(f('Name of Institution address', p, s(d.get('eduAddress', ''))))
    on('still attending school yes', p, yv(d.get('stillAttendingSchool')))
    on('still attending school no',  p, not yv(d.get('stillAttendingSchool')))
    fields.append(f('Date Last Attended',   p, s(d.get('dateLastAttended', ''))))
    fields.append(f('Projected Completion', p, s(d.get('projectedCompletion', ''))))
    fields.append(f('Career Goals',         p, s(d.get('careerGoals', ''))))
    chk('return to school yes', p, yv(d.get('returnedToSchool')))
    chk('return to school no',  p, not yv(d.get('returnedToSchool')))
    fields.append(f('return to school date', p, s(d.get('returnedSchoolDate', ''))))
    fields.append(f('activities 1', p, s(d.get('courseDropped1', ''))))
    fields.append(f('activities 2', p, s(d.get('courseDropped2', ''))))

    chk('Extended healt plan yes', p, yv(d.get('hasOtherBenefitPlan')))
    chk('Extended healt plan no',  p, not yv(d.get('hasOtherBenefitPlan')))
    fields.append(f('Benefit Plan 1',           p, s(d.get('otherInsuranceName', ''))))
    fields.append(f('Type of Insurance 1',      p, s(d.get('otherInsuranceType', ''))))
    fields.append(f('Policy/ Certificate No 1', p, s(d.get('otherInsurancePolicyNo', ''))))

    chk('Received any disability yes', p, yv(d.get('receivedDisabilityIncome')))
    chk('Received any disability No',  p, not yv(d.get('receivedDisabilityIncome')))
    fields.append(f('Disablity Plan from', p, s(d.get('disabilityFrom', ''))))
    fields.append(f('Disablity Plan to',   p, s(d.get('disabilityTo', ''))))

    chk('Receiving EI yes', p, yv(d.get('receivingEI')))
    chk('Receiving EI no',  p, not yv(d.get('receivingEI')))
    fields.append(f('Employment Insurance from', p, s(d.get('eiFrom', ''))))
    fields.append(f('Employment Insurance to',   p, s(d.get('eiTo', ''))))

    chk('Receving welfare yes', p, yv(d.get('receivingWelfare')))
    chk('Receving welfare no',  p, not yv(d.get('receivingWelfare')))

    # ── Page 10: Income tax + expense contacts ────────────────────────────────
    p = 10
    on('Was the client paying support on the date of the accident Yes',
       p, yv(d.get('payingSupport')))
    on('No_34', p, not yv(d.get('payingSupport')))
    fields.append(f('From_5',    p, s(d.get('supportFrom', ''))))
    fields.append(f('Total paid', p, s(d.get('supportTotalPaid', ''))))

    tax_m = s(d.get('taxMaritalStatus', ''))
    on('Marital status for Tax purposes Single', p, tax_m == 'Single')
    on('Married_2',           p, tax_m == 'Married')
    on('Equivalent to married', p, tax_m == 'Equivalent to married')

    fields.append(f('MVA occurred',   p, s(d.get('spouseIncome1', ''))))
    fields.append(f('MVA occurred_2', p, s(d.get('spouseIncome2', ''))))

    chk('Disability TAX return yes', p, yv(d.get('taxDisabilityClaim')))
    chk('Disability TAX return no',  p, not yv(d.get('taxDisabilityClaim')))

    fields.append(f('Name of housekeeper',         p, s(d.get('hk_name', ''))))
    fields.append(f('Address_15',                  p, s(d.get('hk_address', ''))))
    fields.append(f('Phone_4',                     p, s(d.get('hk_phone', ''))))
    fields.append(f('No of hours worked per week', p, s(d.get('hk_hoursPerWeek', ''))))
    fields.append(f('Amount paid per week',        p, s(d.get('hk_amountPerWeek', ''))))

    fields.append(f('Name of Caregiver',             p, s(d.get('carg_name', ''))))
    fields.append(f('Address_16',                    p, s(d.get('carg_address', ''))))
    fields.append(f('Phone_5',                       p, s(d.get('carg_phone', ''))))
    fields.append(f('No of hours worked per week_2', p, s(d.get('carg_hoursPerWeek', ''))))
    fields.append(f('Amount paid per week_2',        p, s(d.get('carg_amountPerWeek', ''))))

    fields.append(f('Name of Care Person',           p, s(d.get('care_name', ''))))
    fields.append(f('Address_17',                    p, s(d.get('care_address', ''))))
    fields.append(f('Phone_6',                       p, s(d.get('care_phone', ''))))
    fields.append(f('No of hours worked per week_3', p, s(d.get('care_hoursPerWeek', ''))))
    fields.append(f('Amount paid per week_3',        p, s(d.get('care_amountPerWeek', ''))))

    # ── Authorization letters (pages 11-15) ───────────────────────────────────
    for ch_day, ch_mon, ch_yr, pg in [
        ('Authorization day',          'Authorization month',       'Authorization year',        11),
        ('Notice of changing day',     'Notice of changing  month', 'Notice of changing  year',  12),
        ('Ministry of health day',     'Ministry of health month',  'Ministry of health year',   13),
        ('Authorization anything day', 'Authorization anything month','Authorization anything year', 14),
        ('Medical day',                'Medical month',             'Medical year',              15),
    ]:
        fields.append(f(ch_day, pg, auth_day))
        fields.append(f(ch_mon, pg, auth_mon))
        fields.append(f(ch_yr,  pg, auth_yr))

    # Ministry of Health OHIP fields
    p = 13
    fields.append(f('Health Card No', p,
                    s(d.get('healthCardNo') or d.get('ohipNumber', ''))))
    fields.append(f('from to', p, s(d.get('ohipFromDate', ''))))

    # OHIP PCH consent form
    p = 16
    fields.append(f('Ohip Unit Number',  p, s(d.get('ohipUnitNo', ''))))
    fields.append(f('Ohip Street number', p, s(d.get('ohipStreetNo', ''))))
    fields.append(f('ohip Street Nume',  p,
                    s(d.get('ohipStreetName') or d.get('address', ''))))
    fields.append(f('Ohip City',         p,
                    s(d.get('ohipCity') or d.get('city', ''))))
    fields.append(f('Ohip Postal code',  p,
                    s(d.get('ohipPostal') or d.get('postCode', ''))))
    fields.append(f('Ohip State date',   p,
                    s(d.get('ohipStartDate') or mva_date)))
    fields.append(f('Ohipe date 1',      p, s(d.get('ohipEndDate', ''))))

    # Retainer agreement
    p = 17
    fields.append(f('Retainer %-1',       p, s(d.get('percent', '25%'))))
    fields.append(f('Retainer day',       p, auth_day))
    fields.append(f('Retainer month',     p, auth_mon))
    fields.append(f('retainer year',      p, auth_yr))
    fields.append(f('Retainer sign City', p, s(d.get('city', ''))))
    fields.append(f('Retainer sign day',  p, auth_day))
    fields.append(f('Retainer sign month', p, auth_mon))
    fields.append(f('retainer Sign year', p, auth_yr))

    return fields


# ── CLI entry-point ───────────────────────────────────────────────────────────

if __name__ == "__main__":
    if len(sys.argv) != 4:
        print("Usage: python fill_intake_form.py input.pdf data.json output.pdf")
        sys.exit(1)

    input_pdf  = sys.argv[1]
    data_json  = sys.argv[2]
    output_pdf = sys.argv[3]

    with open(data_json, encoding='utf-8') as fh:
        data = json.load(fh)

    field_entries = build_intake_fields(data)
    fill_pdf_fields_safe(input_pdf, field_entries, output_pdf)
    print(f"Done: {output_pdf}")
