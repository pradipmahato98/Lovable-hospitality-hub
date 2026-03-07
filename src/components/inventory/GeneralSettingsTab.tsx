import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useInventoryUISettings, useUpdateInventoryUISettings, InventoryUISettings } from "@/hooks/useSettings";
import { Save, Loader2 } from "lucide-react";

export const GeneralSettingsTab = () => {
  const { data: settings, isLoading } = useInventoryUISettings();
  const updateSettings = useUpdateInventoryUISettings();
  const [localSettings, setLocalSettings] = useState<InventoryUISettings | null>(null);

  useEffect(() => {
    if (settings) {
      setLocalSettings(settings);
    }
  }, [settings]);

  const handleToggle = (key: keyof InventoryUISettings) => {
    if (!localSettings) return;
    setLocalSettings({
      ...localSettings,
      [key]: !localSettings[key],
    });
  };

  const handleSave = () => {
    if (localSettings) {
      updateSettings.mutate(localSettings);
    }
  };

  if (isLoading || !localSettings) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const SettingItem = ({ id, label, value }: { id: keyof InventoryUISettings; label: string; value: boolean }) => (
    <div className="flex items-center space-x-3 py-2 px-1">
      <Checkbox
        id={id}
        checked={value}
        onCheckedChange={() => handleToggle(id)}
      />
      <Label htmlFor={id} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
        {label}
      </Label>
    </div>
  );

  return (
    <Card className="shadow-sm border-muted/40">
      <CardHeader>
        <CardTitle className="text-xl">Inventory UI Settings</CardTitle>
        <CardDescription>Configure which fields are visible across the inventory module.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-1">
          {/* Column 1 */}
          <div className="space-y-1">
            <SettingItem id="barcode_show" label="BarCode Show" value={localSettings.barcode_show} />
            <SettingItem id="brand_show" label="Brand Show" value={localSettings.brand_show} />
            <SettingItem id="expiration_show" label="Expiration Show" value={localSettings.expiration_show} />
            <SettingItem id="non_stock_show" label="Non-Stock Show" value={localSettings.non_stock_show} />
            <SettingItem id="perishable_show" label="Perishable Show" value={localSettings.perishable_show} />
            <SettingItem id="production_item_show" label="Production Item Show" value={localSettings.production_item_show} />
            <SettingItem id="re_order_show" label="Re-Order Show" value={localSettings.re_order_show} />
            <SettingItem id="sku_show" label="SKU Show" value={localSettings.sku_show} />
            <SettingItem id="product_japanese_name_show" label="Product Japanese Name" value={localSettings.product_japanese_name_show} />
          </div>

          {/* Column 2 */}
          <div className="space-y-1">
            <SettingItem id="batch_number_show" label="Batch Number Show" value={localSettings.batch_number_show} />
            <SettingItem id="color_show" label="Color Show" value={localSettings.color_show} />
            <SettingItem id="inventory_item_show" label="Inventory Item Show" value={localSettings.inventory_item_show} />
            <SettingItem id="opening_detail_show" label="Opening Detail Show" value={localSettings.opening_detail_show} />
            <SettingItem id="product_desc_show" label="Product Desc Show" value={localSettings.product_desc_show} />
            <SettingItem id="rack_show" label="Rack Show" value={localSettings.rack_show} />
            <SettingItem id="serial_number_show" label="Serial Number Show" value={localSettings.serial_number_show} />
            <SettingItem id="hs_code_show" label="HS Code Show" value={localSettings.hs_code_show} />
          </div>

          {/* Column 3 */}
          <div className="space-y-1">
            <SettingItem id="branchwise_product_show" label="Branchwise Product Show" value={localSettings.branchwise_product_show} />
            <SettingItem id="display_name_show" label="Display Name Show" value={localSettings.display_name_show} />
            <SettingItem id="narcotics_show" label="Narcotics Show" value={localSettings.narcotics_show} />
            <SettingItem id="other_identifier_show" label="Other Identifier Show" value={localSettings.other_identifier_show} />
            <SettingItem id="product_image_show" label="Product Image Show" value={localSettings.product_image_show} />
            <SettingItem id="raw_item_show" label="Raw Item Show" value={localSettings.raw_item_show} />
            <SettingItem id="size_show" label="Size Show" value={localSettings.size_show} />
            <SettingItem id="category_japanese_name_show" label="Category Japanese Name" value={localSettings.category_japanese_name_show} />
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button
            onClick={handleSave}
            disabled={updateSettings.isPending}
            className="bg-sky-500 hover:bg-sky-600 text-white min-w-[100px]"
          >
            {updateSettings.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
