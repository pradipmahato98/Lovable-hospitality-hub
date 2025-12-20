import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, Filter, Plus, Mail, Phone, Star } from "lucide-react";

const guests = [
  {
    id: 1,
    name: "Sarah Johnson",
    email: "sarah.j@email.com",
    phone: "+1 234 567 890",
    visits: 12,
    totalSpent: "$15,680",
    status: "vip",
    lastVisit: "Dec 20, 2024",
  },
  {
    id: 2,
    name: "Michael Chen",
    email: "m.chen@email.com",
    phone: "+1 345 678 901",
    visits: 5,
    totalSpent: "$4,250",
    status: "regular",
    lastVisit: "Dec 18, 2024",
  },
  {
    id: 3,
    name: "Emma Wilson",
    email: "emma.w@email.com",
    phone: "+1 456 789 012",
    visits: 1,
    totalSpent: "$360",
    status: "new",
    lastVisit: "Dec 15, 2024",
  },
  {
    id: 4,
    name: "James Brown",
    email: "j.brown@email.com",
    phone: "+1 567 890 123",
    visits: 8,
    totalSpent: "$9,840",
    status: "vip",
    lastVisit: "Dec 19, 2024",
  },
  {
    id: 5,
    name: "Lisa Anderson",
    email: "lisa.a@email.com",
    phone: "+1 678 901 234",
    visits: 3,
    totalSpent: "$2,100",
    status: "regular",
    lastVisit: "Dec 17, 2024",
  },
  {
    id: 6,
    name: "David Martinez",
    email: "d.martinez@email.com",
    phone: "+1 789 012 345",
    visits: 15,
    totalSpent: "$22,350",
    status: "vip",
    lastVisit: "Dec 20, 2024",
  },
];

const statusColors = {
  vip: "bg-primary/20 text-primary border-primary/30",
  regular: "bg-secondary text-secondary-foreground border-border",
  new: "bg-success/20 text-success border-success/30",
};

const Guests = () => {
  return (
    <MainLayout title="Guests" subtitle="Manage guest profiles and preferences">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search guests..." className="w-full sm:w-48 lg:w-64 pl-9 bg-secondary" />
          </div>
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="h-4 w-4" />
            <span className="hidden sm:inline">Filter</span>
          </Button>
        </div>
        <Button variant="gold" size="sm" className="gap-2 w-full sm:w-auto">
          <Plus className="h-4 w-4" />
          Add Guest
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
        {guests.map((guest, index) => (
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
                      {guest.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-foreground flex items-center gap-2">
                      {guest.name}
                      {guest.status === "vip" && <Star className="h-4 w-4 text-primary fill-primary" />}
                    </h3>
                    <Badge variant="outline" className={statusColors[guest.status as keyof typeof statusColors]}>
                      {guest.status.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  {guest.email}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  {guest.phone}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
                <div>
                  <p className="text-xs text-muted-foreground">Visits</p>
                  <p className="text-lg font-semibold text-foreground">{guest.visits}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Spent</p>
                  <p className="text-lg font-semibold text-primary">{guest.totalSpent}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Last Visit</p>
                  <p className="text-sm font-medium text-foreground">{guest.lastVisit}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </MainLayout>
  );
};

export default Guests;
