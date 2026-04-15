import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Welcome to Hasab AI</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Usage this month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">128 / 500 min</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Active Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">2</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Credits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">$45.00</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
