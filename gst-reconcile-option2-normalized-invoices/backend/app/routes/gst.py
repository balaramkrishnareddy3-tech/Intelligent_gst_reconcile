
from fastapi import APIRouter, Query
from ..db import select
from ..utils import now_iso, uid

router = APIRouter(prefix='/api/gst', tags=['GST Data'])

@router.get('/gstr2b')
def gstr2b(gstin: str = 'DEMO-GSTIN', period: str = '112025', vendor_id: str | None = None):
    filters = {'vendor_id': vendor_id} if vendor_id else None
    rows = select('invoices', filters=filters, order_by='created_at', descending=True, limit=5000)
    records = []
    for r in rows:
        if r.get('gst_taxable_value') is not None:
            taxable = float(r.get('gst_taxable_value') or 0)
            cgst = float(r.get('gst_cgst') or 0)
            sgst = float(r.get('gst_sgst') or 0)
            igst = float(r.get('gst_igst') or 0)
            total_gst = float(r.get('gst_total_gst') or (cgst + sgst + igst))
            total_value = float(r.get('gst_total_value') or (taxable + total_gst))
        else:
            # Demo statement: uploaded purchase/outward invoice data becomes the statement source.
            taxable = float(r.get('taxable_value') or 0)
            cgst = float(r.get('cgst') or 0)
            sgst = float(r.get('sgst') or 0)
            igst = float(r.get('igst') or 0)
            total_gst = float(r.get('total_gst') or (cgst + sgst + igst))
            total_value = float(r.get('total_value') or (taxable + total_gst))
        records.append({
            'invoice_id': r.get('id'),
            'vendor_gstin': r.get('vendor_gstin'),
            'vendor_name': r.get('vendor_name'),
            'invoice_number': r.get('invoice_number'),
            'invoice_date': r.get('invoice_date'),
            'taxable_value': taxable,
            'cgst': cgst,
            'sgst': sgst,
            'igst': igst,
            'total_gst': total_gst,
            'total_value': total_value,
            'itc_available': True,
        })

    return {
        'gstin': gstin,
        'period': period,
        'period_label': f'{period[0:2]}/{period[2:]}' if len(period) == 6 else period,
        'generated_at': now_iso(),
        'request_id': uid('GSTR2B'),
        'source': 'DEMO-GSTR2B-FROM-SUPABASE-UPLOADS',
        'records': records,
        'summary': {
            'suppliers': len({r['vendor_gstin'] for r in records if r['vendor_gstin']}),
            'invoices': len(records),
            'total_taxable': round(sum(r['taxable_value'] for r in records), 2),
            'total_cgst': round(sum(r['cgst'] for r in records), 2),
            'total_sgst': round(sum(r['sgst'] for r in records), 2),
            'total_igst': round(sum(r['igst'] for r in records), 2),
            'total_tax': round(sum(r['total_gst'] for r in records), 2),
            'total_value': round(sum(r['total_value'] for r in records), 2),
        }
    }

@router.get('/gstr1')
def gstr1(period: str = '112025'):
    rows = select('invoices')
    records = [{k:r.get(k) for k in ['vendor_gstin','vendor_name','invoice_number','invoice_date','taxable_value','cgst','sgst','igst','total_gst','total_value']} for r in rows]
    return {'period':period,'source':'DEMO-GSTR1','records':records}

@router.get('/gstr3b')
def gstr3b(period: str = '112025'):
    rows=select('invoices')
    tax=sum(float(r.get('total_gst') or 0) for r in rows)
    risk=sum(float(r.get('itc_risk_amount') or 0) for r in rows)
    return {'period':period,'source':'DEMO-GSTR3B','summary':{'tax_liability':tax,'itc_at_risk':risk}}
