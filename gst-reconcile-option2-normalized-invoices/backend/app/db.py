from functools import lru_cache
from supabase import create_client, Client
from .config import SUPABASE_URL, SUPABASE_KEY


@lru_cache(maxsize=1)
def get_supabase() -> Client:
    if not SUPABASE_URL or not SUPABASE_KEY:
        raise RuntimeError('Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in backend/.env')
    return create_client(SUPABASE_URL, SUPABASE_KEY)


def select(table: str, columns: str = '*', filters: dict | None = None, order_by: str | None = None,
           descending: bool = False, limit: int | None = None):
    q = get_supabase().table(table).select(columns)
    for key, value in (filters or {}).items():
        if value is not None:
            q = q.eq(key, value)
    if order_by:
        q = q.order(order_by, desc=descending)
    if limit:
        q = q.limit(limit)
    return q.execute().data or []


def get_one(table: str, filters: dict, columns: str = '*'):
    rows = select(table, columns, filters, limit=1)
    return rows[0] if rows else None


def insert(table: str, payload):
    data = get_supabase().table(table).insert(payload).execute().data or []
    return data[0] if data else None


def update(table: str, filters: dict, payload):
    q = get_supabase().table(table).update(payload)
    for key, value in filters.items():
        q = q.eq(key, value)
    data = q.execute().data or []
    return data[0] if data else None


def count(table: str, filters: dict | None = None) -> int:
    q = get_supabase().table(table).select('*', count='exact')
    for key, value in (filters or {}).items():
        if value is not None:
            q = q.eq(key, value)
    response = q.execute()
    return response.count or 0


def init_db() -> None:
    # Tables are created in Supabase using backend/supabase_schema.sql.
    # The backend intentionally does not execute DDL against Supabase at startup.
    required = ['users', 'companies', 'vendors', 'invoices', 'reconciliation_batches', 'fraud_alerts', 'notifications', 'audit_logs']
    missing = []
    client = get_supabase()
    for table in required:
        try:
            client.table(table).select('*').limit(1).execute()
        except Exception:
            missing.append(table)
    if missing:
        raise RuntimeError('Supabase schema is not ready. Run backend/supabase_schema.sql in the Supabase SQL Editor. Missing/unavailable tables: ' + ', '.join(missing))


def seed_db() -> None:
    if not get_supabase().table('users').select('id').limit(1).execute().data:
        seed_all()


def seed_all() -> None:
    users = [
        {'email':'admin@demo.com','password':'admin123','role':'admin','name':'Platform Admin','company_id':None},
        {'email':'company@demo.com','password':'company123','role':'company','name':'Acme Corp Admin','company_id':'COMP-01'},
        {'email':'vendor@demo.com','password':'vendor123','role':'vendor','name':'Tata Steel Vendor','company_id':'COMP-01'},
    ]
    companies = [
        {'id':'COMP-01','name':'Acme Corp India Pvt Ltd','gstin':'27AABCU9603R1ZM','admin_email':'company@demo.com','status':'active','compliance_score':88,'itc_claimed':1240000,'itc_at_risk':184000},
        {'id':'COMP-02','name':'Bharat Logistics & Infra Ltd','gstin':'24AABCB1290K1Z4','admin_email':'finance@bharatlogistics.in','status':'active','compliance_score':74,'itc_claimed':3450000,'itc_at_risk':148000},
        {'id':'COMP-03','name':'Apex Precision Tools Ltd','gstin':'29AABCA9012J1Z2','admin_email':'tax@apexprecision.com','status':'active','compliance_score':94,'itc_claimed':1820000,'itc_at_risk':12000},
        {'id':'COMP-04','name':'Delta Polymers India','gstin':'33AABCD4512N1Z8','admin_email':'admin@deltapolymers.in','status':'active','compliance_score':61,'itc_claimed':2210000,'itc_at_risk':284000},
    ]
    vendors = [
        {'id':'VEND-01','name':'Tata Steel Ltd','gstin':'27AAACT2727Q1ZV','risk_level':'LOW','compliance_score':96},
        {'id':'VEND-02','name':'Mahindra Parts & Logistics','gstin':'27AABCM8291M1ZU','risk_level':'MEDIUM','compliance_score':82},
        {'id':'VEND-03','name':'Singh Electronics & Hardware','gstin':'29GGGGG1314R9Z6','risk_level':'HIGH','compliance_score':62},
        {'id':'VEND-04','name':'Reliance Industries Ltd','gstin':'27AAACR5055K1Z5','risk_level':'LOW','compliance_score':98},
        {'id':'VEND-05','name':'Patel Enterprises & Tech','gstin':'24AAECR0987K1Z8','risk_level':'MEDIUM','compliance_score':84},
        {'id':'VEND-06','name':'Maheshwari Traders','gstin':'27AABCU9603R1ZM','risk_level':'CRITICAL','compliance_score':45},
    ]
    invoices = [
        {'id':'INV-2025-4821','invoice_number':'INV-2025-4821','invoice_date':'2025-11-15','vendor_id':'VEND-01','vendor_name':'Tata Steel Ltd','vendor_gstin':'27AAACT2727Q1ZV','taxable_value':625000,'cgst':56250,'sgst':56250,'igst':0,'total_gst':112500,'total_value':737500,'gst_taxable_value':625000,'gst_cgst':56250,'gst_sgst':56250,'gst_igst':0,'gst_total_gst':112500,'gst_total_value':737500,'status':'MATCHED','risk_level':'LOW','itc_risk_amount':0,'mismatch_fields':[],'mismatch_explanation':'All core values match.','recommended_action':'Claim eligible ITC.','source':'Seed Data'},
        {'id':'INV-2025-4822','invoice_number':'INV-2025-4822','invoice_date':'2025-11-18','vendor_id':'VEND-02','vendor_name':'Mahindra Parts & Logistics','vendor_gstin':'27AABCM8291M1ZU','taxable_value':100000,'cgst':9000,'sgst':9000,'igst':0,'total_gst':18000,'total_value':118000,'gst_taxable_value':105000,'gst_cgst':9450,'gst_sgst':9450,'gst_igst':0,'gst_total_gst':18900,'gst_total_value':123900,'status':'MISMATCHED','risk_level':'MEDIUM','itc_risk_amount':900,'mismatch_fields':['taxableValue','cgst','sgst','totalGst'],'mismatch_explanation':'Taxable value and GST differ from GSTR-2B.','recommended_action':'Review vendor and restrict excess ITC.','source':'Seed Data'},
        {'id':'INV-2025-4823','invoice_number':'INV-2025-4823','invoice_date':'2025-11-20','vendor_id':'VEND-03','vendor_name':'Singh Electronics & Hardware','vendor_gstin':'29GGGGG1314R9Z6','taxable_value':253333,'cgst':0,'sgst':0,'igst':45600,'total_gst':45600,'total_value':298933,'gst_taxable_value':None,'gst_cgst':None,'gst_sgst':None,'gst_igst':None,'gst_total_gst':None,'gst_total_value':None,'status':'MISSING','risk_level':'HIGH','itc_risk_amount':45600,'mismatch_fields':['missing_in_gstr2b'],'mismatch_explanation':'Invoice is absent from GSTR-2B.','recommended_action':'Hold ITC and follow up with vendor.','source':'Seed Data'},
        {'id':'INV-2025-4824','invoice_number':'INV-2025-4824','invoice_date':'2025-11-12','vendor_id':'VEND-04','vendor_name':'Reliance Industries Ltd','vendor_gstin':'27AAACR5055K1Z5','taxable_value':1216111,'cgst':109450,'sgst':109450,'igst':0,'total_gst':218900,'total_value':1435011,'gst_taxable_value':1216111,'gst_cgst':109450,'gst_sgst':109450,'gst_igst':0,'gst_total_gst':218900,'gst_total_value':1435011,'status':'MATCHED','risk_level':'LOW','itc_risk_amount':0,'mismatch_fields':[],'mismatch_explanation':'Values match exactly.','recommended_action':'Proceed with reconciliation.','source':'Seed Data'},
        {'id':'INV-2025-4825','invoice_number':'INV-2025-4825','invoice_date':'2025-11-22','vendor_id':'VEND-05','vendor_name':'Patel Enterprises & Tech','vendor_gstin':'24AAECR0987K1Z8','taxable_value':373333,'cgst':0,'sgst':0,'igst':67200,'total_gst':67200,'total_value':440533,'gst_taxable_value':376666,'gst_cgst':0,'gst_sgst':0,'gst_igst':67800,'gst_total_gst':67800,'gst_total_value':444466,'status':'MISMATCHED','risk_level':'MEDIUM','itc_risk_amount':600,'mismatch_fields':['taxableValue','igst','totalGst'],'mismatch_explanation':'Taxable value and IGST differ.','recommended_action':'Request vendor correction.','source':'Seed Data'},
        {'id':'INV-2025-4826','invoice_number':'INV-2025-4826','invoice_date':'2025-11-25','vendor_id':'VEND-06','vendor_name':'Maheshwari Traders','vendor_gstin':'27AABCU9603R1ZM','taxable_value':233333,'cgst':21000,'sgst':21000,'igst':0,'total_gst':42000,'total_value':275333,'gst_taxable_value':233333,'gst_cgst':21000,'gst_sgst':21000,'gst_igst':0,'gst_total_gst':42000,'gst_total_value':275333,'status':'HIGH_RISK','risk_level':'CRITICAL','itc_risk_amount':42000,'mismatch_fields':['vendor_gstin_suspended','itc_ineligible_flag'],'mismatch_explanation':'Vendor risk flag and ITC ineligibility require review.','recommended_action':'Prohibit ITC until compliance is restored.','source':'Seed Data'},
    ]
    batch = {'id':'REC-847','company_id':'COMP-01','company_name':'Acme Corp India Pvt Ltd','period':'Nov 2025','total_records':16,'matched_count':15,'mismatch_count':1,'missing_count':0,'duplicate_count':0,'high_risk_count':0,'match_rate':94.2,'status':'Completed','duration_seconds':2.1,'variance_amount':900,'rules_applied':20,'logs':['Ingested purchase register','Normalized GSTINs','Compared GSTR-2B','Applied statutory tax rules']}
    notifications = [
        {'id':'NOT-001','title':'Reconciliation completed','message':'REC-847 completed with one mismatch.','severity':'info','read':False},
        {'id':'NOT-002','title':'High ITC risk detected','message':'INV-2025-4826 requires compliance review.','severity':'critical','read':False},
    ]
    # Inserts are intentionally idempotent by checking each table before inserting.
    for table, rows in [('users', users), ('companies', companies), ('vendors', vendors), ('invoices', invoices), ('reconciliation_batches', [batch]), ('notifications', notifications)]:
        if not get_supabase().table(table).select('id').limit(1).execute().data:
            get_supabase().table(table).insert(rows).execute()
