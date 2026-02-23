import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { useRooms, useCreateRoom, useUpdateRoom, useDeleteRoom, Room } from "@/hooks/useRooms";
import { Plus, Edit2, Trash2, Eye, EyeOff, Upload, Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { generateSecureRandomString } from "@/utils/security";

export const RoomManagement = () => {
  const { data: rooms = [], isLoading } = useRooms();
  const createRoom = useCreateRoom();
  const updateRoom = useUpdateRoom();
  const deleteRoom = useDeleteRoom();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const [formData, setFormData] = useState<Partial<Room>>({
    room_number: "",
    room_type: "standard",
    floor: 1,
    capacity: 2,
    price_per_night: 100,
    status: "available",
    is_active: true,
    amenities: [],
    image_url: ""
  });

  const handleOpenDialog = (room?: Room) => {
    if (room) {
      setEditingRoom(room);
      setFormData(room);
    } else {
      setEditingRoom(null);
      setFormData({
        room_number: "",
        room_type: "standard",
        floor: 1,
        capacity: 2,
        price_per_night: 100,
        status: "available",
        is_active: true,
        amenities: [],
        image_url: ""
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editingRoom) {
        await updateRoom.mutateAsync({ id: editingRoom.id, ...formData });
        toast.success("Room updated successfully");
      } else {
        await createRoom.mutateAsync(formData as any);
        toast.success("Room created successfully");
      }
      setIsDialogOpen(false);
    } catch (error: any) {
      toast.error("Failed to save room: " + error.message);
    }
  };

  const handleToggleActive = async (room: Room) => {
    try {
      await updateRoom.mutateAsync({ id: room.id, is_active: !room.is_active });
      toast.success(`Room ${room.room_number} ${!room.is_active ? 'enabled' : 'disabled'}`);
    } catch (error: any) {
      toast.error("Failed to update room status");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this room?")) return;
    try {
      await deleteRoom.mutateAsync(id);
      toast.success("Room deleted successfully");
    } catch (error: any) {
      toast.error("Failed to delete room");
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${generateSecureRandomString(8)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('rooms')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('rooms')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, image_url: publicUrl }));
      toast.success("Image uploaded successfully");
    } catch (error: any) {
      toast.error("Error uploading image: " + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const filteredRooms = rooms.filter(r =>
    r.room_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.room_type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search rooms..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button onClick={() => handleOpenDialog()} className="gap-2">
          <Plus className="h-4 w-4" /> Add Room
        </Button>
      </div>

      <div className="border rounded-lg overflow-hidden bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Room</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Visibility</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : filteredRooms.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No rooms found
                </TableCell>
              </TableRow>
            ) : (
              filteredRooms.map((room) => (
                <TableRow key={room.id} className={!room.is_active ? "opacity-50" : ""}>
                  <TableCell className="font-bold">{room.room_number}</TableCell>
                  <TableCell className="capitalize">{room.room_type}</TableCell>
                  <TableCell>${room.price_per_night}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">{room.status}</Badge>
                  </TableCell>
                  <TableCell>
                    {room.is_active ? (
                      <Badge variant="success" className="gap-1">
                        <Eye className="h-3 w-3" /> Visible
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="gap-1">
                        <EyeOff className="h-3 w-3" /> Hidden
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="ghost" size="sm" onClick={() => handleToggleActive(room)}>
                      {room.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleOpenDialog(room)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(room.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingRoom ? "Edit Room" : "Add New Room"}</DialogTitle>
            <DialogDescription>
              Configure room details and visibility settings.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="room_number">Room Number</Label>
                <Input
                  id="room_number"
                  value={formData.room_number}
                  onChange={(e) => setFormData({...formData, room_number: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="room_type">Room Type</Label>
                <Select
                  value={formData.room_type}
                  onValueChange={(val) => setFormData({...formData, room_type: val})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="deluxe">Deluxe</SelectItem>
                    <SelectItem value="suite">Suite</SelectItem>
                    <SelectItem value="presidential">Presidential</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="floor">Floor</Label>
                <Input
                  id="floor"
                  type="number"
                  value={formData.floor}
                  onChange={(e) => setFormData({...formData, floor: parseInt(e.target.value)})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Price per Night</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price_per_night}
                  onChange={(e) => setFormData({...formData, price_per_night: parseFloat(e.target.value)})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Room Image</Label>
              <div className="flex items-center gap-4">
                {formData.image_url ? (
                  <div className="relative h-20 w-20 rounded border overflow-hidden">
                    <img src={formData.image_url} alt="Room" className="h-full w-full object-cover" />
                    <button
                      className="absolute top-0 right-0 bg-destructive text-white p-0.5"
                      onClick={() => setFormData({...formData, image_url: ""})}
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <div className="h-20 w-20 rounded border border-dashed flex items-center justify-center text-muted-foreground">
                    No Image
                  </div>
                )}
                <div className="flex-1">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    disabled={isUploading}
                    className="hidden"
                    id="room-image-upload"
                  />
                  <Label
                    htmlFor="room-image-upload"
                    className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-secondary rounded-md text-sm font-medium hover:bg-secondary/80"
                  >
                    {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    Upload Image
                  </Label>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={createRoom.isPending || updateRoom.isPending}>
              {createRoom.isPending || updateRoom.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save Room
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
