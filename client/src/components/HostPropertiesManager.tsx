import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Pencil, Trash2, Home, Loader2, CheckCircle, AlertCircle, Clock } from "lucide-react";
import { useHostProperties, useCreateProperty, useUpdateProperty, useDeleteProperty, usePropertySync } from "@/hooks/useApi";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface PropertyFormData {
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  icalUrl: string;
}

const emptyForm: PropertyFormData = {
  name: "",
  address: "",
  city: "Austin",
  state: "TX",
  zip: "",
  icalUrl: "",
};

export function HostPropertiesManager() {
  const { data: properties = [], isLoading } = useHostProperties();
  const createProperty = useCreateProperty();
  const updateProperty = useUpdateProperty();
  const deleteProperty = useDeleteProperty();
  const propertySync = usePropertySync();
  
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<any | null>(null);
  const [formData, setFormData] = useState<PropertyFormData>(emptyForm);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleSubmit = async () => {
    if (!formData.name || !formData.address) {
      toast({
        title: "Missing Fields",
        description: "Name and address are required",
        variant: "destructive",
      });
      return;
    }
    
    try {
      if (editingProperty) {
        await updateProperty.mutateAsync({ id: editingProperty.id, data: formData });
        toast({ title: "Property Updated", description: `${formData.name} has been updated.` });
      } else {
        await createProperty.mutateAsync(formData);
        toast({ title: "Property Added", description: `${formData.name} has been added.` });
      }
      setIsAddOpen(false);
      setEditingProperty(null);
      setFormData(emptyForm);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save property. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (property: any) => {
    setEditingProperty(property);
    setFormData({
      name: property.name || "",
      address: property.address || "",
      city: property.city || "Austin",
      state: property.state || "TX",
      zip: property.zip || "",
      icalUrl: property.icalUrl || "",
    });
    setIsAddOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      setDeletingId(id);
      await deleteProperty.mutateAsync(id);
      toast({ title: "Property Deleted", description: "The property has been removed." });
    } catch (error: any) {
      toast({
        title: "Cannot Delete",
        description: "This property has existing bookings and cannot be deleted.",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleSync = async (propertyId: number, propertyName: string) => {
    try {
      await propertySync.mutateAsync(propertyId);
      toast({
        title: "Sync Started",
        description: `Calendar sync initiated for ${propertyName}`,
      });
    } catch (error) {
      toast({
        title: "Sync Failed",
        description: "Failed to sync calendar. Please check the iCal URL.",
        variant: "destructive",
      });
    }
  };

  const getSyncStatusBadge = (property: any) => {
    if (!property.lastSyncAt) {
      return <Badge variant="outline" className="text-muted-foreground"><Clock className="h-3 w-3 mr-1" />Never synced</Badge>;
    }
    if (property.lastSyncStatus === "success") {
      return <Badge className="bg-emerald-500/15 text-emerald-600"><CheckCircle className="h-3 w-3 mr-1" />Synced</Badge>;
    }
    if (property.lastSyncStatus === "error") {
      return <Badge className="bg-red-500/15 text-red-600"><AlertCircle className="h-3 w-3 mr-1" />Error</Badge>;
    }
    return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
  };

  const closeDialog = () => {
    setIsAddOpen(false);
    setEditingProperty(null);
    setFormData(emptyForm);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Properties</h1>
          <p className="text-muted-foreground mt-1">Manage your vacation rental properties</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={(open) => { if (!open) closeDialog(); else setIsAddOpen(true); }}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-property">
              <Plus className="mr-2 h-4 w-4" /> Add Property
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editingProperty ? "Edit Property" : "Add New Property"}</DialogTitle>
              <DialogDescription>
                {editingProperty ? "Update your property details below." : "Enter the details for your new property."}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Property Name *</Label>
                <Input
                  id="name"
                  placeholder="Downtown Loft"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  data-testid="input-property-name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="address">Address *</Label>
                <Input
                  id="address"
                  placeholder="123 Main St"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  data-testid="input-property-address"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    data-testid="input-property-city"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    data-testid="input-property-state"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="zip">Zip</Label>
                  <Input
                    id="zip"
                    value={formData.zip}
                    onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                    data-testid="input-property-zip"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="icalUrl">Airbnb iCal URL (Optional)</Label>
                <Input
                  id="icalUrl"
                  placeholder="https://www.airbnb.com/calendar/ical/..."
                  value={formData.icalUrl}
                  onChange={(e) => setFormData({ ...formData, icalUrl: e.target.value })}
                  data-testid="input-property-ical"
                />
                <p className="text-xs text-muted-foreground">Add this to automatically sync bookings from Airbnb</p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={closeDialog}>Cancel</Button>
              <Button 
                onClick={handleSubmit} 
                disabled={createProperty.isPending || updateProperty.isPending}
                data-testid="button-save-property"
              >
                {(createProperty.isPending || updateProperty.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingProperty ? "Save Changes" : "Add Property"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-none shadow-md">
        <CardHeader>
          <CardTitle>All Properties</CardTitle>
          <CardDescription>Your vacation rental listings and their calendar sync status</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8"><Loader2 className="h-5 w-5 animate-spin mx-auto" /></div>
          ) : properties.length === 0 ? (
            <div className="text-center py-12">
              <Home className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium">No properties yet</h3>
              <p className="text-muted-foreground mt-1 mb-4">Add your first property to get started</p>
              <Button onClick={() => setIsAddOpen(true)} data-testid="button-add-first-property">
                <Plus className="mr-2 h-4 w-4" /> Add Property
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Property</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>iCal Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {properties.map((property: any) => (
                  <TableRow key={property.id} data-testid={`row-property-${property.id}`}>
                    <TableCell className="font-medium">{property.name}</TableCell>
                    <TableCell>{property.city}, {property.state}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {property.icalUrl ? (
                          <>
                            {getSyncStatusBadge(property)}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSync(property.id, property.name)}
                              disabled={propertySync.isPending}
                              data-testid={`button-sync-${property.id}`}
                            >
                              {propertySync.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Sync"}
                            </Button>
                          </>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">Not connected</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{format(new Date(property.createdAt), 'MMM dd, yyyy')}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(property)}
                          data-testid={`button-edit-${property.id}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(property.id)}
                          disabled={deletingId === property.id}
                          className="text-destructive hover:text-destructive"
                          data-testid={`button-delete-${property.id}`}
                        >
                          {deletingId === property.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
