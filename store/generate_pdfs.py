#!/usr/bin/env python3
"""Generate EMT Quick Reference Cards PDF"""
from fpdf import FPDF
import os

class EMSPDF(FPDF):
    def __init__(self):
        super().__init__()
        self.set_auto_page_break(auto=True, margin=20)
    
    def header_custom(self, title, subtitle=''):
        self.set_font('Helvetica', 'B', 10)
        self.set_text_color(220, 38, 38)
        self.cell(0, 8, title, ln=True, align='C')
        if subtitle:
            self.set_font('Helvetica', '', 8)
            self.set_text_color(100, 100, 100)
            self.cell(0, 5, subtitle, ln=True, align='C')
        self.ln(3)
        self.set_draw_color(220, 38, 38)
        self.set_line_width(0.5)
        self.line(10, self.get_y(), 200, self.get_y())
        self.ln(4)
    
    def section_header(self, text):
        self.set_font('Helvetica', 'B', 11)
        self.set_text_color(30, 64, 175)
        self.cell(0, 7, text, ln=True)
        self.set_text_color(0, 0, 0)
        self.ln(1)
    
    def table_row(self, col1, col2, col3='', col4='', widths=None):
        if widths is None:
            widths = [45, 45, 45, 45]
        self.set_font('Helvetica', '', 8)
        self.cell(widths[0], 5, str(col1), border=0)
        self.cell(widths[1], 5, str(col2), border=0)
        if col3:
            self.cell(widths[2], 5, str(col3), border=0)
        if col4:
            self.cell(widths[3], 5, str(col4), border=0)
        self.ln()
    
    def table_header(self, col1, col2, col3='', col4='', widths=None):
        if widths is None:
            widths = [45, 45, 45, 45]
        self.set_font('Helvetica', 'B', 8)
        self.set_fill_color(240, 240, 240)
        self.cell(widths[0], 6, str(col1), border=1, fill=True)
        self.cell(widths[1], 6, str(col2), border=1, fill=True)
        if col3:
            self.cell(widths[2], 6, str(col3), border=1, fill=True)
        if col4:
            self.cell(widths[3], 6, str(col4), border=1, fill=True)
        self.ln()
    
    def bullet(self, text):
        self.set_font('Helvetica', '', 8)
        self.cell(5, 4, '-', border=0)
        self.multi_cell(0, 4, text)
        self.ln(1)
    
    def disclaimer(self):
        self.ln(5)
        self.set_font('Helvetica', 'I', 7)
        self.set_text_color(100, 100, 100)
        self.multi_cell(0, 4, 'DISCLAIMER: This product contains general medical reference information for educational purposes only. It does not constitute medical advice, clinical guidance, or protocol. Always follow your local protocols, medical direction, and institutional guidelines. Clinical accuracy should be verified against current evidence-based resources before use in patient care.')

output_dir = '/home/adam/hermes/store/emt-guide/pdfs'
os.makedirs(output_dir, exist_ok=True)

# ============================================
# PDF 1: EMT Quick Reference Cards (6 pages)
# ============================================
pdf = EMSPDF()

# Page 1: Title + Vital Signs
pdf.add_page()
pdf.header_custom('EMT QUICK REFERENCE CARDS', 'Printable Study Guide for EMT Students')
pdf.section_header('CARD 1: Normal Adult Vital Signs')
pdf.table_header('Parameter', 'Normal Range', widths=[70, 70])
pdf.table_row('Heart Rate', '60-100 bpm')
pdf.table_row('Blood Pressure', '90/60 - 120/80 mmHg')
pdf.table_row('Respiratory Rate', '12-20 breaths/min')
pdf.table_row('SpO2', '95-100%')
pdf.table_row('Temperature', '97.8-99.1 F (36.5-37.3 C)')
pdf.table_row('Glasgow Coma Scale', '15 (E4V5M6)')
pdf.ln(4)
pdf.section_header('CARD 1B: Pediatric Vital Signs by Age')
pdf.table_header('Age', 'HR (bpm)', 'RR (/min)', 'SBP (mmHg)', widths=[35, 35, 35, 35])
pdf.table_row('Newborn (0-1 mo)', '100-160', '30-60', '60-90')
pdf.table_row('Infant (1-12 mo)', '100-160', '30-50', '70-100')
pdf.table_row('Toddler (1-3 yr)', '80-130', '20-30', '80-110')
pdf.table_row('Preschool (3-6 yr)', '80-120', '20-25', '80-110')
pdf.table_row('School Age (6-12)', '70-110', '15-20', '90-120')
pdf.table_row('Adolescent (12+)', '60-100', '12-20', '100-120')

# Page 2: GCS + APGAR
pdf.add_page()
pdf.header_custom('EMT QUICK REFERENCE CARDS', 'Page 2 of 6')
pdf.section_header('CARD 2: Glasgow Coma Scale (GCS)')
pdf.table_header('Component', 'Response', 'Score', widths=[50, 70, 20])
pdf.table_row('Eye Opening (E)', 'Spontaneous', '4')
pdf.table_row('', 'To verbal command', '3')
pdf.table_row('', 'To pain', '2')
pdf.table_row('', 'None', '1')
pdf.table_row('Verbal Response (V)', 'Oriented', '5')
pdf.table_row('', 'Confused', '4')
pdf.table_row('', 'Inappropriate words', '3')
pdf.table_row('', 'Incomprehensible sounds', '2')
pdf.table_row('', 'None', '1')
pdf.table_row('Motor Response (M)', 'Obeys commands', '6')
pdf.table_row('', 'Localizes pain', '5')
pdf.table_row('', 'Withdraws from pain', '4')
pdf.table_row('', 'Flexion (decorticate)', '3')
pdf.table_row('', 'Extension (decerebrate)', '2')
pdf.table_row('', 'None', '1')
pdf.ln(2)
pdf.set_font('Helvetica', 'B', 9)
pdf.cell(0, 5, 'Total GCS Range: 3-15', ln=True)
pdf.set_font('Helvetica', 'I', 8)
pdf.cell(0, 5, 'GCS <= 8 = Consider intubation. Score of 15 does NOT rule out serious pathology.', ln=True)
pdf.ln(4)
pdf.section_header('CARD 2B: APGAR Score')
pdf.table_header('Component', '0 points', '1 point', '2 points', widths=[30, 45, 45, 45])
pdf.table_row('Appearance (Color)', 'Blue/pale', 'Blue ext, pink body', 'Completely pink')
pdf.table_row('Pulse', 'Absent', '< 100 bpm', '>= 100 bpm')
pdf.table_row('Grimace (Reflex)', 'No response', 'Grimace', 'Cry/cough')
pdf.table_row('Activity (Tone)', 'Limp', 'Some flexion', 'Active motion')
pdf.table_row('Respiration', 'Absent', 'Slow/irregular', 'Strong cry')
pdf.ln(2)
pdf.set_font('Helvetica', '', 8)
pdf.cell(0, 4, 'Scoring: 7-10 = Normal | 4-6 = Moderate depression | 0-3 = Severe depression', ln=True)
pdf.cell(0, 4, 'Scored at 1 and 5 minutes after birth.', ln=True)

# Page 3: Patient Assessment
pdf.add_page()
pdf.header_custom('EMT QUICK REFERENCE CARDS', 'Page 3 of 6')
pdf.section_header('CARD 3: Systematic Patient Assessment')
pdf.set_font('Helvetica', 'B', 9)
pdf.cell(0, 6, 'Scene Size-Up (Before Patient Contact):', ln=True)
pdf.set_font('Helvetica', '', 8)
for item in ['Scene safety (BSI: Body Substance Isolation)', 'Mechanism of injury / Nature of illness', 'Number of patients', 'Additional resources needed']:
    pdf.bullet(item)
pdf.ln(2)
pdf.set_font('Helvetica', 'B', 9)
pdf.cell(0, 6, 'Primary Assessment (ABCDE):', ln=True)
pdf.set_font('Helvetica', '', 8)
for item in ['A - Airway: Patent? Obstructed? Need adjunct?', 'B - Breathing: Rate, quality, symmetry, SpO2', 'C - Circulation: Pulse, skin signs, bleeding control', 'D - Disability: GCS/AVPU, pupil response', 'E - Expose/Environment: Undress as needed, prevent hypothermia']:
    pdf.bullet(item)
pdf.ln(2)
pdf.set_font('Helvetica', 'B', 9)
pdf.cell(0, 6, 'Secondary Assessment:', ln=True)
pdf.set_font('Helvetica', '', 8)
for item in ['Vital signs (full set)', 'History: OPQRST + SAMPLE', 'Head-to-toe physical exam', 'Focused exam based on chief complaint']:
    pdf.bullet(item)
pdf.ln(2)
pdf.set_font('Helvetica', 'B', 9)
pdf.cell(0, 6, 'Reassessment:', ln=True)
pdf.set_font('Helvetica', '', 8)
for item in ['Repeat primary assessment every 5 min (unstable) or 15 min (stable)', 'Reassess interventions', 'Trend vital signs']:
    pdf.bullet(item)

# Page 4: Abbreviations
pdf.add_page()
pdf.header_custom('EMT QUICK REFERENCE CARDS', 'Page 4 of 6')
pdf.section_header('CARD 4: Common EMS Abbreviations')
pdf.table_header('Abbreviation', 'Meaning', 'Abbreviation', 'Meaning', widths=[30, 55, 30, 55])
abbrevs = [
    ('AED', 'Automated External Defibrillator', 'BLS', 'Basic Life Support'),
    ('BP', 'Blood Pressure', 'BVM', 'Bag Valve Mask'),
    ('C-collar', 'Cervical Collar', 'CC', 'Chief Complaint'),
    ('CPR', 'Cardiopulmonary Resuscitation', 'Dx', 'Diagnosis'),
    ('EKG/ECG', 'Electrocardiogram', 'ETA', 'Est Time of Arrival'),
    ('GCS', 'Glasgow Coma Scale', 'HR', 'Heart Rate'),
    ('IM', 'Intramuscular', 'IO', 'Intraosseous'),
    ('IV', 'Intravenous', 'LOC', 'Level of Consciousness'),
    ('MOI', 'Mechanism of Injury', 'NPO', 'Nothing by Mouth'),
    ('NRB', 'Non-Rebreather Mask', 'NS', 'Normal Saline'),
    ('O2', 'Oxygen', 'OPQRST', 'Onset, Prov, Qual, Rad, Sev, Time'),
    ('PRN', 'As Needed', 'PT', 'Patient'),
    ('RR', 'Respiratory Rate', 'Rx', 'Treatment/Prescription'),
    ('SAMPLE', 'Sx, Allerg, Meds, PMH, Last oral, Events', 'SpO2', 'Oxygen Saturation'),
    ('SQ/SC', 'Subcutaneous', 'SVT', 'Supraventricular Tachycardia'),
    ('Tx', 'Treatment', 'VS', 'Vital Signs'),
]
for a1, m1, a2, m2 in abbrevs:
    pdf.table_row(a1, m1, a2, m2, widths=[30, 55, 30, 55])

# Page 5: Stroke Scale + Cardiac Algorithm
pdf.add_page()
pdf.header_custom('EMT QUICK REFERENCE CARDS', 'Page 5 of 6')
pdf.section_header('CARD 5: Stroke Scale & Cardiac Algorithms')
pdf.set_font('Helvetica', 'B', 9)
pdf.cell(0, 6, 'Cincinnati Prehospital Stroke Scale', ln=True)
pdf.set_font('Helvetica', 'I', 8)
pdf.cell(0, 4, 'Any ONE positive = Stroke Alert', ln=True)
pdf.set_font('Helvetica', '', 8)
pdf.ln(1)
for item in ['Facial Droop: Ask patient to smile. One side droops?', 'Arm Drift: Ask patient to close eyes and hold both arms out for 10 sec. One arm drifts?', 'Abnormal Speech: Ask patient to repeat a simple sentence. Slurred or wrong words?']:
    pdf.bullet(item)
pdf.ln(3)
pdf.set_font('Helvetica', 'B', 9)
pdf.cell(0, 6, 'Adult Cardiac Arrest Algorithm (BLS):', ln=True)
pdf.set_font('Helvetica', '', 8)
steps = ['Check responsiveness + breathing', 'Activate EMS / call for AED', 'Check pulse (<= 10 seconds)', 'If no pulse -> Begin CPR (30:2 compression:ventilation)', 'Attach AED ASAP', 'If shockable rhythm (VF/pVT): Shock -> CPR 2 min -> Rhythm check -> Repeat', 'If non-shockable (PEA/Asystole): CPR 2 min -> Epinephrine 1mg IV -> Repeat', 'Continue until ROSC or termination']
for i, step in enumerate(steps, 1):
    pdf.cell(8, 4, f'{i}.', border=0)
    pdf.multi_cell(0, 4, step)
    pdf.ln(0.5)

# Page 6: Trauma Triage + Mnemonics
pdf.add_page()
pdf.header_custom('EMT QUICK REFERENCE CARDS', 'Page 6 of 6')
pdf.section_header('CARD 6: Trauma Triage & Assessment Mnemonics')
pdf.set_font('Helvetica', 'B', 9)
pdf.cell(0, 6, 'START Triage (Simple Triage and Rapid Treatment):', ln=True)
pdf.table_header('Category', 'Criteria', 'Tag Color', widths=[30, 90, 30])
pdf.table_row('Immediate', 'Unable to walk AND RR>30 OR no radial pulse OR unable to follow commands', 'Red')
pdf.table_row('Delayed', 'Unable to walk BUT RR<30, radial pulse present, follows commands', 'Yellow')
pdf.table_row('Minor', 'Can walk', 'Green')
pdf.table_row('Deceased', 'Not breathing (even after positioning)', 'Black')
pdf.ln(4)
pdf.set_font('Helvetica', 'B', 9)
pdf.cell(0, 6, 'OPQRST Pain Assessment:', ln=True)
pdf.set_font('Helvetica', '', 8)
for item in ['O - Onset: When did it start? What were you doing?', 'P - Provocation/Palliation: What makes it better/worse?', 'Q - Quality: Sharp, dull, crushing, pressure?', 'R - Radiation: Does it travel anywhere?', 'S - Severity: Scale of 0-10', 'T - Time: How long has it been going on?']:
    pdf.bullet(item)
pdf.ln(3)
pdf.set_font('Helvetica', 'B', 9)
pdf.cell(0, 6, 'SAMPLE History:', ln=True)
pdf.set_font('Helvetica', '', 8)
for item in ['S - Symptoms: What is wrong?', 'A - Allergies: Any medication/environmental allergies?', 'M - Medications: What do you take regularly?', 'P - Past Medical History: Relevant conditions?', 'L - Last Oral Intake: When did you last eat/drink?', 'E - Events: What happened leading up to this?']:
    pdf.bullet(item)

pdf.disclaimer()
pdf1_path = f'{output_dir}/EMT_Quick_Reference_Cards.pdf'
pdf.output(pdf1_path)
print(f'PDF 1: {pdf1_path} ({os.path.getsize(pdf1_path)} bytes)')

# ============================================
# PDF 2: Paramedic Pharmacology Cheat Sheet
# ============================================
pdf2 = EMSPDF()
pdf2.add_page()
pdf2.header_custom('PARAMEDIC PHARMACOLOGY CHEAT SHEET', '18 Critical EMS Medications')

drugs = [
    ('Epinephrine', 'Sympathomimetic', 'Cardiac arrest, Anaphylaxis, Severe asthma', '1mg IV/IO (1:10,000) q3-5min', '0.01mg/kg IV/IO (1:10,000)', 'IV/IO/IN', 'HTN, Tachycardia, Dysrhythmias'),
    ('Amiodarone', 'Antiarrhythmic', 'VF/pVT, Stable VT', '300mg IV/IO push, then 150mg', '5mg/kg IV/IO', 'IV/IO', 'Hypotension, Bradycardia, Heart block'),
    ('Lidocaine', 'Antiarrhythmic', 'VF/pVT (alternative to amiodarone)', '1-1.5mg/kg IV/IO, repeat 0.5-0.75mg/kg', '1mg/kg IV/IO', 'IV/IO', 'Seizures, Bradycardia, Heart block'),
    ('Atropine', 'Anticholinergic', 'Symptomatic bradycardia', '0.5mg IV q3-5min (max 3mg)', '0.02mg/kg IV (min 0.1mg)', 'IV/IO', 'Tachycardia, Glaucoma, Hypothermia'),
    ('Adenosine', 'Antiarrhythmic', 'Stable SVT', '6mg rapid IV push, then 12mg if needed', '0.1mg/kg (max 6mg), then 0.2mg/kg (max 12mg)', 'IV (rapid push)', 'Bronchospasm, Transient asystole'),
    ('Dopamine', 'Sympathomimetic', 'Symptomatic bradycardia (2nd line), Cardiogenic shock', '2-20 mcg/kg/min IV drip', '2-20 mcg/kg/min IV drip', 'IV drip', 'Tachydysrhythmias, HTN'),
    ('Naloxone (Narcan)', 'Opioid antagonist', 'Opioid overdose', '0.4-2mg IV/IO/IM/IN', '0.1mg/kg IV/IO/IM/IN (max 2mg)', 'IV/IO/IM/IN', 'Opioid withdrawal, Pulmonary edema'),
    ('Dextrose (D50/D25/D10)', 'Carbohydrate', 'Hypoglycemia', '25g IV (D50W 50mL)', '0.5-1g/kg IV (D25W 2-4mL/kg, D10W 5-10mL/kg)', 'IV', 'Hyperglycemia, Tissue necrosis'),
    ('Midazolam (Versed)', 'Benzodiazepine', 'Seizures, Sedation, Cardioversion', '2-5mg IV/IO/IM/IN', '0.1mg/kg IV/IO/IM/IN (max 5mg)', 'IV/IO/IM/IN', 'Respiratory depression, Hypotension'),
    ('Diazepam (Valium)', 'Benzodiazepine', 'Seizures, Anxiety, Muscle spasm', '5-10mg IV/IO', '0.1-0.3mg/kg IV/IO', 'IV/IO/IM', 'Respiratory depression, Hypotension'),
    ('Morphine Sulfate', 'Opioid analgesic', 'Pain management, ACS, Pulmonary edema', '2-4mg IV q5min PRN', '0.1-0.2mg/kg IV', 'IV/IO/IM/SQ', 'Respiratory depression, Hypotension'),
    ('Fentanyl', 'Opioid analgesic', 'Pain management (preferred over morphine)', '50-100mcg IV/IO/IM/IN', '1-2mcg/kg IV/IO/IN', 'IV/IO/IM/IN', 'Respiratory depression, Chest wall rigidity'),
    ('Nitroglycerin', 'Vasodilator', 'ACS, CHF, Hypertensive emergency', '0.4mg SL q3-5min (max 3 doses)', 'Not typically used peds', 'SL', 'Hypotension, PDE5 inhibitor use, Head injury'),
    ('Aspirin', 'Antiplatelet', 'Suspected ACS', '324mg chewed (non-enteric)', 'Not typically used peds', 'PO (chewed)', 'Allergy, Active bleeding, Children (Reye syndrome)'),
    ('Albuterol', 'Beta-2 agonist', 'Bronchospasm, Hyperkalemia', '2.5-5mg nebulized', '2.5mg nebulized (<20kg), 5mg (>20kg)', 'Nebulized', 'Tachycardia, Dysrhythmias'),
    ('Diphenhydramine (Benadryl)', 'Antihistamine', 'Allergic reaction, Dystonic reaction', '25-50mg IV/IO/IM', '1mg/kg IV/IO/IM (max 50mg)', 'IV/IO/IM', 'Glaucoma, Urinary retention, Sedation'),
    ('Glucagon', 'Hormone', 'Hypoglycemia (no IV access), Beta-blocker OD', '1mg IM (hypoglycemia), 3-10mg IV (BB OD)', '0.5mg IM (<20kg), 1mg IM (>20kg)', 'IM/IV', 'Nausea, Vomiting'),
    ('Sodium Bicarbonate', 'Alkalizing agent', 'Tricyclic OD, Hyperkalemia, Metabolic acidosis', '1mEq/kg IV', '1mEq/kg IV', 'IV', 'Metabolic alkalosis, Hypernatremia'),
]

pdf2.set_font('Helvetica', 'B', 7)
pdf2.cell(28, 4, 'Drug', border=1, fill=True)
pdf2.cell(22, 4, 'Class', border=1, fill=True)
pdf2.cell(32, 4, 'Indication', border=1, fill=True)
pdf2.cell(32, 4, 'Adult Dose', border=1, fill=True)
pdf2.cell(22, 4, 'Peds Dose', border=1, fill=True)
pdf2.cell(16, 4, 'Route', border=1, fill=True)
pdf2.cell(38, 4, 'Contra/SE', border=1, fill=True)
pdf2.ln()
for drug in drugs:
    name, cls, ind, adult, peds, route, contra = drug
    pdf2.set_font('Helvetica', 'B', 6.5)
    pdf2.cell(28, 3.5, name, border=1)
    pdf2.set_font('Helvetica', '', 6)
    pdf2.cell(22, 3.5, cls, border=1)
    pdf2.cell(32, 3.5, ind, border=1)
    pdf2.cell(32, 3.5, adult, border=1)
    pdf2.cell(22, 3.5, peds, border=1)
    pdf2.cell(16, 3.5, route, border=1)
    pdf2.cell(38, 3.5, contra, border=1)
    pdf2.ln()

pdf2.ln(4)
pdf2.section_header('Clinical Pearls')
pearls = [
    'Epinephrine 1:10,000 = 0.1mg/mL (for IV/IO use in cardiac arrest)',
    'Epinephrine 1:1,000 = 1mg/mL (for IM use in anaphylaxis)',
    'Always confirm D50 concentration before administering to pediatrics',
    'Naloxone duration of action (30-90 min) may be shorter than opioid - monitor for re-narcotization',
    'Nitroglycerin is CONTRAINDICATED with PDE5 inhibitor use (Viagra, Cialis) within 24-48 hours',
    'Fentanyl is preferred over morphine in hypotensive patients due to less histamine release',
    'Atropine minimum single dose is 0.1mg to avoid paradoxical bradycardia',
    'Adenosine requires RAPID push followed by 20mL saline flush',
]
for p in pearls:
    pdf2.bullet(p)

pdf2.disclaimer()
pdf2_path = f'{output_dir}/Paramedic_Pharmacology_Cheat_Sheet.pdf'
pdf2.output(pdf2_path)
print(f'PDF 2: {pdf2_path} ({os.path.getsize(pdf2_path)} bytes)')

print('\nAll PDFs generated successfully!')
