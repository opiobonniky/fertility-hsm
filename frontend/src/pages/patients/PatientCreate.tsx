import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";

import { LocationInput } from "@/components/ui/LocationInput";
import { api } from "@/api/client";
import { ArrowLeft, UserCheck, Phone, Mail, Briefcase, Globe, X } from "lucide-react";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { Link } from "react-router-dom";

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

interface SpouseCandidate {
  id: string;
  mrn: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  phone: string;
  gender: string;
}

interface OptionItem {
  id: string;
  label: string;
  value: string | null;
}

const EMPTY_FORM: PatientForm = {
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
};

export function PatientCreate() {
  const navigate = useNavigate();
  const [form, setForm] = useState<PatientForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Dynamic options
  const [hearFromOptions, setHearFromOptions] = useState<OptionItem[]>([]);
  const [branchOptions, setBranchOptions] = useState<OptionItem[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  // Spouse auto-detect
  const [spouseCandidates, setSpouseCandidates] = useState<SpouseCandidate[]>([]);
  const [selectedSpouse, setSelectedSpouse] = useState<SpouseCandidate | null>(null);
  const [searchingSpouse, setSearchingSpouse] = useState(false);

  // ── Load dynamic options ──────────────────────────────────
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
        // Fall back to empty — forms work without dynamic options
      } finally {
        setLoadingOptions(false);
      }
    }
    loadOptions();
  }, []);

  const handleChange = (field: keyof PatientForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // ── Spouse Auto-Detect ─────────────────────────────────────
  const autoDetectSpouse = useCallback(async () => {
    const params: Record<string, string> = { gender: form.gender === "MALE" ? "FEMALE" : "MALE" };
    if (form.phone && form.phone.length >= 6) params.phone = form.phone;
    if (form.nationalId) params.nationalId = form.nationalId;
    if (form.firstName) params.firstName = form.firstName;
    if (form.lastName) params.lastName = form.lastName;

    if (Object.keys(params).length <= 1) return;

    setSearchingSpouse(true);
    try {
      const res = await api.get<{ success: boolean; data: SpouseCandidate[] }>("/patients/detect-spouse", params);
      setSpouseCandidates(res.data || []);
    } catch {
      setSpouseCandidates([]);
    } finally {
      setSearchingSpouse(false);
    }
  }, [form.gender, form.phone, form.nationalId, form.firstName, form.lastName]);

  useEffect(() => {
    if (form.phone.length >= 6 || form.nationalId) {
      const timer = setTimeout(autoDetectSpouse, 500);
      return () => clearTimeout(timer);
    }
  }, [form.phone, form.nationalId, autoDetectSpouse]);

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
      };
      const res = await api.post<{ success: boolean; data: { id: string; mrn: string } }>("/patients", payload);
      setSuccess(`Patient registered successfully! MRN: ${res.data.mrn}`);

      if (selectedSpouse) {
        try {
          await api.post("/couples", {
            wifePatientId: form.gender === "FEMALE" ? res.data.id : selectedSpouse.id,
            husbandPatientId: form.gender === "MALE" ? res.data.id : selectedSpouse.id,
          });
        } catch {
          // Couple linking failed silently
        }
      }

      setTimeout(() => navigate(`/patients`), 1500);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to register patient");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/patients" className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Register New Patient</h1>
          <p className="text-sm text-gray-500 mt-1">Enter patient demographics and contact information</p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-700">{error}</div>
      )}
      {success && (
        <div className="p-4 rounded-lg bg-green-50 border border-green-200 text-sm text-green-700">{success}</div>
      )}

      {/* Spouse Auto-Detect */}
      {spouseCandidates.length > 0 && !selectedSpouse && (
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <UserCheck className="w-5 h-5 text-primary-600" />
            <h3 className="font-semibold text-gray-900">Existing Patient Found — Potential Spouse?</h3>
          </div>
          <p className="text-sm text-gray-600 mb-3">
            We found an existing {form.gender === "MALE" ? "female" : "male"} patient matching your search. Would you like to link them as a couple?
          </p>
          <div className="space-y-2">
            {spouseCandidates.map((candidate) => (
              <div
                key={candidate.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-primary-50 cursor-pointer transition-colors"
                onClick={() => setSelectedSpouse(candidate)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                    <span className="text-sm font-semibold text-primary-700">
                      {candidate.firstName[0]}{candidate.lastName[0]}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{candidate.firstName} {candidate.lastName}</p>
                    <p className="text-xs text-gray-500">MRN: {candidate.mrn} | {candidate.phone}</p>
                  </div>
                </div>
                <Badge variant="success">Select as Spouse</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {selectedSpouse && (
        <Card>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <UserCheck className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">Linked as Couple</p>
                <p className="text-xs text-gray-500">
                  {selectedSpouse.firstName} {selectedSpouse.lastName} ({selectedSpouse.mrn})
                </p>
              </div>
            </div>
            <button onClick={() => setSelectedSpouse(null)} className="p-1 text-gray-400 hover:text-gray-600 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        </Card>
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

              {/* Location with Geoapify */}
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
            <Link to="/patients">
              <Button type="button" variant="outline">Cancel</Button>
            </Link>
            <Button type="submit" isLoading={saving}>
              {saving ? "Registering..." : "Register Patient"}
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}
