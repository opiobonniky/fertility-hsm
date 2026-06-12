import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { api } from "@/api/client";
import { Search, Plus, ChevronLeft, ChevronRight, Users, Phone, MapPin, Calendar } from "lucide-react";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { Link } from "react-router-dom";
import type { Patient } from "@/types";

interface BranchOption {
  id: string;
  label: string;
  value: string | null;
}

export function PatientList() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [branchFilter, setBranchFilter] = useState("");
  const [genderFilter, setGenderFilter] = useState("");
  const [hearUsFromFilter, setHearUsFromFilter] = useState("");
  const [branchOptions, setBranchOptions] = useState<BranchOption[]>([]);
  const [hearUsFromOptions, setHearUsFromOptions] = useState<BranchOption[]>([]);

  const loadPatients = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page, limit: 20 };
      if (search) params.query = search;
      if (branchFilter) params.branch = branchFilter;
      if (genderFilter) params.gender = genderFilter;
      if (hearUsFromFilter) params.hearUsFrom = hearUsFromFilter;

      const res = await api.get<{ success: boolean; data: Patient[]; total: number; totalPages: number }>("/patients/search", params);
      setPatients(res.data || []);
      setTotal(res.total || 0);
      setTotalPages(res.totalPages || 1);
    } catch (err) {
      console.error("Failed to load patients:", err);
      setPatients([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, branchFilter, genderFilter, hearUsFromFilter]);

  useEffect(() => {
    loadPatients();
  }, [loadPatients]);

  // Debounce search
  const [searchInput, setSearchInput] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Load dynamic branch options & hearUsFrom options
  useEffect(() => {
    const loadBranches = async () => {
      try {
        const [branchRes, hearFromRes] = await Promise.all([
          api.get<{ success: boolean; data: BranchOption[] }>("/selection-options/category/branch"),
          api.get<{ success: boolean; data: BranchOption[] }>("/selection-options/category/hearUsFrom"),
        ]);
        setBranchOptions(branchRes.data || []);
        setHearUsFromOptions(hearFromRes.data || []);
      } catch {
        // Fall back to empty — filters work without options
      }
    };
    loadBranches();
  }, []);

  const handleGenderFilter = (gender: string) => {
    setGenderFilter(gender === genderFilter ? "" : gender);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Patients</h1>
          <p className="text-sm text-gray-500 mt-1">Search, view, and manage patient records {total > 0 && `(${total} total)`}</p>
        </div>
        <Link to="/patients/new">
          <Button icon={<Plus className="w-4 h-4" />}>Register Patient</Button>
        </Link>
      </div>

      {/* Search & Filters */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, MRN, phone, or ID..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleGenderFilter("FEMALE")}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${genderFilter === "FEMALE" ? "bg-rose-50 border-rose-200 text-rose-700" : "border-gray-200 text-gray-500 hover:bg-gray-50"}`}
            >
              Female
            </button>
            <button
              onClick={() => handleGenderFilter("MALE")}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${genderFilter === "MALE" ? "bg-blue-50 border-blue-200 text-blue-700" : "border-gray-200 text-gray-500 hover:bg-gray-50"}`}
            >
              Male
            </button>
            <div className="w-48">
              <SearchableSelect
                label=""
                options={[
                  { id: "all-branches", label: "All Branches", value: "" },
                  ...branchOptions.map((b) => ({ ...b, value: b.value || b.label })),
                ]}
                value={branchFilter}
                onChange={(val) => { setBranchFilter(val); setPage(1); }}
                placeholder="All Branches"
              />
            </div>
            <div className="w-48">
              <SearchableSelect
                label=""
                options={[
                  { id: "all-sources", label: "All Sources", value: "" },
                  ...hearUsFromOptions.map((b) => ({ ...b, value: b.value || b.label })),
                ]}
                value={hearUsFromFilter}
                onChange={(val) => { setHearUsFromFilter(val); setPage(1); }}
                placeholder="All Sources"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Patient Table */}
      {loading ? (
        <div className="flex justify-center py-12"><Spinner size={32} /></div>
      ) : patients.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No patients found</p>
            <p className="text-sm text-gray-400 mt-1">{search ? "Try a different search term" : "Register your first patient to get started"}</p>
          </div>
        </Card>
      ) : (
        <Card padding="none">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">MRN</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Patient Name</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Gender</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Phone</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Nationality</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Branch</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Source</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Registered</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {patients.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <code className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-700">{p.mrn}</code>
                    </td>
                    <td className="px-4 py-3">
                      <Link to={`/patients/${p.id}`} className="flex items-center gap-2 hover:text-primary-600 group">
                        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                          <span className="text-xs font-semibold text-primary-700">{p.firstName[0]}{p.lastName[0]}</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 group-hover:text-primary-700 transition-colors">{p.firstName} {p.lastName}</p>
                          {p.email && <p className="text-xs text-gray-400">{p.email}</p>}
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={p.gender === "FEMALE" ? "info" : "neutral"} size="sm">{p.gender === "FEMALE" ? "Female" : "Male"}</Badge>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{p.phone}</td>
                    <td className="px-4 py-3 text-gray-600">{p.nationality || "—"}</td>
                    <td className="px-4 py-3 text-gray-600">{p.branch || "—"}</td>
                    <td className="px-4 py-3 text-gray-600">{p.hearUsFrom || "—"}</td>
                    <td className="px-4 py-3">
                      <Badge variant={p.isActive ? "success" : "danger"} size="sm">{p.isActive ? "Active" : "Inactive"}</Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">{new Date(p.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">Page {page} of {totalPages} ({total} patients)</p>
          <div className="flex gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
