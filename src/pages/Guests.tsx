import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Plus, Mail, Phone, Star, Grid, List } from "lucide-react";
import { useGuests, Guest } from "@/hooks/useGuests";
import { DataTable, Column } from "@/components/ui/data-table";
import { TableSkeleton } from "@/components/skeletons";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const statusColors = {
  vip: "bg-primary/20 text-primary border-primary/30",
  regular: "bg-secondary text-secondary-foreground border-border",
  new: "bg-success/20 text-success border-success/30",
};

const getGuestStatus = (guest: Guest): "vip" | "regular" | "new" => {
  if (guest.is_vip) return "vip";
  if ((guest.total_visits || 0) <= 1) return "new";
  return "regular";
};

const Guests = () => {
  const { data: guests = [], isLoading } = useGuests();
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  const columns: Column<Guest>[] = [
    {
      key: "first_name",
      header: "Guest",
      render: (guest) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-gradient-gold text-primary-foreground text-xs">
              {guest.first_name[0]}{guest.last_name[0]}
            </AvatarFallback>
          </Avatar>
          <div>
            <span className="font-medium flex items-center gap-2">
              {guest.first_name} {guest.last_name}
              {guest.is_vip && <Star className="h-3 w-3 text-primary fill-primary" />}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "email",
      header: "Email",
      render: (guest) => (
        <span className="text-muted-foreground">{guest.email || "-"}</span>
      ),
    },
    {
      key: "phone",
      header: "Phone",
      render: (guest) => (
        <span className="text-muted-foreground">{guest.phone || "-"}</span>
      ),
    },
    {
      key: "total_visits",
      header: "Visits",
      render: (guest) => (
        <span className="font-semibold">{guest.total_visits || 0}</span>
      ),
    },
    {
      key: "total_spending",
      header: "Total Spent",
      render: (guest) => (
        <span className="font-semibold text-primary">
          ${(guest.total_spending || 0).toLocaleString()}
        </span>
      ),
    },
    {
      key: "is_vip",
      header: "Status",
      sortable: false,
      render: (guest) => {
        const status = getGuestStatus(guest);
        return (
          <Badge variant="outline" className={statusColors[status]}>
            {status.toUpperCase()}
          </Badge>
        );
      },
    },
  ];

  return (
    <MainLayout title="Guests" subtitle="Manage guest profiles and preferences">
      <ErrorBoundary>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("grid")}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "table" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("table")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          <Button variant="gold" size="sm" className="gap-2 w-full sm:w-auto">
            <Plus className="h-4 w-4" />
            Add Guest
          </Button>
        </div>

        {isLoading ? (
          <TableSkeleton columns={6} rows={5} />
        ) : viewMode === "table" ? (
          <Card variant="elevated">
            <CardHeader>
              <CardTitle>All Guests</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                data={guests}
                columns={columns}
                keyExtractor={(guest) => guest.id}
                searchPlaceholder="Search guests..."
                emptyMessage="No guests found."
                pageSize={10}
              />
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {guests.map((guest, index) => {
              const status = getGuestStatus(guest);
              return (
                <Card
                  key={guest.id}
                  variant="elevated"
                  className="animate-slide-up hover:shadow-glow transition-all cursor-pointer"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback className="bg-gradient-gold text-primary-foreground font-semibold">
                            {guest.first_name[0]}{guest.last_name[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold text-foreground flex items-center gap-2">
                            {guest.first_name} {guest.last_name}
                            {guest.is_vip && <Star className="h-4 w-4 text-primary fill-primary" />}
                          </h3>
                          <Badge variant="outline" className={statusColors[status]}>
                            {status.toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-4 w-4" />
                        {guest.email || "-"}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        {guest.phone || "-"}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                      <div>
                        <p className="text-xs text-muted-foreground">Visits</p>
                        <p className="text-lg font-semibold text-foreground">{guest.total_visits || 0}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Total Spent</p>
                        <p className="text-lg font-semibold text-primary">
                          ${(guest.total_spending || 0).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {guests.length === 0 && (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                No guests found
              </div>
            )}
          </div>
        )}
      </ErrorBoundary>
    </MainLayout>
  );
};

export default Guests;
