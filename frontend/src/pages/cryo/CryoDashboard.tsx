import { Card, CardHeader } from "@/components/ui/Card";

export function CryoDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Cryo Inventory
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage cryopreserved embryos, sperm, and oocytes
        </p>
      </div>
      <Card>
        <div className="text-center py-12 text-gray-500">
          <p>Cryo inventory module will be displayed here</p>
          <p className="text-sm mt-1">
            Tank management, embryo/sperm/oocyte storage, expiry tracking
          </p>
        </div>
      </Card>
    </div>
  );
}
