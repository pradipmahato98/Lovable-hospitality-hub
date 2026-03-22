import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Ruler, Loader2, Edit, Trash2, ArrowRightLeft, X } from "lucide-react";
import { toast } from "sonner";
import { useItemService } from "@/hooks/inventory/useItemService";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function UoMTab() {
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isConvOpen, setIsConvOpen] = useState(false);
  const { units: unitsQuery, createUoM } = useItemService();

  const uoms = unitsQuery.data || [];
  const isLoading = unitsQuery.isLoading;

  const { data: conversions = [], isLoading: isConversionsLoading } = useQuery({
     queryKey: ["inventory-uom-conversions"],
     queryFn: async () => {
        const { data, error } = await supabase.from('unit_conversions').select('*, from_uom:units!from_unit(unit_name, unit_symbol), to_uom:units!to_unit(unit_name, unit_symbol)');
        if (error) throw error;
        return data;
     }
  });

  const createConversion = useMutation({
     mutationFn: async (payload: any) => {
        const { error } = await supabase.from('unit_conversions').insert(payload);
        if (error) throw error;
     },
     onSuccess: () => queryClient.invalidateQueries({ queryKey: ["inventory-uom-conversions"] })
  });

  const deleteConversion = useMutation({
     mutationFn: async (id: string) => {
        const { error } = await supabase.from('unit_conversions').delete().eq('conversion_id', id);
        if (error) throw error;
     },
     onSuccess: () => queryClient.invalidateQueries({ queryKey: ["inventory-uom-conversions"] })
  });

  const [form, setForm] = useState({ name: "", abbreviation: "" });
  const [convForm, setConvForm] = useState({ from_uom_id: "", to_uom_id: "", conversion_factor: 1 });

  const handleCreate = async () => {
    try {
      await createUoM.mutateAsync({
         unit_name: form.name,
         unit_symbol: form.abbreviation
      });
      toast.success("Unit of measurement created");
      setIsAddOpen(false);
      setForm({ name: "", abbreviation: "" });
    } catch (error: any) {
      console.error("Create UoM error:", error);
      toast.error(error.message || "Failed to create UoM");
    }
  };

  const handleCreateConv = async () => {
    try {
      if (!convForm.from_uom_id || !convForm.to_uom_id) {
        toast.error("Please select both units");
        return;
      }
      await createConversion.mutateAsync(convForm);
      toast.success("Conversion rule added");
      setIsConvOpen(false);
      setConvForm({ from_uom_id: "", to_uom_id: "", conversion_factor: 1 });
    } catch (error: any) {
      console.error("Create conversion error:", error);
      toast.error(error.message || "Failed to add conversion");
    }
  };

  const handleDeleteConv = async (id: string) => {
    try {
      await deleteConversion.mutateAsync(id);
      toast.success("Conversion rule removed");
    } catch (error: any) {
      console.error("Delete conversion error:", error);
      toast.error(error.message || "Failed to remove conversion");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Units of Measurement</h3>
          <p className="text-sm text-muted-foreground">Manage units and conversion factors (e.g., 1 Box = 12 Packets)</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={() => setIsConvOpen(true)}><ArrowRightLeft className="h-4 w-4" />Set Conversions</Button>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild><Button variant="blue" className="gap-2"><Plus className="h-4 w-4" />Add Unit</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add Unit of Measurement</DialogTitle><DialogDescription>Create a new unit for inventory items</DialogDescription></DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2"><Label>Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Kilogram" /></div>
                <div className="space-y-2"><Label>Abbreviation</Label><Input value={form.abbreviation} onChange={(e) => setForm({ ...form, abbreviation: e.target.value })} placeholder="e.g. kg" /></div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                <Button onClick={handleCreate} disabled={!form.name || createUoM.isPending} variant="blue">
                  {createUoM.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-10"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Abbreviation</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {uoms.length === 0 ? (
                    <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">No units found</TableCell></TableRow>
                  ) : (
                    uoms.map((uom: any) => (
                      <TableRow key={uom.unit_id}>
                        <TableCell className="font-medium">{uom.unit_name}</TableCell>
                        <TableCell>{uom.unit_symbol || "-"}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm"><Edit className="h-4 w-4" /></Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Conversions Card */}
        <Card>
          <CardHeader><CardTitle className="text-sm">Active Unit Conversions</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {isConversionsLoading ? (
               <div className="flex justify-center py-4"><Loader2 className="h-4 w-4 animate-spin" /></div>
            ) : conversions.length === 0 ? (
               <p className="text-xs text-muted-foreground text-center py-4">No conversion rules defined</p>
            ) : (
              conversions.map((c) => (
                <div key={c.conversion_id} className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                  <div className="flex items-center gap-3">
                    <Badge variant="blue">1 {c.from_uom?.unit_name}</Badge>
                    <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
                    <Badge variant="outline">{c.conversion_factor} {c.to_uom?.unit_name}</Badge>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteConv(c.conversion_id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              ))
            )}
            <Button variant="link" className="w-full text-xs text-muted-foreground" onClick={() => setIsConvOpen(true)}>Manage all conversions &rarr;</Button>
          </CardContent>
        </Card>
      </div>

      {/* Conversion Dialog */}
      <Dialog open={isConvOpen} onOpenChange={setIsConvOpen}>
        <DialogContent className="max-w-md bg-[#0F172A] border-[#1E293B] text-white">
          <DialogHeader>
             <DialogTitle className="text-xl font-serif">Unit Conversion Setup</DialogTitle>
             <DialogDescription className="text-gray-400">Define how different units relate to each other</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-bold">From Unit</Label>
                <Select value={convForm.from_uom_id} onValueChange={(v) => setConvForm({...convForm, from_uom_id: v})}>
                  <SelectTrigger className="bg-[#1E293B]/50 border-[#334155] h-12"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent className="bg-[#0F172A] border-[#334155] text-white">{uoms.map((u: any) => <SelectItem key={u.unit_id} value={u.unit_id}>{u.unit_name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-bold">To Unit</Label>
                <Select value={convForm.to_uom_id} onValueChange={(v) => setConvForm({...convForm, to_uom_id: v})}>
                  <SelectTrigger className="bg-[#1E293B]/50 border-[#334155] h-12"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent className="bg-[#0F172A] border-[#334155] text-white">{uoms.map((u: any) => <SelectItem key={u.unit_id} value={u.unit_id}>{u.unit_name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Input type="number" value={convForm.conversion_factor} onChange={(e) => setConvForm({...convForm, conversion_factor: Number(e.target.value)})} className="bg-[#1E293B]/50 border-[#334155] h-12 font-bold text-lg" />
            </div>

            <div className="p-4 bg-[#1E293B]/30 rounded-lg text-gray-400 text-sm italic border border-[#334155]/20">
              Meaning: 1 {uoms.find((u: any) => u.unit_id === convForm.from_uom_id)?.unit_name || "Selected"} = {convForm.conversion_factor} {uoms.find((u: any) => u.unit_id === convForm.to_uom_id)?.unit_name || "Base"} units
            </div>
          </div>
          <DialogFooter className="gap-3">
            <Button variant="outline" onClick={() => setIsConvOpen(false)} className="bg-transparent border-[#334155] text-white hover:bg-[#1E293B] rounded-xl px-8">Cancel</Button>
            <Button onClick={handleCreateConv} disabled={createConversion.isPending} variant="blue" className="rounded-xl px-8 shadow-lg shadow-blue-500/20">
               {createConversion.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
               Add Rule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
