import { useState } from "react";
import { useRooms, useRoomMutations, Room } from "@/hooks/useRooms";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Plus, Edit, Trash2, Loader2, Layout, Search, Camera, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const RoomManagement = () => {
  const { data: rooms, isLoading } = useRooms();
  const { addRoom, updateRoom, deleteRoom, toggleRoomActive } = useRoomMutations();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const [formData, setFormData] = useState({
    room_number: "",
    room_type: "",
    floor: 1,
    capacity: 2,
    price_per_night: 100,
    description: "",
    image_url: "" as string | null,
  });

  const handleOpenAdd = () => {
    setEditingRoom(null);
    setFormData({
      room_number: "",
      room_type: "",
      floor: 1,
      capacity: 2,
      price_per_night: 100,
      description: "",
      image_url: null,
    });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (room: Room) => {
    setEditingRoom(room);
    setFormData({
      room_number: room.room_number,
      room_type: room.room_type,
      floor: room.floor,
      capacity: room.capacity,
      price_per_night: room.price_per_night,
      description: room.description || "",
      image_url: room.image_url || null,
    });
    setIsDialogOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `room-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('rooms')
        .upload(filePath, file);

      if (uploadError) {
        // If bucket doesn't exist, we might need to handle it or use a default
        throw new Error("Failed to upload image. Please ensure the 'rooms' bucket exists.");
      }

      const { data: { publicUrl } } = supabase.storage
        .from('rooms')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, image_url: publicUrl }));
      toast.success("Image uploaded successfully");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      if (editingRoom) {
        await updateRoom.mutateAsync({ id: editingRoom.id, ...formData });
        toast.success("Room updated successfully");
      } else {
        await addRoom.mutateAsync(formData);
        toast.success("Room added successfully");
      }
      setIsDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to save room");
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this room?")) {
      try {
        await deleteRoom.mutateAsync(id);
        toast.success("Room deleted successfully");
      } catch (error: any) {
        toast.error(error.message || "Failed to delete room");
      }
    }
  };

  const filteredRooms = rooms?.filter(r =>
    r.room_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.room_type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Card variant="elevated">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Layout className="h-5 w-5" />
              Room / Hotel Management
            </CardTitle>
            <CardDescription>
              Manage room listings, prices, and status. <Badge variant="outline" className="ml-1">Full CRUD support</Badge>
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search rooms..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button onClick={handleOpenAdd} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Room
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Room Number</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Image</TableHead>
                  <TableHead>Floor</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRooms?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No rooms found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRooms?.map((room) => (
                    <TableRow key={room.id}>
                      <TableCell className="font-bold">{room.room_number}</TableCell>
                      <TableCell className="capitalize">{room.room_type}</TableCell>
                      <TableCell>
                        {room.image_url ? (
                          <img src={room.image_url} alt="Room" className="h-10 w-16 object-cover rounded border" />
                        ) : (
                          <div className="h-10 w-16 bg-muted flex items-center justify-center rounded border">
                            <ImageIcon className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{room.floor}</TableCell>
                      <TableCell>{room.capacity}</TableCell>
                      <TableCell>${room.price_per_night}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {room.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={room.is_active !== false}
                          onCheckedChange={(checked) => toggleRoomActive.mutate({ id: room.id, is_active: checked })}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(room)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(room.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingRoom ? "Edit Room" : "Add New Room"}</DialogTitle>
            <DialogDescription>
              Enter the details for the room listing below.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="room_number">Room Number</Label>
                <Input
                  id="room_number"
                  value={formData.room_number}
                  onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
                  placeholder="101"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="room_type">Room Type</Label>
                <Input
                  id="room_type"
                  value={formData.room_type}
                  onChange={(e) => setFormData({ ...formData, room_type: e.target.value })}
                  placeholder="Deluxe"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="floor">Floor</Label>
                <Input
                  id="floor"
                  type="number"
                  value={formData.floor}
                  onChange={(e) => setFormData({ ...formData, floor: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="capacity">Capacity</Label>
                <Input
                  id="capacity"
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Price / Night</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price_per_night}
                  onChange={(e) => setFormData({ ...formData, price_per_night: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Beautiful room with ocean view..."
              />
            </div>

            <div className="space-y-2">
              <Label>Room Image</Label>
              <div className="flex items-center gap-4">
                {formData.image_url ? (
                  <div className="relative h-20 w-32 rounded border overflow-hidden">
                    <img src={formData.image_url} alt="Room" className="h-full w-full object-cover" />
                    <button
                      onClick={() => setFormData(prev => ({ ...prev, image_url: null }))}
                      className="absolute top-0 right-0 bg-destructive text-white p-1"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <div className="h-20 w-32 bg-muted rounded border flex items-center justify-center">
                    <Camera className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <div className="flex flex-col gap-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="room-image-upload"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('room-image-upload')?.click()}
                    disabled={isUploading}
                  >
                    {isUploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                    Upload Image
                  </Button>
                  <p className="text-[10px] text-muted-foreground">JPG/PNG, Max 2MB</p>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={addRoom.isPending || updateRoom.isPending}>
              {(addRoom.isPending || updateRoom.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingRoom ? "Update Room" : "Add Room"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
