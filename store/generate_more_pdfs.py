#!/usr/bin/env python3
"""Generate additional EMS digital products"""
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
        self.multi_cell(0, 4, 'DISCLAIMER: Educational purposes only. Not medical advice. Always follow local protocols and medical direction. Verify all clinical information against current evidence-based resources.')

output_dir = '/home/adam/hermes/store/emt-guide/pdfs'

# ============================================
# PDF 3: EKG/ECG Interpretation Guide
# ============================================
pdf = EMSPDF()
pdf.add_page()
pdf.header_custom('EKG/ECG INTERPRETATION GUIDE', 'Quick Reference for EMS Professionals')

pdf.section_header('Normal EKG Values')
pdf.table_header('Component', 'Normal Range', 'Description', widths=[40, 40, 80])
pdf.table_row('Rate', '60-100 bpm', 'Normal sinus rhythm')
pdf.table_row('PR Interval', '0.12-0.20 sec (3-5 small boxes)', 'Time from atrial to ventricular depolarization')
pdf.table_row('QRS Complex', '< 0.12 sec (< 3 small boxes)', 'Ventricular depolarization')
pdf.table_row('QT Interval', '< 0.44 sec (men), < 0.46 sec (women)', 'Ventricular depolarization + repolarization')
pdf.table_row('P Wave', 'Upright in II, III, aVF', 'Atrial depolarization')
pdf.table_row('QRS Axis', '-30 to +90 degrees', 'Normal electrical axis')

pdf.ln(4)
pdf.section_header('Systematic EKG Interpretation (8 Steps)')
steps = [
    ('1. Rate', 'Count R waves x 10 (300/150/100/75/60/50) or 300 / large boxes between R waves'),
    ('2. Rhythm', 'Regular? Irregular? Regularly irregular? P waves present? Every P followed by QRS?'),
    ('3. P Waves', 'Present? Uniform? Upright in II? One P per QRS?'),
    ('4. PR Interval', 'Normal (0.12-0.20s)? Constant? Prolonged? Shortened?'),
    ('5. QRS Complex', 'Narrow (<0.12s) or Wide (>=0.12s)? Pathological Q waves?'),
    ('6. ST Segment', 'Elevated? Depressed? Isoelectric?'),
    ('7. T Waves', 'Upright? Inverted? Peaked? Flattened?'),
    ('8. QT Interval', 'Corrected QT (QTc) < 440ms men, < 460ms women?'),
]
for title, desc in steps:
    pdf.set_font('Helvetica', 'B', 8)
    pdf.cell(0, 5, title, ln=True)
    pdf.set_font('Helvetica', '', 7.5)
    pdf.cell(0, 4, desc, ln=True)
    pdf.ln(1)

pdf.add_page()
pdf.header_custom('EKG/ECG INTERPRETATION GUIDE', 'Page 2 of 4')

pdf.section_header('Critical EKG Findings - RECOGNIZE & ACT')
pdf.table_header('Finding', 'What to Look For', 'Significance', 'Action', widths=[35, 45, 40, 40])
findings = [
    ('STEMI', 'ST elevation >= 1mm in 2+ contiguous walls', 'Active MI', 'Activate cath lab, MONA, ASA'),
    ('STEMI Equiv', 'ST depression in V1-V3 (posterior), New LBBB', 'Posterior MI / MI', 'Treat as STEMI'),
    ('VTach', 'Wide QLS, rate >100, AV dissociation', 'Unstable if symptomatic', 'Amiodarone, shock if unstable'),
    ('VFib', 'Chaotic, no organized rhythm', 'Cardiac arrest', 'Defibrillate immediately'),
    ('Asystole', 'Flat line (confirm in 2 leads)', 'Cardiac arrest', 'CPR, epi, search cause'),
    ('PEA', 'Organized rhythm, no pulse', 'Cardiac arrest', 'CPR, epi, search reversible causes'),
    ('3rd Degree HB', 'P and QRS dissociated, junctional escape', 'Unstable bradycardia', 'Transcutaneous pacing'),
    ('AFlutter', 'Sawtooth pattern, atrial rate ~300', 'Unstable if rapid', 'Rate control, cardioversion'),
    ('Torsades', 'Polymorphic VT, prolonged QT', 'Degenerates to VF', 'Magnesium 2g IV'),
    ('HyperK', 'Peaked Ts, wide QRS, sine wave', 'Cardiac arrest risk', 'Calcium, insulin/D50, albuterol'),
    ('Brugada', 'RBBB + STE V1-V3', 'Sudden death risk', 'Avoid certain drugs, ICD'),
    ('WPW', 'Delta wave, short PR, wide QLS', 'Risk of rapid SVT/Afib', 'Avoid AV nodal blockers'),
]
for f in findings:
    pdf.set_font('Helvetica', 'B', 6.5)
    pdf.cell(35, 4, f[0], border=1)
    pdf.set_font('Helvetica', '', 6)
    pdf.cell(45, 4, f[1], border=1)
    pdf.cell(40, 4, f[2], border=1)
    pdf.cell(40, 4, f[3], border=1)
    pdf.ln()

pdf.add_page()
pdf.header_custom('EKG/ECG INTERPRETATION GUIDE', 'Page 3 of 4')

pdf.section_header('12-Lead STEMI Localization')
pdf.table_header('Leads Involved', 'Wall', 'Artery', 'Notes', widths=[40, 35, 35, 60])
stemi_local = [
    ('V1-V2', 'Septal', 'LAD (septal)', 'R in V1 may indicate posterior MI'),
    ('V3-V4', 'Anterior', 'LAD', 'Most common STEMI location'),
    ('V5-V6 + I, aVL', 'Lateral', 'LCx or LAD diagonal', 'Check for reciprocal changes inferiorly'),
    ('II, III, aVF', 'Inferior', 'RCA (90%) or LCx', 'Always get right leads for RV involvement'),
    ('V3R-V4R', 'Right Ventricle', 'RCA (proximal)', 'Hypotension + clear lungs = consider RV MI'),
    ('V7-V9', 'Posterior', 'RCA or LCx', 'Look for ST depression in V1-V3 as mirror'),
]
for loc in stemi_local:
    pdf.set_font('Helvetica', '', 7)
    pdf.cell(40, 5, loc[0], border=1)
    pdf.cell(35, 5, loc[1], border=1)
    pdf.cell(35, 5, loc[2], border=1)
    pdf.cell(60, 5, loc[3], border=1)
    pdf.ln()

pdf.ln(4)
pdf.section_header('Normal Sinus Rhythm Criteria')
for item in ['Rate: 60-100 bpm', 'Rhythm: Regular', 'P waves: Upright in II, III, aVF', 'Every P wave followed by a QRS', 'PR interval: 0.12-0.20 seconds (.constant)', 'QRS: Narrow (< 0.12 seconds)', 'One P wave for every QRS complex']:
    pdf.bullet(item)

pdf.add_page()
pdf.header_custom('EKG/ECG INTERPRETATION GUIDE', 'Page 4 of 4')

pdf.section_header('Common Dysrhythmias Quick Reference')
pdf.set_font('Helvetica', 'B', 6.5)
pdf.cell(35, 5, 'Rhythm', border=1, fill=True)
pdf.cell(25, 5, 'Rate', border=1, fill=True)
pdf.cell(20, 5, 'QRS', border=1, fill=True)
pdf.cell(25, 5, 'P Wave', border=1, fill=True)
pdf.cell(55, 5, 'Treatment', border=1, fill=True)
pdf.ln()
rhythms = [
    ('Sinus Brady', '<60', 'Narrow', 'Normal', 'Atropine 0.5mg, TCP if symptomatic'),
    ('Sinus Tach', '100-150', 'Narrow', 'Normal', 'Treat underlying cause'),
    ('PSVT', '150-250', 'Narrow', 'Hidden', 'Vagal, Adenosine 6/12mg'),
    ('AFlutter', 'Variable', 'Narrow', 'Sawtooth', 'Rate control, anticoagulate'),
    ('AFib', 'Irregular', 'Narrow', 'None/fibs', 'Rate/rhythm control, anticoagulate'),
    ('VTach', '100-250', 'Wide', 'None/dissoc', 'Amiodarone/lidocaine, shock if unstable'),
    ('Torsades', '200-250', 'Wide, changing', 'None', 'Magnesium 2g IV, overdrive pacing'),
    ('VFib', 'None', 'Chaotic', 'None', 'Defibrillate, CPR, epi'),
    ('Asystole', 'None', 'None', 'None', 'CPR, epi, search causes'),
    ('PEA', 'Variable', 'Variable', 'May have', 'CPR, epi, search reversible causes'),
]
for r in rhythms:
    pdf.set_font('Helvetica', '', 6)
    pdf.cell(35, 4, r[0], border=1)
    pdf.cell(25, 4, r[1], border=1)
    pdf.cell(20, 4, r[2], border=1)
    pdf.cell(25, 4, r[3], border=1)
    pdf.cell(55, 4, r[4], border=1)
    pdf.ln()

pdf.disclaimer()
ekg_path = f'{output_dir}/EKG_Interpretation_Guide.pdf'
pdf.output(ekg_path)
print(f'PDF 3 (EKG Guide): {ekg_path} ({os.path.getsize(ekg_path)} bytes)')

# ============================================
# PDF 4: Medical Terminology & Abbreviations
# ============================================
pdf2 = EMSPDF()
pdf2.add_page()
pdf2.header_custom('EMS MEDICAL TERMINOLOGY', 'Comprehensive Abbreviation Reference')

prefixes = [
    ('a-/an-', 'without, not', 'apnea = without breathing'),
    ('brady-', 'slow', 'bradycardia = slow heart rate'),
    ('tachy-', 'fast', 'tachycardia = fast heart rate'),
    ('hyper-', 'above, excessive', 'hypertension = high blood pressure'),
    ('hypo-', 'below, deficient', 'hypotension = low blood pressure'),
    ('dys-', 'difficult, painful', 'dyspnea = difficulty breathing'),
    ('poly-', 'many', 'polyuria = excessive urination'),
    ('oligo-', 'few, scanty', 'oliguria = decreased urination'),
    ('hemi-', 'half', 'hemiparesis = weakness on one side'),
    ('para-', 'beside, near', 'paraplegia = paralysis of lower limbs'),
    ('peri-', 'around', 'pericardium = sac around heart'),
    ('sub-', 'under', 'subcutaneous = under the skin'),
    ('supra-', 'above', 'supraventricular = above the ventricles'),
    ('inter-', 'between', 'intercostal = between the ribs'),
    ('intra-', 'within', 'intravenous = within the vein'),
    ('endo-', 'inside', 'endotracheal = inside the trachea'),
    ('exo-', 'outside', 'exogenous = originating outside'),
    ('anti-', 'against', 'anticoagulant = against clotting'),
]

pdf2.section_header('Common Prefixes')
pdf2.table_header('Prefix', 'Meaning', 'Example', widths=[30, 40, 90])
for p in prefixes:
    pdf2.set_font('Helvetica', '', 7.5)
    pdf2.cell(30, 4, p[0], border=1)
    pdf2.cell(40, 4, p[1], border=1)
    pdf2.cell(90, 4, p[2], border=1)
    pdf2.ln()

pdf2.add_page()
pdf2.header_custom('EMS MEDICAL TERMINOLOGY', 'Page 2 of 3')

suffixes = [
    ('-itis', 'inflammation', 'appendicitis, meningitis'),
    ('-osis', 'condition, disease', 'fibrosis, stenosis'),
    ('-ectomy', 'surgical removal', 'appendectomy, cholecystectomy'),
    ('-otomy', 'cutting into', 'tracheotomy, craniotomy'),
    ('-ostomy', 'creating an opening', 'colostomy, tracheostomy'),
    ('-plasty', 'surgical repair', 'angioplasty, rhinoplasty'),
    ('-scopy', 'visual examination', 'endoscopy, bronchoscopy'),
    ('-gram', 'record, image', 'electrocardiogram, radiogram'),
    ('-graph', 'instrument for recording', 'electrocardiograph'),
    ('-graphy', 'process of recording', 'radiography'),
    ('-emia', 'blood condition', 'hypoglycemia, hyperkalemia'),
    ('-uria', 'urine condition', 'hematuria, dysuria'),
    ('-pnea', 'breathing', 'apnea, tachypnea, dyspnea'),
    ('-phagia', 'swallowing', 'dysphagia'),
    ('-plegia', 'paralysis', 'hemiplegia, quadriplegia'),
    ('-tocia', 'labor, delivery', 'dystocia'),
    ('-rrhea', 'flow, discharge', 'diarrhea'),
    ('-rrhexis', 'rupture', 'angiorrhexis'),
]

pdf2.section_header('Common Suffixes')
pdf2.table_header('Suffix', 'Meaning', 'Example', widths=[30, 40, 90])
for s in suffixes:
    pdf2.set_font('Helvetica', '', 7.5)
    pdf2.cell(30, 4, s[0], border=1)
    pdf2.cell(40, 4, s[1], border=1)
    pdf2.cell(90, 4, s[2], border=1)
    pdf2.ln()

pdf2.add_page()
pdf2.header_custom('EMS MEDICAL TERMINOLOGY', 'Page 3 of 3')

pdf2.section_header('Body Systems Quick Reference')
systems = [
    ('Cardiovascular', 'Heart, blood vessels', 'MI, CHF, DVT, PE, AAA'),
    ('Respiratory', 'Lungs, airways', 'COPD, asthma, pneumonia, PTX'),
    ('Neurological', 'Brain, spine, nerves', 'CVA, TIA, seizure, TBI'),
    ('Gastrointestinal', 'Stomach, intestines', 'GI bleed, appendicitis, bowel obstruction'),
    ('Musculoskeletal', 'Muscles, bones', 'Fracture, sprain, dislocation'),
    ('Endocrine', 'Hormones, glands', 'DKA, hypothyroidism, Addisonian crisis'),
    ('Renal/Urological', 'Kidneys, bladder', 'Renal failure, kidney stones, UTI'),
    ('Reproductive', 'Reproductive organs', 'Ectopic pregnancy, PID, testicular torsion'),
    ('Integumentary', 'Skin, hair, nails', 'Burns, cellulitis, pressure ulcers'),
    ('Hematologic', 'Blood, bone marrow', 'Anemia, sickle cell, leukemia'),
    ('Immunological', 'Immune system', 'Anaphylaxis, lupus, HIV/AIDS'),
]

pdf2.table_header('System', 'Components', 'Common Conditions', widths=[35, 45, 80])
for sys in systems:
    pdf2.set_font('Helvetica', '', 7.5)
    pdf2.cell(35, 5, sys[0], border=1)
    pdf2.cell(45, 5, sys[1], border=1)
    pdf2.cell(80, 5, sys[2], border=1)
    pdf2.ln()

pdf2.ln(4)
pdf2.section_header('Directional Terms')
dirs = [
    ('Superior', 'Toward the head / above'),
    ('Inferior', 'Toward the feet / below'),
    ('Anterior (Ventral)', 'Front of the body'),
    ('Posterior (Dorsal)', 'Back of the body'),
    ('Medial', 'Toward the midline'),
    ('Lateral', 'Away from the midline'),
    ('Proximal', 'Closer to the trunk'),
    ('Distal', 'Farther from the trunk'),
    ('Superficial', 'Near the surface'),
    ('Deep', 'Away from the surface'),
    ('Supine', 'Face up, lying on back'),
    ('Prone', 'Face down, lying on stomach'),
    ('Fowler\'s', 'Seated upright (90 degrees)'),
    ('Semi-Fowler\'s', 'Partially upright (30-45 degrees)'),
    ('Trendelenburg', 'Head down, feet up'),
]
pdf2.table_header('Term', 'Meaning', widths=[55, 105])
for d in dirs:
    pdf2.set_font('Helvetica', '', 7.5)
    pdf2.cell(55, 4, d[0], border=1)
    pdf2.cell(105, 4, d[1], border=1)
    pdf2.ln()

pdf2.disclaimer()
term_path = f'{output_dir}/EMS_Medical_Terminology.pdf'
pdf2.output(term_path)
print(f'PDF 4 (Medical Terminology): {term_path} ({os.path.getsize(term_path)} bytes)')

print('\nAll additional PDFs generated!')
