import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { api } from "@/api/client";
import {
  ArrowLeft, Search, DollarSign,
  CalendarDays, Plus, X, Save, Building2,
  CheckCircle,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────

interface PatientResult {
  id: string;
  firstName: string;
  lastName: string;
  mrn: string;
  phone: string;
  gender: string;
}

interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
}

const CURRENCIES = ["AED", "USD", "EUR", "GBP", "SAR", "QAR", "KWD", "BHD"];

// ── Component ──────────────────────────────────────────────────

export function InvoiceCreate() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Patient Search ──────────────────────────────────────────
  const [patientSearch, setPatientSearch] = useState("");
  const [patients, setPatients] = useState<PatientResult[]>([]);
  const [searchingPatients, setSearchingPatients] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<PatientResult | null>(null);

  // ── Invoice Fields ──────────────────────────────────────────
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split("T")[0];
  });
  const [branch, setBranch] = useState("");
  const [currency, setCurrency] = useState("AED");
  const [vatRate, setVatRate] = useState("0.05");
  const [discountAmount, setDiscountAmount] = useState("");
  const [insuranceClaim, setInsuranceClaim] = useState(false);
  const [notes, setNotes] = useState("");

  // ── Line Items ──────────────────────────────────────────────
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { description: "", quantity: 1, unitPrice: 0 },
  ]);

  // ── Search Patients ─────────────────────────────────────────
  const searchPatients = useCallback(async (query: string) => {
    if (query.length < 2) {
      setPatients([]);
      return;
    }
    setSearchingPatients(true);
    try {
      const res = await api.get<{ success: boolean; data: PatientResult[] }>(
        `/patients/search?query=${encodeURIComponent(query)}&limit=10`,
      );
      setPatients(res.data || []);
    } catch {
      setPatients([]);
    } finally {
      setSearchingPatients(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => searchPatients(patientSearch), 400);
    return () => clearTimeout(timer);
  }, [patientSearch, searchPatients]);

  // ── Line Item Operations ────────────────────────────────────
  const addLineItem = () => {
    setLineItems([...lineItems, { description: "", quantity: 1, unitPrice: 0 }]);
  };

  const updateLineItem = (index: number, field: keyof LineItem, value: string | number) => {
    const updated = [...lineItems];
    (updated[index] as Record<string, unknown>)[field] = typeof value === "string" && field !== "description"
      ? parseFloat(value) || 0
      : value;
    setLineItems(updated);
  };

  const removeLineItem = (index: number) => {
    if (lineItems.length <= 1) return;
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  // ── Calculations ────────────────────────────────────────────
  const subTotal = lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const vat = subTotal * (parseFloat(vatRate) || 0);
  const discount = parseFloat(discountAmount) || 0;
  const totalAmount = subTotal + vat - discount;

  // ── Submit ──────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedPatient) {
      setError("Please select a patient");
      return;
    }

    const validItems = lineItems.filter(
      (item) => item.description.trim() && item.quantity > 0 && item.unitPrice > 0,
    );
    if (validItems.length === 0) {
      setError("At least one line item with description, quantity, and price is required");
      return;
    }

    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        patientId: selectedPatient.id,
        dueDate: new Date(dueDate).toISOString(),
        currency,
        vatRate: parseFloat(vatRate) || 0,
        lineItems: validItems.map((item) => ({
          description: item.description.trim(),
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
      };
      if (branch) payload.branch = branch;
      if (discount > 0) payload.discountAmount = discount;
      if (insuranceClaim) payload.insuranceClaim = true;
      if (notes.trim()) payload.notes = notes.trim();

      const res = await api.post<{ success: boolean; data: { id: string; invoiceNumber: string } }>(
        "/invoices",
        payload,
      );
      navigate(`/billing/${res.data.id}`);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to create invoice");
    } finally {
      setSaving(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────
  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/billing" className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create Invoice</h1>
          <p className="text-sm text-gray-500 mt-1">Generate a new invoice for a patient</p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-700">{error}</div>
      )}

      <form onSubmit={handleSubmit}>
        {/* ── Patient Selection ──────────────────────────────── */}
        <Card>
          <CardHeader title="Patient" subtitle="Search and select the patient to invoice" />
          <div className="space-y-3">
            {!selectedPatient ? (
              <>
                <div className="relative max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name, MRN, or phone..."
                    value={patientSearch}
                    onChange={(e) => setPatientSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    autoFocus
                  />
                </div>

                {searchingPatients && (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Spinner size={16} /> Searching...
                  </div>
                )}

                {patients.length > 0 && (
                  <div className="space-y-2">
                    {patients.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => setSelectedPatient(p)}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-primary-50 cursor-pointer transition-colors border border-transparent hover:border-primary-200"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                            <span className="text-sm font-semibold text-primary-700">
                              {p.firstName[0]}{p.lastName[0]}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{p.firstName} {p.lastName}</p>
                            <p className="text-xs text-gray-500">{p.mrn} | {p.phone} | {p.gender === "FEMALE" ? "Female" : "Male"}</p>
                          </div>
                        </div>
                        <Badge variant="success" size="sm">Select</Badge>
                      </div>
                    ))}
                  </div>
                )}

                {!searchingPatients && patientSearch.length >= 2 && patients.length === 0 && (
                  <div className="text-center py-6 text-gray-400 text-sm">
                    No patients found matching "{patientSearch}"
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {selectedPatient.firstName} {selectedPatient.lastName}
                    </p>
                    <p className="text-xs text-gray-500">{selectedPatient.mrn} | {selectedPatient.phone}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => { setSelectedPatient(null); setPatientSearch(""); setPatients([]); }}
                  className="p-1 text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </Card>

        {/* ── Invoice Metadata ───────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <Card>
            <CardHeader title="Invoice Details" />
            <div className="space-y-4">
              <Input
                label="Due Date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                icon={<CalendarDays className="w-4 h-4 text-gray-400" />}
                required
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                <div className="flex flex-wrap gap-2">
                  {CURRENCIES.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCurrency(c)}
                      className={`px-3 py-1.5 text-sm rounded-lg border transition-colors cursor-pointer ${
                        currency === c
                          ? "border-primary-500 bg-primary-50 text-primary-700 font-medium"
                          : "border-gray-200 text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
              <Input
                label="Branch"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                placeholder="e.g., Main Clinic, Dubai Branch"
                icon={<Building2 className="w-4 h-4 text-gray-400" />}
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="VAT Rate"
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={vatRate}
                  onChange={(e) => setVatRate(e.target.value)}
                  placeholder="e.g. 0.05"
                  helperText="As decimal (5% = 0.05)"
                />
                <Input
                  label="Discount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(e.target.value)}
                  placeholder="0"
                  icon={<DollarSign className="w-4 h-4 text-gray-400" />}
                />
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <input
                  type="checkbox"
                  id="insuranceClaim"
                  checked={insuranceClaim}
                  onChange={(e) => setInsuranceClaim(e.target.checked)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <label htmlFor="insuranceClaim" className="text-sm text-gray-700 cursor-pointer">
                  Insurance Claim
                </label>
              </div>
            </div>
          </Card>

          {/* ── Line Items ─────────────────────────────────────── */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <CardHeader title="Line Items" subtitle="Add services or products" />
              <Button type="button" size="sm" variant="outline" onClick={addLineItem} icon={<Plus className="w-3.5 h-3.5" />}>
                Add Item
              </Button>
            </div>
            <div className="space-y-3">
              {lineItems.map((item, i) => (
                <div key={i} className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="flex items-start gap-2">
                    <div className="flex-1 space-y-2">
                      <input
                        type="text"
                        placeholder="Description (e.g., ICSI Procedure)"
                        value={item.description}
                        onChange={(e) => updateLineItem(i, "description", e.target.value)}
                        className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                      />
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <label className="text-xs text-gray-500">Qty</label>
                          <input
                            type="number"
                            min={1}
                            value={item.quantity || ""}
                            onChange={(e) => updateLineItem(i, "quantity", e.target.value)}
                            className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                          />
                        </div>
                        <div className="flex-1">
                          <label className="text-xs text-gray-500">Unit Price ({currency})</label>
                          <input
                            type="number"
                            step="0.01"
                            min={0}
                            value={item.unitPrice || ""}
                            onChange={(e) => updateLineItem(i, "unitPrice", e.target.value)}
                            className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                          />
                        </div>
                        <div className="flex-1">
                          <label className="text-xs text-gray-500">Total</label>
                          <p className="text-sm font-medium text-gray-900 pt-1.5">
                            {currency} {(item.quantity * item.unitPrice).toLocaleString()}
                          </p>
                        </div>
                        {lineItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeLineItem(i)}
                            className="p-1.5 mt-4 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* ── Summary ─────────────────────────────────────────── */}
        <Card>
          <CardHeader title="Summary" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500">Subtotal</p>
              <p className="text-lg font-bold text-gray-900">{currency} {subTotal.toLocaleString()}</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500">VAT ({(parseFloat(vatRate) * 100).toFixed(1)}%)</p>
              <p className="text-lg font-bold text-gray-900">{currency} {vat.toLocaleString()}</p>
            </div>
            {discount > 0 && (
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500">Discount</p>
                <p className="text-lg font-bold text-rose-600">-{currency} {discount.toLocaleString()}</p>
              </div>
            )}
            <div className="text-center p-3 bg-primary-50 rounded-lg border border-primary-200">
              <p className="text-xs text-primary-600 font-medium">Total Amount</p>
              <p className="text-lg font-bold text-primary-700">{currency} {totalAmount.toLocaleString()}</p>
            </div>
          </div>
        </Card>

        {/* ── Notes ───────────────────────────────────────────── */}
        <Card>
          <CardHeader title="Notes (Optional)" subtitle="Additional invoice notes" />
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Payment terms, special instructions, or any additional information..."
            rows={3}
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
          />
        </Card>

        {/* ── Actions ─────────────────────────────────────────── */}
        <div className="flex gap-3 justify-end">
          <Link to="/billing">
            <Button type="button" variant="outline">Cancel</Button>
          </Link>
          <Button type="submit" isLoading={saving} icon={<Save className="w-4 h-4" />}>
            {saving ? "Creating Invoice..." : "Create Invoice"}
          </Button>
        </div>
      </form>
    </div>
  );
}
