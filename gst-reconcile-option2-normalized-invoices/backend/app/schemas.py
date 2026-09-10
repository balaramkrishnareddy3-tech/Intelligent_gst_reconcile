from typing import Any, Optional
from pydantic import BaseModel, Field

class LoginRequest(BaseModel):
    email: str
    password: str

class InvoiceCreate(BaseModel):
    id: Optional[str] = None
    invoice_number: str
    invoice_date: str
    vendor_id: str
    vendor_name: str
    vendor_gstin: str
    taxable_value: float = 0
    cgst: float = 0
    sgst: float = 0
    igst: float = 0
    total_gst: Optional[float] = None
    total_value: Optional[float] = None
    gst_taxable_value: Optional[float] = None
    gst_cgst: Optional[float] = None
    gst_sgst: Optional[float] = None
    gst_igst: Optional[float] = None
    gst_total_gst: Optional[float] = None
    gst_total_value: Optional[float] = None

class ReconciliationRequest(BaseModel):
    invoice_ids: list[str] = Field(default_factory=list)
    tolerance: float = 10
    period: str = "Current"

class FraudRequest(BaseModel):
    invoice_id: str
