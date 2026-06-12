import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

import { PageLoader } from "@/components/ui/Spinner";
import { LocationInput } from "@/components/ui/LocationInput";
import { api } from "@/api/client";
import { ArrowLeft, Phone, Mail, Briefcase, Globe } from "lucide-react";
import { SearchableSelect } from "@/components/ui/SearchableSelect";

interface PatientForm {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: "MALE" | "FEMALE";
  phone: string;
  email: string;
  nationality: string;
  nationalId: string;
  address: string;
  city: string;
  occupation: string;
  company: string;
  hearUsFrom: string;
  branch: string;
}

interface OptionItem {
  id: string;
  label: string;
  value: string | null;
}

export function PatientEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Form State ─────────────────────────────────────────────
  const [form, setForm] = useState<PatientForm>({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    gender: "FEMALE",
    phone: "",
    email: "",
    nationality: "",
    nationalId: "",
    address: "",
    city: "",
    occupation: "",
    company: "",
    hearUsFrom: "",
    branch: "",
  });
  const [mrn, setMrn] = useState("");

  // ── Dynamic Options ────────────────────────────────────────
  const [hearFromOptions, setHearFromOptions] = useState<OptionItem[]>([]);
  const [branchOptions, setBranchOptions] = useState<OptionItem[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  // ── Load Existing Patient ──────────────────────────────────
  const loadPatient = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await api.get<{ success: boolean; data: PatientForm & { mrn: string } }>(`/patients/${id}`);
      const p = res.data;
      setMrn(p.mrn);
      setForm({
        firstName: p.firstName || "",
        lastName: p.lastName || "",
        dateOfBirth: p.dateOfBirth ? new Date(p.dateOfBirth).toISOString().split("T")[0] : "",
        gender: p.gender || "FEMALE",
        phone: p.phone || "",
        email: p.email || "",
        nationality: p.nationality || "",
        nationalId: p.nationalId || "",
        address: p.address || "",
        city: p.city || "",
        occupation: p.occupation || "",
        company: p.company || "",
        hearUsFrom: p.hearUsFrom || "",
        branch: p.branch || "",
      });
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to load patient");
    } finally {
      setLoading(false);
    }
  }, [id]);

  // ── Load Dynamic Options ───────────────────────────────────
  useEffect(() => {
    async function loadOptions() {
      try {
        const [hearRes, branchRes] = await Promise.all([
          api.get<{ success: boolean; data: OptionItem[] }>("/selection-options/category/hearUsFrom"),
          api.get<{ success: boolean; data: OptionItem[] }>("/selection-options/category/branch"),
        ]);
        setHearFromOptions(hearRes.data || []);
        setBranchOptions(branchRes.data || []);
      } catch {
        // Fall back to empty
      } finally {
        setLoadingOptions(false);
      }
    }
    loadOptions();
    loadPatient();
  }, [loadPatient]);

  const handleChange = (field: keyof PatientForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // ── Submit ─────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.firstName.trim() || !form.lastName.trim() || !form.dateOfBirth || !form.phone.trim()) {
      setError("First name, last name, date of birth, and phone are required");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        dateOfBirth: new Date(form.dateOfBirth).toISOString(),
        email: form.email || undefined,
        nationalId: form.nationalId || undefined,
      };
      await api.put(`/patients/${id}`, payload);
      navigate(`/patients/${id}`);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to update patient");
    } finally {
      setSaving(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────
  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to={`/patients/${id}`} className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Patient</h1>
          <p className="text-sm text-gray-500 mt-1">
            {form.firstName} {form.lastName}
            {mrn && <span className="text-gray-400"> · <code className="font-mono bg-gray-100 px-1 py-0.5 rounded">{mrn}</code></span>}
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-700">{error}</div>
      )}

      <form onSubmit={handleSubmit}>
        <Card>
          <div className="space-y-6">
            {/* Demographics */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Demographics</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Input label="First Name *" value={form.firstName} onChange={(e) => handleChange("firstName", e.target.value)} placeholder="Enter first name" required />
                <Input label="Last Name *" value={form.lastName} onChange={(e) => handleChange("lastName", e.target.value)} placeholder="Enter last name" required />
                <Input label="Date of Birth *" type="date" value={form.dateOfBirth} onChange={(e) => handleChange("dateOfBirth", e.target.value)} required />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gender *</label>
                  <select value={form.gender} onChange={(e) => handleChange("gender", e.target.value)} className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" required>
                    <option value="FEMALE">Female</option>
                    <option value="MALE">Male</option>
                  </select>
                </div>
                <Input label="Nationality" value={form.nationality} onChange={(e) => handleChange("nationality", e.target.value)} placeholder="e.g., UAE, Egyptian" icon={<Globe className="w-4 h-4 text-gray-400" />} />
                <Input label="National ID" value={form.nationalId} onChange={(e) => handleChange("nationalId", e.target.value)} placeholder="Emirates ID / Passport" />
              </div>
            </div>

            {/* Contact */}
            <div className="border-t border-gray-100 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Phone *" type="tel" value={form.phone} onChange={(e) => handleChange("phone", e.target.value)} placeholder="+971 XX XXX XXXX" icon={<Phone className="w-4 h-4 text-gray-400" />} required />
                <Input label="Email" type="email" value={form.email} onChange={(e) => handleChange("email", e.target.value)} placeholder="patient@email.com" icon={<Mail className="w-4 h-4 text-gray-400" />} />
              </div>
              <div className="mt-4">
                <LocationInput
                  address={form.address}
                  onAddressChange={(val) => handleChange("address", val)}
                  city={form.city}
                  onCityChange={(val) => handleChange("city", val)}
                />
              </div>
            </div>

            {/* Additional Info */}
            <div className="border-t border-gray-100 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Occupation" value={form.occupation} onChange={(e) => handleChange("occupation", e.target.value)} placeholder="e.g., Teacher, Engineer" icon={<Briefcase className="w-4 h-4 text-gray-400" />} />
                <Input label="Company/Employer" value={form.company} onChange={(e) => handleChange("company", e.target.value)} placeholder="Company name (for insurance)" />

                {/* How did you hear about us — dynamic */}
                <SearchableSelect
                  label="How did you hear about us?"
                  options={hearFromOptions}
                  value={form.hearUsFrom}
                  onChange={(val) => handleChange("hearUsFrom", val)}
                  placeholder="Select..."
                  loading={loadingOptions}
                />

                {/* Branch — dynamic */}
                <SearchableSelect
                  label="Branch"
                  options={branchOptions}
                  value={form.branch}
                  onChange={(val) => handleChange("branch", val)}
                  placeholder="Select branch..."
                  loading={loadingOptions}
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-6 border-t border-gray-100 mt-6">
            <Link to={`/patients/${id}`}>
              <Button type="button" variant="outline">Cancel</Button>
            </Link>
            <Button type="submit" isLoading={saving}>
              {saving ? "Saving Changes..." : "Save Changes"}
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}