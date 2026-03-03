import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Folder,
  File,
  Upload,
  Search,
  MoreVertical,
  Plus,
  Settings,
  HardDrive
} from "lucide-react";
import { Input } from "@/components/ui/input";

const MOCK_BUCKETS = [
  { name: "avatars", size: "156 MB", files: 1245, public: true },
  { name: "room-images", size: "840 MB", files: 450, public: true },
  { name: "documents", size: "2.1 GB", files: 890, public: false },
  { name: "backups", size: "12 GB", files: 24, public: false },
];

export const StorageManager = () => {
  const [buckets, setBuckets] = useState(MOCK_BUCKETS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBuckets = async () => {
      try {
        const response = await fetch("http://localhost:3001/api/storage/buckets");
        if (response.ok) {
          const data = await response.json();
          if (data && data.length > 0) {
            setBuckets(data);
          }
        }
      } catch (error) {
        console.error("Failed to fetch buckets from custom backend:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBuckets();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Buckets</h2>
        <Button className="gap-2" onClick={() => toast.info("New Bucket creation coming soon.")}>
          <Plus className="h-4 w-4" /> New Bucket
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {buckets.map((bucket) => (
          <Card key={bucket.name} className="group hover:border-primary/50 transition-colors cursor-pointer" variant="elevated">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Folder className="h-5 w-5 text-primary" />
                </div>
                <div className="flex items-center gap-2">
                  {bucket.public ? (
                    <Badge variant="success" className="text-[10px] uppercase">Public</Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] uppercase">Private</Badge>
                  )}
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <CardTitle className="mt-4">{bucket.name}</CardTitle>
              <CardDescription className="flex items-center gap-2">
                <HardDrive className="h-3 w-3" />
                {bucket.size} • {bucket.files} files
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="secondary" size="sm" className="w-full gap-2">
                Explore Files
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card variant="elevated">
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <File className="h-5 w-5 text-primary" />
              File Explorer
            </CardTitle>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search files..." className="pl-9 h-9" />
              </div>
              <Button size="sm" className="gap-2">
                <Upload className="h-4 w-4" /> Upload
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="py-20 text-center bg-secondary/20 rounded-b-lg border-t border-sidebar-border">
          <div className="flex flex-col items-center gap-3">
            <div className="p-4 bg-muted rounded-full">
              <Folder className="h-10 w-10 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">Select a bucket to view files</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
