import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Award, TrendingUp, Users, Star } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const mockReviews = [
  { id: "1", employeeName: "John Smith", department: "Front Desk", lastReview: "2023-12-15", rating: 4.5, nextReview: "2024-06-15", status: "Completed" },
  { id: "2", employeeName: "Sarah Johnson", department: "Housekeeping", lastReview: "2023-11-20", rating: 4.8, nextReview: "2024-05-20", status: "Pending" },
  { id: "3", employeeName: "Mike Brown", department: "F&B", lastReview: "2023-10-10", rating: 4.2, nextReview: "2024-04-10", status: "Overdue" },
];

export const PerformanceReviews = () => {
  return (
    <div className="space-y-6">
      <Card variant="elevated">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Performance Reviews
              </CardTitle>
              <CardDescription>Track and manage employee performance assessments</CardDescription>
            </div>
            <Button variant="gold" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              New Review
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Average Rating</p>
                  <p className="text-2xl font-bold text-primary">4.5 / 5.0</p>
                </div>
                <Star className="h-8 w-8 text-primary fill-primary/20" />
              </CardContent>
            </Card>
            <Card className="bg-amber-500/5 border-amber-500/20">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Reviews</p>
                  <p className="text-2xl font-bold text-amber-500">5</p>
                </div>
                <Users className="h-8 w-8 text-amber-500" />
              </CardContent>
            </Card>
            <Card className="bg-destructive/5 border-destructive/20">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Overdue</p>
                  <p className="text-2xl font-bold text-destructive">2</p>
                </div>
                <Award className="h-8 w-8 text-destructive" />
              </CardContent>
            </Card>
          </div>

          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Last Review</TableHead>
                  <TableHead>Next Review</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockReviews.map((review) => (
                  <TableRow key={review.id}>
                    <TableCell className="font-medium">{review.employeeName}</TableCell>
                    <TableCell>{review.department}</TableCell>
                    <TableCell className="text-muted-foreground">{review.lastReview}</TableCell>
                    <TableCell className="text-muted-foreground">{review.nextReview}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-primary">
                        <Star className="h-3 w-3 fill-primary" />
                        <span>{review.rating}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          review.status === "Completed" ? "bg-success/10 text-success border-success/30" :
                          review.status === "Pending" ? "bg-amber-500/10 text-amber-500 border-amber-500/30" :
                          "bg-destructive/10 text-destructive border-destructive/30"
                        }
                      >
                        {review.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">View</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
