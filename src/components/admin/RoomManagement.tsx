import { useState } from "react";
import { useRooms, useAddRoom, useUpdateRoom, useDeleteRoom } from "@/hooks/useRooms";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Image as ImageIcon,
  Loader2,
  CheckCircle2,
  XCircle
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const RoomManagement = () => {
  const { data: rooms, isLoading } = useRooms();
  const addRoom = useAddRoom();
  const updateRoom = useUpdateRoom();
  const deleteRoom = useDeleteRoom();

  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [formData, setFormData] = useState({
    room_number: "",
    room_type: "Standard",
    floor: 1,
    capacity: 2,
    price_per_night: 100,
    status: "available",
    is_active: true,
    image_url: ""
  });

  const filteredRooms = rooms?.filter(room =>
    room.room_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    room.room_type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenModal = (room: any = null) => {
    if (room) {
      setEditingRoom(room);
      setFormData({
        room_number: room.room_number,
        room_type: room.room_type,
        floor: room.floor,
        capacity: room.capacity,
        price_per_night: room.price_per_night,
        status: room.status,
        is_active: room.is_active ?? true,
        image_url: room.image_url || ""
      });
    } else {
      setEditingRoom(null);
      setFormData({
        room_number: "",
        room_type: "Standard",
        floor: 1,
        capacity: 2,
        price_per_night: 100,
        status: "available",
        is_active: true,
        image_url: ""
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.room_number) {
      toast.error("Room number is required");
      return;
    }

    try {
      if (editingRoom) {
        await updateRoom.mutateAsync({ id: editingRoom.id, ...formData });
        toast.success("Room updated successfully");
      } else {
        await addRoom.mutateAsync(formData);
        toast.success("Room added successfully");
      }
      setIsModalOpen(false);
    } catch (error: any) {
      toast.error("Error: " + error.message);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `room-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('rooms')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('rooms')
        .getPublicUrl(filePath);

      setFormData({ ...formData, image_url: publicUrl });
      toast.success("Image uploaded successfully");
    } catch (error: any) {
      toast.error("Upload failed: " + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card variant="elevated">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>Room / Hotel Management</CardTitle>
            <CardDescription>Manage your property listings and room details</CardDescription>
            <Badge variant="outline" className="mt-2 text-[10px] font-bold uppercase tracking-wider">Full CRUD Support</Badge>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search rooms..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button onClick={() => handleOpenModal()} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Room
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="py-20 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /></div>
        ) : (
          <div className="rounded-lg border border-border overflow-hidden">
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
                {filteredRooms?.map((room) => (
                  <TableRow key={room.id}>
                    <TableCell className="font-bold">{room.room_number}</TableCell>
                    <TableCell>{room.room_type}</TableCell>
                    <TableCell>${room.price_per_night}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={
                        room.status === 'available' ? 'border-success text-success' : 'border-warning text-warning'
                      }>
                        {room.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {room.is_active ? (
                        <Badge className="bg-success/20 text-success border-success/30 gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Enabled
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="bg-destructive/20 text-destructive border-destructive/30 gap-1">
                          <XCircle className="h-3 w-3" /> Disabled
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleOpenModal(room)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => {
                            if (window.confirm("Are you sure?")) {
                              deleteRoom.mutate(room.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingRoom ? "Edit Room" : "Add New Room"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="room_number">Room Number</Label>
                <Input
                  id="room_number"
                  value={formData.room_number}
                  onChange={(e) => setFormData({...formData, room_number: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="room_type">Room Type</Label>
                <Select
                  value={formData.room_type}
                  onValueChange={(val) => setFormData({...formData, room_type: val})}
                >
                  <SelectTrigger id="room_type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Standard">Standard</SelectItem>
                    <SelectItem value="Deluxe">Deluxe</SelectItem>
                    <SelectItem value="Suite">Suite</SelectItem>
                    <SelectItem value="Presidential">Presidential</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="floor">Floor</Label>
                <Input
                  id="floor"
                  type="number"
                  value={formData.floor}
                  onChange={(e) => setFormData({...formData, floor: parseInt(e.target.value)})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="capacity">Capacity</Label>
                <Input
                  id="capacity"
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => setFormData({...formData, capacity: parseInt(e.target.value)})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="price">Price / Night</Label>
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
                  <img src={formData.image_url} alt="Room" className="h-20 w-20 object-cover rounded-lg border border-border" />
                ) : (
                  <div className="h-20 w-20 bg-secondary flex items-center justify-center rounded-lg border border-border border-dashed">
                    <ImageIcon className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={isUploading}
                    className="hidden"
                    id="image-upload"
                  />
                  <Label htmlFor="image-upload" className="cursor-pointer">
                    <Button variant="outline" type="button" className="w-full gap-2 pointer-events-none" disabled={isUploading}>
                      {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                      {formData.image_url ? "Change Image" : "Upload Image"}
                    </Button>
                  </Label>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
              <div className="space-y-0.5">
                <Label>Enable Room Listing</Label>
                <p className="text-[10px] text-muted-foreground">Make this room visible to guests and staff</p>
              </div>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({...formData, is_active: checked})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={addRoom.isPending || updateRoom.isPending}>
              {(addRoom.isPending || updateRoom.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingRoom ? "Save Changes" : "Add Room"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
