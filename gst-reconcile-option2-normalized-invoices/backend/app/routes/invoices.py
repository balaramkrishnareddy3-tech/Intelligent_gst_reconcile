
from fastapi import APIRouter, UploadFile, File, HTTPException, Query
from ..db import select, get_one, insert
from ..schemas import InvoiceCreate
from ..utils import uid, now_iso
from ..parser import parse_invoice_rows

router = APIRouter(prefix='/api/invoices', tags=['Invoices'])

@router.get('')
def list_invoices(status: str | None = None, vendor_id: str | None = None, limit: int = 100):
    rows = select('invoices', filters={'status': status, 'vendor_id': vendor_id},
                  order_by='created_at', descending=True, limit=max(1, min(limit, 1000)))
    return {'count': len(rows), 'items': rows}

@router.get('/{invoice_id}')
def get_invoice(invoice_id: str):
    row = get_one('invoices', {'id': invoice_id})
    if not row:
        raise HTTPException(404, 'Invoice not found')
    return row

@router.post('')
def create_invoice(payload: InvoiceCreate):
    iid = payload.id or uid('INV')
    total_gst = payload.total_gst if payload.total_gst is not None else payload.cgst + payload.sgst + payload.igst
    total_value = payload.total_value if payload.total_value is not None else payload.taxable_value + total_gst
    data = payload.model_dump(exclude_none=True)
    data.update({'id': iid, 'total_gst': total_gst, 'total_value': total_value,
                 'status': 'MISSING', 'risk_level': 'LOW', 'itc_risk_amount': 0,
                 'mismatch_fields': [], 'source': 'API'})
    row = insert('invoices', data)
    return row

@router.post('/upload')
async def upload_invoice_file(
    file: UploadFile = File(...),
    vendor_id: str = Query(default='UPLOAD-VENDOR'),
    vendor_name: str = Query(default='Uploaded Vendor'),
    vendor_gstin: str = Query(default='DEMO-SUPPLIER-GSTIN'),
):
    if not file.filename:
        raise HTTPException(400, 'File name is required')
    content = await file.read()
    if len(content) > 15 * 1024 * 1024:
        raise HTTPException(413, 'File size exceeds 15 MB limit.')

    try:
        parsed = parse_invoice_rows(file.filename, content)
    except Exception as exc:
        raise HTTPException(400, str(exc))

    created = []
    synced = []
    skipped = []
    for row in parsed:
        # Use the uploaded row's supplier details when present; otherwise use the logged-in demo vendor.
        row_vendor_id = vendor_id
        row_vendor_name = row['vendor_name'] or vendor_name
        row_vendor_gstin = row['vendor_gstin'] or vendor_gstin

        existing = get_one('invoices', {'invoice_number': row['invoice_number'], 'vendor_id': row_vendor_id})
        if existing:
            synced.append(existing)
            skipped.append({'invoice_number': row['invoice_number'], 'reason': 'Already exists; existing Supabase record synchronized to the UI'})
            continue

        data = {
            'id': uid('INV'),
            'invoice_number': row['invoice_number'],
            'invoice_date': row['invoice_date'],
            'vendor_id': row_vendor_id,
            'vendor_name': row_vendor_name,
            'vendor_gstin': row_vendor_gstin,
            'taxable_value': row['taxable_value'],
            'cgst': row['cgst'],
            'sgst': row['sgst'],
            'igst': row['igst'],
            'total_gst': row['total_gst'],
            'total_value': row['total_value'],
            'status': 'MISSING',
            'risk_level': 'LOW',
            'itc_risk_amount': 0,
            'mismatch_fields': [],
            'mismatch_explanation': 'Uploaded and stored successfully. Generate the demo GSTR-2B statement to compare this invoice.',
            'recommended_action': 'Generate GSTR-2B and run reconciliation.',
            'source': f'Uploaded: {file.filename}',
        }
        row_result = insert('invoices', data)
        if row_result:
            created.append(row_result)
            synced.append(row_result)

    return {
        'success': True,
        'filename': file.filename,
        'bytes': len(content),
        'count': len(created),
        'skipped_count': len(skipped),
        'items': synced,
        'skipped': skipped,
        'message': f'{len(created)} invoice(s) uploaded and saved to Supabase.'
    }
